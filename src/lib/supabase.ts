import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nrdlpdsoeksdybrshvst.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZGxwZHNvZWtzZHlicnNodnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NzQwNDEsImV4cCI6MjA4ODE1MDA0MX0.RxYy4tdYZQRxkDVF36XdNiKZPfjNVsbgDTe5fhwilI0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
