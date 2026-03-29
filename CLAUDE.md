# One Love Outdoors — Mobile Bike Service Platform

## Tech Stack
- Next.js 14, React 18, Tailwind CSS
- Deployed on Vercel (clarity-pi-ten.vercel.app)
- Supabase (database + storage)
- Resend (email notifications from service@oneloveoutdoors.org)
- Twilio (SMS notifications — toll-free verification pending)
- Square (payment links, membership billing via Squarespace)
- Leaflet/OpenStreetMap (maps)
- Embedded in Squarespace site at oneloveoutdoors.org via iframes

## Key URLs
- Live site: https://clarity-pi-ten.vercel.app
- Squarespace: https://oneloveoutdoors.org
- Service booking: /schedule-service and /embed/service
- Admin: /admin/service (password protected via ADMIN_PASSWORD env var)
- Customer tracking: /service/[id] and /embed/service/[bookingId]
- Members dashboard: /embed/members-dashboard
- Membership info: /embed/membership
- Repair or Replace: /embed/repair-or-replace
- Custom builds: /embed/custom-builds

## Brand Rules
- Brand is "One Love Outdoors" — always use "we" not "I"
- No emojis in UI
- No reference to Newington or any specific town
- No disparaging language about big bike companies
- No "Love > Money" branding on customer-facing pages
- Grateful Dead references woven in subtly
- Tone: warm, honest, confident, not corporate

## Service Area
- Hartford and Tolland counties, CT
- Pickup/delivery Monday and Friday
- ZIP-based pricing tiers in lib/servicePricing.js
- Members get free pickup/delivery

## Status Flow
New → Confirmed → In Progress → Ready → Out for Delivery → Complete

## Email/SMS Routing
- contact_preference === 'text' → SMS only (via Twilio)
- contact_preference === 'email' → email only (via Resend)
- Admin always gets email at service@oneloveoutdoors.org

## Embed Pages
All /embed/* pages have no nav, no footer — designed for Squarespace iframes. Links between embeds open in new tabs.

## Known Issues
- Admin email for new bookings has been fragile — uses inline Resend call in /api/bookings/route.js, not a helper function
- Cannot run npm locally — no Node installed on dev machine. Builds run on Vercel only.
- Always verify JSX syntax before pushing — build errors have been recurring

## Supabase Tables
service_bookings, service_messages, member_messages, custom_build_inquiries, membership_signups, company_requests, feedback, fec_cache, shops
