import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = 'https://cityvueckcxrudyoxaih.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdHl2dWVja2N4cnVkeW94YWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyODA3MjgsImV4cCI6MjA2Nzg1NjcyOH0.FiQYMLNb_9_WfnwHCjWQkAXeMekQaN7hII7MFbR20tk'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)