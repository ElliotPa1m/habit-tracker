import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { error } = await supabase.from('habits').select('id').limit(1);

  if (error) return res.status(500).json({ status: 'error' });
  return res.status(200).json({ status: 'ok' });
}