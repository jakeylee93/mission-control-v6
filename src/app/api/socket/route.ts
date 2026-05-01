import { NextResponse } from 'next/server'

// Simple WebSocket-like endpoint using Server-Sent Events (SSE)
// For production, consider using a real WebSocket server (Socket.io, etc.)

const clients: ReadableStreamDefaultController[] = []

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      clients.push(controller)
      
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`
      controller.enqueue(new TextEncoder().encode(data))
      
      // Keep connection alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(':keepalive\n\n'))
        } catch {
          clearInterval(keepAlive)
          const idx = clients.indexOf(controller)
          if (idx > -1) clients.splice(idx, 1)
        }
      }, 30000)
      
      // Cleanup on close
      return () => {
        clearInterval(keepAlive)
        const idx = clients.indexOf(controller)
        if (idx > -1) clients.splice(idx, 1)
      }
    }
  })
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}

// Broadcast to all connected clients
export async function POST(request: Request) {
  const body = await request.json()
  
  const message = `data: ${JSON.stringify(body)}\n\n`
  const encoded = new TextEncoder().encode(message)
  
  clients.forEach(controller => {
    try {
      controller.enqueue(encoded)
    } catch {
      // Client disconnected
    }
  })
  
  return NextResponse.json({ sent: clients.length })
}
