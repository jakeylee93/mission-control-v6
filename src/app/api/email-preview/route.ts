import { NextResponse } from 'next/server'

interface Email {
  id: string
  sender: string
  subject: string
  preview: string
  time: string
  unread: boolean
}

// Mock email data (in production, integrate with Gmail API)
const MOCK_EMAILS: Email[] = [
  {
    id: '1',
    sender: 'Sarah Chen',
    subject: 'Q2 Marketing Strategy — Review Needed',
    preview: 'Hi Jake, I\'ve put together the Q2 marketing strategy draft. Could you take a look at the budget section...',
    time: '10:23',
    unread: true,
  },
  {
    id: '2',
    sender: 'Tom Wilson',
    subject: 'Bar People — New Supplier Quote',
    preview: 'Hey Jake, got a quote back from the new glassware supplier. Much better pricing than our current one...',
    time: '09:45',
    unread: true,
  },
  {
    id: '3',
    sender: 'Emily Davis',
    subject: 'Invoice #2847 — Paid',
    preview: 'Your invoice has been paid. Transaction reference: INV-2847-PAID. Amount: £1,250.00...',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: '4',
    sender: 'Alex Kumar',
    subject: 'Mission Control v7 — Feedback',
    preview: 'Love the new Daily Brief layout! The weather card is a nice touch. One suggestion on the task cards...',
    time: 'Yesterday',
    unread: true,
  },
]

export async function GET() {
  const unread = MOCK_EMAILS.filter(e => e.unread)
  const read = MOCK_EMAILS.filter(e => !e.unread)
  
  return NextResponse.json({
    total: MOCK_EMAILS.length,
    unread: unread.length,
    emails: [...unread, ...read].slice(0, 5),
  })
}
