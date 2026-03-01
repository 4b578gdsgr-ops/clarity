# Clarity — Know What Your Money Supports

A nonpartisan corporate transparency app. Search any company by name or stock ticker to see their political spending, karma score, foreign financial ties, and corporate ownership chain.

**A One Love Outdoors 501(c)(3) project.**

## Quick Deploy to Vercel (5 minutes)

### Step 1: Push to GitHub

If you haven't used git before, the easiest way:

1. Go to [github.com/new](https://github.com/new)
2. Name the repository `clarity`
3. Keep it **Public** (for free Vercel hosting)
4. Click **Create repository**
5. On the next page, click **"uploading an existing file"**
6. Drag ALL the files from this folder into the upload area
7. Click **Commit changes**

### Step 2: Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your `clarity` repository
3. Vercel auto-detects Next.js — just click **Deploy**
4. Wait ~2 minutes for it to build
5. You'll get a live URL like `clarity-abc123.vercel.app`

### Step 3: Connect Your Subdomain

To use `clarity.oneloveoutdoors.org` (or similar):

1. In Vercel dashboard → Your project → **Settings** → **Domains**
2. Add `clarity.yourdomain.com`
3. Vercel gives you a CNAME record
4. Go to your domain registrar (wherever you bought your domain)
5. Add a CNAME record pointing `clarity` to `cname.vercel-dns.com`
6. Wait 5-30 minutes for DNS propagation

### Step 4: Add Environment Variables (Optional for Phase 2)

In Vercel dashboard → Settings → **Environment Variables**, add:
- `FEC_API_KEY` — your FEC key
- `OPENSECRETS_API_KEY` — your OpenSecrets key

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
clarity/
├── app/
│   ├── layout.js          # Root layout with metadata
│   ├── page.js            # Main Clarity UI
│   ├── globals.css         # Styles
│   └── api/
│       ├── search/route.js # Search endpoint
│       └── company/route.js # Company detail endpoint
├── lib/
│   └── companies.js       # Company database & search
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Current Status

- ✅ 25+ companies with full data
- ✅ Search by name, ticker, subsidiary
- ✅ Dual scoring (Opacity + Karma)
- ✅ Foreign financial ties tracking
- ✅ Healthcare impact scoring
- ✅ Ethical alternatives
- ✅ Political spending breakdown
- ⬜ Live FEC API integration
- ⬜ Live OpenSecrets API integration  
- ⬜ SEC 13F ownership data
- ⬜ Barcode scanning
- ⬜ User accounts & premium tier
- ⬜ Supabase database migration

## License

© 2026 One Love Outdoors. All rights reserved.
