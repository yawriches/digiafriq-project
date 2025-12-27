'use client'

import useSWR, { SWRConfiguration } from 'swr'
import { supabase } from '@/lib/supabase/client'

export const swrDefaults: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  keepPreviousData: true,
  dedupingInterval: 30_000,
}

export async function supabaseFetcher<T>(key: string, fn: () => Promise<T>): Promise<T> {
  // Ensure session exists/valid before querying.
  // If session is not ready, supabase-js returns null; SWR will treat thrown error as retryable.
  const { data } = await supabase.auth.getSession()
  if (!data.session) {
    throw new Error('No session')
  }
  return fn()
}

export { useSWR }
