import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://ikhsqiakasyhcqdcaxse.supabase.co'
const supabaseAnonKey = 'sb_publishable_vKLr3ugkmlcCAOfnxll3Vg_BXrrsSYT'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)