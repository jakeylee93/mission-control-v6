'use client'
import { useState, useEffect, useRef } from 'react'

interface NutritionEntry {
  id: string
  timestamp: string
  image_url?: string
  foods: FoodItem[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

interface FoodItem {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface HealthAppProps {
  onBack: () => void
}

interface DrinkOption {
  name: string
  calories: number
  alcoholUnits: number
  emoji: string
  logo?: string
}

const QUICK_DRINKS: { [key: string]: DrinkOption } = {
  'stella-artois': { name: 'Stella Artois', calories: 154, alcoholUnits: 1.4, emoji: '🍺', logo: 'https://seeklogo.com/images/S/stella-artois-logo-4A5C74A9B4-seeklogo.com.png' },
  'peroni': { name: 'Peroni', calories: 142, alcoholUnits: 1.4, emoji: '🍺', logo: 'https://seeklogo.com/images/P/peroni-logo-B0B6A4B2B2-seeklogo.com.png' },
  'corona': { name: 'Corona', calories: 148, alcoholUnits: 1.4, emoji: '🍺', logo: 'https://seeklogo.com/images/C/corona-logo-AC5142DDA2-seeklogo.com.png' },
  'guinness': { name: 'Guinness', calories: 125, alcoholUnits: 1.2, emoji: '🍺', logo: 'https://seeklogo.com/images/G/guinness-logo-2B62FCF23D-seeklogo.com.png' },
  'wine-red': { name: 'Red Wine', calories: 85, alcoholUnits: 1.6, emoji: '🍷' },
  'wine-white': { name: 'White Wine', calories: 82, alcoholUnits: 1.5, emoji: '🥂' },
  'prosecco': { name: 'Prosecco', calories: 89, alcoholUnits: 1.4, emoji: '🥂' },
  'gin-tonic': { name: 'G&T', calories: 115, alcoholUnits: 1.0, emoji: '🍸' },
}

export function HealthApp({ onBack }: HealthAppProps) {
  const [entries, setEntries] = useState<NutritionEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDrinks, setShowDrinks] = useState(false)
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    alcoholUnits: 0
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load today's data
  useEffect(() => {
    loadTodaysData()
  }, [])

  async function loadTodaysData() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Load drinks from working drinks API
      const drinksResponse = await fetch(`/api/lovely/drinks?date=${today}`)
      let drinkTotals = { calories: 0, alcoholUnits: 0 }
      
      if (drinksResponse.ok) {
        const drinksData = await drinksResponse.json()
        const drinks = drinksData.drinks || []
        
        drinkTotals = drinks.reduce((acc: any, drink: any) => ({
          calories: acc.calories + (drink.calories || 0),
          alcoholUnits: acc.alcoholUnits + (drink.alcoholUnits || 0)
        }), { calories: 0, alcoholUnits: 0 })
      }
      
      // Load foods from nutrition API (if any)
      const foodResponse = await fetch(`/api/health/nutrition?date=${today}`)
      let foodTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
      let foods = []
      
      if (foodResponse.ok) {
        const foodData = await foodResponse.json()
        foods = foodData.entries || []
        
        foodTotals = foods.reduce((acc: any, food: any) => ({
          calories: acc.calories + (food.total_calories || 0),
          protein: acc.protein + (food.total_protein || 0),
          carbs: acc.carbs + (food.total_carbs || 0),
          fat: acc.fat + (food.total_fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
      }
      
      // Set combined totals
      setEntries(foods)
      setDailyTotals({
        calories: drinkTotals.calories + foodTotals.calories,
        protein: foodTotals.protein,
        carbs: foodTotals.carbs,
        fat: foodTotals.fat,
        alcoholUnits: drinkTotals.alcoholUnits
      })
      
    } catch (error) {
      console.error('Failed to load daily data:', error)
    }
  }



  async function handleImageUpload(file: File) {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/health/analyze-food', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.saved) {
          // Successfully saved, reload data
          loadTodaysData()
          alert('Food analyzed and saved! 🍎')
        } else {
          // Analysis worked but save failed
          alert('Food analyzed but not saved. Database issue.')
          console.error('Save failed:', result.error)
        }
      } else {
        const error = await response.text()
        console.error('Failed to analyze food:', error)
        alert('Failed to analyze food. Please try again.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleQuickAction(drinkKey: string, portionSize: string = 'pint') {
    try {
      const response = await fetch('/api/health/quick-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'alcohol',
          itemKey: drinkKey,
          quantity: 1,
          portionSize
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Update daily totals immediately
        if (result.action) {
          setDailyTotals(prev => ({
            ...prev,
            calories: prev.calories + (result.action.calories || 0),
            alcoholUnits: prev.alcoholUnits + (result.action.alcohol_units || 0)
          }))
        }
        
        setShowDrinks(false)
        
        // Show quick success message
        const drink = QUICK_DRINKS[drinkKey]
        console.log(`Added ${drink.name} (${portionSize})`)
        
        // Reload data immediately
        loadTodaysData()
        
      } else {
        const error = await response.text()
        console.error('❌ Quick action failed:', response.status, error)
        alert(`Failed to add drink (${response.status}): ${error}`)
      }
    } catch (error) {
      console.error('Quick action error:', error)
      alert('Failed to add drink. Please try again.')
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const goals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ paddingTop: 52, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12,
          color: '#aaa', padding: '10px 16px', fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Back
        </button>
      </div>

      {/* Daily Overview */}
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Today's Nutrition
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ff6b6b', fontSize: 20, fontWeight: 700 }}>
              {dailyTotals.calories}
            </div>
            <div style={{ color: '#888', fontSize: 11 }}>/{goals.calories} cal</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#4ecdc4', fontSize: 20, fontWeight: 700 }}>
              {dailyTotals.protein}g
            </div>
            <div style={{ color: '#888', fontSize: 11 }}>/{goals.protein}g protein</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#f093fb', fontSize: 20, fontWeight: 700 }}>
              {dailyTotals.alcoholUnits.toFixed(1)}
            </div>
            <div style={{ color: '#888', fontSize: 11 }}>alcohol units</div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ffe066', fontSize: 20, fontWeight: 700 }}>
              {dailyTotals.carbs}g
            </div>
            <div style={{ color: '#888', fontSize: 11 }}>/{goals.carbs}g carbs</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#a8e6cf', fontSize: 20, fontWeight: 700 }}>
              {dailyTotals.fat}g
            </div>
            <div style={{ color: '#888', fontSize: 11 }}>/{goals.fat}g fat</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            style={{
              background: isLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              padding: '16px 12px',
              fontSize: 14,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            📸 {isLoading ? 'Analyzing...' : 'Food Photo'}
          </button>
          
          <button 
            onClick={() => setShowDrinks(true)}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              padding: '16px 12px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            🍺 Quick Drinks
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Drinks Modal */}
      {showDrinks && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
            borderRadius: 20,
            padding: 24,
            maxWidth: 400,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Quick Drinks</h3>
              <button 
                onClick={() => setShowDrinks(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#aaa',
                  padding: 8,
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {Object.entries(QUICK_DRINKS).map(([key, drink]) => (
                <button
                  key={key}
                  onClick={() => handleQuickAction(key)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: 16,
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: 14
                  }}
                >
                  <div style={{ height: 40, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {drink.logo ? (
                      <img 
                        src={drink.logo} 
                        alt={drink.name}
                        style={{ 
                          height: 32, 
                          width: 'auto', 
                          maxWidth: 80
                        }}
                        onError={(e) => {
                          // Fallback to emoji if logo fails
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `<div style="font-size: 28px">${drink.emoji}</div>`
                          }
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 32 }}>{drink.emoji}</div>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{drink.name}</div>
                  <div style={{ color: '#aaa', fontSize: 12 }}>
                    {drink.calories} cal • {drink.alcoholUnits} units
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Entries */}
      <div>
        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Recent Meals
        </h3>
        
        {entries.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
            color: '#666'
          }}>
            No meals logged today. Take a photo to get started!
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#aaa', fontSize: 12 }}>
                  {new Date(entry.timestamp).toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                <span style={{ color: '#ff6b6b', fontSize: 14, fontWeight: 600 }}>
                  {entry.total_calories} cal
                </span>
              </div>
              
              {entry.image_url && (
                <img 
                  src={entry.image_url} 
                  alt="Food"
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 8,
                    marginBottom: 8
                  }}
                />
              )}
              
              <div style={{ color: '#ccc', fontSize: 14 }}>
                {entry.foods.map((food, i) => (
                  <span key={i}>
                    {food.name} ({food.quantity})
                    {i < entry.foods.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}