import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xxykyokmuzxjmvsiyxmg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eWt5b2ttdXp4am12c2l5eG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTk2NjQsImV4cCI6MjA3Nzc3NTY2NH0.OvB3u6tT9ekY9yqKe4NGLaof04U1GI__UtHQg_hKJsc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
