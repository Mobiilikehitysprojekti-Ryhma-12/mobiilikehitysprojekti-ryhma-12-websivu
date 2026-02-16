/*
  supabaseClient.js
  - Supabase-yhteyden alustus ja konfiguraatio.
  - HUOM: Tayta SUPABASE_URL ja SUPABASE_ANON_KEY kun tietokanta on luotu.
  - Anon key on turvallinen julkaista selainpuolelle (RLS-saannot suojaavat dataa).
*/

// TODO: Asenna Supabase-kirjasto:
// npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

// TODO: Aseta .env-tiedostoon VITE_SUPABASE_URL ja VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

/**
 * Supabase-asiakas lomakkeen tietojen tallennukseen.
 * Kun projekti on luotu, poista kommentit ja asenna kirjasto.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/*
  Supabase-tietokannan taulun rakenne (leads):
  
  CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'new',
    customer_name TEXT,
    customer_phone TEXT,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now(),
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
