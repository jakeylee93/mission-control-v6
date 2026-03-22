import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

function dateStringUTC(date: Date): string {
  return date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0')
}

async function getRecentPatterns(supabase: any, days = 7) {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - days)
  
  try {
    // Get recent alcohol/drink data
    const { data: quickActions } = await supabase
      .from('quick_actions')
      .select('*')
      .gte('date', dateStringUTC(weekAgo))
      .order('date', { ascending: false })
    
    // Get recent water data
    const { data: waterData } = await supabase
      .from('lovely_water')
      .select('*')
      .gte('date', dateStringUTC(weekAgo))
      .order('date', { ascending: false })
    
    // Get recent lager/beer data  
    const { data: lagerData } = await supabase
      .from('lovely_lager')
      .select('*')
      .gte('date', dateStringUTC(weekAgo))
      .order('date', { ascending: false })
    
    // Get recent nutrition data
    const { data: nutritionData } = await supabase
      .from('nutrition_entries')
      .select('*')
      .gte('timestamp', weekAgo.toISOString())
      .order('timestamp', { ascending: false })
    
    return {
      alcohol: quickActions || [],
      water: waterData || [],
      lager: lagerData || [],
      nutrition: nutritionData || []
    }
  } catch (error) {
    console.error('Failed to get patterns:', error)
    return { alcohol: [], water: [], lager: [], nutrition: [] }
  }
}

async function generateSmartMessage(patterns: any): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return "Keep being amazing! 💫"
  }
  
  try {
    const prompt = `You are Lovely, Jake's supportive AI companion. Based on his recent health data, generate a personalized, encouraging message for today.

Data from the last 7 days:
- Alcohol/Drinks: ${JSON.stringify(patterns.alcohol)}
- Water Intake: ${JSON.stringify(patterns.water)}
- Beer/Lager: ${JSON.stringify(patterns.lager)}
- Nutrition: ${JSON.stringify(patterns.nutrition)}

Generate a warm, encouraging message that:
1. Acknowledges patterns (good or concerning)
2. Gives gentle guidance if needed
3. Celebrates wins
4. Feels personal and caring
5. Is 1-2 sentences max
6. Uses appropriate emojis

Examples:
- "Great hydration yesterday! Your body is loving that water 💧"
- "Friday night was fun, but maybe a lighter weekend? Your future self will thank you 🌱"
- "Loving the consistent water intake this week - you're glowing! ✨"

Respond with ONLY the message, no explanation.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })
    
    if (!response.ok) {
      throw new Error('Claude API error')
    }
    
    const data = await response.json()
    return data.content?.[0]?.text?.trim() || "You're doing great! Keep it up! 💪"
    
  } catch (error) {
    console.error('Failed to generate smart message:', error)
    return "You're amazing! Here's to another great day 🌟"
  }
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  
  try {
    const patterns = await getRecentPatterns(supabase)
    const message = await generateSmartMessage(patterns)
    
    return NextResponse.json({ 
      message,
      patterns: {
        totalAlcoholUnits: patterns.alcohol.reduce((sum: number, item: any) => sum + (item.alcohol_units || 0), 0),
        avgWaterGlasses: patterns.water.length > 0 ? patterns.water.reduce((sum: number, item: any) => sum + item.glasses, 0) / patterns.water.length : 0,
        totalCalories: patterns.nutrition.reduce((sum: number, item: any) => sum + item.total_calories, 0),
        daysTracked: patterns.water.length
      }
    })
    
  } catch (error: any) {
    console.error('Smart message error:', error)
    return NextResponse.json({
      message: "You're wonderful! Have a great day! 🌈",
      error: error.message
    }, { status: 500 })
  }
}