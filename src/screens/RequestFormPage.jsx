/*
  RequestFormPage.jsx
  - Asiakkaan tarjouspyynto-lomake suoraan URL:sta.
  - Sivu ei vaadi kirjautumista tai latauksia.
  - BusinessId tulee reitilta ja naytetaan otsikossa.
  - Validointi estaa lahetyksen ilman pakollisia kenttia.
  - Honeyfield torjuu perus-botit ilman raskasta logiikkaa.
  - Osoite muunnetaan automaattisesti koordinaateiksi ennen lahetysta.
  - Lomakedata tallennetaan Supabase-tietokantaan.
*/

import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { geocodeAddress } from '../services/geocoding'
import { createQuoteRequest } from '../services/quoteRequestService'

const initialFormState = {
  title: '',
  description: '',
  customerName: '',
  customerEmail: '',
  phone: '',
  address: '',
  honey: '',
}

const RATE_LIMIT_MS = 10000
const RATE_LIMIT_STORAGE_KEY = 'quoteFlow:lastSubmitAt'
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isValidUuid = (value) => UUID_REGEX.test(value)

/**
 * Validoi lomakkeen pakolliset kentat ja palauttaa virheet.
 * @param {typeof initialFormState} values Lomakkeen nykyiset arvot.
 * @returns {Record<string, string>} Virheviestit kenttakohtaisesti.
 */
const validateRequiredFields = (values) => {
  const errors = {}

  if (!values.title.trim()) {
    errors.title = 'Otsikko on pakollinen.'
  }

  if (!values.description.trim()) {
    errors.description = 'Kuvaus on pakollinen.'
  }

  if (!values.customerName.trim()) {
    errors.customerName = 'Nimi on pakollinen.'
  }

  const emailValue = values.customerEmail.trim()
  if (!emailValue) {
    errors.customerEmail = 'Sähköposti on pakollinen.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    errors.customerEmail = 'Tarkista sähköposti.'
  }

  return errors
}

/**
 * Hakee edellisen lahetyksen ajan selaimesta rate limit -tarkistukseen.
 * @returns {number} Timestamp millisekunteina tai 0, jos ei saatavilla.
 */
const getLastSubmitTimestamp = () => {
  try {
    const storedValue = window.localStorage.getItem(RATE_LIMIT_STORAGE_KEY)
    return storedValue ? Number(storedValue) : 0
  } catch {
    return 0
  }
}

/**
 * Tallentaa onnistuneen lahetyksen ajan selaimeen.
 * @param {number} timestamp Millisekuntitarkkuinen aika.
 */
const setLastSubmitTimestamp = (timestamp) => {
  try {
    window.localStorage.setItem(RATE_LIMIT_STORAGE_KEY, String(timestamp))
  } catch {
    // Jos tallennus ei onnistu, jatketaan ilman rate limit -muistia.
  }
}

/**
 * Tarjouspyyntolomake, joka naytetaan businessId-reitilla.
 * @returns {JSX.Element} Lomaketta ja tiloja kuvaava UI.
 */
function RequestFormPage() {
  const { businessId } = useParams()
  const [formValues, setFormValues] = useState(initialFormState)
  const [touchedFields, setTouchedFields] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)

  const validationErrors = useMemo(
    () => validateRequiredFields(formValues),
    [formValues]
  )

  const isFormValid = Object.keys(validationErrors).length === 0
  const isBusinessIdValid = businessId && isValidUuid(businessId)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleBlur = (event) => {
    const { name } = event.target
    setTouchedFields((prev) => ({ ...prev, [name]: true }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitAttempted(true)

    // Honeyfield: jos tama taytetaan, oletetaan botti ja estetaan lahetys.
    if (formValues.honey.trim()) {
      setSubmissionStatus('error')
      setErrorMessage(
        'Lähetys estettiin automaattisen suojauksen vuoksi. Yritä uudelleen.'
      )
      return
    }

    // Rate limit: estetaan toistuvat lahetykset liian nopeasti.
    const now = Date.now()
    const lastSubmitAt = getLastSubmitTimestamp()
    const timeSinceLastSubmit = now - lastSubmitAt
    if (lastSubmitAt && timeSinceLastSubmit < RATE_LIMIT_MS) {
      const secondsLeft = Math.ceil(
        (RATE_LIMIT_MS - timeSinceLastSubmit) / 1000
      )
      setSubmissionStatus('error')
      setErrorMessage(
        `Lähetysraja ylittyi. Yritä uudelleen ${secondsLeft} sekunnin kuluttua.`
      )
      return
    }

    if (!isFormValid) {
      return
    }

    if (!isBusinessIdValid) {
      setSubmissionStatus('error')
      setErrorMessage('Business ID ei ole kelvollinen UUID.')
      return
    }

    // Muunna osoite koordinaateiksi ennen lahetysta (jos annettu).
    let coordinates = null
    if (formValues.address.trim()) {
      setIsGeocoding(true)
      coordinates = await geocodeAddress(formValues.address)
      setIsGeocoding(false)

      if (!coordinates) {
        console.warn(
          'Osoitetta ei voitu muuntaa koordinaateiksi, jatketaan ilman.'
        )
      }
    }

    // Tallennetaan tarjouspyynto Supabase-tietokantaan.
    const payload = {
      businessId,
      title: formValues.title,
      description: formValues.description,
      customerName: formValues.customerName,
      customerEmail: formValues.customerEmail,
      phone: formValues.phone,
      address: formValues.address,
      lat: coordinates?.lat ?? null,
      lng: coordinates?.lon ?? null,
    }

    const result = await createQuoteRequest(payload)

    if (!result.success) {
      setSubmissionStatus('error')
      setErrorMessage(
        result.error || 'Tallennus epäonnistui. Yritä uudelleen.'
      )
      return
    }

    console.log('Tarjouspyynto lahetetty:', result.data)
    setLastSubmitTimestamp(now)
    setSubmissionStatus('success')
    setErrorMessage('')
  }

  // Palautetaan nakyma takaisin lomakkeeseen demotilanteissa.
  const returnToForm = () => {
    setSubmissionStatus('idle')
  }

  // Simuloi lahetysvirhetta, jotta virhenakyman voi esitella demossa.
  const handleDemoError = () => {
    setSubmissionStatus('error')
    setErrorMessage(
      'Lähetys ei onnistunut. Tarkista verkkoyhteys ja yritä uudelleen.'
    )
  }

  // Virheita naytetaan vasta kun kenttaa on koskettu tai lahetys yritetty.
  const getFieldError = (fieldName) => {
    if (!validationErrors[fieldName]) {
      return ''
    }

    if (!touchedFields[fieldName] && !submitAttempted) {
      return ''
    }

    return validationErrors[fieldName]
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="hero__eyebrow">QuoteFlow - Tarjouspyyntö</p>
        <h1 className="hero__title">Lähetä pyyntö nopeasti</h1>
        <p className="hero__subtitle">
          Täytä tiedot, niin yrittäjä saa kaiken tarvittavan heti.
        </p>
        <div className="hero__chip">
          <span>Business ID</span>
          <strong>{businessId || 'tuntematon'}</strong>
        </div>
        <button
          type="button"
          className="button button--ghost"
          onClick={handleDemoError}
        >
          Simuloi lahetysvirhe
        </button>
      </header>

      <section className="card" aria-live="polite">
        <div className="card__header">
          <h2>Lomake</h2>
          <p>Pakolliset kentät: otsikko, kuvaus, nimi, sähköposti.</p>
        </div>

        {submissionStatus === 'success' ? (
          <div className="success">
            <h3>Kiitos! Pyyntösi on vastaanotettu.</h3>
            <p>Voit sulkea sivun tai palata takaisin, jos haluat.</p>
            <button
              type="button"
              className="button button--secondary"
              onClick={returnToForm}
            >
              Palaa lomakkeelle
            </button>
          </div>
        ) : submissionStatus === 'error' ? (
          <div className="error">
            <h3>Lähetys epäonnistui</h3>
            <p>{errorMessage}</p>
            <div className="error__actions">
              <button
                type="button"
                className="button button--primary"
                onClick={returnToForm}
              >
                Yritä uudelleen
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={returnToForm}
              >
                Palaa lomakkeelle
              </button>
            </div>
          </div>
        ) : (
          <form className="form" onSubmit={handleSubmit} noValidate>
            <label className="honeypot" aria-hidden="true">
              <span>Jätä tämä kenttä tyhjäksi</span>
              <input
                type="text"
                name="honey"
                value={formValues.honey}
                onChange={handleChange}
                autoComplete="off"
                tabIndex={-1}
              />
            </label>
            <label className="field">
              <span>Otsikko *</span>
              <input
                type="text"
                name="title"
                value={formValues.title}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Esim. Julkisivun maalaus"
                aria-invalid={Boolean(getFieldError('title'))}
                aria-describedby="title-error"
              />
              {getFieldError('title') ? (
                <span className="field__error" id="title-error">
                  {getFieldError('title')}
                </span>
              ) : null}
            </label>

            <label className="field">
              <span>Kuvaus *</span>
              <textarea
                name="description"
                value={formValues.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Kuvaa projektin laajuus ja aikataulu"
                rows={4}
                aria-invalid={Boolean(getFieldError('description'))}
                aria-describedby="description-error"
              />
              {getFieldError('description') ? (
                <span className="field__error" id="description-error">
                  {getFieldError('description')}
                </span>
              ) : null}
            </label>

            <label className="field">
              <span>Nimi *</span>
              <input
                type="text"
                name="customerName"
                value={formValues.customerName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Etunimi Sukunimi"
                aria-invalid={Boolean(getFieldError('customerName'))}
                aria-describedby="name-error"
              />
              {getFieldError('customerName') ? (
                <span className="field__error" id="name-error">
                  {getFieldError('customerName')}
                </span>
              ) : null}
            </label>

            <label className="field">
              <span>Sähköposti *</span>
              <input
                type="email"
                name="customerEmail"
                value={formValues.customerEmail}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="nimi@esimerkki.fi"
                required
                aria-invalid={Boolean(getFieldError('customerEmail'))}
                aria-describedby="email-error"
              />
              {getFieldError('customerEmail') ? (
                <span className="field__error" id="email-error">
                  {getFieldError('customerEmail')}
                </span>
              ) : null}
            </label>

            <div className="grid">
              <label className="field">
                <span>Puhelin (valinnainen)</span>
                <input
                  type="tel"
                  name="phone"
                  value={formValues.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="040 123 4567"
                />
              </label>

              <label className="field">
                <span>Osoite (valinnainen)</span>
                <input
                  type="text"
                  name="address"
                  value={formValues.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Katu 1, 90100 Oulu"
                />
              </label>
            </div>

            <div className="form__footer">
              <button
                type="submit"
                className="button button--primary"
                disabled={!isFormValid || !isBusinessIdValid || isGeocoding}
              >
                {isGeocoding
                  ? 'Haetaan sijaintia...'
                  : 'Lähetä tarjouspyyntö'}
              </button>
              {!isFormValid && submitAttempted ? (
                <span className="form__hint">
                  Tayta kaikki pakolliset kentät jatkaaksesi.
                </span>
              ) : !isBusinessIdValid ? (
                <span className="form__hint">
                  Business ID ei ole kelvollinen UUID.
                </span>
              ) : null}
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

export default RequestFormPage
