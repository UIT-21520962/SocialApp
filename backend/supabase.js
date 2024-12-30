import 'url-polyfill';
import { createClient } from '@supabase/supabase-js';

// Khai báo trực tiếp URL và key
const SUPABASE_URL = 'https://jpmkponozafwrjgahbeq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbWtwb25vemFmd3JqZ2FoYmVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NDM4MTMsImV4cCI6MjA1MDIxOTgxM30.Tl7-X3-Ef6gCxu-simsDI_D-tTpT5hIvck-y6k09ZIY';

// Kiểm tra xem các giá trị đã được khai báo hay chưa
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
}

// Tạo client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { SUPABASE_URL, SUPABASE_ANON_KEY };

export default supabase;
