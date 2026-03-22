import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

interface FoodItem {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface AnalysisResult {
  foods: FoodItem[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

function isMissingTableError(error: any): boolean {
  return error?.code === '42P01' || 
    error?.code === 'PGRST204' || 
    error?.code === 'PGRST205' || 
    (error?.message && /nutrition_entries|relation|table/i.test(error.message))
}

async function ensureNutritionTable(supabase: any) {
  try {
    const { error } = await supabase.rpc('create_nutrition_table')
    if (!error) {
      return { success: true }
    }
    
    // Fallback: create table manually
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS nutrition_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        image_url TEXT,
        foods JSONB NOT NULL DEFAULT '[]'::jsonb,
        total_calories INTEGER NOT NULL DEFAULT 0,
        total_protein DECIMAL(6,2) NOT NULL DEFAULT 0,
        total_carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
        total_fat DECIMAL(6,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS nutrition_entries_timestamp_idx ON nutrition_entries (timestamp);
    `
    
    const { error: directError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    return { success: !directError, error: directError }
  } catch (error) {
    return { success: false, error }
  }
}

async function analyzeFoodImage(imageBase64: string): Promise<AnalysisResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured')
  }
  
  const prompt = `Analyze this food image and provide nutrition information. Look at each food item visible and estimate:

1. What foods you can identify
2. Approximate portion sizes 
3. Estimated calories and macros (protein, carbs, fat in grams)

Respond with ONLY a JSON object in this exact format:
{
  "foods": [
    {
      "name": "Food name",
      "quantity": "portion description (e.g. '1 cup', '150g', '1 medium')",
      "calories": 150,
      "protein": 10.5,
      "carbs": 20.0,
      "fat": 5.2
    }
  ]
}

Be realistic with portions and calories. If you can't identify something clearly, make a reasonable guess. Always include at least one food item even if uncertain.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          }
        ]
      }]
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }
  
  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  
  try {
    const parsed = JSON.parse(text)
    const foods: FoodItem[] = Array.isArray(parsed.foods) ? parsed.foods : []
    
    // Ensure we have at least one food item
    if (foods.length === 0) {
      foods.push({
        name: "Unknown food",
        quantity: "1 portion",
        calories: 200,
        protein: 10,
        carbs: 25,
        fat: 8
      })
    }
    
    // Calculate totals
    const totals = foods.reduce((acc, food) => ({
      total_calories: acc.total_calories + (food.calories || 0),
      total_protein: acc.total_protein + (food.protein || 0),
      total_carbs: acc.total_carbs + (food.carbs || 0),
      total_fat: acc.total_fat + (food.fat || 0)
    }), { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 })
    
    return {
      foods,
      ...totals
    }
  } catch (parseError) {
    console.error('Parse error:', parseError, 'Raw text:', text)
    // Return a fallback result
    return {
      foods: [{
        name: "Food (analysis failed)",
        quantity: "1 portion",
        calories: 250,
        protein: 12,
        carbs: 30,
        fat: 10
      }],
      total_calories: 250,
      total_protein: 12,
      total_carbs: 30,
      total_fat: 10
    }
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }
    
    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    
    // Analyze the food with AI
    const analysis = await analyzeFoodImage(imageBase64)
    
    // Store image in Supabase Storage (optional - for now we'll skip this)
    // const imageUrl = await uploadImage(imageBuffer, imageFile.type)
    
    // Create nutrition entry (for now, just return the analysis without storing)
    const entry = {
      id: 'temp-' + Date.now(),
      timestamp: new Date().toISOString(),
      image_url: null,
      foods: analysis.foods,
      total_calories: Math.round(analysis.total_calories),
      total_protein: Math.round(analysis.total_protein * 100) / 100,
      total_carbs: Math.round(analysis.total_carbs * 100) / 100,
      total_fat: Math.round(analysis.total_fat * 100) / 100
    }
    
    // Skip database storage for now - just return the analysis
    return NextResponse.json({ entry })
    
  } catch (error: any) {
    console.error('Food analysis error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to analyze food' 
    }, { status: 500 })
  }
}