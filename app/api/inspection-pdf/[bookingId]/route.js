import { supabaseAdmin } from '../../../../lib/supabase';

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wearColor(pct) {
  if (pct >= 75) return '#16a34a';
  if (pct >= 50) return '#ca8a04';
  if (pct >= 25) return '#ea580c';
  return '#dc2626';
}

function renderItems(items) {
  if (!items || items.length === 0) return '<p style="color:#9ca3af;font-size:13px;">No items recorded.</p>';

  const wearItems  = items.filter(it => !it.na && 'wear' in it && it.wear != null);
  const replaced   = items.filter(it => !it.na && it.state === 'replaced');
  const done       = items.filter(it => !it.na && it.state === 'done');
  const sentOut    = items.filter(it => !it.na && it.state === 'sent_out');
  const attention  = items.filter(it => !it.na && it.state === 'attention');
  const adjusted   = items.filter(it => !it.na && it.state === 'adjusted');
  const good       = items.filter(it => !it.na && it.state === 'good');
  const noteOnly   = items.filter(it => !it.na && !('state' in it) && !('wear' in it) && it.note);

  let html = '';

  if (wearItems.length > 0) {
    html += '<div class="section"><div class="section-title">Component Wear</div>';
    for (const item of wearItems) {
      const pct = item.wear;
      const color = item.replaced ? '#16a34a' : wearColor(pct);
      const label = item.replaced ? 'Replaced' : pct === 100 ? 'New' : pct === 75 ? 'Good' : pct === 50 ? 'Halfway' : pct === 25 ? 'Replace soon' : 'Replace now';
      html += `<div class="wear-item">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span class="item-label">${esc(item.label)}</span>
          <span style="font-size:12px;font-weight:700;color:${color};">${item.replaced ? 'Replaced ✓' : pct + '%'}</span>
        </div>
        <div class="wear-bar"><div style="height:100%;width:${pct}%;background:${color};border-radius:3px;"></div></div>
        <div style="font-size:11px;color:#6b7280;margin-top:3px;">${esc(label)}${item.note ? ' — ' + esc(item.note) : ''}</div>
        ${item.photo ? `<img src="${esc(item.photo)}" class="item-photo" alt="${esc(item.label)}" />` : ''}
      </div>`;
    }
    html += '</div>';
  }

  if (replaced.length > 0 || done.length > 0) {
    html += '<div class="section"><div class="section-title" style="color:#166534;">Replaced / Done</div>';
    for (const item of [...replaced, ...done]) {
      html += `<div class="card card-green">
        <div class="item-label" style="color:#166534;">${esc(item.label)} ✓</div>
        ${item.note ? `<div style="font-size:12px;color:#4b7c5e;margin-top:3px;">${esc(item.note)}</div>` : ''}
        ${item.photo ? `<img src="${esc(item.photo)}" class="item-photo" />` : ''}
      </div>`;
    }
    html += '</div>';
  }

  if (sentOut.length > 0) {
    html += '<div class="section"><div class="section-title" style="color:#6d28d9;">Sent to Specialist</div>';
    for (const item of sentOut) {
      html += `<div class="card" style="background:#f5f3ff;border:1px solid #ddd6fe;">
        <div class="item-label" style="color:#6d28d9;">${esc(item.label)}</div>
        <div style="font-size:12px;color:#7c3aed;margin-top:3px;">Sent to specialist for service</div>
        ${item.note ? `<div style="font-size:12px;color:#7c3aed;margin-top:2px;">${esc(item.note)}</div>` : ''}
      </div>`;
    }
    html += '</div>';
  }

  if (attention.length > 0) {
    html += '<div class="section"><div class="section-title" style="color:#c2410c;">Needs Attention</div>';
    for (const item of attention) {
      html += `<div class="card card-orange">
        <div class="item-label" style="color:#92400e;">${esc(item.label)}</div>
        ${item.note ? `<div style="font-size:12px;color:#c2410c;margin-top:3px;">${esc(item.note)}</div>` : ''}
        ${item.photo ? `<img src="${esc(item.photo)}" class="item-photo" />` : ''}
      </div>`;
    }
    html += '</div>';
  }

  if (adjusted.length > 0) {
    html += '<div class="section"><div class="section-title" style="color:#1d4ed8;">Adjusted</div>';
    for (const item of adjusted) {
      html += `<div class="card card-blue">
        <div class="item-label" style="color:#1e40af;">${esc(item.label)}</div>
        ${item.note ? `<div style="font-size:12px;color:#1d4ed8;margin-top:3px;">${esc(item.note)}</div>` : ''}
        ${item.photo ? `<img src="${esc(item.photo)}" class="item-photo" />` : ''}
      </div>`;
    }
    html += '</div>';
  }

  if (good.length > 0) {
    html += `<div class="section"><div class="section-title" style="color:#16a34a;">Good</div>
      <p style="font-size:13px;color:#374151;line-height:1.7;margin:0;">${good.map(it => esc(it.label)).join(', ')}</p>
    </div>`;
  }

  if (noteOnly.length > 0) {
    html += '<div class="section"><div class="section-title">Recorded Values</div>';
    for (const item of noteOnly) {
      html += `<div style="display:flex;gap:8px;margin-bottom:6px;font-size:13px;">
        <span style="color:#6b7280;min-width:200px;">${esc(item.label)}</span>
        <span style="color:#374151;font-weight:500;">${esc(item.note)}</span>
      </div>`;
    }
    html += '</div>';
  }

  return html;
}

export async function GET(request, { params }) {
  if (!supabaseAdmin) return new Response('Admin unavailable', { status: 500 });

  const { bookingId } = params;

  const [{ data: booking, error: bErr }, { data: iData, error: iErr }] = await Promise.all([
    supabaseAdmin.from('service_bookings').select('*').eq('id', bookingId).single(),
    supabaseAdmin.from('inspection_reports').select('*').eq('booking_id', bookingId).order('bike_index'),
  ]);

  if (bErr || !booking) return new Response('Not found', { status: 404 });

  const reports = iData || [];
  const bikes = booking.bikes?.length > 0 ? booking.bikes : [{ name: booking.bike_brand || 'Bike', brand: booking.bike_brand || '' }];

  let bikesSections = '';
  for (let i = 0; i < bikes.length; i++) {
    const bike = bikes[i];
    const report = reports.find(r => r.bike_index === i);
    const bikeLabel = [bike.name, bike.brand].filter(Boolean).join(' — ') || `Bike ${i + 1}`;
    const typeBadges = [report?.bike_type, report?.drivetrain_type].filter(Boolean).map(t => `<span class="bike-type-badge">${esc(t)}</span>`).join(' ');
    bikesSections += `<div class="bike-section">
      <h3 class="bike-title">${esc(bikeLabel)}${typeBadges ? ' ' + typeBadges : ''}</h3>
      ${report ? renderItems(report.items) : '<p style="color:#9ca3af;font-size:13px;">No inspection on file for this bike.</p>'}
      ${report?.notes ? `<div class="overall-notes"><strong>Notes:</strong> ${esc(report.notes)}</div>` : ''}
    </div>`;
  }

  const serviceDate = booking.confirmed_date ? fmtDate(booking.confirmed_date) : (booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Inspection Report — ${esc(booking.name)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: #fff; }
  .page { max-width: 760px; margin: 0 auto; padding: 48px 32px; }
  .header { border-bottom: 2px solid #1a3328; padding-bottom: 20px; margin-bottom: 28px; }
  .brand { font-size: 22px; font-weight: 800; color: #1a3328; letter-spacing: -0.02em; }
  .brand-sub { font-size: 13px; color: #6b7280; margin-top: 3px; }
  .meta { display: flex; gap: 32px; flex-wrap: wrap; margin-bottom: 28px; }
  .meta-item { }
  .meta-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
  .meta-value { font-size: 15px; font-weight: 600; color: #111; }
  .bike-section { margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #f3f4f6; }
  .bike-section:last-child { border-bottom: none; }
  .bike-title { font-size: 16px; font-weight: 700; color: #1a3328; margin-bottom: 16px; }
  .bike-type-badge { font-size: 11px; font-weight: 600; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 12px; padding: 2px 8px; margin-left: 8px; vertical-align: middle; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
  .item-label { font-size: 13px; font-weight: 600; color: #374151; }
  .wear-item { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f9f9f9; }
  .wear-item:last-child { border-bottom: none; }
  .wear-bar { height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; margin: 4px 0; }
  .card { border-radius: 8px; padding: 10px 14px; margin-bottom: 6px; }
  .card-green { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .card-orange { background: #fff7ed; border: 1px solid #fed7aa; }
  .card-blue { background: #eff6ff; border: 1px solid #bfdbfe; }
  .item-photo { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 8px; display: block; }
  .overall-notes { background: #fafaf7; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; margin-top: 12px; font-size: 13px; color: #374151; line-height: 1.5; }
  .print-btn { display: block; margin: 32px 0 0; padding: 12px 28px; background: #1a3328; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af; }
  @media print {
    .print-btn { display: none; }
    .page { padding: 24px 16px; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">One Love Outdoors</div>
    <div class="brand-sub">Bike Service — Inspection Report</div>
  </div>
  <div class="meta">
    <div class="meta-item"><div class="meta-label">Customer</div><div class="meta-value">${esc(booking.name)}</div></div>
    ${serviceDate ? `<div class="meta-item"><div class="meta-label">Service date</div><div class="meta-value">${esc(serviceDate)}</div></div>` : ''}
    ${booking.email ? `<div class="meta-item"><div class="meta-label">Email</div><div class="meta-value">${esc(booking.email)}</div></div>` : ''}
  </div>
  ${bikesSections}
  <button class="print-btn" onclick="window.print()">Save as PDF / Print</button>
  <div class="footer">Generated by One Love Outdoors · service.oneloveoutdoors.org</div>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
