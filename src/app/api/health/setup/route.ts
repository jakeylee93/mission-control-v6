import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()

  try {
    // Create nutrition_entries table if not exists
    const { error: nutritionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS nutrition_entries (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          timestamp timestamptz,
          image_url text,
          foods jsonb,
          total_calories int,
          total_protein numeric,
          total_carbs numeric,
          total_fat numeric,
          created_at timestamptz DEFAULT now()
        );
      `
    })

    if (nutritionError) {
      console.error('nutrition_entries creation error:', nutritionError)
    }

    // Create drink_collection table if not exists
    const { error: drinkCollError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS drink_collection (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          category text NOT NULL,
          name text NOT NULL,
          calories int DEFAULT 0,
          alcohol_units numeric DEFAULT 0,
          portion text DEFAULT 'pint',
          image_url text,
          created_at timestamptz DEFAULT now()
        );
      `
    })

    if (drinkCollError) {
      console.error('drink_collection creation error:', drinkCollError)
    }

    return NextResponse.json({
      success: true,
      message: 'Tables created (or already exist)',
      errors: {
        nutrition_entries: nutritionError?.message || null,
        drink_collection: drinkCollError?.message || null,
      }
    })
  } catch (error: any) {
    console.error('Health setup error:', error)
    return NextResponse.json({
      error: error.message || 'Setup failed'
    }, { status: 500 })
  }
}
