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
        <circle cx="60" cy="60" r="50" fill="none" stroke="#1a3328" strokeWidth="8" />
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
  const oc = opacity <= 25 ? '#4ade80' : opacity <= 50 ? '#fbbf24' : opacity <= 75 ? '#f97316' : '#ef4444';
  const kc = karma >= 75 ? '#4ade80' : karma >= 50 ? '#a3e635' : karma >= 25 ? '#fbbf24' : '#ef4444';
  const ol = opacity <= 25 ? 'Transparent' : opacity <= 50 ? 'Semi-Opaque' : opacity <= 75 ? 'Opaque' : 'Very Opaque';
  const kl = karma >= 75 ? 'Force for Good' : karma >= 50 ? 'Mixed Impact' : karma >= 25 ? 'Mostly Harmful' : 'Harmful';
  return (
    <div className="grid grid-cols-2 gap-4 py-5">
      {[{ s: opacity, c: oc, l: ol, t: 'Opacity', sub: '0 = transparent · 100 = hidden' },
        { s: karma, c: kc, l: kl, t: 'Karma', sub: '0 = harmful · 100 = force for good' }].map((item, i) => (
        <div key={i} className="text-center">
          <div className="text-[10px] tracking-[2px] uppercase mb-3 font-bold" style={{color:'#6b8f71'}}>
            {item.t}
          </div>
          <div className="mx-auto w-fit"><ScoreRing score={item.s} color={item.c} /></div>
          <div className="text-xs font-bold mt-2" style={{ color: item.c }}>{item.l}</div>
          <div className="text-[9px] mt-0.5" style={{color:'#4a6b52'}}>{item.sub}</div>
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
  const gc = v => v >= 75 ? '#4ade80' : v >= 50 ? '#a3e635' : v >= 25 ? '#fbbf24' : '#ef4444';
  return (
    <div className="flex flex-col gap-2.5">
      {cats.map(cat => {
        const v = data[cat.key] || 0;
        return (
          <div key={cat.key} className="flex items-center gap-2.5">
            <span className="text-sm w-5">{cat.icon}</span>
            <span className="text-xs w-[90px]" style={{color:'#8aaa8f'}}>{cat.label}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:'#1a3328'}}>
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
      <h3 className="text-[10px] font-extrabold tracking-[3px] uppercase mb-2.5 pb-2" style={{color:'#6b8f71', borderBottom:'1px solid #1a3328'}}>{title}</h3>
      {children}
    </div>
  );
}

function Tag({ children, color = '#a78bfa' }) {
  return (
    <span className="inline-block px-2.5 py-1 m-0.5 rounded text-[11px] font-semibold"
      style={{ background: color + '15', color, border: `1px solid ${color}30` }}>
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
  const pc = p => p === 'D' ? '#60a5fa' : p === 'R' ? '#f87171' : p === 'N' ? '#4ade80' : '#a78bfa';
  const pl = p => p === 'D' ? 'D' : p === 'R' ? 'R' : p === 'N' ? 'NP' : 'PAC';

  return (
    <div className={`max-w-[600px] mx-auto transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
      <div className="rounded-2xl p-5 mb-3" style={{background:'linear-gradient(135deg, #0d1f15, #142a1c)', border:'1px solid #1a3328'}}>
        <h2 className="text-xl font-extrabold text-white">{data.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          {data.ticker && data.ticker !== 'Private' && data.ticker !== 'Co-op' && (
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded" style={{color:'#4ade80', background:'#16402520'}}>${data.ticker}</span>
          )}
          {(data.ticker === 'Private' || data.ticker === 'Co-op') && (
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{color:'#6b8f71', background:'#1a332820'}}>{data.ticker}</span>
          )}
          <span className="text-[11px]" style={{color:'#4a6b52'}}>· {data.sector}</span>
        </div>
        <DualScore opacity={data.opacityScore} karma={data.karmaScore} />
        <button onClick={handleShare}
          className="w-full py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all"
          style={{
            background: copied ? '#4ade8012' : '#0a1810',
            border: `1px solid ${copied ? '#4ade8040' : '#1a3328'}`,
            color: copied ? '#4ade80' : '#4a6b52',
          }}>
          {copied ? '♥ Link copied to clipboard' : 'Share This Score'}
        </button>
      </div>

      <div className="flex gap-1 mb-3 rounded-xl p-1" style={{background:'#0d1f15', border:'1px solid #1a3328'}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all
              ${tab === t.id ? 'text-white' : 'hover:text-white'}`}
            style={tab === t.id ? {background:'linear-gradient(135deg, #166534, #15803d)'} : {color:'#6b8f71'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{background:'linear-gradient(135deg, #0d1f15, #142a1c)', border:'1px solid #1a3328'}}>
        {tab === 'karma' && (<>
          <Section title="Karma Breakdown"><KarmaBreakdown data={data.karmaBreakdown} /></Section>
          {data.healthcareImpact && (
            <Section title={data.healthcareImpact.score >= 70 ? "⊕ Healthcare Impact" : "⊖ Healthcare Impact"}>
              <div className="p-3 rounded-lg mb-3" style={data.healthcareImpact.score >= 70
                ? {border:'1px solid #16553530', background:'#05200e20'}
                : {border:'1px solid #7f1d1d30', background:'#300a0a20'}}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold" style={{color: data.healthcareImpact.score >= 70 ? '#4ade80' : '#f87171'}}>Healthcare Score</span>
                  <span className="text-lg font-black font-mono" style={{color: data.healthcareImpact.score >= 70 ? '#4ade80' : '#f87171'}}>{data.healthcareImpact.score}/100</span>
                </div>
                {data.healthcareImpact.details.map((d, i) => (
                  <div key={i} className="text-[11px] mb-1" style={{color: data.healthcareImpact.score >= 70 ? '#6ee7b7' : '#fca5a5'}}>
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
                  ? {color:'#fca5a5', background:'#300a0a30', border:'1px solid #7f1d1d25'}
                  : {color:'#6ee7b7', background:'#05200e30', border:'1px solid #16553525'}}>
                  {d.bad ? '⊖' : '⊕'} {d.text}
                </div>
              ))}
            </div>
          </Section>
          {data.alternatives?.length > 0 && (
            <Section title="♥ Better Alternatives">
              {data.alternatives.map((alt, i) => {
                const kc = alt.karma >= 75 ? '#4ade80' : alt.karma >= 50 ? '#a3e635' : '#fbbf24';
                return (
                  <div key={i} className="p-3.5 rounded-xl mb-2" style={{background:'#05200e20', border:'1px solid #16553525'}}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold" style={{color:'#4ade80'}}>♥ {alt.name}</span>
                      <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded"
                        style={{ color: kc, background: kc + '15' }}>Karma {alt.karma}</span>
                    </div>
                    <div className="text-xs" style={{color:'#6ee7b780'}}>{alt.why}</div>
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
              <div key={i} className="rounded-xl p-2.5 text-center" style={{background:'#0a1810', border:'1px solid #1a3328'}}>
                <div className="text-[15px] font-extrabold font-mono text-white">{item.v}</div>
                <div className="text-[9px] mt-0.5 tracking-wider uppercase" style={{color:'#4a6b52'}}>{item.l}</div>
              </div>
            ))}
          </div>
          <Section title="Political Split">
            <div className="my-3">
              <div className="flex justify-between mb-1.5 text-xs font-semibold">
                <span style={{color:'#60a5fa'}}>Democrat {data.splitD}%</span>
                <span style={{color:'#f87171'}}>Republican {data.splitR}%</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden">
                <div className="transition-all duration-1000" style={{ width: `${data.splitD}%`, background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />
                <div className="transition-all duration-1000" style={{ width: `${data.splitR}%`, background: 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
              </div>
            </div>
          </Section>
          <Section title="Top Recipients">
            {data.topRecipients.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg mb-1.5" style={{background:'#0a1810', border:'1px solid #1a3328'}}>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-extrabold"
                    style={{ background: pc(r.party) + '20', color: pc(r.party) }}>{pl(r.party)}</span>
                  <span className="text-xs" style={{color:'#b0ccb5'}}>{r.name}</span>
                </div>
                <span className="text-xs font-bold font-mono text-white">{formatMoney(r.amount)}</span>
              </div>
            ))}
          </Section>
          <Section title="Lobbying Issues">
            <div className="flex flex-wrap">{data.lobbyingIssues.map((issue, i) => <Tag key={i} color="#fbbf24">{issue}</Tag>)}</div>
          </Section>
        </>)}

        {tab === 'ties' && (<>
          {data.foreignTies?.length > 0 ? (
            <Section title="Foreign Financial Ties">
              {data.foreignTies.map((tie, i) => (
                <div key={i} className="p-3 rounded-lg mb-2" style={{background:'#0a1810', border:'1px solid #1a3328'}}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{tie.flag}</span>
                    <span className="text-sm font-bold text-white">{tie.country}</span>
                  </div>
                  <div className="text-xs leading-relaxed" style={{color:'#8aaa8f'}}>{tie.detail}</div>
                </div>
              ))}
            </Section>
          ) : (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">🌿</div>
              <div className="text-sm" style={{color:'#8aaa8f'}}>No significant foreign government ties found</div>
              <div className="text-xs mt-1" style={{color:'#4a6b52'}}>Based on FARA, SEC 13F, and defense contract data</div>
            </div>
          )}
          <div className="text-[10px] mt-4 p-3 rounded-lg" style={{color:'#4a6b52', background:'#0a1810', border:'1px solid #1a3328'}}>
            <strong style={{color:'#6b8f71'}}>Sources:</strong> FARA, SEC 13F filings, SIPRI arms trade, corporate reports. No ideological labels — just factual financial relationships.
          </div>
        </>)}

        {tab === 'details' && (<>
          {data.subsidiaries?.length > 0 && (
            <Section title="Brands & Subsidiaries">
              <div className="flex flex-wrap">{data.subsidiaries.map((s, i) => <Tag key={i} color="#4ade80">{s}</Tag>)}</div>
              <div className="text-[10px] mt-2" style={{color:'#4a6b52'}}>Search any brand above to find this company.</div>
            </Section>
          )}
          <Section title="Institutional Ownership">
            {data.institutionalOwners?.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {data.institutionalOwners.map((owner, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{background:'#0a1810', border:'1px solid #1a3328'}}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{background:'#a78bfa'}}></span>
                      <span className="text-xs" style={{color:'#b0ccb5'}}>{owner.name}</span>
                    </div>
                    <span className="text-xs font-bold font-mono" style={{color:'#a78bfa'}}>{owner.stake}%</span>
                  </div>
                ))}
                <div className="text-[10px] mt-1 p-2 rounded" style={{color:'#4a6b52', background:'#0a1810', border:'1px solid #1a3328'}}>
                  Source: SEC 13F filings. The same few firms appear as top shareholders in nearly every major corporation.
                </div>
              </div>
            ) : (
              <div className="text-xs p-3 rounded-lg" style={{color:'#6b8f71', background:'#0a1810', border:'1px solid #1a3328'}}>
                Private company — not required to disclose institutional ownership.
              </div>
            )}
          </Section>
          {data.controversies?.length > 0 && (
            <Section title="Controversies">
              {data.controversies.map((c, i) => (
                <div key={i} className="text-xs px-2.5 py-1.5 rounded mb-1" style={{color:'#fca5a5', background:'#300a0a20', border:'1px solid #7f1d1d20'}}>⚠ {c}</div>
              ))}
            </Section>
          )}
        </>)}
      </div>
      <div className="text-center text-[9px] py-3" style={{color:'#2a4a38'}}>
        Data: FEC · OpenSecrets · SEC 13F · FARA · EPA · B-Corp · All public record
      </div>
    </div>
  );
}
