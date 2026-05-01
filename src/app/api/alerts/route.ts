import { NextResponse } from 'next/server'

interface Alert {
  id: string
  type: 'meeting' | 'task' | 'cost' | 'weather'
  message: string
  urgency: 'high' | 'medium' | 'low'
  action?: string
  actionUrl?: string
  dismissible: boolean
}

// Generate alerts based on current context
// In production, this would check real calendar, tasks, costs
export async function GET() {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  
  const alerts: Alert[] = []
  
  // Mock: Meeting in 15 minutes (only show during business hours)
  if (hour >= 9 && hour < 18) {
    alerts.push({
      id: '1',
      type: 'meeting',
      message: 'Team standup in 15 minutes',
      urgency: 'high',
      action: 'Join Zoom',
      actionUrl: '#',
      dismissible: true,
    })
  }
  
  // Mock: Task overdue
  alerts.push({
    id: '2',
    type: 'task',
    message: '2 tasks are overdue — Bar People Q2 review and AnyVendor supplier quote',
    urgency: 'high',
    action: 'View tasks',
    actionUrl: '#plans',
    dismissible: true,
  })
  
  // Mock: AI spend alert (show if "high")
  alerts.push({
    id: '3',
    type: 'cost',
    message: 'AI spend today: £4.20 — approaching daily budget (£5.00)',
    urgency: 'medium',
    action: 'View costs',
    dismissible: true,
  })
  
  // Mock: Weather alert
  if (hour < 12) {
    alerts.push({
      id: '4',
      type: 'weather',
      message: 'Rain expected this afternoon — bring an umbrella',
      urgency: 'low',
      dismissible: true,
    })
  }
  
  return NextResponse.json({
    alerts: alerts.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    }),
    highPriority: alerts.filter(a => a.urgency === 'high').length,
  })
}
