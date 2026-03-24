import { NextRequest, NextResponse } from 'next/server'

const DATA: Record<string, { summary: string; days: { date: string; items: string[] }[] }> = {
  marg: {
    summary: 'Busy week orchestrating across all systems. Shipped Health app product editing, built the Media List app with Supabase backend, and redesigned the Maps interface with collapsible categories and favourites.',
    days: [
      { date: '2026-03-24', items: ['Agent cards redesign — selectable hero layout', 'Reviewed Maps route-from-home fix'] },
      { date: '2026-03-23', items: ['Media List app — podcasts, newsletters, reading tracker', 'Seeded first item: The Rest Is Politics'] },
      { date: '2026-03-22', items: ['Maps redesign — collapsible categories, compact cards', 'Added Upcoming section from Google Calendar'] },
      { date: '2026-03-21', items: ['Health app — edit products, improved quantity picker', 'Zero-calorie warning prompt'] },
      { date: '2026-03-20', items: ['Maps — reorganised categories, added venues', 'Route from Home button'] },
      { date: '2026-03-19', items: ['Cost tracking review', 'Calendar integration fixes'] },
      { date: '2026-03-18', items: ['Weekly planning session', 'Agent coordination sync'] },
    ],
  },
  doc: {
    summary: 'Focused on infrastructure and build pipeline. Deployed Mission Control v6.1, optimised Next.js bundle size, and set up Supabase tables for the new Media List feature.',
    days: [
      { date: '2026-03-24', items: ['Build pipeline optimisation', 'Bundle analysis — reduced by 12%'] },
      { date: '2026-03-23', items: ['Supabase schema for media_items table', 'API route for media-list CRUD'] },
      { date: '2026-03-22', items: ['Next.js config tuning', 'Image optimisation pipeline'] },
      { date: '2026-03-21', items: ['Health API endpoints — product editing', 'Database migration for quantity fields'] },
      { date: '2026-03-20', items: ['Maps API — Google Places integration fix', 'Geocoding cache layer'] },
      { date: '2026-03-19', items: ['Vercel deployment debugging', 'Environment variable audit'] },
      { date: '2026-03-18', items: ['v6.1 release deploy', 'Post-deploy smoke tests'] },
    ],
  },
  cindy: {
    summary: 'Managed calendar and contacts workflows. Synced Google Calendar events, handled scheduling conflicts, and organised contact groups for the new contacts feature.',
    days: [
      { date: '2026-03-24', items: ['Calendar sync — 47 events processed', 'Contact deduplication run'] },
      { date: '2026-03-23', items: ['Weekly schedule summary generated', 'Meeting conflict resolution — 3 overlaps fixed'] },
      { date: '2026-03-22', items: ['Google Calendar API token refresh', 'Event colour mapping update'] },
      { date: '2026-03-21', items: ['Contact import from Google — 234 contacts', 'Group categorisation'] },
      { date: '2026-03-20', items: ['Reminder notifications setup', 'Calendar widget data feed'] },
      { date: '2026-03-19', items: ['Scheduling assistant — availability windows', 'Travel time estimation for events'] },
      { date: '2026-03-18', items: ['Weekly digest email draft', 'Calendar cleanup — removed 12 stale events'] },
    ],
  },
}

export async function GET(request: NextRequest) {
  const agent = request.nextUrl.searchParams.get('agent') || 'marg'
  const data = DATA[agent]

  if (!data) {
    return NextResponse.json({ error: 'Unknown agent' }, { status: 404 })
  }

  return NextResponse.json(data)
}
