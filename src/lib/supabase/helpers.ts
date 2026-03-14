/**
 * Supabase query helpers with proper typing.
 * 
 * The hand-maintained types.ts doesn't include per-table Relationships,
 * so join queries (`.select('*, relation(...)') `) resolve to `never`.
 * These helpers provide typed wrappers for common query patterns.
 * 
 * TODO: Replace with `supabase gen types typescript` when DB access is available.
 */
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

/**
 * Create a typed query builder that bypasses relationship type checking.
 * Use this for queries with joins/relations that the hand-maintained
 * types file can't express.
 */
export function typedQuery<T = any>(
  client: SupabaseClient<Database>,
  table: string
) {
  return client.from(table) as any as ReturnType<SupabaseClient['from']> & {
    select: (...args: any[]) => any
    insert: (...args: any[]) => any
    update: (...args: any[]) => any
    upsert: (...args: any[]) => any
    delete: (...args: any[]) => any
  }
}
