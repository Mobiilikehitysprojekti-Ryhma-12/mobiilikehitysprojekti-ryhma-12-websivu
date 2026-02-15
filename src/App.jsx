/*
  App.jsx
  - Sovelluksen reititys ja peruskehys web-lomakkeelle.
  - Ohjaa pyynnot /request/:businessId -polkuun.
  - Pidetaan App kapeana: vain reitit ja yleinen rakenne.
*/

import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import RequestFormPage from './screens/RequestFormPage'

/**
 * App koostaa reitit ja hoitaa oletusohjauksen demopolkuun.
 * @returns {JSX.Element} Reititetty UI.
 */
function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/request/:businessId" element={<RequestFormPage />} />
        <Route path="*" element={<Navigate to="/request/demo" replace />} />
      </Routes>
    </div>
  )
}

export default App
