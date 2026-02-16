# Supabase-integraation asennus

Tämä ohje selittää, miten Supabase-tietokanta otetaan käyttöön tarjouspyyntölomakkeelle.

## 1. Luo Supabase-projekti

1. Mene osoitteeseen [supabase.com](https://supabase.com)
2. Luo uusi projekti tai käytä olemassa olevaa
3. Odota, että tietokanta on valmis (muutama minuutti)

## 2. Luo tietokantataulukko

Mene Supabase-projektin SQL Editoriin ja aja seuraava kysely:

```sql
-- Luo leads-taulukko (tarjouspyynnot)
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

-- Ota käyttöön Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Salli julkinen insert (lomakkeen lähetys ilman kirjautumista)
CREATE POLICY "Allow public insert" ON leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- Salli luku vain kirjautuneille käyttäjille (mobiilisovellus)
CREATE POLICY "Allow authenticated read" ON leads
  FOR SELECT TO authenticated
  USING (true);

-- Valinnainen: indeksi hakutoimintoja varten
CREATE INDEX idx_leads_business_id ON leads(business_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

## 3. Hae API-tunnukset

1. Mene projektin asetuksiin: **Settings → API**
2. Kopioi seuraavat arvot:
   - **Project URL** (esim. `https://abc123.supabase.co`)
   - **anon / public key** (pitkä merkkijono)

## 4. Aseta ympäristömuuttujat

Luo projektin juureen .env-tiedosto ja lisää:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key-here
```

Sovellus lukee nämä arvot automaattisesti Vite-ympäristömuuttujista.

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

## Valinnainen: suojaa tunnukset

Varmista, että .env on gitin ignoroinnissa (esim. .gitignore-tiedostossa).

---

**Valmista!** Lomake nyt tallentaa tarjouspyynnöt Supabaseen.
