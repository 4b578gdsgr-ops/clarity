// app/api/company/route.js
import { NextResponse } from 'next/server';

const { getCompanyById, searchCompanies } = require('../../../lib/companies');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const query = searchParams.get('q');
  
  let company = null;
  
  if (id) {
    company = getCompanyById(id);
  } else if (query) {
    const results = searchCompanies(query);
    company = results[0] || null;
  }
  
  if (!company) {
    return NextResponse.json({ error: 'Company not found', found: false }, { status: 404 });
  }
  
  return NextResponse.json({ company, found: true });
}
