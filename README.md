# QuoteFlow Web Form

Web-based quote request form for QuoteFlow mobile application. Allows customers to submit quote requests directly from a browser without installing the app.

## 🎯 Project Overview

QuoteFlow is an entrepreneur's mobile tool designed to make receiving and handling quote requests as easy and fast as possible. This web form is the customer-facing entry point, accessible via QR code or direct link.

**Purpose:**
- Customer can send a quote request immediately in the browser (QR/link) without downloading an app
- Entrepreneur sees requests in their mobile app Inbox
- Form works reliably even with weak network connection

## ✨ Features

### Core Functionality
- **Direct URL Access**: `/request/:businessId` route opens form with no authentication required
- **Form Validation**: Required fields (title, description, name) with inline error messages
- **Success & Error States**: Clear feedback with retry/return options
- **Demo Error Mode**: Button to simulate submission errors for presentations

### Anti-Spam Protection
- **Honeypot Field**: Hidden field to catch basic bots
- **Rate Limiting**: Client-side limit (10 seconds) prevents rapid repeated submissions
- Uses localStorage to track submission timestamps

### Smart Address Handling
- **Automatic Geocoding**: Converts address to coordinates using Nominatim OpenStreetMap API
- **Loading State**: Shows "Haetaan sijaintia..." while geocoding
- **Graceful Degradation**: Form submits even if geocoding fails

### Data Persistence
- **Supabase Integration**: Ready-to-use database service layer
- **Placeholder Mode**: Works in demo mode before database is configured
- **Row Level Security**: Public insert, authenticated read policies

## 🛠 Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Supabase** - Backend database (optional, works without)
- **Nominatim API** - Address geocoding service

## 📦 Installation

```bash
# Navigate to project directory
cd weblomake

# Install dependencies
npm install

# Optional: Install Supabase client (when ready to connect database)
npm install @supabase/supabase-js
```

## 🚀 Running the Project

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

The app will be available at `http://localhost:5173`

Default route redirects to `/request/demo` for easy testing.

## 📁 Project Structure

```
src/
├── screens/
│   └── RequestFormPage.jsx    # Main form component with validation & submission
├── services/
│   ├── geocoding.js           # Address to coordinates conversion
│   ├── supabaseClient.js      # Database client configuration (placeholder)
│   └── quoteRequestService.js # Database operations with fallback
├── components/
│   └── ui/                    # Reusable UI components (if needed)
├── App.jsx                    # Routing setup
├── App.css                    # Form and page styles
├── index.css                  # Global styles and design tokens
└── main.jsx                   # Application entry point
```

## ⚙️ Configuration

### Supabase Setup (Optional)

The form works in demo mode without Supabase. To enable database storage:

1. Follow instructions in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
2. Create project and run SQL schema
3. Update credentials in `src/services/supabaseClient.js`:
   ```js
   const SUPABASE_URL = 'https://your-project.supabase.co'
   const SUPABASE_ANON_KEY = 'your-anon-key-here'
   ```
4. Uncomment the real client export

### Environment Variables (Optional)

Create `.env` file for sensitive credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Update `supabaseClient.js` to use:
```js
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
```

## 🔒 Security & Anti-Spam

### Honeypot Field
- Hidden input field that bots typically auto-fill
- Positioned off-screen using CSS
- Submission blocked if field contains any value

### Rate Limiting
- Prevents submission within 10 seconds of previous submission
- Stored in localStorage (client-side only)
- Shows countdown message when limit is hit

### Database Security (Supabase RLS)
- Public users can only INSERT new requests
- Reading data requires authentication (mobile app)
- No updates or deletes allowed from public

## 🗺️ Geocoding

Address geocoding uses the free Nominatim OpenStreetMap API:
- No API key required
- Respects usage policy with proper User-Agent
- Automatically converts "Katu 1, 90100 Oulu" → `{ lat: 65.01, lon: 25.47 }`
- Non-blocking: form submits even if geocoding fails

## 🎨 Design System

The form uses a custom design inspired by modern web aesthetics:
- **Typography**: Space Grotesk (body), Fraunces (display)
- **Colors**: Warm neutrals with green accent (`#116456`)
- **Layout**: Responsive, mobile-first approach
- **Animations**: Subtle fade-in and rise-in effects

Design tokens defined in `index.css`:
```css
--accent: #116456
--ink: #1b1f23
--ink-muted: #5d6470
--danger: #b13c2f
```

## 📝 Form Fields

### Required
- **Title**: Short description of the project
- **Description**: Detailed explanation and timeline
- **Name**: Customer's full name

### Optional
- **Phone**: Contact number
- **Address**: Project location (auto-geocoded if provided)

### Hidden
- **Honey**: Anti-spam honeypot field
- **BusinessId**: From URL parameter

## 🧪 Testing & Demo

### Test Scenarios
1. **Valid submission**: Fill required fields and submit
2. **Validation errors**: Try submitting empty form
3. **Success view**: Complete valid submission
4. **Error view**: Click "Simuloi lahetysvirhe" button
5. **Rate limit**: Submit twice within 10 seconds
6. **Geocoding**: Enter address "Katu 1, 90100 Oulu" and check console for coordinates

### Demo Mode
Without Supabase configured:
- Form logs data to console
- Returns mock success response
- All validation and anti-spam features work normally

## 📚 Code Style

Follows QuoteFlow architecture principles (adapted for web from mobile):
- **Readability over cleverness**: Clear, explicit naming
- **Single responsibility**: Small, focused functions
- **Loose coupling**: Service layer separates UI from data
- **Guard clauses**: Early validation and error handling
- **Finnish comments**: Key sections documented in Finnish for team learning

## 🚢 Deployment

Build the project for production:
```bash
npm run build
```

Output will be in `dist/` folder. Deploy to:
- **Vercel**: Automatic deployment from Git
- **Netlify**: Drag-and-drop or Git integration  
- **GitHub Pages**: Static hosting
- **Supabase Hosting**: Integrated with database

### Environment Variables for Production
Set in your hosting platform's dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🤝 Mobile App Integration

This web form is designed to work with the QuoteFlow mobile app:

1. **Mobile app generates**: `/request/[businessId]` links or QR codes
2. **Customer accesses**: Web form via link/QR
3. **Form submits**: Data to Supabase `leads` table with businessId
4. **Mobile app reads**: New requests from same table with authentication

Shared data structure:
```js
{
  business_id: string
  title: string
  description: string
  name: string
  phone: string | null
  address: string | null
  coordinates: { lat, lon } | null
  status: 'new' | 'quoted' | 'accepted' | 'rejected'
}
```

## 📄 License

Private project for OAMK Mobiilihekityksen Projekti course.

---

**Built with ❤️ for QuoteFlow**

