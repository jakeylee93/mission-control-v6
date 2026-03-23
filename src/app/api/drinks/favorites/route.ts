import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

// Personal favorites with custom photos
interface PersonalFavorite {
  id: string
  name: string
  type: string
  calories: number
  alcoholUnits: number
  portion: string
  customPhoto?: string // base64 image data
  useCount: number
  lastUsed: string
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseAdmin()
    
    // Get user's personal favorites from database
    const { data: favorites, error } = await supabase
      .from('personal_favorites')
      .select('*')
      .order('useCount', { ascending: false })
      .limit(8)

    if (error && error.code !== 'PGRST116') { // Ignore table doesn't exist error
      console.error('Favorites fetch error:', error)
    }

    // Return favorites or empty array
    return NextResponse.json({ 
      favorites: favorites || [],
      success: true 
    })

  } catch (error: any) {
    console.error('Get favorites error:', error)
    return NextResponse.json({ 
      favorites: [], 
      error: error.message 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseAdmin()
    const body = await req.json()
    const { action, favorite } = body

    if (action === 'add' && favorite) {
      // Create personal_favorites table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS personal_favorites (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          calories INTEGER NOT NULL,
          alcohol_units REAL NOT NULL,
          portion TEXT NOT NULL,
          custom_photo TEXT,
          use_count INTEGER DEFAULT 1,
          last_used TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `

      // Try to create table (will be ignored if exists)
      try {
        await supabase.rpc('query_sql', { query_text: createTableQuery })
        console.log('✅ Personal favorites table ready')
      } catch {
        console.log('ℹ️ Using existing personal_favorites table')
      }

      // Check if favorite already exists
      const { data: existing } = await supabase
        .from('personal_favorites')
        .select('*')
        .eq('name', favorite.name)
        .maybeSingle()

      if (existing) {
        // Update use count and last used
        const { error: updateError } = await supabase
          .from('personal_favorites')
          .update({
            use_count: existing.use_count + 1,
            last_used: new Date().toISOString(),
            custom_photo: favorite.customPhoto || existing.custom_photo
          })
          .eq('id', existing.id)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
      } else {
        // Add new favorite
        const { error: insertError } = await supabase
          .from('personal_favorites')
          .insert([{
            id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: favorite.name,
            type: favorite.type || 'beer',
            calories: favorite.calories,
            alcohol_units: favorite.alcoholUnits,
            portion: favorite.portion,
            custom_photo: favorite.customPhoto,
            use_count: 1,
            last_used: new Date().toISOString()
          }])

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Manage favorites error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}