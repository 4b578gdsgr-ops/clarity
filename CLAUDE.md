# Love > Money

## What This Is
Love > Money is a nonpartisan corporate transparency web app built by One Love Outdoors, a 501(c)(3) nonprofit focused on mountain biking, outdoor wellness, and community health in Connecticut. The app lets users search any company by name, stock ticker, or subsidiary brand and see their political spending, karma score, foreign financial ties, and institutional ownership.

## Tech Stack
- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS with custom earthy/nature color palette
- **Deployment:** Vercel (auto-deploys on push to main)
- **Database (current):** Static seed data in `lib/companies.js` (65 companies)
- **Database (planned):** Supabase (free tier)
- **Domain:** clarity-pi-ten.vercel.app (will move to loveovermoney.oneloveoutdoors.org)

## Project Structure
```
clarity/
├── app/
│   ├── layout.js          # Root layout, metadata, SEO
│   ├── page.js            # Main UI (client component) - search, results, all tabs
│   ├── globals.css         # Tailwind + custom nature-themed styles
│   └── api/
│       ├── search/route.js    # Search endpoint - returns lightweight results
│       └── company/route.js   # Company detail endpoint - returns full data
├── lib/
│   └── companies.js       # Company database (35 companies, 150+ brands)
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── CLAUDE.md              # This file
```

## Key Design Decisions
- **Color palette:** Forest greens (#0f1a14, #0d1f15, #1a3328, #4ade80), warm amber (#fbbf24), pink heart (#f472b6). NOT cold tech blue/purple. Think nature, humanism, healthy lifestyles.
- **Font:** Playfair Display for the "Love > Money" logo. Inter for body. JetBrains Mono for data/numbers.
- **Scoring:** Two scores per company:
  - **Opacity Score** (0-100): How hidden is their money trail. 0 = transparent, 100 = hidden.
  - **Karma Score** (0-100): Overall ethical impact. 0 = harmful, 100 = force for good. Composed of 5 equally-weighted categories: Environment, Workers, Community, Ethics, Transparency.
- **Healthcare Impact:** Companies in pharma/insurance get an additional healthcare sub-score tracking drug pricing, claim denials, lobbying against public health.
- **Nonpartisan:** No ideological labels. Show Democrat/Republican split as factual percentages. Data speaks for itself.
- **Cycling focus:** Cycling and outdoor recreation companies appear first in browse chips. This is our community.

## Company Data Structure
Each company in `lib/companies.js` has:
- id, name, ticker, sector
- opacityScore, karmaScore
- totalPoliticalSpending, lobbyingSpending, pacSpending, splitR, splitD
- topRecipients (array: name, amount, party)
- lobbyingIssues (array of strings)
- subsidiaries (array - searchable)
- karmaBreakdown (object: environment, workers, community, ethics, transparency)
- karmaDetails (array: text + bad boolean)
- foreignTies (array: country, flag, detail)
- institutionalOwners (array: name, stake percentage)
- alternatives (array: name, karma score, why)
- controversies (array of strings)
- healthcareImpact (null or { score, details[] })

## Search
Search matches against: company name, ticker symbol, sector, subsidiary brands, and company ID. The `$` prefix is stripped for ticker searches.

## Current Companies (60)
**Cycling — Bikes (23):** Specialized, Trek, Giant, Santa Cruz, Yeti, Guerrilla Gravity, Ibis Cycles, Evil Bikes, Pivot Cycles, Transition, Kona, Marin, Rocky Mountain, Norco, Chromag, Canyon, QBP/Surly, Cannondale, GT Bicycles, Schwinn, Mongoose
**Cycling — Components (7):** Shimano, SRAM, Fox Factory, Chris King, We Are One, Industry Nine, Hope Technology, Onyx Racing Products
**Cycling — Tires (3):** Maxxis, Continental (cycling), Vittoria
**Cycling — Apparel/Helmets/Footwear (5):** Pearl Izumi, Giro (Bell), POC, Troy Lee Designs, Five Ten (Adidas)
**Outdoor (5):** Patagonia, REI, Cotopaxi, The North Face, Dr. Bronner's
**Outdoor Gear & Hydration (5):** Osprey, Black Diamond, Hydro Flask, Nalgene, CamelBak
**Technology (5):** Amazon, Apple, Google, Meta, Tesla
**Healthcare (4):** UnitedHealth, Pfizer, Eli Lilly, Cost Plus Drugs
**Defense (2):** Lockheed Martin, Raytheon
**Retail/Food (5):** Costco, Walmart, Nestlé, Starbucks, Nike
**Financial/Energy (2):** BlackRock, ExxonMobil

## Adding New Companies
When adding a company to `lib/companies.js`, follow the exact data structure above. Research from:
- FEC.gov for political spending
- OpenSecrets.org for lobbying data
- SEC EDGAR for 13F institutional ownership
- Corporate annual reports for karma scoring
- FARA database for foreign ties
- B-Corp directory for ethical certifications

## Deployment
Push to `main` branch → Vercel auto-deploys in ~2 minutes. The Vercel project root directory is set to `clarity/` (files are nested one level in the repo).

## Phase 2 (Next)
- Connect FEC API for live political spending data (API key obtained)
- Supabase database for company data + user company requests
- Company request form connected to real database
- Automated data pipeline (cron) for FEC/OpenSecrets updates

## Phase 3 (Future)
- Barcode scanning (mobile)
- Premium subscriptions via Stripe
- Ethical alternatives marketplace
- Grant applications (Knight Foundation, Mozilla, Craig Newmark)

## Brand Voice
Warm. Human. Direct. Not corporate. Not preachy. Not ideological. Let the data speak. Use hearts (♥) not stars. Love > Money is about choosing what matters.
