'use client'
import { useState, useEffect, useRef } from 'react'
import { BeerIcon, WineIcon, SpiritsIcon, CocktailIcon, SoftDrinkIcon } from './icons/DrinkIcons'

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

interface CollectionDrink {
  id: string
  category: string
  name: string
  calories: number
  alcohol_units: number
  portion: string
  image_url?: string
}

interface HealthAppProps {
  onBack: () => void
}

const DRINK_CATEGORIES = [
  { key: 'beer', label: 'Beer', Icon: BeerIcon },
  { key: 'wine', label: 'Wine', Icon: WineIcon },
  { key: 'spirits', label: 'Spirits', Icon: SpiritsIcon },
  { key: 'cocktails', label: 'Cocktails', Icon: CocktailIcon },
  { key: 'soft-drinks', label: 'Soft Drinks', Icon: SoftDrinkIcon },
] as const

export function HealthApp({ onBack }: HealthAppProps) {
  const [entries, setEntries] = useState<NutritionEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFoodAndDrinks, setShowFoodAndDrinks] = useState(false)
  const [activeTab, setActiveTab] = useState<'food' | 'drinks'>('drinks')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [drinksData, setDrinksData] = useState<any>(null)
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0, protein: 0, carbs: 0, fat: 0, alcoholUnits: 0
  })
  const [monthData, setMonthData] = useState<Record<string, { hasFood: boolean; hasDrinks: boolean }>>({})

  // Drink collection state
  const [drinkCollection, setDrinkCollection] = useState<Record<string, CollectionDrink[]>>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddToCollection, setShowAddToCollection] = useState(false)
  const [newDrink, setNewDrink] = useState({
    name: '', calories: '', alcohol_units: '', portion: 'pint'
  })

  // Food state
  const [foodCategories, setFoodCategories] = useState<any>({})
  const [activeFoodCategory, setActiveFoodCategory] = useState('breakfast')
  const [showAddFood, setShowAddFood] = useState(false)
  const [customFood, setCustomFood] = useState({
    name: '', calories: '', protein: '', carbs: '', fat: ''
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load data on date change
  useEffect(() => {
    loadDataForDate(selectedDate)
    loadFoodCategories()
  }, [selectedDate])

  // Load month summary
  useEffect(() => {
    loadMonthSummary()
  }, [currentMonth])

  // Load drink collection once
  useEffect(() => {
    loadDrinkCollection()
  }, [])

  async function loadDrinkCollection() {
    try {
      const res = await fetch('/api/health/drinks')
      if (res.ok) {
        const data = await res.json()
        setDrinkCollection(data.grouped || {})
      }
    } catch (error) {
      console.error('Failed to load drink collection:', error)
    }
  }

  async function addDrinkToCollection(category: string) {
    if (!newDrink.name) return
    try {
      const res = await fetch('/api/health/drinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          name: newDrink.name,
          calories: parseInt(newDrink.calories) || 0,
          alcohol_units: parseFloat(newDrink.alcohol_units) || 0,
          portion: newDrink.portion,
        })
      })
      if (res.ok) {
        setShowAddToCollection(false)
        setNewDrink({ name: '', calories: '', alcohol_units: '', portion: 'pint' })
        await loadDrinkCollection()
      }
    } catch (error) {
      console.error('Add drink to collection error:', error)
    }
  }

  async function removeDrinkFromCollection(id: string) {
    try {
      const res = await fetch('/api/health/drinks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        await loadDrinkCollection()
      }
    } catch (error) {
      console.error('Remove drink from collection error:', error)
    }
  }

  async function logDrinkFromCollection(drink: CollectionDrink) {
    try {
      const res = await fetch('/api/health/quick-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'alcohol',
          customDrink: {
            name: drink.name,
            calories: drink.calories,
            alcoholUnits: drink.alcohol_units,
          },
          quantity: 1,
          portionSize: drink.portion,
        })
      })
      if (res.ok) {
        setShowFoodAndDrinks(false)
        setSelectedCategory(null)
        await loadDataForDate(selectedDate)
        loadMonthSummary()
      }
    } catch (error) {
      console.error('Log drink error:', error)
    }
  }

  async function loadMonthSummary() {
    try {
      const year = currentMonth.getFullYear()
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0')
      const res = await fetch(`/api/health/daily?mode=month&month=${year}-${month}`)
      if (res.ok) {
        const data = await res.json()
        setMonthData(data.dates || {})
      }
    } catch (error) {
      console.error('Failed to load month summary:', error)
    }
  }

  async function loadFoodCategories() {
    try {
      const res = await fetch('/api/health/nutrition/quick-add')
      if (res.ok) {
        const data = await res.json()
        setFoodCategories(data.categories || {})
      }
    } catch (error) {
      console.error('Failed to load food categories:', error)
    }
  }

  async function quickAddFood(foodKey: string) {
    try {
      const res = await fetch('/api/health/nutrition/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodKey })
      })
      if (res.ok) {
        await loadDataForDate(selectedDate)
      }
    } catch (error) {
      console.error('Quick add food error:', error)
    }
  }

  async function addCustomFood() {
    try {
      const res = await fetch('/api/health/nutrition/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom: {
            name: customFood.name,
            calories: parseInt(customFood.calories) || 0,
            protein: parseFloat(customFood.protein) || 0,
            carbs: parseFloat(customFood.carbs) || 0,
            fat: parseFloat(customFood.fat) || 0
          }
        })
      })
      if (res.ok) {
        setShowAddFood(false)
        setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '' })
        await loadDataForDate(selectedDate)
      }
    } catch (error) {
      console.error('Add custom food error:', error)
    }
  }

  async function deleteFood(entryId: string) {
    try {
      const res = await fetch('/api/health/nutrition/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryId })
      })
      if (res.ok) {
        await loadDataForDate(selectedDate)
      }
    } catch (error) {
      console.error('Delete food error:', error)
    }
  }

  async function deleteDrink(drinkIndex: number) {
    try {
      const response = await fetch('/api/lovely/drinks/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, drinkIndex })
      })
      if (response.ok) {
        await loadDataForDate(selectedDate)
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  async function updateDrinkQuantity(drinkIndex: number, newQuantity: number) {
    if (newQuantity < 1) {
      await deleteDrink(drinkIndex)
      return
    }
    try {
      const response = await fetch('/api/lovely/drinks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          drinkIndex,
          updates: { quantity: newQuantity }
        })
      })
      if (response.ok) {
        await loadDataForDate(selectedDate)
      }
    } catch (error) {
      console.error('Update error:', error)
    }
  }

  function changeMonth(delta: number) {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + delta)
    setCurrentMonth(newMonth)
  }

  function formatDate(date: string) {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short'
    })
  }

  async function loadDataForDate(date: string) {
    try {
      // Load drinks from working drinks API
      const drinksResponse = await fetch(`/api/lovely/drinks?date=${date}`)
      let drinkTotals = { calories: 0, alcoholUnits: 0 }
      let dData = { drinks: [] }

      if (drinksResponse.ok) {
        dData = await drinksResponse.json()
        const drinks = dData.drinks || []
        drinkTotals = drinks.reduce((acc: any, drink: any) => ({
          calories: acc.calories + (drink.calories || 0),
          alcoholUnits: acc.alcoholUnits + (drink.alcoholUnits || 0)
        }), { calories: 0, alcoholUnits: 0 })
      }

      // Load foods
      const foodResponse = await fetch(`/api/health/nutrition?date=${date}`)
      let foodTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 }
      let foods: NutritionEntry[] = []

      if (foodResponse.ok) {
        const foodData = await foodResponse.json()
        foods = foodData.entries || []
        foodTotals = foods.reduce((acc, food) => ({
          calories: acc.calories + (food.total_calories || 0),
          protein: acc.protein + (food.total_protein || 0),
          carbs: acc.carbs + (food.total_carbs || 0),
          fat: acc.fat + (food.total_fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
      }

      setEntries(foods)
      setDrinksData(dData)
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
          loadDataForDate(selectedDate)
          loadMonthSummary()
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) handleImageUpload(file)
  }

  const goals = { calories: 2000, protein: 150, carbs: 250, fat: 67 }
  const isToday = selectedDate === new Date().toISOString().split('T')[0]
  const dateLabel = isToday ? "Today's" : formatDate(selectedDate)

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
        background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => changeMonth(-1)} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
            color: '#fff', padding: '8px 12px', cursor: 'pointer', fontSize: 14
          }}>←</button>
          <div style={{ color: '#FFD700', fontWeight: 600, fontSize: 16 }}>
            {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => changeMonth(1)} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
            color: '#fff', padding: '8px 12px', cursor: 'pointer', fontSize: 14
          }}>→</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} style={{ textAlign: 'center', color: '#888', fontSize: 10, padding: 4 }}>{day}</div>
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
              const isTodayDate = dateStr === new Date().toISOString().split('T')[0]
              const dateInfo = monthData[dateStr]
              const hasFood = dateInfo?.hasFood || false
              const hasDrinks = dateInfo?.hasDrinks || false

              days.push(
                <button key={dateStr} onClick={() => setSelectedDate(dateStr)} style={{
                  border: 'none', borderRadius: 6, padding: '6px 4px 2px',
                  background: isSelected ? '#FFD700' : isTodayDate ? 'rgba(255,215,0,0.2)' : (hasFood || hasDrinks) && isCurrentMonth ? 'rgba(255,255,255,0.04)' : 'transparent',
                  color: isSelected ? '#000' : isCurrentMonth ? '#fff' : '#666',
                  fontSize: 12, cursor: 'pointer', fontWeight: isSelected || isTodayDate ? 600 : 400,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                }}>
                  {d.getDate()}
                  <div style={{ display: 'flex', gap: 2, height: 5 }}>
                    {hasFood && <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#000' : '#4ecdc4' }} />}
                    {hasDrinks && <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#333' : '#f093fb' }} />}
                  </div>
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
          {dateLabel} Nutrition
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ff6b6b', fontSize: 20, fontWeight: 700 }}>{dailyTotals.calories}</div>
            <div style={{ color: '#888', fontSize: 11 }}>/{goals.calories} cal</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#4ecdc4', fontSize: 20, fontWeight: 700 }}>{dailyTotals.protein}g</div>
            <div style={{ color: '#888', fontSize: 11 }}>/{goals.protein}g protein</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#f093fb', fontSize: 20, fontWeight: 700 }}>{dailyTotals.alcoholUnits.toFixed(1)}</div>
            <div style={{ color: '#888', fontSize: 11 }}>alcohol units</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ffe066', fontSize: 20, fontWeight: 700 }}>{dailyTotals.carbs}g</div>
            <div style={{ color: '#888', fontSize: 11 }}>/{goals.carbs}g carbs</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#a8e6cf', fontSize: 20, fontWeight: 700 }}>{dailyTotals.fat}g</div>
            <div style={{ color: '#888', fontSize: 11 }}>/{goals.fat}g fat</div>
          </div>
        </div>
      </div>

      {/* Add Food & Drinks Button */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setShowFoodAndDrinks(true)} style={{
          background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
          border: 'none', borderRadius: 12, color: '#fff', padding: '16px 12px',
          fontSize: 16, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%'
        }}>
          + Add Food & Drinks
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
      </div>

      {/* Daily Food & Drinks Log */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 20,
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>{dateLabel} Log</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#888', fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ecdc4', display: 'inline-block' }} /> food
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#888', fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f093fb', display: 'inline-block' }} /> drinks
            </span>
          </div>
        </div>

        {/* Food Items */}
        {entries.length > 0 && (
          <div style={{ marginBottom: entries.length > 0 && drinksData?.drinks?.length > 0 ? 12 : 0 }}>
            {entries.map((food) => (
              <div key={food.id} style={{
                display: 'flex', alignItems: 'center', padding: '10px 12px',
                background: 'rgba(78,205,196,0.06)', borderRadius: 10, marginBottom: 6,
                borderLeft: '3px solid #4ecdc4', gap: 10
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
                    {food.foods?.[0]?.name || 'Food Item'}
                  </div>
                  <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                    {food.total_calories} cal · {food.total_protein}g P · {food.total_carbs}g C · {food.total_fat}g F
                  </div>
                </div>
                <div style={{ color: '#666', fontSize: 10 }}>
                  {new Date(food.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <button onClick={() => deleteFood(food.id)} style={{
                  background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer', padding: '4px', opacity: 0.6
                }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Drink Items */}
        {drinksData?.drinks?.length > 0 && (
          <div>
            {drinksData.drinks.map((drink: any, idx: number) => {
              const qty = drink.quantity || 1
              return (
                <div key={`drink-${idx}`} style={{
                  display: 'flex', alignItems: 'center', padding: '10px 12px',
                  background: 'rgba(240,147,251,0.06)', borderRadius: 10, marginBottom: 6,
                  borderLeft: '3px solid #f093fb', gap: 10
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
                      {drink.name}{qty > 1 ? ` ×${qty}` : ''}
                    </div>
                    <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                      {drink.calories || 0} cal · {drink.alcoholUnits || 0} units · {drink.portion || ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => updateDrinkQuantity(idx, qty - 1)} style={{
                      width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)', color: '#aaa', fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                    }}>−</button>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => updateDrinkQuantity(idx, qty + 1)} style={{
                      width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)', color: '#aaa', fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                    }}>+</button>
                  </div>
                  <div style={{ color: '#666', fontSize: 10 }}>
                    {drink.timestamp ? new Date(drink.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                  <button onClick={() => deleteDrink(idx)} style={{
                    background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer', padding: '4px', opacity: 0.6
                  }}>✕</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && (!drinksData?.drinks || drinksData.drinks.length === 0) && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20,
            textAlign: 'center', color: '#666', fontSize: 14
          }}>
            No food or drinks logged{isToday ? ' today' : ''} — tap the button above to add
          </div>
        )}
      </div>

      {/* Food & Drinks Modal */}
      {showFoodAndDrinks && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
            borderRadius: 20, padding: 24, maxWidth: 500, width: '100%', maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 }}>Food & Drinks</h3>
              <button onClick={() => { setShowFoodAndDrinks(false); setSelectedCategory(null) }} style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                color: '#aaa', padding: 8, cursor: 'pointer', fontSize: 16
              }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
              <button onClick={() => { setActiveTab('drinks'); setSelectedCategory(null) }} style={{
                flex: 1, padding: '12px 16px', border: 'none', borderRadius: 8,
                background: activeTab === 'drinks' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === 'drinks' ? '#fff' : '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>Drinks</button>
              <button onClick={() => setActiveTab('food')} style={{
                flex: 1, padding: '12px 16px', border: 'none', borderRadius: 8,
                background: activeTab === 'food' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === 'food' ? '#fff' : '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>Food</button>
            </div>

            {/* ============ DRINKS TAB ============ */}
            {activeTab === 'drinks' && !selectedCategory && (
              <div>
                <h4 style={{ color: '#aaa', fontSize: 13, fontWeight: 500, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Choose a category
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {DRINK_CATEGORIES.map(({ key, label, Icon }) => {
                    const count = (drinkCollection[key] || []).length
                    return (
                      <button key={key} onClick={() => setSelectedCategory(key)} style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 14, padding: '20px 12px', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
                      }}>
                        <Icon size={40} color="#e0e0e0" />
                        <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{label}</div>
                        <div style={{ color: '#666', fontSize: 11 }}>
                          {count === 0 ? 'Empty' : `${count} drink${count !== 1 ? 's' : ''}`}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ============ CATEGORY DETAIL VIEW ============ */}
            {activeTab === 'drinks' && selectedCategory && (
              <div>
                <button onClick={() => setSelectedCategory(null)} style={{
                  background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
                  color: '#aaa', padding: '6px 12px', fontSize: 13, cursor: 'pointer', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                  ← Back to categories
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>
                    {DRINK_CATEGORIES.find(c => c.key === selectedCategory)?.label}
                  </h4>
                  <button onClick={() => setShowAddToCollection(true)} style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none', borderRadius: 8, color: '#fff', padding: '6px 14px',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}>+ Add New</button>
                </div>

                {(drinkCollection[selectedCategory] || []).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {(drinkCollection[selectedCategory] || []).map((drink) => (
                      <div key={drink.id} style={{ position: 'relative' }}>
                        <button onClick={() => logDrinkFromCollection(drink)} style={{
                          width: '100%', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                          padding: '16px 10px', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {(() => {
                              const cat = DRINK_CATEGORIES.find(c => c.key === selectedCategory)
                              if (cat) {
                                const CatIcon = cat.Icon
                                return <CatIcon size={24} color="#fff" />
                              }
                              return null
                            })()}
                          </div>
                          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{drink.name}</div>
                          <div style={{ color: '#888', fontSize: 11, textAlign: 'center' }}>
                            {drink.calories} cal · {drink.alcohol_units} units
                          </div>
                          <div style={{ color: '#666', fontSize: 10 }}>{drink.portion}</div>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeDrinkFromCollection(drink.id) }} style={{
                          position: 'absolute', top: 4, right: 4,
                          background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 6,
                          color: '#888', fontSize: 11, cursor: 'pointer', padding: '2px 6px',
                          lineHeight: 1
                        }}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 30,
                    textAlign: 'center'
                  }}>
                    <div style={{ marginBottom: 12 }}>
                      {(() => {
                        const cat = DRINK_CATEGORIES.find(c => c.key === selectedCategory)
                        if (cat) {
                          const CatIcon = cat.Icon
                          return <CatIcon size={48} color="#555" />
                        }
                        return null
                      })()}
                    </div>
                    <div style={{ color: '#aaa', fontSize: 14, marginBottom: 4 }}>No drinks yet</div>
                    <div style={{ color: '#666', fontSize: 12 }}>
                      Tap &quot;+ Add New&quot; to build your collection
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============ FOOD TAB ============ */}
            {activeTab === 'food' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button onClick={() => { fileInputRef.current?.click(); setShowFoodAndDrinks(false) }}
                    disabled={isLoading} style={{
                      flex: 1, background: isLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none', borderRadius: 10, color: '#fff', padding: '14px 12px',
                      fontSize: 13, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}>
                    {isLoading ? 'Analyzing...' : 'Snap Food'}
                  </button>
                  <button onClick={() => setShowAddFood(true)} style={{
                    flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10, color: '#fff', padding: '14px 12px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}>Custom Entry</button>
                </div>

                {/* Macro Summary */}
                {entries.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Calories', value: dailyTotals.calories, color: '#ef4444', unit: '' },
                      { label: 'Protein', value: dailyTotals.protein, color: '#3b82f6', unit: 'g' },
                      { label: 'Carbs', value: dailyTotals.carbs, color: '#f59e0b', unit: 'g' },
                      { label: 'Fat', value: dailyTotals.fat, color: '#10b981', unit: 'g' }
                    ].map((macro) => (
                      <div key={macro.label} style={{
                        background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px', textAlign: 'center'
                      }}>
                        <div style={{ color: macro.color, fontSize: 18, fontWeight: 700 }}>
                          {Math.round(macro.value)}{macro.unit}
                        </div>
                        <div style={{ color: '#666', fontSize: 10, marginTop: 2 }}>{macro.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Add Categories */}
                <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>Quick Add</h4>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
                  {['breakfast', 'lunch', 'dinner', 'snack', 'drink'].map((cat) => (
                    <button key={cat} onClick={() => setActiveFoodCategory(cat)} style={{
                      padding: '6px 12px', borderRadius: 20, border: 'none',
                      background: activeFoodCategory === cat ? 'rgba(102,126,234,0.25)' : 'rgba(255,255,255,0.06)',
                      color: activeFoodCategory === cat ? '#667eea' : '#888',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize'
                    }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                  {(foodCategories[activeFoodCategory] || []).map((food: any) => (
                    <button key={food.key} onClick={() => quickAddFood(food.key)} style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '10px', color: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 12
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{food.name}</div>
                      <div style={{ color: '#888', fontSize: 11 }}>
                        {food.calories} cal · {food.protein}g P · {food.carbs}g C · {food.fat}g F
                      </div>
                    </button>
                  ))}
                </div>

                {/* Food Log */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ color: '#fff', fontSize: 14, margin: 0 }}>Food Log</h4>
                  <span style={{ color: '#666', fontSize: 11 }}>{entries.length} items</span>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                  padding: entries.length > 0 ? 12 : 16
                }}>
                  {entries.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {entries.slice(-10).reverse().map((food, idx) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', padding: '10px 12px',
                          background: 'rgba(255,255,255,0.04)', borderRadius: 8, gap: 10
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>
                              {food.foods?.[0]?.name || 'Food Item'}
                            </div>
                            <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                              {food.total_calories} cal · {food.total_protein}g P · {food.total_carbs}g C · {food.total_fat}g F
                            </div>
                          </div>
                          <div style={{ color: '#666', fontSize: 10 }}>
                            {new Date(food.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <button onClick={() => deleteFood(food.id)} style={{
                            background: 'none', border: 'none', color: '#ef4444', fontSize: 14,
                            cursor: 'pointer', padding: '4px', opacity: 0.6
                          }}>✕</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>
                      No food logged yet — snap a photo or quick add above
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add Custom Food Modal */}
            {showAddFood && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.8)', zIndex: 1002,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
              }}>
                <div style={{
                  background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
                  borderRadius: 20, padding: 24, maxWidth: 400, width: '100%'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 }}>Add Food</h3>
                    <button onClick={() => setShowAddFood(false)} style={{
                      background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                      color: '#aaa', padding: 8, cursor: 'pointer', fontSize: 16
                    }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input type="text" value={customFood.name} onChange={(e) => setCustomFood(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Food name" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ color: '#aaa', fontSize: 11, display: 'block', marginBottom: 4 }}>Calories</label>
                        <input type="number" value={customFood.calories} onChange={(e) => setCustomFood(prev => ({ ...prev, calories: e.target.value }))}
                          placeholder="250" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }} />
                      </div>
                      <div>
                        <label style={{ color: '#aaa', fontSize: 11, display: 'block', marginBottom: 4 }}>Protein (g)</label>
                        <input type="number" value={customFood.protein} onChange={(e) => setCustomFood(prev => ({ ...prev, protein: e.target.value }))}
                          placeholder="15" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }} />
                      </div>
                      <div>
                        <label style={{ color: '#aaa', fontSize: 11, display: 'block', marginBottom: 4 }}>Carbs (g)</label>
                        <input type="number" value={customFood.carbs} onChange={(e) => setCustomFood(prev => ({ ...prev, carbs: e.target.value }))}
                          placeholder="30" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }} />
                      </div>
                      <div>
                        <label style={{ color: '#aaa', fontSize: 11, display: 'block', marginBottom: 4 }}>Fat (g)</label>
                        <input type="number" value={customFood.fat} onChange={(e) => setCustomFood(prev => ({ ...prev, fat: e.target.value }))}
                          placeholder="10" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button onClick={() => setShowAddFood(false)} style={{
                        flex: 1, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                        background: 'transparent', color: '#aaa', fontSize: 14, cursor: 'pointer'
                      }}>Cancel</button>
                      <button onClick={addCustomFood} disabled={!customFood.name} style={{
                        flex: 1, padding: 12, borderRadius: 8, border: 'none',
                        background: customFood.name ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
                        color: '#fff', fontSize: 14, fontWeight: 600, cursor: customFood.name ? 'pointer' : 'not-allowed'
                      }}>Add Food</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Drink to Collection Modal */}
      {showAddToCollection && selectedCategory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1001,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'linear-gradient(170deg, #0a0812 0%, #110d20 35%, #0e0a18 70%, #080610 100%)',
            borderRadius: 20, padding: 24, maxWidth: 400, width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 }}>
                Add to {DRINK_CATEGORIES.find(c => c.key === selectedCategory)?.label}
              </h3>
              <button onClick={() => { setShowAddToCollection(false); setNewDrink({ name: '', calories: '', alcohol_units: '', portion: 'pint' }) }} style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                color: '#aaa', padding: 8, cursor: 'pointer', fontSize: 16
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>Drink Name</label>
                <input type="text" value={newDrink.name}
                  onChange={(e) => setNewDrink(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Stella Artois"
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }} />
              </div>

              <div>
                <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>Portion Size</label>
                <select value={newDrink.portion}
                  onChange={(e) => setNewDrink(prev => ({ ...prev, portion: e.target.value }))}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }}>
                  <option value="pint">Pint (568ml)</option>
                  <option value="half-pint">Half Pint (284ml)</option>
                  <option value="bottle">Bottle (500ml)</option>
                  <option value="can">Can (330ml)</option>
                  <option value="glass">Glass (175ml)</option>
                  <option value="shot">Shot (25ml)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>Calories</label>
                  <input type="number" value={newDrink.calories}
                    onChange={(e) => setNewDrink(prev => ({ ...prev, calories: e.target.value }))}
                    placeholder="150"
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ color: '#aaa', fontSize: 12, marginBottom: 6, display: 'block' }}>Alcohol Units</label>
                  <input type="number" step="0.1" value={newDrink.alcohol_units}
                    onChange={(e) => setNewDrink(prev => ({ ...prev, alcohol_units: e.target.value }))}
                    placeholder="1.4"
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14 }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button onClick={() => { setShowAddToCollection(false); setNewDrink({ name: '', calories: '', alcohol_units: '', portion: 'pint' }) }} style={{
                  flex: 1, padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent', color: '#aaa', fontSize: 14, cursor: 'pointer'
                }}>Cancel</button>
                <button onClick={() => addDrinkToCollection(selectedCategory)} disabled={!newDrink.name} style={{
                  flex: 1, padding: 12, borderRadius: 8, border: 'none',
                  background: newDrink.name ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: newDrink.name ? 'pointer' : 'not-allowed'
                }}>Save to Collection</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
