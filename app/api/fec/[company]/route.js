import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

const FEC_BASE = 'https://api.open.fec.gov/v1';
const CACHE_DAYS = 30;

function fmt(n) {
  if (!n) return '$0';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

async function fecFetch(path) {
  const API_KEY = process.env.FEC_API_KEY;
  if (!API_KEY) return null;
  const sep = path.includes('?') ? '&' : '?';
  try {
    const res = await fetch(`${FEC_BASE}${path}${sep}api_key=${API_KEY}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function cacheResult(companyName, data) {
  if (!supabase) return;
  try {
    await supabase
      .from('fec_cache')
      .upsert(
        { company_name: companyName, data, cached_at: new Date().toISOString() },
        { onConflict: 'company_name' }
      );
  } catch {
    // Cache write failure is non-fatal
  }
}

export async function GET(request, { params }) {
  const companyName = decodeURIComponent(params.company);

  // 1. Check cache
  if (supabase) {
    try {
      const { data: cached } = await supabase
        .from('fec_cache')
        .select('data, cached_at')
        .eq('company_name', companyName)
        .single();

      if (cached) {
        const age = (Date.now() - new Date(cached.cached_at).getTime()) / (1000 * 60 * 60 * 24);
        if (age < CACHE_DAYS) {
          return NextResponse.json({ ...cached.data, cached: true });
        }
      }
    } catch {
      // Cache read failure is non-fatal — fall through to live fetch
    }
  }

  if (!process.env.FEC_API_KEY) {
    return NextResponse.json({ committees: [], totalSpending: 0, totalFormatted: '$0', found: false });
  }

  // 2. Search for matching committees
  const searchData = await fecFetch(
    `/names/committees/?q=${encodeURIComponent(companyName)}`
  );

  if (!searchData?.results?.length) {
    const result = { committees: [], totalSpending: 0, totalFormatted: '$0', found: false };
    await cacheResult(companyName, result);
    return NextResponse.json(result);
  }

  // Take top 5 committee matches
  const committees = searchData.results.slice(0, 5);

  // 3. Fetch totals for each committee
  const committeeDetails = await Promise.all(
    committees.map(async (c) => {
      const totals = await fecFetch(
        `/totals/pac-party/?committee_id=${c.id}&per_page=1&sort=-cycle`
      );
      const latest = totals?.results?.[0];

      const disbursements = await fecFetch(
        `/schedules/schedule_b/?committee_id=${c.id}&per_page=5&sort=-disbursement_amount&two_year_transaction_period=2024`
      );

      const recipients = (disbursements?.results ?? []).map(d => ({
        name: d.recipient_name ?? '',
        amount: d.disbursement_amount ?? 0,
        purpose: d.disbursement_description ?? '',
      }));

      return {
        id: c.id,
        name: c.name ?? '',
        receipts: latest?.receipts ?? 0,
        disbursements: latest?.disbursements ?? 0,
        cycle: latest?.cycle ?? null,
        recipients,
      };
    })
  );

  const totalSpending = committeeDetails.reduce((sum, c) => sum + (c.disbursements ?? 0), 0);

  const result = {
    found: committeeDetails.length > 0,
    committees: committeeDetails,
    totalSpending,
    totalFormatted: fmt(totalSpending),
  };

  await cacheResult(companyName, result);
  return NextResponse.json(result);
}
