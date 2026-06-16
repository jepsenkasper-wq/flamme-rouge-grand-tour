import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ytdvptdgxdhpdhhnveee.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZHZwdGRneGRocGRoaG52ZWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDA1NTUsImV4cCI6MjA5NzExNjU1NX0.55q3k2JPPOIpgFErEfebZ3ZLauWiUR4nIHgOlR6G3mg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});