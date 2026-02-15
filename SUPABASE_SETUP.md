# Supabase-integraation asennus

Tämä ohje selittää, miten Supabase-tietokanta otetaan käyttöön tarjouspyyntölomakkeelle.

## 1. Luo Supabase-projekti

1. Mene osoitteeseen [supabase.com](https://supabase.com)
2. Luo uusi projekti tai käytä olemassa olevaa
3. Odota, että tietokanta on valmis (muutama minuutti)

## 2. Luo tietokantataulukko

Mene Supabase-projektin SQL Editoriin ja aja seuraava kysely:

```sql
-- Luo quote_requests-taulukko
CREATE TABLE quote_requests (
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

-- Ota käyttöön Row Level Security
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Salli julkinen insert (lomakkeen lähetys ilman kirjautumista)
CREATE POLICY "Allow public insert" ON quote_requests
  FOR INSERT TO anon
  WITH CHECK (true);

-- Salli luku vain kirjautuneille käyttäjille (mobiilisovellus)
CREATE POLICY "Allow authenticated read" ON quote_requests
  FOR SELECT TO authenticated
  USING (true);

-- Valinnainen: indeksi hakutoimintoja varten
CREATE INDEX idx_quote_requests_business_id ON quote_requests(business_id);
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_created_at ON quote_requests(created_at DESC);
```

## 3. Hae API-tunnukset

1. Mene projektin asetuksiin: **Settings → API**
2. Kopioi seuraavat arvot:
   - **Project URL** (esim. `https://abc123.supabase.co`)
   - **anon / public key** (pitkä merkkijono)

## 4. Päivitä sovelluskonfiguraatio

Avaa tiedosto `src/services/supabaseClient.js` ja:

1. Päivitä `SUPABASE_URL` ja `SUPABASE_ANON_KEY` kohdassa 2 haetuilla arvoilla
2. Poista kommenttimerkinnät riveiltä:
   - `import { createClient } from '@supabase/supabase-js'`
   - `export const supabase = createClient(...)`
3. Poista tai kommentoi placeholder-rivi: `export const supabase = null`

## 5. Asenna Supabase-kirjasto

Aja projektin juuressa:

```bash
npm install @supabase/supabase-js
```

## 6. Testaa integraatio

1. Käynnistä dev-palvelin: `npm run dev`
2. Täytä lomake ja lähetä
3. Tarkista Supabase Table Editorista, että data tallentui

---

## Tietoturva

- **anon key** on turvallinen julkaista selainpuolella, koska RLS-säännöt rajoittavat pääsyä
- Lomake sallii vain **insert**-operaation anonyymeille käyttäjille
- **Luku** vaatii kirjautumisen (mobiilisovellusta varten)
- **Päivitys ja poisto** ovat oletuksena estettyjä

## Valinnainen: ympäristömuuttujat

Jos haluat piilottaa tunnukset versionhallinnasta:

1. Luo tiedosto `.env` projektin juureen:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. Päivitä `supabaseClient.js` käyttämään ympäristömuuttujia:
   ```js
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
   const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
   ```

3. Lisää `.env` tiedostoon `.gitignore`

---

**Valmista!** Lomake nyt tallentaa tarjouspyynnöt Supabaseen.
