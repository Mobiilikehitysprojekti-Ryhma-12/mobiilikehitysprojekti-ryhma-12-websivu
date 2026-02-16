/*
  App.jsx
  - Sovelluksen reititys ja peruskehys web-lomakkeelle.
  - Ohjaa pyynnot /request/:businessId -polkuun.
  - Pidetaan App kapeana: vain reitit ja yleinen rakenne.
*/

import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import RequestFormPage from './screens/RequestFormPage'

const DEFAULT_BUSINESS_ID = 'b10a0d2c-efe5-4675-a2ff-7a2154a4cde6'

/**
 * App koostaa reitit ja hoitaa oletusohjauksen demopolkuun.
 * @returns {JSX.Element} Reititetty UI.
 */
function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/request/:businessId" element={<RequestFormPage />} />
        <Route
          path="*"
          element={<Navigate to={`/request/${DEFAULT_BUSINESS_ID}`} replace />}
        />
      </Routes>
    </div>
  )
}

export default App
