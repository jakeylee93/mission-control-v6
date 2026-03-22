import { createServerSupabaseAdmin } from './supabase'

export async function ensureHealthTables() {
  const supabase = createServerSupabaseAdmin()
  
  try {
    // Check if nutrition_entries table exists by trying to query it
    const { data: nutritionTest, error: nutritionError } = await supabase
      .from('nutrition_entries')
      .select('id')
      .limit(1)
    
    if (nutritionError && nutritionError.code === 'PGRST204') {
      // Table doesn't exist, create it via SQL query
      const { error: createNutritionError } = await supabase.rpc('create_nutrition_entries_table')
      if (createNutritionError) {
        console.log('nutrition_entries table might already exist or needs manual creation')
      }
    }
    
    // Check if quick_drinks table exists
    const { data: drinksTest, error: drinksError } = await supabase
      .from('quick_drinks')
      .select('id')
      .limit(1)
    
    if (drinksError && drinksError.code === 'PGRST204') {
      // Table doesn't exist, create it
      const { error: createDrinksError } = await supabase.rpc('create_quick_drinks_table')
      if (createDrinksError) {
        console.log('quick_drinks table might already exist or needs manual creation')
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Database setup error:', error)
    return { success: false, error }
  }
}

// Manual table creation as backup
export async function createTablesManually() {
  const supabase = createServerSupabaseAdmin()
  
  // Create nutrition_entries table manually
  const { error: nutritionError } = await supabase
    .from('nutrition_entries')
    .insert({
      timestamp: new Date().toISOString(),
      foods: [],
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0
    })
  
  // Create quick_drinks table manually  
  const { error: drinksError } = await supabase
    .from('quick_drinks')
    .insert({
      date: new Date().toISOString().split('T')[0],
      drink_name: 'test',
      quantity: 1,
      portion_size: 'pint',
      calories: 0,
      alcohol_units: 0,
      timestamp: new Date().toISOString()
    })
  
  // Delete the test records
  if (!nutritionError) {
    await supabase.from('nutrition_entries').delete().eq('total_calories', 0)
  }
  
  if (!drinksError) {
    await supabase.from('quick_drinks').delete().eq('drink_name', 'test')
  }
  
  return { 
    success: !nutritionError && !drinksError,
    nutritionError: nutritionError?.message,
    drinksError: drinksError?.message
  }
}