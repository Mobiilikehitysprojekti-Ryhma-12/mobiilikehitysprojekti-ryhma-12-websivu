/*
  supabaseClient.js
  - Supabase-yhteyden alustus ja konfiguraatio.
  - HUOM: Tayta SUPABASE_URL ja SUPABASE_ANON_KEY kun tietokanta on luotu.
  - Anon key on turvallinen julkaista selainpuolelle (RLS-saannot suojaavat dataa).
*/

// TODO: Asenna Supabase-kirjasto:
// npm install @supabase/supabase-js

// import { createClient } from '@supabase/supabase-js'

// TODO: Korvaa nama oikeilla arvoilla Supabase-projektin asetuksista.
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'

/**
 * Supabase-asiakas lomakkeen tietojen tallennukseen.
 * Kun projekti on luotu, poista kommentit ja asenna kirjasto.
 */
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Valiaikainen placeholder, jotta sovellus ei kaadu ennen kuin Supabase on kaynnissa.
export const supabase = null

/*
  Supabase-tietokannan taulun rakenne (leads):
  
  CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    business_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    coordinates JSONB,
    status TEXT DEFAULT 'new',
    CONSTRAINT valid_status CHECK (status IN ('new', 'quoted', 'accepted', 'rejected'))
  );

  -- RLS-saannot (Row Level Security):
  ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

  -- Salli insert kaikille (julkinen lomake)
  CREATE POLICY "Allow public insert" ON leads
    FOR INSERT TO anon
    WITH CHECK (true);

  -- Salli luku vain kirjautuneille (yrittajalle mobiilisovelluksessa)
  CREATE POLICY "Allow authenticated read" ON leads
    FOR SELECT TO authenticated
    USING (true);
*/
