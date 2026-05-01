import { NextResponse } from 'next/server'

interface WeatherData {
  temp: number
  condition: string
  icon: string
  location: string
  forecast: { day: string; temp: number; condition: string; icon: string }[]
}

// Mock weather data for UK (London area)
// In production, replace with real OpenWeatherMap API call
const MOCK_WEATHER: WeatherData = {
  temp: 14,
  condition: 'Partly Cloudy',
  icon: '⛅',
  location: 'London, UK',
  forecast: [
    { day: 'Tomorrow', temp: 16, condition: 'Sunny', icon: '☀️' },
    { day: 'Sunday', temp: 13, condition: 'Rainy', icon: '🌧️' },
    { day: 'Monday', temp: 15, condition: 'Cloudy', icon: '☁️' },
  ],
}

// Simple in-memory cache
let cache: { data: WeatherData; fetchedAt: number } | null = null
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export async function GET() {
  // Return cached data if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  // In production, fetch from OpenWeatherMap:
  // const apiKey = process.env.OPENWEATHER_API_KEY
  // const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London,UK&appid=${apiKey}&units=metric`)
  // const data = await res.json()

  // For now, use mock data
  cache = { data: MOCK_WEATHER, fetchedAt: Date.now() }
  return NextResponse.json(MOCK_WEATHER)
}
