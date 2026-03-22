import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Use OpenAI Vision to identify the beer
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Identify this alcoholic drink. Return ONLY a JSON object with this exact format:
{
  "name": "Beer Name",
  "type": "beer/wine/spirit/cocktail",
  "brand": "Brand Name", 
  "abv": 4.5,
  "calories_per_100ml": 43,
  "portion_size": "pint/bottle/can/glass/shot",
  "confidence": 0.85
}

If you cannot identify it clearly, set confidence below 0.7 and use generic estimates.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error:', error)
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 })
    }

    const result = await openaiResponse.json()
    const content = result.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'No analysis result' }, { status: 500 })
    }

    try {
      const drinkInfo = JSON.parse(content)
      
      // Calculate calories and alcohol units based on standard portions
      const portionSizes = {
        'pint': 568,
        'half-pint': 284,
        'bottle': 500,
        'can': 330,
        'glass': 175,
        'shot': 25
      }
      
      const portionMl = portionSizes[drinkInfo.portion_size as keyof typeof portionSizes] || 568
      const calories = Math.round((drinkInfo.calories_per_100ml * portionMl) / 100)
      const alcoholUnits = Math.round(((drinkInfo.abv * portionMl * 0.8) / 1000) * 10) / 10

      return NextResponse.json({
        success: true,
        drink: {
          name: drinkInfo.name,
          type: drinkInfo.type,
          brand: drinkInfo.brand,
          abv: drinkInfo.abv,
          portion: drinkInfo.portion_size,
          calories: calories,
          alcoholUnits: alcoholUnits,
          confidence: drinkInfo.confidence
        }
      })

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      return NextResponse.json({ error: 'Failed to parse drink information' }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Drink identification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}