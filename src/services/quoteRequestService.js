/*
  quoteRequestService.js
  - Tarjouspyyntojen tallennuslogiikka Supabase-tietokantaan.
  - Sisaltaa virheenkasittelyn ja validoinnin.
  - Valmis kaytettavaksi kun supabaseClient on konfiguroitu.
*/

import { supabase } from './supabaseClient'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isValidUuid = (value) => UUID_REGEX.test(value)

/**
 * Tallentaa uuden tarjouspyynnon tietokantaan.
 * @param {Object} requestData Tarjouspyynnon tiedot.
 * @param {string} requestData.businessId Yrittajan tunniste.
 * @param {string} requestData.title Otsikko.
 * @param {string} requestData.description Kuvaus.
 * @param {string} requestData.customerName Asiakkaan nimi.
 * @param {string} requestData.customerEmail Asiakkaan sahkoposti.
 * @param {string} [requestData.phone] Puhelinnumero (valinnainen).
 * @param {string} [requestData.address] Osoite (valinnainen).
 * @param {number} [requestData.lat] Latitude (valinnainen).
 * @param {number} [requestData.lng] Longitude (valinnainen).
 * @returns {Promise<{ success: boolean; data?: any; error?: string }>}
 */
export const createQuoteRequest = async (requestData) => {
  // Validoi pakolliset kentat ennen lahettamista.
  if (
    !requestData.businessId ||
    !requestData.title ||
    !requestData.description ||
    !requestData.customerName ||
    !requestData.customerEmail
  ) {
    return {
      success: false,
      error: 'Pakolliset kentät puuttuvat.',
    }
  }

  if (!isValidUuid(requestData.businessId)) {
    return {
      success: false,
      error: 'Business ID ei ole kelvollinen UUID.',
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
      customer_name: requestData.customerName.trim(),
      customer_email: requestData.customerEmail.trim(),
      customer_phone: requestData.phone?.trim() || null,
      address: requestData.address?.trim() || null,
      lat: typeof requestData.lat === 'number' ? requestData.lat : null,
      lng: typeof requestData.lng === 'number' ? requestData.lng : null,
      status: 'new',
      //created_at: new Date().toISOString(),
    }

    // Tallenna Supabaseen leads-tauluun (businessId mukana).
    const { error } = await supabase.from('leads').insert([payload])

    if (error) {
      console.error('Supabase insert virhe:', error)
      return {
        success: false,
        error: 'Tietokannan tallennus epäonnistui. Yritä uudelleen.',
      }
    }

    console.log('Tarjouspyynto tallennettu:', payload)
    return {
      success: true,
      data: payload,
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
