import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create singleton client instance
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// Helper for executing RPC functions
export async function executeRPC<T = any>(
  functionName: string, 
  params?: Record<string, any>
): Promise<{ data: T | null; error: any }> {
  const { data, error } = await supabase.rpc(functionName, params)
  
  if (error) {
    console.error(`[Supabase RPC] Error in ${functionName}:`, error)
  }
  
  return { data, error }
}

// Helper for batch operations with concurrency control
export async function batchExecute<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> {
  const pLimit = (await import('p-limit')).default
  const limit = pLimit(concurrency)
  
  return Promise.all(
    items.map(item => limit(() => operation(item)))
  )
}