# My Things  - Project Context

## Project Overview
My Things  is a full-stack web application to help users track product warranties,
manage documents (bills, warranty cards, manuals), and get alerts before warranties expire.

---

## Tech Stack
- **Frontend**: React + Vite, TailwindCSS, Framer Motion, Recharts, Lucide React
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (via Mongoose)
- **Auth**: JWT + bcrypt (local), Google OAuth (via access token)
- **Storage**: Cloudinary (images/PDFs — URLs only in DB)
- **Email**: Nodemailer (SMTP/Gmail App Password)

---

## Phase 1: Authentication + Landing — ✅ COMPLETED

### Features
- Landing page (premium design)
- Signup with email OTP verification
- Login with email + password
- Google OAuth (access_token flow)
- Facebook OAuth placeholder
- JWT session management

### Files
- `server/models/User.js` — User schema (otp, isVerified, authProvider)
- `server/routes/authRoutes.js` — /signup, /verify-otp, /login, /google
- `server/utils/sendEmail.js` — Nodemailer OTP utility
- `client/src/pages/LandingPage.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/SignupPage.jsx`
- `client/src/App.jsx` — Wrapped with GoogleOAuthProvider + AuthProvider

---

## Phase 2: Dashboard + Product Management — ✅ COMPLETED

### Features
- Protected routes (JWT guard)
- Sidebar navigation layout
- Dashboard with:
  - Stat cards (Total, Active, Expiring Soon, Expired)
  - Warranty status pie chart (Recharts)
  - 6-month expiry trend bar chart
  - Alerts section (items expiring within 30 days)
  - Category insights with animated progress bars
- Product list page with search + filter + category icons
- Add Product form with Cloudinary file upload (bill, warranty, manual)
- Product details page with document View/Download
- Product delete (also removes from Cloudinary)

### Backend
- `server/models/Product.js` — Product schema (Cloudinary URLs only)
- `server/config/cloudinary.js` — Cloudinary + multer setup
- `server/middleware/auth.js` — JWT auth middleware
- `server/controllers/productController.js` — CRUD + stats
- `server/routes/productRoutes.js` — GET /stats, POST /add, GET /, GET /:id, DELETE /:id

### Frontend
- `client/src/context/AuthContext.jsx` — Auth context + token management
- `client/src/components/ProtectedRoute.jsx` — Route guard
- `client/src/components/AppLayout.jsx` — Sidebar layout
- `client/src/pages/DashboardPage.jsx`
- `client/src/pages/ProductsPage.jsx`
- `client/src/pages/AddProductPage.jsx`
- `client/src/pages/ProductDetailsPage.jsx`

---

## Environment Variables

### Server (.env)
- `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` (Gmail App Password)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `OPENROUTER_API_KEY` (For AI Q&A and text extraction summarization)
- `FRONTEND_URL`

### Client (.env)
- `VITE_GOOGLE_CLIENT_ID`

---

## Phase 3: AI Document Intelligence & Q&A — ✅ COMPLETED

### Features
- **OCR Text Extraction**: Uses `tesseract.js` to read text from uploaded images without sending raw images to AI APIs.
- **Smart Summary**: Uses OpenRouter (`mistralai/mistral-7b-instruct`) to extract structured data (product name, warranty, store, dates) from raw OCR text once per product.
- **AI Q&A System**: Users can ask questions about their product's warranty/documents. Context is injected efficiently using the structured summary to minimize token usage.
- **Chat History**: Stores recent questions and answers per product for continuous context.

### Backend
- `server/services/aiService.js` — Axios-based OpenRouter API client.
- `server/utils/ocrExtractor.js` — Cloudinary image fetch + Tesseract OCR text extraction.
- `server/controllers/aiController.js` — POST `/api/ai/extract`, POST `/api/ai/ask`, GET `/api/ai/status/:productId`.
- `server/routes/aiRoutes.js` — AI-related endpoints.

### Frontend
- `client/src/pages/AnalyzePage.jsx` — Warranty AI Chat interface and OCR summary dashboard.

---

## Routes

### Backend API
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/signup | No | Register + send OTP |
| POST | /api/auth/verify-otp | No | Verify OTP |
| POST | /api/auth/login | No | Email/password login |
| POST | /api/auth/google | No | Google OAuth |
| GET | /api/products/stats | Yes | Dashboard analytics |
| POST | /api/products/add | Yes | Add product + upload |
| GET | /api/products | Yes | List all products |
| GET | /api/products/:id | Yes | Product details |
| DELETE | /api/products/:id | Yes | Delete + Cloudinary cleanup |
| POST | /api/ai/extract | Yes | Trigger OCR and text extraction |
| POST | /api/ai/ask | Yes | Ask a question to the AI |
| GET | /api/ai/status/:productId | Yes | Get OCR status & chat history |

### Frontend Routes
| Path | Page |
|------|------|
| / | Landing |
| /login | Login |
| /signup | Signup |
| /dashboard | Dashboard (protected) |
| /products | Product List (protected) |
| /products/add | Add Product (protected) |
| /products/:id | Product Details (protected) |
| /analyze | Warranty AI Chat (protected) |

---

## Known Issues / Next Steps
- Email OTP: Gmail App Password required — spaces must be removed
- Google OAuth: Add http://localhost:5173 to Google Cloud Console authorized origins
- Phase 4: Notifications, profile settings, warranty renewal reminders
