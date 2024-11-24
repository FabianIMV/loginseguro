import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sijmswybqeopefdwuatx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpam1zd3licWVvcGVmZHd1YXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4ODM1OTksImV4cCI6MjA0NzQ1OTU5OX0.QI8gzL5vs8wkKXiKWmGAQJI1cVEpKWBs2kTra_O5puk'

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });