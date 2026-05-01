# Smart Warranty & Product Tracker Platform — Complete Product Blueprint

---

# PART 1: PRODUCT REQUIREMENTS DOCUMENT (PRD)

---

## 1.1 Executive Summary

**Product Name:** My Things   
**Version:** 1.0  
**Date:** May 2025  
**Status:** Pre-Development Blueprint  

My Things  is a full-stack, mobile-first SaaS platform that enables users to digitally store, track, and manage warranties, bills, and product manuals for purchased items. Powered by OCR and AI-based extraction, the platform eliminates the real-world problem of lost warranty documents and missed claim windows.

---

## 1.2 Problem Statement

| Problem | Impact |
|---|---|
| Users lose physical bills/warranty cards | Cannot claim warranty when product fails |
| No centralized place to track multiple products | Users forget expiry dates |
| Manual tracking via spreadsheets is tedious | Zero adoption among non-technical users |
| No reminders before warranty expires | Missed claim opportunities = financial loss |
| Hard to find store/service contact quickly | Delays in getting products repaired |

---

## 1.3 Target Users

**Primary:** Urban households aged 22–45 who own 5+ electronics/appliances  
**Secondary:** Small business owners tracking office/shop equipment  
**Tertiary:** Tech-savvy users who want full control over purchase history  

---

## 1.4 Goals & Success Metrics

### Business Goals
- Reach 10,000 active users within 6 months of launch
- Maintain 60%+ monthly active user retention
- Achieve 4.5+ star rating on app stores (future mobile release)

### Technical Goals
- Page load time < 2 seconds on 4G connection
- AI extraction accuracy > 85% for standard warranty documents
- 99.5% uptime on free-tier infrastructure
- Zero critical security vulnerabilities at launch

### User Success Metrics
- User adds first product within 5 minutes of signup
- >70% of users set up at least one reminder
- <3 taps to view any product's warranty status

---

## 1.5 Feature Requirements

### Priority Matrix

| Priority | Feature |
|---|---|
| P0 (Must Have) | Authentication (Email + OAuth) |
| P0 | Add Product with document upload |
| P0 | AI-powered data extraction |
| P0 | Dashboard with stats + alerts |
| P0 | Products list page |
| P0 | Product detail page |
| P1 (Should Have) | Email reminder notifications |
| P1 | Admin panel |
| P1 | Dark/light mode |
| P2 (Nice to Have) | Troubleshooting AI suggestions |
| P2 | Export warranty data as PDF |
| P3 (Future) | React Native mobile app |
| P3 | Push notifications |

---

## 1.6 User Stories

### Authentication
- As a new user, I want to sign up with email/password so I can create an account
- As a returning user, I want to log in with Google OAuth so I don't manage another password
- As a user, I want OTP email verification so my account is secure
- As a user, I want to reset my password via email so I can recover access

### Product Management
- As a user, I want to upload a photo of my warranty card so I don't need to type details manually
- As a user, I want AI to extract product name, purchase date, and expiry from my uploaded bill
- As a user, I want to manually edit any AI-extracted field so I can correct errors
- As a user, I want to assign a category to my product so I can organize them by type
- As a user, I want to download my uploaded documents anytime so I have backup access

### Dashboard & Tracking
- As a user, I want to see a summary of all my warranty stats so I understand my portfolio at a glance
- As a user, I want to see which warranties are expiring in the next 30 days so I can act
- As a user, I want a visual chart of my warranty statuses so I can quickly assess risk
- As a user, I want color-coded urgency indicators so I never miss a critical expiry

### Notifications
- As a user, I want an email reminder 30 days before warranty expiry so I have time to act
- As a user, I want an email reminder 7 days before expiry so I have a final warning
- As a user, I want to configure my own reminder lead times so I match my preferences

### Admin
- As an admin, I want to view all registered users so I can monitor growth
- As an admin, I want to see all uploaded products so I can moderate content
- As an admin, I want to view system stats so I can monitor platform health

---

## 1.7 Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | API response < 500ms for standard requests |
| Security | All passwords hashed with bcrypt (salt rounds: 12) |
| Security | JWT tokens expire in 7 days; refresh token in 30 days |
| Security | Rate limiting: 100 requests/15 min per IP |
| Scalability | MongoDB Atlas auto-scaling supported |
| Availability | Deployed on Render/Railway (free tier) with auto-restart |
| Accessibility | WCAG 2.1 AA compliance for core flows |
| Privacy | No user data shared with third parties; GDPR-aware design |

---

## 1.8 Constraints

- All infrastructure must use free tiers only
- AI/LLM API usage must be minimized (token budget per extraction)
- No paid UI libraries (only free/open-source)
- Single developer buildable in phased sprints

---

# PART 2: SYSTEM ARCHITECTURE

---

## 2.1 Architecture Overview

My Things  uses a **3-tier client-server architecture** with a dedicated AI processing pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  React.js SPA (Vite) + Tailwind CSS + ShadCN UI + Framer Motion │
│  Deployed on: Vercel (Free Tier)                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS REST API calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│         Node.js + Express.js (MVC Architecture)                 │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Auth Module │  │Product Module│  │   AI/OCR Module     │   │
│  │  (JWT+OAuth)│  │ (CRUD+Docs)  │  │(Extract + Validate) │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │Notif Module │  │ Admin Module │  │   Upload Module     │   │
│  │(Email Cron) │  │ (Stats+CRUD) │  │  (Cloudinary SDK)   │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│                                                                 │
│  Deployed on: Render (Free Tier) / Railway                      │
└──────────┬────────────────────────────────────┬─────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────┐          ┌─────────────────────────────┐
│    DATA LAYER        │          │     EXTERNAL SERVICES        │
│                      │          │                              │
│  MongoDB Atlas       │          │  Cloudinary (Image Storage)  │
│  (Free M0 Cluster)   │          │  Google OAuth 2.0            │
│                      │          │  Facebook OAuth              │
│  Collections:        │          │  Nodemailer + Gmail SMTP     │
│  - users             │          │  Gemini API (Free Tier)      │
│  - products          │          │  Tesseract.js (Local OCR)    │
│  - notifications     │          │                              │
│  - admin_logs        │          └─────────────────────────────┘
└──────────────────────┘
```

---

## 2.2 AI Processing Pipeline Architecture

```
USER UPLOADS DOCUMENT
        │
        ▼
┌───────────────────┐
│  Image Upload     │
│  (Cloudinary SDK) │
│  - Compress image │
│  - Get public URL │
└────────┬──────────┘
         │
         ▼
┌───────────────────────────────────────┐
│        PRE-PROCESSING LAYER           │
│  1. Check if extracted_data exists    │
│     in cache (MongoDB field)          │
│  2. If YES → return cached data       │
│  3. If NO → proceed to OCR            │
└────────┬──────────────────────────────┘
         │ (only if no cache)
         ▼
┌───────────────────────────────────────┐
│         OCR STAGE                     │
│  Tool: Tesseract.js (free, local)     │
│  - Convert image to raw text          │
│  - Clean whitespace / noise           │
│  - Extract text block                 │
└────────┬──────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────┐
│        LLM EXTRACTION STAGE           │
│  Tool: Gemini 1.5 Flash (free tier)   │
│                                       │
│  Structured Prompt:                   │
│  "Extract ONLY these fields from      │
│   the following text as JSON:         │
│   product_name, purchase_date,        │
│   warranty_duration, expiry_date,     │
│   store_name, store_contact,          │
│   serial_number                       │
│   Text: [OCR_OUTPUT - max 800 chars]" │
│                                       │
│  Token budget: ~300 input, ~200 out   │
└────────┬──────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────┐
│       VALIDATION & SAVE               │
│  - Validate date formats              │
│  - Calculate warranty status          │
│  - Save to product.extracted_data     │
│  - Return to user for review/edit     │
└───────────────────────────────────────┘
```

---

## 2.3 Authentication Flow

```
┌────────┐     POST /auth/register      ┌─────────────┐
│ Client │ ─────────────────────────── ▶│   Express   │
│        │                              │   Server    │
│        │◀─────────────────────────── │ Hash pw     │
│        │  202 + OTP sent to email     │ Save user   │
│        │                              │ Send OTP    │
│        │  POST /auth/verify-otp       └─────────────┘
│        │ ─────────────────────────── ▶
│        │◀─────────────────────────── 
│        │  200 + JWT token             
│        │                              
│        │  GET /api/products           
│        │  Headers: Authorization:     
│        │  Bearer <JWT>                
└────────┘
```

---

## 2.4 Deployment Architecture

```
PRODUCTION DEPLOYMENT (Free Tier)

Frontend:  Vercel
           └── React SPA
           └── CDN-served static assets
           └── Environment: VITE_API_URL

Backend:   Render.com (Free Web Service)
           └── Node.js Express App
           └── Auto-sleep after 15 min inactivity
           └── Environment Variables (secrets)

Database:  MongoDB Atlas M0 (Free)
           └── 512MB storage
           └── Shared cluster
           └── Connection via Mongoose

Storage:   Cloudinary (Free Tier)
           └── 25GB bandwidth/month
           └── 25k transformations/month

Email:     Gmail SMTP via Nodemailer
           └── App Password auth
           └── 500 emails/day limit

AI:        Google Gemini 1.5 Flash
           └── Free tier: 15 RPM, 1M tokens/day
```

---

## 2.5 Security Architecture

```
REQUEST LIFECYCLE WITH SECURITY

Client Request
    │
    ▼
[Rate Limiter] ── 100 req/15min/IP ──▶ 429 Too Many Requests
    │
    ▼
[CORS Guard] ── Whitelist: vercel app domain
    │
    ▼
[Helmet.js] ── Security headers (CSP, HSTS, etc.)
    │
    ▼
[Input Validator] ── express-validator schemas
    │
    ▼
[Auth Middleware] ── JWT verify (protected routes only)
    │
    ▼
[Route Handler] ── Business logic
    │
    ▼
[Error Handler] ── Sanitized error responses (no stack traces)
    │
    ▼
Response to Client
```
