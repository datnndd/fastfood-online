import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env variables are missing. Auth flows will fail until they are set.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

let currentSession = null
const subscribers = new Set()

const notify = (session) => {
  currentSession = session
  subscribers.forEach((listener) => {
    try {
      listener(session)
    } catch (error) {
      console.error('Supabase session listener failed', error)
    }
  })
}

supabase.auth.getSession().then(({ data }) => {
  notify(data?.session ?? null)
})

supabase.auth.onAuthStateChange((_event, session) => {
  notify(session)
})

export const subscribeToSession = (listener, { immediate = true } = {}) => {
  subscribers.add(listener)
  if (immediate) {
    listener(currentSession)
  }
  return () => subscribers.delete(listener)
}

export const getCurrentSession = () => currentSession
