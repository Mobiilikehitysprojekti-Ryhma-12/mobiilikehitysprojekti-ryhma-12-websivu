/*
  RequestFormPage.jsx
  - Asiakkaan tarjouspyynto-lomake suoraan URL:sta.
  - Sivu ei vaadi kirjautumista tai latauksia.
  - BusinessId tulee reitilta ja naytetaan otsikossa.
  - Validointi estaa lahetyksen ilman pakollisia kenttia.
*/

import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

const initialFormState = {
  title: '',
  description: '',
  name: '',
  phone: '',
  address: '',
}

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
 * Tarjouspyyntolomake, joka naytetaan businessId-reitilla.
 * @returns {JSX.Element} Lomaketta ja tiloja kuvaava UI.
 */
function RequestFormPage() {
  const { businessId } = useParams()
  const [formValues, setFormValues] = useState(initialFormState)
  const [touchedFields, setTouchedFields] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

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

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitAttempted(true)

    if (!isFormValid) {
      return
    }

    setIsSubmitted(true)
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
        <p className="hero__eyebrow">QuoteFlow - Tarjouspyynto</p>
        <h1 className="hero__title">Laheta pyynto nopeasti</h1>
        <p className="hero__subtitle">
          Täytä tiedot, niin yrittaja saa kaiken tarvittavan heti.
        </p>
        <div className="hero__chip">
          <span>Business ID</span>
          <strong>{businessId || 'tuntematon'}</strong>
        </div>
      </header>

      <section className="card" aria-live="polite">
        <div className="card__header">
          <h2>Lomake</h2>
          <p>Pakolliset kentat: otsikko, kuvaus, nimi.</p>
        </div>

        {isSubmitted ? (
          <div className="success">
            <h3>Kiitos! Pyyntosi on vastaanotettu.</h3>
            <p>Voit sulkea sivun tai palata takaisin, jos haluat.</p>
          </div>
        ) : (
          <form className="form" onSubmit={handleSubmit} noValidate>
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
              <button type="submit" disabled={!isFormValid}>
                Laheta tarjouspyynto
              </button>
              {!isFormValid && submitAttempted ? (
                <span className="form__hint">
                  Tayta kaikki pakolliset kentat jatkaaksesi.
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
