/**
 * Production-safe logger utility.
 * 
 * - In production: only logs warnings and errors (server-side only)
 * - In development: logs everything
 * - Never logs sensitive data (redacts tokens, keys, passwords)
 */

const isProduction = process.env.NODE_ENV === 'production'
const isServer = typeof window === 'undefined'

function redactSensitive(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return arg
        .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
        .replace(/(?:password|secret|key|token)["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, '$1: [REDACTED]')
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        const str = JSON.stringify(arg)
        const redacted = str
          .replace(/"(?:password|secret|key|token|authorization)":\s*"[^"]*"/gi, '"$1":"[REDACTED]"')
        return JSON.parse(redacted)
      } catch {
        return arg
      }
    }
    return arg
  })
}

export const logger = {
  /** Debug-level logging — only in development */
  debug(...args: unknown[]) {
    if (!isProduction) {
      console.log(...args)
    }
  },

  /** Info-level logging — only in development or server-side production */
  info(...args: unknown[]) {
    if (!isProduction) {
      console.log(...args)
    } else if (isServer) {
      console.log(...redactSensitive(args))
    }
  },

  /** Warning-level logging — always logs on server, dev only on client */
  warn(...args: unknown[]) {
    if (isServer || !isProduction) {
      console.warn(...redactSensitive(args))
    }
  },

  /** Error-level logging — always logs everywhere */
  error(...args: unknown[]) {
    console.error(...redactSensitive(args))
  },
}
