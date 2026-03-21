import { NextResponse } from 'next/server'

const BIRTHDAY_MESSAGE = 'Happy birthday Jake! Take today to celebrate — you deserve it.'

const AFFIRMATIONS = [
  'You are building a life with intention, and that matters.',
  'Small progress still counts as progress.',
  'You can do hard things one step at a time.',
  'Your effort today is enough.',
  'Rest is productive when it protects your energy.',
  'You have overcome difficult days before; you can do it again.',
  'Your calm decisions create better outcomes.',
  'You do not need perfect conditions to begin.',
  'Your consistency is becoming your superpower.',
  'You are allowed to grow at your own pace.',
  'One focused hour can change the whole day.',
  'Your work has value, even when results are delayed.',
  'You are learning, adapting, and getting sharper.',
  'Your future gets built by today\'s choices.',
  'You can choose clarity over pressure.',
  'Your body and mind both deserve care.',
  'You are not behind; you are in motion.',
  'Good boundaries create better momentum.',
  'You can reset at any point in the day.',
  'The next right action is enough for now.',
  'You can be ambitious and kind to yourself.',
  'Your presence matters to the people around you.',
  'You are building trust with yourself every time you show up.',
  'Strong foundations beat quick fixes.',
  'You can ask for support and still be strong.',
  'Your discipline is paying off, even if quietly.',
  'You have permission to simplify.',
  'You can celebrate small wins without waiting for perfect.',
  'You are more resilient than this moment feels.',
  'You can protect your peace and pursue your goals.',
  'Your attention is your most valuable resource.',
  'You are allowed to take up space and speak clearly.',
  'Progress is not linear, but it is still progress.',
  'You can finish today proud of one meaningful thing.',
  'Your story is still being written, and this chapter matters.',
]

function getDayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0))
  const now = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  return Math.floor((now.getTime() - start.getTime()) / 86400000)
}

function getRandomAffirmation(exclude?: string): string {
  const pool = exclude ? AFFIRMATIONS.filter((item) => item !== exclude) : AFFIRMATIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

export async function GET() {
  const today = new Date()
  const isBirthday = today.getUTCMonth() === 2 && today.getUTCDate() === 22

  if (isBirthday) {
    return NextResponse.json({
      daily: BIRTHDAY_MESSAGE,
      random: getRandomAffirmation(BIRTHDAY_MESSAGE),
      total: AFFIRMATIONS.length + 1,
    })
  }

  const dayOfYear = getDayOfYear(today)
  const daily = AFFIRMATIONS[(dayOfYear - 1) % AFFIRMATIONS.length]

  return NextResponse.json({
    daily,
    random: getRandomAffirmation(daily),
    total: AFFIRMATIONS.length,
  })
}
