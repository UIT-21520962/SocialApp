import 'url-polyfill';
import { createClient } from '@supabase/supabase-js';

// Khai báo trực tiếp URL và key
const SUPABASE_URL;
const SUPABASE_ANON_KEY;

// Kiểm tra xem các giá trị đã được khai báo hay chưa
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
}

// Tạo client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { SUPABASE_URL, SUPABASE_ANON_KEY };

export default supabase;
