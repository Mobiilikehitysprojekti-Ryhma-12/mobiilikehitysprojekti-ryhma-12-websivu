/*
  main.jsx
  - Sovelluksen bootstrap web-selaimessa.
  - Reititys alustetaan BrowserRouterilla.
  - Pidetaan sisaanajo selkeana ja kevyena.
*/

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
