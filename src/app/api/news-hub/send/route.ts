import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { campaign_id, test_email, html_content, subject_line, from_name, from_email } = body

  const resendKey = process.env.RESEND_API_KEY

  // Test send — sends to a single email address
  if (test_email) {
    if (!resendKey) {
      return NextResponse.json({
        ok: false,
        error: 'RESEND_API_KEY not set. Add it to Vercel env vars to enable email sending.',
        setup_required: true,
      })
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from_email ? `${from_name || 'Newsletter'} <${from_email}>` : 'Newsletter <onboarding@resend.dev>',
          to: test_email,
          subject: subject_line || 'Test Newsletter',
          html: html_content,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        return NextResponse.json({ ok: false, error: result.message || 'Send failed' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, message_id: result.id, test: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Send failed'
      return NextResponse.json({ ok: false, error: message }, { status: 500 })
    }
  }

  // Full send — sends to all subscribers in a list
  if (campaign_id) {
    if (!resendKey) {
      return NextResponse.json({
        ok: false,
        error: 'RESEND_API_KEY not set. Add it to Vercel env vars to enable email sending.',
        setup_required: true,
      })
    }

    const supabase = createServerSupabaseAdmin()

    // Get campaign
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ ok: false, error: 'Campaign not found' }, { status: 404 })
    }

    if (!campaign.list_id) {
      return NextResponse.json({ ok: false, error: 'No subscriber list selected for this campaign' }, { status: 400 })
    }

    // Get subscribers
    const { data: members } = await supabase
      .from('subscriber_members')
      .select('subscribers(email, name)')
      .eq('list_id', campaign.list_id)

    if (!members || members.length === 0) {
      return NextResponse.json({ ok: false, error: 'No subscribers in selected list' }, { status: 400 })
    }

    const html = campaign.html_content || html_content
    if (!html) {
      return NextResponse.json({ ok: false, error: 'No HTML content for campaign' }, { status: 400 })
    }

    let sent = 0
    let failed = 0
    const fromAddr = from_email ? `${from_name || 'Newsletter'} <${from_email}>` : 'Newsletter <onboarding@resend.dev>'

    for (const member of members) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = (member as any).subscribers
      if (!sub?.email) continue

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddr,
            to: sub.email,
            subject: campaign.subject_line || campaign.title,
            html,
          }),
        })

        if (res.ok) sent++
        else failed++
      } catch {
        failed++
      }
    }

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: sent })
      .eq('id', campaign_id)

    return NextResponse.json({ ok: true, sent, failed, total: members.length })
  }

  return NextResponse.json({ ok: false, error: 'Provide test_email or campaign_id' }, { status: 400 })
}
