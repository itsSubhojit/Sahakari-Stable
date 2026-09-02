# Sahakari Frontend (Customer Module)

A production-grade, hackathon-winning frontend architecture for **Sahakari** — the trusted hyper-local marketplace that empowers customers and gig-workers with fair, direct price negotiation and transparent escrow booking.

Developed for **Smart India Hackathon (SIH)**.

---

## 🚀 Key Features

1. **Material 3-Inspired Design System**:
   - Strict adherence to the `DESIGN.md` color tokens (`primary: #012d1d`, `secondary: #7d562d`, `surface: #fcf9f6`, containers and tints).
   - Dynamic typography with Google Fonts `Noto Sans` and `Material Symbols Outlined`.

2. **Real-time Dynamic Negotiation Engine**:
   - Live bargaining room with simulated worker responses.
   - Quick counter-offer presets (-5%, -10%, -15%, -20%, custom numeric amount).
   - Direct handover from agreed negotiation rate to final checkout.

3. **High-Fidelity Booking & Payment Breakdown**:
   - Comprehensive appointment summary (Date, Time, Address, Task description).
   - Itemized transparent pricing: *Agreed Service Fee* + *5% Platform Fee* + *Taxes* = *Total Payable*.
   - Interactive payment simulator with UPI, Card, and NetBanking options protected by escrow.

4. **Service Discovery & Geo-Radius Proximity**:
   - Filter verified workers by skill category (Electrician, Plumber, Carpenter, Appliance Repair, etc.).
   - Filter by distance (≤ 1km, 2km, 5km, 10km) and minimum rating score (4.5★+).

5. **Customer Authentication**:
   - Indian mobile format validation (`+91`).
   - 1-Click evaluator demo login for lightning-fast judge evaluations.

---

## 📂 Project Structure

```text
sahakari-frontend/
├── public/                # Static assets & web manifest
│   ├── favicon.svg
│   └── manifest.json
├── src/
│   ├── assets/            # Global images and brand icons
│   ├── components/
│   │   ├── common/        # Shared UI primitives (Button, Input, Card, Badge, Avatar, Rating, Modal)
│   │   ├── layout/        # Shell components (Header, BottomNavbar, Layout)
│   │   └── customer/      # Customer-specific components (WorkerCard, NegotiationChat, PriceBreakdown, etc.)
│   ├── hooks/             # Custom React hooks (useAuth, useNegotiation, useBooking)
│   ├── pages/
│   │   ├── customer/      # Customer module screens (Services, NearbyWorkers, Negotiation, BookingDetail)
│   │   └── auth/          # Shared auth pages (Login, Signup)
│   ├── services/          # API client and rich mock database
│   ├── store/             # Context API global state (AuthContext, BookingContext)
│   ├── styles/            # Tailwind CSS base imports & tokens
│   ├── utils/             # Formatters (₹ INR, km, dates) and form validators
│   ├── App.jsx            # React Router DOM configuration
│   └── main.jsx           # React root entry point
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## 🛠️ Quickstart

### 1. Install Dependencies
```bash
cd sahakari-frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

The application will be accessible at: `http://localhost:3000`

### 3. Build for Production
```bash
npm run build
```
