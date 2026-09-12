import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Variáveis de ambiente do Supabase não encontradas. " +
      "Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY " +
      "estão definidas no seu arquivo .env (ou nas variáveis de ambiente da Vercel)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
