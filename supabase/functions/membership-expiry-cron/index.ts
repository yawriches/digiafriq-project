/// <reference lib="dom" />

declare const Deno: {
  env: { get(key: string): string | undefined }
}

import { serve } from 'std/http/server'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * membership-expiry-cron
 *
 * This Edge Function is designed to be invoked daily (via pg_cron or an external scheduler).
 * It checks for memberships that are:
 *   1. Expiring in exactly 7 days  → sends membership_expiry_warning email
 *   2. Expiring today (day-of)     → sends membership_expiry_warning email (daysRemaining=0 worded as "today")
 *   3. Expired yesterday (1 day ago) → sends membership_expired email
 *
 * To avoid duplicate emails, we use a `membership_expiry_notifications` table
 * that tracks which notifications have been sent for each membership.
 */

serve(async (req: Request) => {
  // Allow GET (cron) and POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const siteUrl = (Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://digiafriq.com').replace(/\/$/, '')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[membership-expiry-cron] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return new Response(JSON.stringify({ ok: false, error: 'Missing env vars' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  // 7 days from now window
  const sevenDaysStart = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  const sevenDaysEnd = new Date(sevenDaysStart.getTime() + 24 * 60 * 60 * 1000)

  // Yesterday window (for post-expiry notification)
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)

  const results = {
    sevenDayWarnings: 0,
    dayOfWarnings: 0,
    expiredNotifications: 0,
    errors: [] as string[],
  }

  try {
    // 1. Find memberships expiring in exactly 7 days
    const { data: sevenDayMemberships, error: err7 } = await supabase
      .from('user_memberships')
      .select('id, user_id, expires_at, profiles(full_name, email)')
      .eq('is_active', true)
      .gte('expires_at', sevenDaysStart.toISOString())
      .lt('expires_at', sevenDaysEnd.toISOString())

    if (err7) {
      console.error('[membership-expiry-cron] Error fetching 7-day memberships:', err7)
      results.errors.push('7-day query failed')
    } else if (sevenDayMemberships?.length) {
      for (const m of sevenDayMemberships) {
        const sent = await hasNotificationBeenSent(supabase, m.id, '7_day_warning')
        if (sent) continue

        const profile = (m as any).profiles
        if (!profile?.email) continue

        const ok = await sendExpiryEmail(supabaseUrl, supabaseServiceKey, {
          type: 'membership_expiry_warning',
          to: profile.email,
          name: profile.full_name || profile.email.split('@')[0],
          daysRemaining: 7,
          expiryDate: formatDate(m.expires_at),
          renewalUrl: `${siteUrl}/dashboard/learner/membership`,
        })

        if (ok) {
          await recordNotification(supabase, m.id, m.user_id, '7_day_warning')
          results.sevenDayWarnings++
        }
      }
    }

    // 2. Find memberships expiring today
    const { data: todayMemberships, error: errToday } = await supabase
      .from('user_memberships')
      .select('id, user_id, expires_at, profiles(full_name, email)')
      .eq('is_active', true)
      .gte('expires_at', todayStart.toISOString())
      .lt('expires_at', todayEnd.toISOString())

    if (errToday) {
      console.error('[membership-expiry-cron] Error fetching today memberships:', errToday)
      results.errors.push('today query failed')
    } else if (todayMemberships?.length) {
      for (const m of todayMemberships) {
        const sent = await hasNotificationBeenSent(supabase, m.id, 'day_of_warning')
        if (sent) continue

        const profile = (m as any).profiles
        if (!profile?.email) continue

        const ok = await sendExpiryEmail(supabaseUrl, supabaseServiceKey, {
          type: 'membership_expiry_warning',
          to: profile.email,
          name: profile.full_name || profile.email.split('@')[0],
          daysRemaining: 0,
          expiryDate: formatDate(m.expires_at),
          renewalUrl: `${siteUrl}/dashboard/learner/membership`,
        })

        if (ok) {
          await recordNotification(supabase, m.id, m.user_id, 'day_of_warning')
          results.dayOfWarnings++
        }
      }
    }

    // 3. Find memberships that expired yesterday (post-expiry notification)
    const { data: expiredMemberships, error: errExpired } = await supabase
      .from('user_memberships')
      .select('id, user_id, expires_at, profiles(full_name, email)')
      .eq('is_active', true)
      .gte('expires_at', yesterdayStart.toISOString())
      .lt('expires_at', todayStart.toISOString())

    if (errExpired) {
      console.error('[membership-expiry-cron] Error fetching expired memberships:', errExpired)
      results.errors.push('expired query failed')
    } else if (expiredMemberships?.length) {
      for (const m of expiredMemberships) {
        const sent = await hasNotificationBeenSent(supabase, m.id, 'expired')
        if (sent) continue

        const profile = (m as any).profiles
        if (!profile?.email) continue

        const ok = await sendExpiryEmail(supabaseUrl, supabaseServiceKey, {
          type: 'membership_expired',
          to: profile.email,
          name: profile.full_name || profile.email.split('@')[0],
          expiryDate: formatDate(m.expires_at),
          renewalUrl: `${siteUrl}/dashboard/learner/membership`,
        })

        if (ok) {
          await recordNotification(supabase, m.id, m.user_id, 'expired')
          results.expiredNotifications++
        }
      }
    }

    console.log('[membership-expiry-cron] completed', results)

    return new Response(JSON.stringify({ ok: true, ...results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[membership-expiry-cron] unexpected error', e)
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

// --- Helpers ---

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function hasNotificationBeenSent(
  supabase: any,
  membershipId: string,
  notificationType: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('membership_expiry_notifications')
    .select('id')
    .eq('membership_id', membershipId)
    .eq('notification_type', notificationType)
    .maybeSingle()

  if (error) {
    console.error('[membership-expiry-cron] Error checking notification:', error)
    return false
  }
  return !!data
}

async function recordNotification(
  supabase: any,
  membershipId: string,
  userId: string,
  notificationType: string
): Promise<void> {
  const { error } = await supabase
    .from('membership_expiry_notifications')
    .insert({
      membership_id: membershipId,
      user_id: userId,
      notification_type: notificationType,
    })

  if (error) {
    console.error('[membership-expiry-cron] Error recording notification:', error)
  }
}

async function sendExpiryEmail(
  supabaseUrl: string,
  serviceKey: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/email-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('[membership-expiry-cron] email-events error:', resp.status, text)
      return false
    }

    return true
  } catch (e) {
    console.error('[membership-expiry-cron] email-events fetch error:', e)
    return false
  }
}
