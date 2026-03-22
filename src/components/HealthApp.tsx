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
  'stella-artois': { name: 'Stella Artois', calories: 154, alcoholUnits: 1.4, emoji: '🍺', logo: '/logos/stella.svg' },
  'peroni': { name: 'Peroni', calories: 142, alcoholUnits: 1.4, emoji: '🍺', logo: '/logos/peroni.svg' },
  'corona': { name: 'Corona', calories: 148, alcoholUnits: 1.4, emoji: '🍺', logo: '/logos/corona.svg' },
  'guinness': { name: 'Guinness', calories: 125, alcoholUnits: 1.2, emoji: '🍺', logo: '/logos/guinness.svg' },
  'wine-red': { name: 'Red Wine', calories: 85, alcoholUnits: 1.6, emoji: '🍷' },
  'wine-white': { name: 'White Wine', calories: 82, alcoholUnits: 1.5, emoji: '🥂' },
  'prosecco': { name: 'Prosecco', calories: 89, alcoholUnits: 1.4, emoji: '🥂' },
  'gin-tonic': { name: 'G&T', calories: 115, alcoholUnits: 1.0, emoji: '🍸' },
}

export function HealthApp({ onBack }: HealthAppProps) {
  const [entries, setEntries] = useState<NutritionEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFoodAndDrinks, setShowFoodAndDrinks] = useState(false)
  const [activeTab, setActiveTab] = useState<'food' | 'drinks'>('drinks')
  const [recentDrinks, setRecentDrinks] = useState<any[]>([])
  const [allDrinks, setAllDrinks] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [drinksData, setDrinksData] = useState<any>(null)
  const [showAddDrink, setShowAddDrink] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [customDrink, setCustomDrink] = useState({
    name: '',
    calories: '',
    alcoholUnits: '',
    portion: 'pint'
  })
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false)
  const [personalFavorites, setPersonalFavorites] = useState<any[]>([])
  const drinkPhotoRef = useRef<HTMLInputElement>(null)
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
    loadPersonalFavorites()
  }, [selectedDate])

  async function loadPersonalFavorites() {
    try {
      const response = await fetch('/api/drinks/favorites')
      if (response.ok) {
        const data = await response.json()
        setPersonalFavorites(data.favorites || [])
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
    }
  }

  function changeMonth(delta: number) {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + delta)
    setCurrentMonth(newMonth)
  }

  function formatDate(date: string) {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  async function deleteDrink(drinkIndex: number) {
    try {
      const response = await fetch('/api/lovely/drinks/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          drinkIndex: drinkIndex
        })
      })

      if (response.ok) {
        // Reload data to reflect deletion and wait for it
        await loadDataForDate(selectedDate)
      } else {
        const error = await response.text()
        alert(`Failed to delete drink: ${error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete drink')
    }
  }

  async function searchDrinks(query: string) {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/drinks/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  async function analyzeDrinkPhoto(file: File) {
    setIsAnalyzingPhoto(true)
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/drinks/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.drink.confidence > 0.7) {
          // Auto-populate form with AI-identified drink and store photo
          setCustomDrink({
            name: data.drink.name,
            calories: data.drink.calories.toString(),
            alcoholUnits: data.drink.alcoholUnits.toString(),
            portion: data.drink.portion
          })
          
          // Store the photo for this drink in personal favorites
          await addToPersonalFavorites({
            ...data.drink,
            customPhoto: base64
          })
        } else {
          alert(`Could not identify drink clearly (${Math.round(data.drink.confidence * 100)}% confidence). Please enter details manually.`)
        }
      } else {
        alert('Failed to analyze photo. Please try again or enter details manually.')
      }
    } catch (error) {
      console.error('Photo analysis error:', error)
      alert('Failed to analyze photo')
    } finally {
      setIsAnalyzingPhoto(false)
    }
  }

  async function addToPersonalFavorites(drinkData: any) {
    try {
      await fetch('/api/drinks/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          favorite: drinkData
        })
      })
    } catch (error) {
      console.error('Failed to add to favorites:', error)
    }
  }

  async function addFavoriteQuick(favorite: any) {
    try {
      const response = await fetch('/api/health/quick-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'alcohol',
          customDrink: {
            name: favorite.name,
            calories: favorite.calories,
            alcoholUnits: favorite.alcohol_units
          },
          quantity: 1,
          portionSize: favorite.portion
        })
      })

      if (response.ok) {
        await loadDataForDate(selectedDate)
        setShowFoodAndDrinks(false)
      } else {
        const error = await response.text()
        alert(`Failed to add drink: ${error}`)
      }
    } catch (error) {
      console.error('Add favorite error:', error)
      alert('Failed to add favorite drink')
    }
  }

  function selectSearchResult(result: any) {
    setCustomDrink({
      name: result.name,
      calories: result.calories.toString(),
      alcoholUnits: result.alcoholUnits.toString(),
      portion: result.portion
    })
    setSearchResults([])
  }

  async function addCustomDrink() {
    try {
      const response = await fetch('/api/health/quick-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'alcohol',
          customDrink: {
            name: customDrink.name,
            calories: parseInt(customDrink.calories) || 0,
            alcoholUnits: parseFloat(customDrink.alcoholUnits) || 0,
          },
          quantity: 1,
          portionSize: customDrink.portion
        })
      })

      if (response.ok) {
        setShowAddDrink(false)
        // Add to personal favorites
        await addToPersonalFavorites({
          name: customDrink.name,
          calories: parseInt(customDrink.calories) || 0,
          alcoholUnits: parseFloat(customDrink.alcoholUnits) || 0,
          portion: customDrink.portion
        })
        
        setCustomDrink({ name: '', calories: '', alcoholUnits: '', portion: 'pint' })
        setSearchResults([])
        // Reload data immediately and wait for it
        await loadDataForDate(selectedDate)
        // Reload favorites to show new addition
        await loadPersonalFavorites()
      } else {
        const error = await response.text()
        alert(`Failed to add drink: ${error}`)
      }
    } catch (error) {
      console.error('Add custom drink error:', error)
      alert('Failed to add custom drink')
    }
  }

  async function loadDataForDate(date: string) {
    try {
      // Load drinks from working drinks API
      const drinksResponse = await fetch(`/api/lovely/drinks?date=${date}`)
      let drinkTotals = { calories: 0, alcoholUnits: 0 }
      let drinksData = { drinks: [] }
      
      if (drinksResponse.ok) {
        drinksData = await drinksResponse.json()
        const drinks = drinksData.drinks || []
        
        drinkTotals = drinks.reduce((acc: any, drink: any) => ({
          calories: acc.calories + (drink.calories || 0),
          alcoholUnits: acc.alcoholUnits + (drink.alcoholUnits || 0)
        }), { calories: 0, alcoholUnits: 0 })
      }
      
      // Load foods from nutrition API (if any)
      const foodResponse = await fetch(`/api/health/nutrition?date=${date}`)
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
      
      // Set data
      setEntries(foods)
      setDrinksData(drinksData)
      setDailyTotals({
        calories: drinkTotals.calories + foodTotals.calories,
        protein: foodTotals.protein,
        carbs: foodTotals.carbs,
        fat: foodTotals.fat,
        alcoholUnits: drinkTotals.alcoholUnits
      })
      
    } catch (error) {
      console.error('Failed to load data for date:', error)
    }
  }

  async function loadTodaysData() {
    loadDataForDate(selectedDate)
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
        
        setShowFoodAndDrinks(false)
        
        // Show quick success message
        const drink = QUICK_DRINKS[drinkKey]
        console.log(`Added ${drink.name} (${portionSize})`)
        
        // Reload data immediately and wait for it
        await loadDataForDate(selectedDate)
        
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

      {/* Calendar */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => changeMonth(-1)} style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 14
          }}>
            ←
          </button>
          <div style={{ color: '#FFD700', fontWeight: 600, fontSize: 16 }}>
            {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => changeMonth(1)} style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 14
          }}>
            →
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} style={{ textAlign: 'center', color: '#888', fontSize: 10, padding: 4 }}>
              {day}
            </div>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {(() => {
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth()
            const firstDay = new Date(year, month, 1)
            const lastDay = new Date(year, month + 1, 0)
            const startDate = new Date(firstDay)
            startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7))
            
            const days = []
            for (let d = new Date(startDate); d <= lastDay || days.length % 7 !== 0; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0]
              const isCurrentMonth = d.getMonth() === month
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              
              days.push(
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    border: 'none',
                    borderRadius: 6,
                    padding: 8,
                    background: isSelected ? '#FFD700' : isToday ? 'rgba(255,215,0,0.2)' : 'transparent',
                    color: isSelected ? '#000' : isCurrentMonth ? '#fff' : '#666',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: isSelected || isToday ? 600 : 400
                  }}
                >
                  {d.getDate()}
                </button>
              )
            }
            return days
          })()}
        </div>
      </div>

      {/* Daily Overview */}
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          {selectedDate === new Date().toISOString().split('T')[0] ? "Today's" : formatDate(selectedDate)} Nutrition
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
        <button 
          onClick={() => setShowFoodAndDrinks(true)}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            padding: '16px 12px',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            marginBottom: 16
          }}
        >
          🍽️ Food & Drinks
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Food & Drinks Modal */}
      {showFoodAndDrinks && (
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
            maxWidth: 500,
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Food & Drinks</h3>
              <button 
                onClick={() => setShowFoodAndDrinks(false)}
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
            
            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
              <button
                onClick={() => setActiveTab('drinks')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: 8,
                  background: activeTab === 'drinks' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeTab === 'drinks' ? '#fff' : '#888',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🍺 Drinks
              </button>
              <button
                onClick={() => setActiveTab('food')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: 8,
                  background: activeTab === 'food' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeTab === 'food' ? '#fff' : '#888',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📸 Food
              </button>
            </div>

            {/* Drinks Tab */}
            {activeTab === 'drinks' && (
              <div>
                {/* Personal Favorites */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ color: '#fff', fontSize: 16, margin: 0 }}>Your Favorites</h4>
                  <div style={{ color: '#888', fontSize: 12 }}>
                    {personalFavorites.length} drinks
                  </div>
                </div>
                
                {personalFavorites.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    {personalFavorites.map((favorite: any) => (
                      <button
                        key={favorite.id}
                        onClick={() => addFavoriteQuick(favorite)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          padding: 16,
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: 14,
                          position: 'relative'
                        }}
                      >
                        <div style={{ height: 40, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {favorite.custom_photo ? (
                            <img 
                              src={favorite.custom_photo} 
                              alt={favorite.name}
                              style={{ 
                                height: 32, 
                                width: 32, 
                                borderRadius: 6,
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div style={{ 
                              width: 32, 
                              height: 32, 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16
                            }}>
                              🍺
                            </div>
                          )}
                        </div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{favorite.name}</div>
                        <div style={{ color: '#aaa', fontSize: 12 }}>
                          {favorite.calories} cal • {favorite.alcohol_units} units
                        </div>
                        <div style={{ 
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: 'rgba(0,0,0,0.7)',
                          borderRadius: 10,
                          padding: '2px 6px',
                          fontSize: 9,
                          color: '#aaa'
                        }}>
                          {favorite.use_count}×
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 12,
                    padding: 20,
                    textAlign: 'center',
                    marginBottom: 20
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
                    <div style={{ color: '#aaa', fontSize: 14, marginBottom: 4 }}>No favorites yet</div>
                    <div style={{ color: '#666', fontSize: 12 }}>
                      Take a photo or add custom drinks to build your personal collection
                    </div>
                  </div>
                )}

                {/* Recent Drinks */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ color: '#fff', fontSize: 16, margin: 0 }}>Recent Drinks</h4>
                  <button
                    onClick={() => setShowAddDrink(true)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100)',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Add Custom
                  </button>
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: 12, 
                  padding: 16, 
                  marginBottom: 20
                }}>
                  {drinksData?.drinks?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {drinksData.drinks.slice(-5).reverse().map((drink: any, idx: number) => {
                        const actualIndex = drinksData.drinks.length - 1 - idx
                        return (
                          <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 8
                          }}>
                            <div style={{ color: '#fff', flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{drink.name}</div>
                              <div style={{ color: '#888', fontSize: 12 }}>
                                {drink.portion} • {drink.calories} cal • {drink.alcoholUnits} units
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ color: '#888', fontSize: 11 }}>
                                {new Date(drink.timestamp).toLocaleTimeString('en-GB', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <button
                                onClick={() => deleteDrink(actualIndex)}
                                style={{
                                  background: 'rgba(239,68,68,0.2)',
                                  border: '1px solid rgba(239,68,68,0.4)',
                                  borderRadius: 6,
                                  color: '#ef4444',
                                  padding: '4px 8px',
                                  fontSize: 10,
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>
                      No drinks logged for {selectedDate === new Date().toISOString().split('T')[0] ? 'today' : 'this date'}
                    </div>
                  )}
                </div>

                {/* All Drinks History */}
                <h4 style={{ color: '#fff', fontSize: 16, marginBottom: 12 }}>All Drinks History</h4>
                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: 12, 
                  padding: 16
                }}>
                  {drinksData?.drinks?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {drinksData.drinks.map((drink: any, idx: number) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: 8
                        }}>
                          <div style={{ color: '#fff' }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{drink.name}</div>
                            <div style={{ color: '#888', fontSize: 12 }}>
                              {drink.portion} • {drink.calories} cal • {drink.alcoholUnits} units
                            </div>
                          </div>
                          <div style={{ color: '#888', fontSize: 11 }}>
                            {new Date(drink.timestamp).toLocaleString('en-GB', { 
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>
                      No drinks logged for {selectedDate === new Date().toISOString().split('T')[0] ? 'today' : 'this date'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Food Tab */}
            {activeTab === 'food' && (
              <div>
                {/* Food Photo */}
                <button 
                  onClick={() => {
                    fileInputRef.current?.click()
                    setShowFoodAndDrinks(false)
                  }}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: isLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    padding: '20px 16px',
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 20
                  }}
                >
                  📸 {isLoading ? 'Analyzing...' : 'Take Food Photo'}
                </button>

                {/* Recent Food */}
                <h4 style={{ color: '#fff', fontSize: 16, marginBottom: 12 }}>Recent Food</h4>
                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: 12, 
                  padding: 16, 
                  marginBottom: 20
                }}>
                  {entries.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {entries.slice(-5).reverse().map((food, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: 8
                        }}>
                          <div style={{ color: '#fff' }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{food.foods?.[0]?.name || 'Food Item'}</div>
                            <div style={{ color: '#888', fontSize: 12 }}>
                              {food.total_calories} cal • {food.total_protein}g protein
                            </div>
                          </div>
                          <div style={{ color: '#888', fontSize: 11 }}>
                            {new Date(food.timestamp).toLocaleTimeString('en-GB', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>
                      No food logged for {selectedDate === new Date().toISOString().split('T')[0] ? 'today' : 'this date'}
                    </div>
                  )}
                </div>

                {/* All Food History */}
                <h4 style={{ color: '#fff', fontSize: 16, marginBottom: 12 }}>All Food History</h4>
                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: 12, 
                  padding: 16
                }}>
                  {entries.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {entries.map((food, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: 8
                        }}>
                          <div style={{ color: '#fff' }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{food.foods?.[0]?.name || 'Food Item'}</div>
                            <div style={{ color: '#888', fontSize: 12 }}>
                              {food.total_calories} cal • {food.total_protein}g protein • {food.total_carbs}g carbs • {food.total_fat}g fat
                            </div>
                          </div>
                          <div style={{ color: '#888', fontSize: 11 }}>
                            {new Date(food.timestamp).toLocaleString('en-GB', { 
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>
                      No food logged for {selectedDate === new Date().toISOString().split('T')[0] ? 'today' : 'this date'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Drink Modal */}
      {showAddDrink && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1001,
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
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Add Custom Drink</h3>
              <button 
                onClick={() => {
                  setShowAddDrink(false)
                  setSearchResults([])
                  setCustomDrink({ name: '', calories: '', alcoholUnits: '', portion: 'pint' })
                }}
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

            {/* Photo Recognition */}
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => drinkPhotoRef.current?.click()}
                disabled={isAnalyzingPhoto}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,215,0,0.3)',
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
                  color: isAnalyzingPhoto ? '#888' : '#FFD700',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isAnalyzingPhoto ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                📸 {isAnalyzingPhoto ? 'Analyzing Photo...' : 'Take Photo to Identify Drink'}
              </button>
              <input
                ref={drinkPhotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) analyzeDrinkPhoto(file)
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Search/Name Input */}
              <div style={{ position: 'relative' }}>
                <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>
                  Drink Name or Search {isSearching && '(searching...)'}
                </label>
                <input
                  type="text"
                  value={customDrink.name}
                  onChange={(e) => {
                    const value = e.target.value
                    setCustomDrink(prev => ({ ...prev, name: value }))
                    searchDrinks(value)
                  }}
                  placeholder="e.g. Heineken, Vodka Tonic, etc."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: 14
                  }}
                />
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(17,13,32,0.95)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                    marginTop: 4,
                    maxHeight: 200,
                    overflowY: 'auto',
                    zIndex: 10
                  }}>
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSearchResult(result)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: 'none',
                          background: 'transparent',
                          color: '#fff',
                          textAlign: 'left',
                          fontSize: 14,
                          cursor: 'pointer',
                          borderBottom: idx < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 600 }}>{result.name}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {result.type} • {result.calories} cal • {result.alcoholUnits} units • {result.portion}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Portion Size */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>
                  Portion Size
                </label>
                <select
                  value={customDrink.portion}
                  onChange={(e) => setCustomDrink(prev => ({ ...prev, portion: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: 14
                  }}
                >
                  <option value="half-pint">Half Pint (284ml)</option>
                  <option value="pint">Pint (568ml)</option>
                  <option value="can">Can (330ml)</option>
                  <option value="bottle">Bottle (500ml)</option>
                  <option value="glass">Glass (175ml)</option>
                  <option value="shot">Shot (25ml)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Calories */}
                <div>
                  <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>
                    Calories
                  </label>
                  <input
                    type="number"
                    value={customDrink.calories}
                    onChange={(e) => setCustomDrink(prev => ({ ...prev, calories: e.target.value }))}
                    placeholder="150"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontSize: 14
                    }}
                  />
                </div>

                {/* Alcohol Units */}
                <div>
                  <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>
                    Alcohol Units
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={customDrink.alcoholUnits}
                    onChange={(e) => setCustomDrink(prev => ({ ...prev, alcoholUnits: e.target.value }))}
                    placeholder="1.4"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      fontSize: 14
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  onClick={() => setShowAddDrink(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: '#aaa',
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomDrink}
                  disabled={!customDrink.name}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 8,
                    border: 'none',
                    background: customDrink.name ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: customDrink.name ? 'pointer' : 'not-allowed'
                  }}
                >
                  Add Drink
                </button>
              </div>
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