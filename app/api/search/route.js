// app/api/search/route.js
import { NextResponse } from 'next/server';

// Import at build time
const { searchCompanies, getAllCompanies } = require('../../../lib/companies');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  
  if (!query.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }
  
  const results = searchCompanies(query);
  
  // Return lightweight results for search suggestions
  const lightweight = results.map(c => ({
    id: c.id,
    name: c.name,
    ticker: c.ticker,
    sector: c.sector,
    karmaScore: c.karmaScore,
    transparencyScore: c.transparencyScore,
  }));
  
  return NextResponse.json({ results: lightweight, total: lightweight.length });
}
