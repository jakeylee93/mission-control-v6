import { NextResponse } from 'next/server'

// Personal affirmations for Jake — not generic, based on who he is
const AFFIRMATIONS = [
  // Climbing / strength
  "You climb walls for fun. Life's problems are just another route to figure out. 🧗",
  "Every climb started with one hold. Every business started with one idea. You've done both.",
  "The guy who built a mobile bar empire from scratch can handle whatever today throws at him.",
  "Remember how scared you were on your first climb? Look how far you've come since then.",
  "Strong hands, strong mind. You've got both.",

  // Business / achievement
  "You're building multiple businesses while most people struggle with one. That takes something special.",
  "The Bar People didn't build itself. YOU built it. Don't forget that.",
  "AnyVendor is going to change how events work. You're not dreaming — you're building.",
  "You work silly hours because you care. But you also deserve rest. Both are true.",
  "Every successful person felt like a fraud at some point. It's a sign you're pushing boundaries.",

  // Self-worth
  "You're not behind. You're building something most people wouldn't even attempt.",
  "Low days don't define you. They're just part of being human. Tomorrow's a new route.",
  "The fact that you're building an AI system to help yourself shows incredible self-awareness.",
  "You don't need to earn rest. You deserve it just by existing.",
  "Being lonely doesn't mean you're alone. It means you're ready for deeper connections.",

  // Motivation
  "Small steps, mate. You don't need to send the whole wall today. Just one move.",
  "The hard days are what make the good days feel incredible. Keep going.",
  "You've survived 100% of your worst days so far. That's a perfect track record.",
  "Future you is going to look back at this period and be proud of how hard you worked.",
  "It's OK to not be OK. But it's also OK to ask for help. That's strength, not weakness.",

  // Practical
  "Drink some water. Step outside for 5 minutes. Text someone you care about. Small wins.",
  "When did you last climb? Book a session. Your body and mind will thank you.",
  "You're allowed to have a slow day. Not every day needs to be a 10.",
  "One thing at a time. You don't need to solve everything today.",
  "Take a breath. You're doing better than you think. Seriously.",
]

export async function GET() {
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  const index = dayOfYear % AFFIRMATIONS.length

  // Also pick a random one for variety
  const random = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]

  return NextResponse.json({
    daily: AFFIRMATIONS[index],
    random,
    total: AFFIRMATIONS.length,
  })
}
