/// <reference lib="dom" />

declare const Deno: {
  env: { get(key: string): string | undefined }
  readTextFile(path: string): Promise<string>
}

import { serve } from 'std/http/server'

type ZeptoMailPayload = {
  from: { address: string; name: string }
  to: Array<{ email_address: { address: string } }>
  subject: string
  htmlbody: string
  textbody: string
  reply_to?: Array<{ address: string }>
  headers?: Record<string, string>
  tags?: string[]
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripHtml(html: string) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function renderTemplate(templateString: string, placeholders: Record<string, unknown>) {
  let out = String(templateString)
  for (const [key, value] of Object.entries(placeholders || {})) {
    const re = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, 'g')
    out = out.replace(re, String(value ?? ''))
  }
  return out
}

function nowIso() {
  return new Date().toISOString()
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function sendEmail(params: {
  to: string
  subject: string
  templateName: 'signup.html' | 'commission.html' | 'payout.html'
  placeholders: Record<string, unknown>
}) {
  const apiKey = Deno.env.get('ZEPTOMAIL_API_KEY')
  const fromName = Deno.env.get('ZEPTOMAIL_FROM_NAME')
  const senderEmail = Deno.env.get('ZEPTOMAIL_SENDER_EMAIL')

  if (!apiKey) throw new Error('Missing env: ZEPTOMAIL_API_KEY')
  if (!fromName) throw new Error('Missing env: ZEPTOMAIL_FROM_NAME')
  if (!senderEmail) throw new Error('Missing env: ZEPTOMAIL_SENDER_EMAIL')

  const templateUrl = new URL(`./templates/${params.templateName}`, import.meta.url)
  const templateHtml = await Deno.readTextFile(templateUrl.pathname)
  const htmlBody = renderTemplate(templateHtml, params.placeholders)
  const textBody = stripHtml(htmlBody)

  const payload: ZeptoMailPayload = {
    from: {
      address: senderEmail,
      name: fromName,
    },
    to: [{ email_address: { address: params.to } }],
    subject: params.subject,
    htmlbody: htmlBody,
    textbody: textBody,
  }

  const endpoint = 'https://api.zeptomail.com/v1.1/email'
  const maxAttempts = 3

  let lastErr: unknown = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Zoho-enczapikey ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      const respText = await resp.text()
      let respJson: unknown = null
      try {
        respJson = respText ? JSON.parse(respText) : null
      } catch (_) {
        respJson = { raw: respText }
      }

      if (!resp.ok) {
        throw new Error(`ZeptoMail error: HTTP ${resp.status} body=${respText}`)
      }

      console.log('[email-events] sent', {
        to: params.to,
        subject: params.subject,
        attempt,
        at: nowIso(),
      })

      return { ok: true, attempt, response: respJson }
    } catch (e) {
      lastErr = e
      console.error('[email-events] failed', {
        to: params.to,
        subject: params.subject,
        attempt,
        error: e instanceof Error ? e.message : String(e),
        at: nowIso(),
      })

      if (attempt < maxAttempts) {
        await sleep(500 * attempt)
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('sendEmail failed')
}

function requireString(value: unknown, field: string) {
  if (!value || typeof value !== 'string') {
    throw new Error(`Invalid payload: ${field} is required`)
  }
  return value
}

function buildAppUrl(path: string) {
  const base = (Deno.env.get('NEXT_PUBLIC_APP_URL') || '').trim().replace(/\/$/, '')
  if (!base) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const payload = await req.json()

    const type = requireString(payload?.type, 'type')
    const to = requireString(payload?.to, 'to')

    const year = new Date().getFullYear()

    if (type === 'signup') {
      const name = requireString(payload?.name, 'name')
      const temporaryPassword = requireString(payload?.temporaryPassword, 'temporaryPassword')

      const loginUrl = buildAppUrl('/login')

      await sendEmail({
        to,
        subject: 'Welcome to DigiafrIQ — Your Temporary Password',
        templateName: 'signup.html',
        placeholders: {
          name,
          email: to,
          temporaryPassword,
          loginUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'commission') {
      const amount = payload?.amount
      const currency = requireString(payload?.currency, 'currency')
      const source = requireString(payload?.source, 'source')
      const date = requireString(payload?.date, 'date')

      const dashboardUrl = buildAppUrl('/dashboard/affiliate')

      await sendEmail({
        to,
        subject: 'DigiafrIQ — New Commission Earned',
        templateName: 'commission.html',
        placeholders: {
          amount,
          currency,
          source,
          date,
          dashboardUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (type === 'payout') {
      const amount = payload?.amount
      const currency = requireString(payload?.currency, 'currency')
      const paymentMethod = requireString(payload?.paymentMethod, 'paymentMethod')
      const referenceId = requireString(payload?.referenceId, 'referenceId')
      const date = requireString(payload?.date, 'date')

      const dashboardUrl = buildAppUrl('/dashboard/affiliate/withdrawals')

      await sendEmail({
        to,
        subject: 'DigiafrIQ — Payout Completed',
        templateName: 'payout.html',
        placeholders: {
          amount,
          currency,
          paymentMethod,
          referenceId,
          date,
          dashboardUrl,
          year,
        },
      })

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: false, error: 'Unknown type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[email-events] request error', {
      error: e instanceof Error ? e.message : String(e),
      at: nowIso(),
    })

    return new Response(JSON.stringify({ ok: false, error: 'Bad Request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
