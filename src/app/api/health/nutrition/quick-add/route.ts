import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

// Common food database
const FOOD_DATABASE: Record<string, any> = {
  // Breakfast
  'toast': { name: 'Toast (2 slices)', calories: 178, protein: 5.6, carbs: 33, fat: 2.4, category: 'breakfast' },
  'eggs': { name: 'Scrambled Eggs (2)', calories: 182, protein: 12, carbs: 2, fat: 14, category: 'breakfast' },
  'porridge': { name: 'Porridge with Milk', calories: 210, protein: 8, carbs: 36, fat: 4.5, category: 'breakfast' },
  'cereal': { name: 'Cereal with Milk', calories: 230, protein: 6, carbs: 42, fat: 4, category: 'breakfast' },
  'bacon': { name: 'Bacon (3 rashers)', calories: 250, protein: 18, carbs: 0, fat: 20, category: 'breakfast' },
  'full-english': { name: 'Full English', calories: 800, protein: 35, carbs: 50, fat: 45, category: 'breakfast' },
  'croissant': { name: 'Croissant', calories: 231, protein: 5, carbs: 26, fat: 12, category: 'breakfast' },
  'yogurt': { name: 'Greek Yogurt', calories: 130, protein: 10, carbs: 5, fat: 8, category: 'breakfast' },
  
  // Lunch
  'sandwich': { name: 'Chicken Sandwich', calories: 380, protein: 22, carbs: 35, fat: 15, category: 'lunch' },
  'soup': { name: 'Soup (bowl)', calories: 180, protein: 8, carbs: 20, fat: 7, category: 'lunch' },
  'salad': { name: 'Mixed Salad', calories: 150, protein: 6, carbs: 12, fat: 8, category: 'lunch' },
  'wrap': { name: 'Chicken Wrap', calories: 420, protein: 25, carbs: 38, fat: 18, category: 'lunch' },
  'pasta': { name: 'Pasta (bowl)', calories: 450, protein: 15, carbs: 60, fat: 14, category: 'lunch' },
  'burger': { name: 'Burger & Chips', calories: 750, protein: 30, carbs: 55, fat: 40, category: 'lunch' },
  
  // Dinner
  'chicken-rice': { name: 'Chicken & Rice', calories: 500, protein: 35, carbs: 50, fat: 12, category: 'dinner' },
  'steak': { name: 'Steak & Veg', calories: 550, protein: 42, carbs: 15, fat: 30, category: 'dinner' },
  'fish-chips': { name: 'Fish & Chips', calories: 840, protein: 28, carbs: 70, fat: 45, category: 'dinner' },
  'curry': { name: 'Chicken Curry & Rice', calories: 650, protein: 30, carbs: 65, fat: 22, category: 'dinner' },
  'pizza': { name: 'Pizza (3 slices)', calories: 690, protein: 24, carbs: 72, fat: 30, category: 'dinner' },
  'roast': { name: 'Sunday Roast', calories: 750, protein: 38, carbs: 45, fat: 35, category: 'dinner' },
  'nandos': { name: "Nando's Half Chicken", calories: 550, protein: 45, carbs: 5, fat: 28, category: 'dinner' },
  
  // Snacks
  'apple': { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, category: 'snack' },
  'banana': { name: 'Banana', calories: 89, protein: 1, carbs: 23, fat: 0.3, category: 'snack' },
  'crisps': { name: 'Crisps (packet)', calories: 180, protein: 2, carbs: 18, fat: 11, category: 'snack' },
  'chocolate': { name: 'Chocolate Bar', calories: 250, protein: 3, carbs: 28, fat: 14, category: 'snack' },
  'biscuits': { name: 'Biscuits (3)', calories: 200, protein: 2, carbs: 28, fat: 9, category: 'snack' },
  'protein-bar': { name: 'Protein Bar', calories: 220, protein: 20, carbs: 22, fat: 8, category: 'snack' },
  'nuts': { name: 'Mixed Nuts (30g)', calories: 180, protein: 5, carbs: 6, fat: 16, category: 'snack' },
  
  // Drinks (non-alcoholic)
  'coffee': { name: 'Coffee (milk)', calories: 30, protein: 1.5, carbs: 3, fat: 1, category: 'drink' },
  'latte': { name: 'Latte', calories: 120, protein: 6, carbs: 10, fat: 6, category: 'drink' },
  'smoothie': { name: 'Fruit Smoothie', calories: 180, protein: 3, carbs: 38, fat: 1, category: 'drink' },
  'protein-shake': { name: 'Protein Shake', calories: 200, protein: 25, carbs: 12, fat: 5, category: 'drink' },
}

export async function GET() {
  // Group by category
  const categories: Record<string, any[]> = {}
  for (const [key, food] of Object.entries(FOOD_DATABASE)) {
    const cat = food.category || 'other'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push({ key, ...food })
  }
  
  return NextResponse.json({ categories, all: FOOD_DATABASE })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseAdmin()
    const body = await req.json()
    const { foodKey, custom, quantity = 1 } = body

    let foodData
    if (custom) {
      foodData = custom
    } else if (foodKey && FOOD_DATABASE[foodKey]) {
      foodData = FOOD_DATABASE[foodKey]
    } else {
      return NextResponse.json({ error: 'Invalid food' }, { status: 400 })
    }

    const entry = {
      timestamp: new Date().toISOString(),
      image_url: null,
      foods: [{
        name: foodData.name,
        quantity: quantity > 1 ? `${quantity} portions` : '1 portion',
        calories: Math.round(foodData.calories * quantity),
        protein: Math.round(foodData.protein * quantity * 10) / 10,
        carbs: Math.round(foodData.carbs * quantity * 10) / 10,
        fat: Math.round(foodData.fat * quantity * 10) / 10
      }],
      total_calories: Math.round(foodData.calories * quantity),
      total_protein: Math.round(foodData.protein * quantity * 10) / 10,
      total_carbs: Math.round(foodData.carbs * quantity * 10) / 10,
      total_fat: Math.round(foodData.fat * quantity * 10) / 10
    }

    const { data, error } = await supabase
      .from('nutrition_entries')
      .insert(entry)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entry: data, success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}