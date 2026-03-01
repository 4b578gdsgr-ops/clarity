'use client';

import { useState, useEffect } from 'react';

export function formatMoney(a) {
  if (a >= 1e6) return `$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(a / 1e3).toFixed(0)}K`;
  return `$${a}`;
}

function ScoreRing({ score, color, size = 120 }) {
  const c = 2 * Math.PI * 50;
  const o = c - (score / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 120 120" style={{ width: size, transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e0d8" strokeWidth="8" />
        <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        fontSize: size * 0.23, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace"
      }}>{score}</div>
    </div>
  );
}

function DualScore({ opacity, karma }) {
  const oc = opacity <= 25 ? '#22c55e' : opacity <= 50 ? '#f59e0b' : opacity <= 75 ? '#f97316' : '#ef4444';
  const kc = karma >= 75 ? '#22c55e' : karma >= 50 ? '#84cc16' : karma >= 25 ? '#f59e0b' : '#ef4444';
  const ol = opacity <= 25 ? 'Transparent' : opacity <= 50 ? 'Semi-Opaque' : opacity <= 75 ? 'Opaque' : 'Very Opaque';
  const kl = karma >= 75 ? 'Force for Good' : karma >= 50 ? 'Mixed Impact' : karma >= 25 ? 'Mostly Harmful' : 'Harmful';
  return (
    <div className="grid grid-cols-2 gap-4 py-5">
      {[{ s: opacity, c: oc, l: ol, t: 'Opacity', sub: '0 = transparent · 100 = hidden' },
        { s: karma, c: kc, l: kl, t: 'Karma', sub: '0 = harmful · 100 = force for good' }].map((item, i) => (
        <div key={i} className="text-center">
          <div className="text-[10px] tracking-[2px] uppercase mb-3 font-bold" style={{color:'#9ca3af'}}>
            {item.t}
          </div>
          <div className="mx-auto w-fit"><ScoreRing score={item.s} color={item.c} /></div>
          <div className="text-xs font-bold mt-2" style={{ color: item.c }}>{item.l}</div>
          <div className="text-[9px] mt-0.5" style={{color:'#b0b8b4'}}>{item.sub}</div>
        </div>
      ))}
    </div>
  );
}

function KarmaBreakdown({ data }) {
  const cats = [
    { key: 'environment', label: 'Environment', icon: '🌿' },
    { key: 'workers', label: 'Workers', icon: '🤝' },
    { key: 'community', label: 'Community', icon: '🏡' },
    { key: 'ethics', label: 'Ethics', icon: '⚖️' },
    { key: 'transparency', label: 'Transparency', icon: '🔍' },
  ];
  const gc = v => v >= 75 ? '#22c55e' : v >= 50 ? '#84cc16' : v >= 25 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col gap-2.5">
      {cats.map(cat => {
        const v = data[cat.key] || 0;
        return (
          <div key={cat.key} className="flex items-center gap-2.5">
            <span className="text-sm w-5">{cat.icon}</span>
            <span className="text-xs w-[90px]" style={{color:'#636e72'}}>{cat.label}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:'#e5e0d8'}}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${v}%`, background: gc(v) }} />
            </div>
            <span className="text-xs font-bold w-[30px] text-right font-mono" style={{ color: gc(v) }}>{v}</span>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-extrabold tracking-[3px] uppercase mb-2.5 pb-2"
        style={{color:'#9ca3af', borderBottom:'1px solid #e5e0d8'}}>{title}</h3>
      {children}
    </div>
  );
}

function Tag({ children, color = '#7c6bfa' }) {
  return (
    <span className="inline-block px-2.5 py-1 m-0.5 rounded text-[11px] font-semibold"
      style={{ background: color + '18', color, border: `1px solid ${color}35` }}>
      {children}
    </span>
  );
}

export default function CompanyResult({ data }) {
  const [tab, setTab] = useState('karma');
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setVisible(false); setTab('karma'); setTimeout(() => setVisible(true), 50); }, [data]);

  const handleShare = () => {
    navigator.clipboard.writeText(`https://loveovermoney.oneloveoutdoors.org/company/${data.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const tabs = [
    { id: 'karma', label: 'Karma' }, { id: 'money', label: 'Money Trail' },
    { id: 'ties', label: 'Foreign Ties' }, { id: 'details', label: 'Details' },
  ];
  const pc = p => p === 'D' ? '#3b82f6' : p === 'R' ? '#ef4444' : p === 'N' ? '#22c55e' : '#8b5cf6';
  const pl = p => p === 'D' ? 'D' : p === 'R' ? 'R' : p === 'N' ? 'NP' : 'PAC';

  return (
    <div className={`max-w-[600px] mx-auto transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
      {/* Header card */}
      <div className="rounded-2xl p-5 mb-3" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 2px 16px rgba(0,0,0,0.06)'}}>
        <h2 className="text-xl font-extrabold" style={{color:'#2d3436'}}>{data.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          {data.ticker && data.ticker !== 'Private' && data.ticker !== 'Co-op' && (
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded" style={{color:'#2d8653', background:'#2d865318'}}>${data.ticker}</span>
          )}
          {(data.ticker === 'Private' || data.ticker === 'Co-op') && (
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{color:'#9ca3af', background:'#f0ede8'}}>{data.ticker}</span>
          )}
          <span className="text-[11px]" style={{color:'#9ca3af'}}>· {data.sector}</span>
        </div>
        <DualScore opacity={data.opacityScore} karma={data.karmaScore} />
        <button onClick={handleShare}
          className="w-full py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all"
          style={{
            background: copied ? '#f0faf5' : '#faf9f6',
            border: `1px solid ${copied ? '#22c55e50' : '#e5e0d8'}`,
            color: copied ? '#22c55e' : '#9ca3af',
          }}>
          {copied ? '♥ Link copied to clipboard' : 'Share This Score'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-3 rounded-xl p-1" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 1px 6px rgba(0,0,0,0.04)'}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all`}
            style={tab === t.id
              ? {background:'linear-gradient(135deg, #2d8653, #1a6e3f)', color:'#ffffff'}
              : {color:'#9ca3af'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content card */}
      <div className="rounded-2xl p-5" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 2px 16px rgba(0,0,0,0.06)'}}>
        {tab === 'karma' && (<>
          <Section title="Karma Breakdown"><KarmaBreakdown data={data.karmaBreakdown} /></Section>
          {data.healthcareImpact && (
            <Section title={data.healthcareImpact.score >= 70 ? "⊕ Healthcare Impact" : "⊖ Healthcare Impact"}>
              <div className="p-3 rounded-lg mb-3" style={data.healthcareImpact.score >= 70
                ? {border:'1px solid #22c55e30', background:'#f0faf5'}
                : {border:'1px solid #ef444430', background:'#fef2f2'}}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold" style={{color: data.healthcareImpact.score >= 70 ? '#16a34a' : '#dc2626'}}>Healthcare Score</span>
                  <span className="text-lg font-black font-mono" style={{color: data.healthcareImpact.score >= 70 ? '#16a34a' : '#dc2626'}}>{data.healthcareImpact.score}/100</span>
                </div>
                {data.healthcareImpact.details.map((d, i) => (
                  <div key={i} className="text-[11px] mb-1" style={{color: data.healthcareImpact.score >= 70 ? '#15803d' : '#b91c1c'}}>
                    {data.healthcareImpact.score >= 70 ? '⊕' : '⊖'} {d}
                  </div>
                ))}
              </div>
            </Section>
          )}
          <Section title="What They Actually Do">
            <div className="flex flex-col gap-1.5">
              {data.karmaDetails.map((d, i) => (
                <div key={i} className="text-xs px-2.5 py-2 rounded-md" style={d.bad
                  ? {color:'#b91c1c', background:'#fef2f2', border:'1px solid #ef444428'}
                  : {color:'#15803d', background:'#f0faf5', border:'1px solid #22c55e28'}}>
                  {d.bad ? '⊖' : '⊕'} {d.text}
                </div>
              ))}
            </div>
          </Section>
          {data.alternatives?.length > 0 && (
            <Section title="♥ Better Alternatives">
              {data.alternatives.map((alt, i) => {
                const kc = alt.karma >= 75 ? '#16a34a' : alt.karma >= 50 ? '#65a30d' : '#d97706';
                return (
                  <div key={i} className="p-3.5 rounded-xl mb-2" style={{background:'#f6fbf8', border:'1px solid #d1ead9'}}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold" style={{color:'#2d8653'}}>♥ {alt.name}</span>
                      <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded"
                        style={{ color: kc, background: kc + '18' }}>Karma {alt.karma}</span>
                    </div>
                    <div className="text-xs" style={{color:'#636e72'}}>{alt.why}</div>
                  </div>
                );
              })}
            </Section>
          )}
        </>)}

        {tab === 'money' && (<>
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[{ l: 'Total Political', v: formatMoney(data.totalPoliticalSpending) },
              { l: 'Lobbying', v: formatMoney(data.lobbyingSpending) },
              { l: 'PAC Spending', v: formatMoney(data.pacSpending) }].map((item, i) => (
              <div key={i} className="rounded-xl p-2.5 text-center" style={{background:'#faf9f6', border:'1px solid #e5e0d8'}}>
                <div className="text-[15px] font-extrabold font-mono" style={{color:'#2d3436'}}>{item.v}</div>
                <div className="text-[9px] mt-0.5 tracking-wider uppercase" style={{color:'#9ca3af'}}>{item.l}</div>
              </div>
            ))}
          </div>
          <Section title="Political Split">
            <div className="my-3">
              <div className="flex justify-between mb-1.5 text-xs font-semibold">
                <span style={{color:'#3b82f6'}}>Democrat {data.splitD}%</span>
                <span style={{color:'#ef4444'}}>Republican {data.splitR}%</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden" style={{background:'#e5e0d8'}}>
                <div className="transition-all duration-1000" style={{ width: `${data.splitD}%`, background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />
                <div className="transition-all duration-1000" style={{ width: `${data.splitR}%`, background: 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
              </div>
            </div>
          </Section>
          <Section title="Top Recipients">
            {data.topRecipients.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg mb-1.5" style={{background:'#faf9f6', border:'1px solid #e5e0d8'}}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-extrabold"
                    style={{ background: pc(r.party) + '18', color: pc(r.party) }}>{pl(r.party)}</span>
                  <span className="text-xs" style={{color:'#636e72'}}>{r.name}</span>
                </div>
                <span className="text-xs font-bold font-mono" style={{color:'#2d3436'}}>{formatMoney(r.amount)}</span>
              </div>
            ))}
          </Section>
          <Section title="Lobbying Issues">
            <div className="flex flex-wrap">{data.lobbyingIssues.map((issue, i) => <Tag key={i} color="#d97706">{issue}</Tag>)}</div>
          </Section>
        </>)}

        {tab === 'ties' && (<>
          {data.foreignTies?.length > 0 ? (
            <Section title="Foreign Financial Ties">
              {data.foreignTies.map((tie, i) => (
                <div key={i} className="p-3 rounded-lg mb-2" style={{background:'#faf9f6', border:'1px solid #e5e0d8'}}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{tie.flag}</span>
                    <span className="text-sm font-bold" style={{color:'#2d3436'}}>{tie.country}</span>
                  </div>
                  <div className="text-xs leading-relaxed" style={{color:'#636e72'}}>{tie.detail}</div>
                </div>
              ))}
            </Section>
          ) : (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">🌿</div>
              <div className="text-sm" style={{color:'#636e72'}}>No significant foreign government ties found</div>
              <div className="text-xs mt-1" style={{color:'#9ca3af'}}>Based on FARA, SEC 13F, and defense contract data</div>
            </div>
          )}
          <div className="text-[10px] mt-4 p-3 rounded-lg" style={{color:'#9ca3af', background:'#faf9f6', border:'1px solid #e5e0d8'}}>
            <strong style={{color:'#636e72'}}>Sources:</strong> FARA, SEC 13F filings, SIPRI arms trade, corporate reports. No ideological labels — just factual financial relationships.
          </div>
        </>)}

        {tab === 'details' && (<>
          {data.subsidiaries?.length > 0 && (
            <Section title="Brands & Subsidiaries">
              <div className="flex flex-wrap">{data.subsidiaries.map((s, i) => <Tag key={i} color="#2d8653">{s}</Tag>)}</div>
              <div className="text-[10px] mt-2" style={{color:'#9ca3af'}}>Search any brand above to find this company.</div>
            </Section>
          )}
          <Section title="Institutional Ownership">
            {data.institutionalOwners?.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {data.institutionalOwners.map((owner, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{background:'#faf9f6', border:'1px solid #e5e0d8'}}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{background:'#8b5cf6'}}></span>
                      <span className="text-xs" style={{color:'#636e72'}}>{owner.name}</span>
                    </div>
                    <span className="text-xs font-bold font-mono" style={{color:'#8b5cf6'}}>{owner.stake}%</span>
                  </div>
                ))}
                <div className="text-[10px] mt-1 p-2 rounded" style={{color:'#9ca3af', background:'#faf9f6', border:'1px solid #e5e0d8'}}>
                  Source: SEC 13F filings. The same few firms appear as top shareholders in nearly every major corporation.
                </div>
              </div>
            ) : (
              <div className="text-xs p-3 rounded-lg" style={{color:'#636e72', background:'#faf9f6', border:'1px solid #e5e0d8'}}>
                Private company — not required to disclose institutional ownership.
              </div>
            )}
          </Section>
          {data.controversies?.length > 0 && (
            <Section title="Controversies">
              {data.controversies.map((c, i) => (
                <div key={i} className="text-xs px-2.5 py-1.5 rounded mb-1" style={{color:'#b91c1c', background:'#fef2f2', border:'1px solid #ef444428'}}>⚠ {c}</div>
              ))}
            </Section>
          )}
        </>)}
      </div>
      <div className="text-center text-[9px] py-3" style={{color:'#c4bdb5'}}>
        Data: FEC · OpenSecrets · SEC 13F · FARA · EPA · B-Corp · All public record
      </div>
    </div>
  );
}
