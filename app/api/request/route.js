import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// NOTE: This uses the local filesystem — works in development and persists
// in production as long as the process stays warm. For durable persistence,
// swap readRequests/writeRequests for a Supabase call (Phase 2).
const DATA_FILE = join(process.cwd(), 'data', 'requests.json');

function readRequests() {
  try {
    if (!existsSync(DATA_FILE)) return [];
    return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeRequests(requests) {
  try {
    const dir = join(process.cwd(), 'data');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2));
  } catch {
    // Filesystem may be read-only in some deployment environments
  }
}

export async function GET() {
  const requests = readRequests();
  return NextResponse.json({ count: requests.length });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const company = body?.company?.trim();
  if (!company) {
    return NextResponse.json({ error: 'Company name required' }, { status: 400 });
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || 'unknown');

  const requests = readRequests();
  requests.push({ company, timestamp: new Date().toISOString(), ip });
  writeRequests(requests);

  return NextResponse.json({ success: true, count: requests.length });
}
