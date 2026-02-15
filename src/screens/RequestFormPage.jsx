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
  name: '',
  phone: '',
  address: '',
  honey: '',
}

const RATE_LIMIT_MS = 10000
const RATE_LIMIT_STORAGE_KEY = 'quoteFlow:lastSubmitAt'

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

  if (!values.name.trim()) {
    errors.name = 'Nimi on pakollinen.'
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
  } catch (error) {
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
  } catch (error) {
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
        `Lahetysraja ylittyi. Yrita uudelleen ${secondsLeft} sekunnin kuluttua.`
      )
      return
    }

    if (!isFormValid) {
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
      name: formValues.name,
      phone: formValues.phone,
      address: formValues.address,
      coordinates,
    }

    const result = await createQuoteRequest(payload)

    if (!result.success) {
      setSubmissionStatus('error')
      setErrorMessage(
        result.error || 'Tallennus epaonnistui. Yrita uudelleen.'
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
      'Lahetys ei onnistunut. Tarkista verkkoyhteys ja yrita uudelleen.'
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
          <p>Pakolliset kentät: otsikko, kuvaus, nimi.</p>
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
                name="name"
                value={formValues.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Etunimi Sukunimi"
                aria-invalid={Boolean(getFieldError('name'))}
                aria-describedby="name-error"
              />
              {getFieldError('name') ? (
                <span className="field__error" id="name-error">
                  {getFieldError('name')}
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
                disabled={!isFormValid || isGeocoding}
              >
                {isGeocoding
                  ? 'Haetaan sijaintia...'
                  : 'Läheta tarjouspyynto'}
              </button>
              {!isFormValid && submitAttempted ? (
                <span className="form__hint">
                  Tayta kaikki pakolliset kentät jatkaaksesi.
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
