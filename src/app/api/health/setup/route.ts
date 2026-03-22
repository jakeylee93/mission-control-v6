import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseAdmin()
  
  try {
    // Create nutrition_entries table
    const { error: nutritionError } = await supabase.rpc('exec_sql', {
      sql: `
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
    })
    
    // Create quick_actions table for alcohol/drinks
    const { error: actionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS quick_actions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date DATE NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          item_name VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          calories INTEGER,
          alcohol_units DECIMAL(4,2),
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS quick_actions_date_idx ON quick_actions (date);
        CREATE INDEX IF NOT EXISTS quick_actions_type_idx ON quick_actions (action_type);
      `
    })
    
    if (nutritionError || actionsError) {
      return NextResponse.json({
        error: 'Setup failed',
        nutritionError: nutritionError?.message,
        actionsError: actionsError?.message
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Health setup error:', error)
    return NextResponse.json({
      error: error.message || 'Setup failed'
    }, { status: 500 })
  }
}