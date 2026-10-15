import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ClientData = {
  id: string;
  slug: string;
  business_name: string;
  business_category: string;
  primary_color: string;
  google_review_url: string;
  whatsapp_number: string;
  page_title: string;
  reward_text: string;
  review_snippets: string[];
  logo_url?: string; // <-- Tambahan kolom logo
};