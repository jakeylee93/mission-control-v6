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

export function HealthApp({ onBack }: HealthAppProps) {
  const [entries, setEntries] = useState<NutritionEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load today's entries
  useEffect(() => {
    loadTodaysEntries()
  }, [])

  // Calculate daily totals when entries change
  useEffect(() => {
    const totals = entries.reduce((acc, entry) => ({
      calories: acc.calories + entry.total_calories,
      protein: acc.protein + entry.total_protein,
      carbs: acc.carbs + entry.total_carbs,
      fat: acc.fat + entry.total_fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    
    setDailyTotals(totals)
  }, [entries])

  async function loadTodaysEntries() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/health/nutrition?date=${today}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Failed to load entries:', error)
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
        // Add the new entry
        setEntries(prev => [result.entry, ...prev])
      } else {
        console.error('Failed to analyze food')
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsLoading(false)
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ff6b6b', fontSize: 24, fontWeight: 700 }}>
              {dailyTotals.calories}
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>/{goals.calories} cal</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#4ecdc4', fontSize: 24, fontWeight: 700 }}>
              {dailyTotals.protein}g
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>/{goals.protein}g protein</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#ffe066', fontSize: 24, fontWeight: 700 }}>
              {dailyTotals.carbs}g
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>/{goals.carbs}g carbs</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#a8e6cf', fontSize: 24, fontWeight: 700 }}>
              {dailyTotals.fat}g
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>/{goals.fat}g fat</div>
          </div>
        </div>
      </div>

      {/* Add Food Button */}
      <div style={{ marginBottom: 20 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          style={{
            width: '100%',
            background: isLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: 16,
            color: '#fff',
            padding: '16px 24px',
            fontSize: 16,
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          📸 {isLoading ? 'Analyzing...' : 'Add Food Photo'}
        </button>
      </div>

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