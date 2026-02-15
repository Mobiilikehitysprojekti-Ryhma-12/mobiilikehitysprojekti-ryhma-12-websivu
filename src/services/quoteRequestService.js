/*
  quoteRequestService.js
  - Tarjouspyyntojen tallennuslogiikka Supabase-tietokantaan.
  - Sisaltaa virheenkasittelyn ja validoinnin.
  - Valmis kaytettavaksi kun supabaseClient on konfiguroitu.
*/

import { supabase } from './supabaseClient'

/**
 * Tallentaa uuden tarjouspyynnon tietokantaan.
 * @param {Object} requestData Tarjouspyynnon tiedot.
 * @param {string} requestData.businessId Yrittajan tunniste.
 * @param {string} requestData.title Otsikko.
 * @param {string} requestData.description Kuvaus.
 * @param {string} requestData.name Asiakkaan nimi.
 * @param {string} [requestData.phone] Puhelinnumero (valinnainen).
 * @param {string} [requestData.address] Osoite (valinnainen).
 * @param {Object} [requestData.coordinates] Koordinaatit { lat, lon } (valinnainen).
 * @returns {Promise<{ success: boolean; data?: any; error?: string }>}
 */
export const createQuoteRequest = async (requestData) => {
  // Validoi pakolliset kentat ennen lahettamista.
  if (
    !requestData.businessId ||
    !requestData.title ||
    !requestData.description ||
    !requestData.name
  ) {
    return {
      success: false,
      error: 'Pakolliset kentät puuttuvat.',
    }
  }

  // Jos Supabase ei ole viela konfiguroitu, palautetaan onnistuminen demotarkoituksessa.
  if (!supabase) {
    console.warn(
      '[DEV] Supabase ei ole konfiguroitu. Simuloidaan onnistunut tallennus.'
    )
    console.log('[DEV] Tallennettava data:', requestData)
    return {
      success: true,
      data: { id: 'demo-' + Date.now(), ...requestData },
    }
  }

  try {
    // Muodosta tietokantaan tallennettava objekti.
    const payload = {
      business_id: requestData.businessId,
      title: requestData.title.trim(),
      description: requestData.description.trim(),
      name: requestData.name.trim(),
      phone: requestData.phone?.trim() || null,
      address: requestData.address?.trim() || null,
      coordinates: requestData.coordinates || null,
      status: 'new',
    }

    // Tallenna Supabaseen leads-tauluun (businessId mukana).
    const { data, error } = await supabase
      .from('leads')
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert virhe:', error)
      return {
        success: false,
        error: 'Tietokannan tallennus epaonnistui. Yrita uudelleen.',
      }
    }

    console.log('Tarjouspyynto tallennettu:', data)
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Odottamaton virhe tallennuksessa:', error)
    return {
      success: false,
      error: 'Odottamaton virhe. Yritä hetken kuluttua uudelleen.',
    }
  }
}

/**
 * Hakee tarjouspyynnon ID:lla (ei kaytossa web-lomakkeella, mutta hyodyllinen myohemmin).
 * @param {string} requestId Tarjouspyynnon UUID.
 * @returns {Promise<{ success: boolean; data?: any; error?: string }>}
 */
export const getQuoteRequestById = async (requestId) => {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase ei ole konfiguroitu.',
    }
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error) {
      console.error('Supabase select virhe:', error)
      return {
        success: false,
        error: 'Tarjouspyynnön hakeminen epäonnistui.',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Odottamaton virhe haussa:', error)
    return {
      success: false,
      error: 'Odottamaton virhe.',
    }
  }
}
