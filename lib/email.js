const fs = require('fs')
const path = require('path')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripHtml(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function renderTemplate(templateString, placeholders) {
  let out = String(templateString)
  for (const [key, value] of Object.entries(placeholders || {})) {
    const re = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, 'g')
    out = out.replace(re, String(value ?? ''))
  }
  return out
}

function loadHtmlTemplate(templateFileName) {
  const templatePath = path.join(process.cwd(), 'emails', 'templates', templateFileName)
  return fs.readFileSync(templatePath, 'utf8')
}

async function sendEmail(options) {
  const {
    to,
    subject,
    template,
    placeholders,
    html,
    text,
    replyTo,
    headers,
    tags,
  } = options || {}

  if (!to) throw new Error('sendEmail: `to` is required')
  if (!subject) throw new Error('sendEmail: `subject` is required')

  const apiKey = process.env.ZEPTOMAIL_API_KEY
  const fromName = process.env.ZEPTOMAIL_FROM_NAME
  const senderEmail = process.env.ZEPTOMAIL_SENDER_EMAIL

  if (!apiKey) throw new Error('Missing env: ZEPTOMAIL_API_KEY')
  if (!fromName) throw new Error('Missing env: ZEPTOMAIL_FROM_NAME')
  if (!senderEmail) throw new Error('Missing env: ZEPTOMAIL_SENDER_EMAIL')

  let htmlBody = html
  if (!htmlBody && template) {
    const rawTemplate = loadHtmlTemplate(template)
    htmlBody = renderTemplate(rawTemplate, placeholders)
  }
  if (!htmlBody) throw new Error('sendEmail: provide either `html` or `template`')

  const textBody = text || stripHtml(htmlBody)

  const payload = {
    from: {
      address: senderEmail,
      name: fromName,
    },
    to: [{ email_address: { address: to } }],
    subject,
    htmlbody: htmlBody,
    textbody: textBody,
  }

  if (replyTo) {
    payload.reply_to = [{ address: replyTo }]
  }

  if (headers && typeof headers === 'object') {
    payload.headers = headers
  }

  if (Array.isArray(tags) && tags.length) {
    payload.tags = tags
  }

  const endpoint = 'https://api.zeptomail.com/v1.1/email'

  const maxAttempts = 3
  let lastErr = null

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
      let respJson = null
      try {
        respJson = respText ? JSON.parse(respText) : null
      } catch (_) {
        respJson = { raw: respText }
      }

      if (!resp.ok) {
        const err = new Error(`ZeptoMail error: HTTP ${resp.status}`)
        err.status = resp.status
        err.response = respJson
        throw err
      }

      console.log('[email] sent', {
        to,
        subject,
        provider: 'zeptomail',
        attempt,
        ok: true,
      })

      return {
        ok: true,
        provider: 'zeptomail',
        attempt,
        response: respJson,
      }
    } catch (e) {
      lastErr = e
      console.error('[email] failed', {
        to,
        subject,
        provider: 'zeptomail',
        attempt,
        ok: false,
        error: e && e.message ? e.message : String(e),
      })

      if (attempt < maxAttempts) {
        await sleep(500 * attempt)
      }
    }
  }

  throw lastErr || new Error('sendEmail: failed')
}

module.exports = {
  sendEmail,
  renderTemplate,
  loadHtmlTemplate,
}
