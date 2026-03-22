import { NextRequest, NextResponse } from 'next/server'

// Comprehensive drink database
const DRINK_DATABASE = {
  // Popular Beers
  'heineken': { name: 'Heineken', type: 'beer', abv: 5.0, calories_per_100ml: 42, brand: 'Heineken' },
  'budweiser': { name: 'Budweiser', type: 'beer', abv: 5.0, calories_per_100ml: 44, brand: 'Budweiser' },
  'carlsberg': { name: 'Carlsberg', type: 'beer', abv: 5.0, calories_per_100ml: 41, brand: 'Carlsberg' },
  'fosters': { name: 'Fosters', type: 'beer', abv: 4.0, calories_per_100ml: 32, brand: 'Fosters' },
  'kronenbourg': { name: 'Kronenbourg 1664', type: 'beer', abv: 5.0, calories_per_100ml: 42, brand: 'Kronenbourg' },
  'becks': { name: 'Becks', type: 'beer', abv: 5.0, calories_per_100ml: 43, brand: 'Becks' },
  'san miguel': { name: 'San Miguel', type: 'beer', abv: 5.0, calories_per_100ml: 44, brand: 'San Miguel' },
  'amstel': { name: 'Amstel', type: 'beer', abv: 5.0, calories_per_100ml: 41, brand: 'Amstel' },
  'moretti': { name: 'Birra Moretti', type: 'beer', abv: 4.6, calories_per_100ml: 35, brand: 'Moretti' },
  'asahi': { name: 'Asahi', type: 'beer', abv: 5.0, calories_per_100ml: 42, brand: 'Asahi' },
  
  // Craft & Specialty Beers  
  'ipa': { name: 'IPA', type: 'beer', abv: 6.0, calories_per_100ml: 50, brand: 'Generic' },
  'pale ale': { name: 'Pale Ale', type: 'beer', abv: 5.2, calories_per_100ml: 45, brand: 'Generic' },
  'wheat beer': { name: 'Wheat Beer', type: 'beer', abv: 5.4, calories_per_100ml: 46, brand: 'Generic' },
  'pilsner': { name: 'Pilsner', type: 'beer', abv: 4.8, calories_per_100ml: 40, brand: 'Generic' },
  
  // Wines
  'sauvignon blanc': { name: 'Sauvignon Blanc', type: 'wine', abv: 12.5, calories_per_100ml: 82, brand: 'Generic' },
  'chardonnay': { name: 'Chardonnay', type: 'wine', abv: 13.0, calories_per_100ml: 84, brand: 'Generic' },
  'pinot grigio': { name: 'Pinot Grigio', type: 'wine', abv: 12.0, calories_per_100ml: 80, brand: 'Generic' },
  'merlot': { name: 'Merlot', type: 'wine', abv: 13.5, calories_per_100ml: 85, brand: 'Generic' },
  'cabernet sauvignon': { name: 'Cabernet Sauvignon', type: 'wine', abv: 14.0, calories_per_100ml: 88, brand: 'Generic' },
  'pinot noir': { name: 'Pinot Noir', type: 'wine', abv: 13.0, calories_per_100ml: 84, brand: 'Generic' },
  'rioja': { name: 'Rioja', type: 'wine', abv: 13.5, calories_per_100ml: 86, brand: 'Generic' },
  'champagne': { name: 'Champagne', type: 'wine', abv: 12.0, calories_per_100ml: 89, brand: 'Generic' },
  
  // Spirits
  'vodka': { name: 'Vodka', type: 'spirit', abv: 40.0, calories_per_100ml: 231, brand: 'Generic' },
  'gin': { name: 'Gin', type: 'spirit', abv: 40.0, calories_per_100ml: 231, brand: 'Generic' },
  'whiskey': { name: 'Whiskey', type: 'spirit', abv: 40.0, calories_per_100ml: 250, brand: 'Generic' },
  'rum': { name: 'Rum', type: 'spirit', abv: 40.0, calories_per_100ml: 231, brand: 'Generic' },
  'tequila': { name: 'Tequila', type: 'spirit', abv: 40.0, calories_per_100ml: 231, brand: 'Generic' },
  'brandy': { name: 'Brandy', type: 'spirit', abv: 40.0, calories_per_100ml: 225, brand: 'Generic' },
  
  // Cocktails
  'mojito': { name: 'Mojito', type: 'cocktail', abv: 13.0, calories_per_100ml: 120, brand: 'Generic' },
  'margarita': { name: 'Margarita', type: 'cocktail', abv: 15.0, calories_per_100ml: 140, brand: 'Generic' },
  'cosmopolitan': { name: 'Cosmopolitan', type: 'cocktail', abv: 18.0, calories_per_100ml: 160, brand: 'Generic' },
  'old fashioned': { name: 'Old Fashioned', type: 'cocktail', abv: 25.0, calories_per_100ml: 180, brand: 'Generic' },
  'manhattan': { name: 'Manhattan', type: 'cocktail', abv: 28.0, calories_per_100ml: 200, brand: 'Generic' },
  'negroni': { name: 'Negroni', type: 'cocktail', abv: 24.0, calories_per_100ml: 170, brand: 'Generic' }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.toLowerCase() || ''
  
  if (!query) {
    return NextResponse.json({ results: [] })
  }

  // Search through database
  const results = []
  
  for (const [key, drink] of Object.entries(DRINK_DATABASE)) {
    if (key.includes(query) || drink.name.toLowerCase().includes(query) || drink.brand.toLowerCase().includes(query)) {
      
      // Calculate standard portion data
      const defaultPortion = drink.type === 'spirit' ? 'shot' : 
                            drink.type === 'wine' ? 'glass' :
                            drink.type === 'cocktail' ? 'glass' : 'pint'
      
      const portionSizes = {
        'pint': 568,
        'half-pint': 284,
        'bottle': 500,
        'can': 330,
        'glass': 175,
        'shot': 25
      }
      
      const portionMl = portionSizes[defaultPortion as keyof typeof portionSizes]
      const calories = Math.round((drink.calories_per_100ml * portionMl) / 100)
      const alcoholUnits = Math.round(((drink.abv * portionMl * 0.8) / 1000) * 10) / 10

      results.push({
        name: drink.name,
        type: drink.type,
        brand: drink.brand,
        abv: drink.abv,
        portion: defaultPortion,
        calories: calories,
        alcoholUnits: alcoholUnits,
        confidence: key === query ? 1.0 : 0.8
      })
    }
  }

  // Sort by confidence and relevance
  results.sort((a, b) => b.confidence - a.confidence)
  
  return NextResponse.json({ 
    results: results.slice(0, 10),
    query: query
  })
}