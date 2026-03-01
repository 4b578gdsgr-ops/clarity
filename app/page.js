'use client';

import { useState, useEffect, useRef } from 'react';

function formatMoney(a) {
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

function CompanyResult({ data }) {
  const [tab, setTab] = useState('karma');
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(false); setTab('karma'); setTimeout(() => setVisible(true), 50); }, [data]);

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

export default function LoveMoneyApp() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = async (term) => {
    const q = (term || query).trim();
    setShowSuggestions(false);
    if (!q) return;
    setSearching(true); setResult(null); setRequestSent(false);
    try {
      const res = await fetch(`/api/company?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResult(data.found ? data.company : 'not_found');
    } catch { setResult('not_found'); }
    setSearching(false);
  };

  const fetchSuggestions = async (q) => {
    if (q.length < 1) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.results || []);
    } catch { setSuggestions([]); }
  };

  const handleInput = (val) => { setQuery(val); setShowSuggestions(true); fetchSuggestions(val); };

  const cyclingBrands = ['Specialized', 'Trek', 'Santa Cruz', 'SRAM', 'Shimano', 'Yeti', 'Chris King', 'Canyon', 'FOX', 'Guerrilla Gravity'];
  const outdoorBrands = ['Patagonia', 'REI', 'Cotopaxi', 'The North Face', 'Dr. Bronner\'s'];
  const otherBrands = ['AMZN', 'TSLA', 'UNH', 'LMT', 'META', 'BLK', 'Nestlé', 'Costco'];

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 50% 0%, #0d2818, #0f1a14 70%)'}} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
          <div className="mb-3">
            <h1 className="text-4xl font-black tracking-tight" style={{fontFamily:'Playfair Display, serif'}}>
              <span style={{color:'#f472b6'}}>Love</span>
              <span className="mx-2 text-2xl" style={{color:'#4a6b52'}}>{'>'}</span>
              <span style={{color:'#4ade80'}}>Money</span>
            </h1>
          </div>
          <p className="text-sm max-w-md mx-auto leading-relaxed" style={{color:'#6b8f71'}}>
            Know what your money supports. Search by company, ticker, or brand.
          </p>
          <p className="text-[11px] mt-1" style={{color:'#2a4a38'}}>A One Love Outdoors project · 501(c)(3)</p>
        </div>

        {/* Search — FIXED z-index */}
        <div ref={searchRef} className={`relative mb-6 z-50 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="flex rounded-xl overflow-hidden" style={{background:'#0d1f15', border:'1px solid #1a3328', boxShadow:'0 0 40px rgba(74,222,128,0.06)'}}>
            <input type="text" value={query}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Company, $TICKER, or brand..."
              className="flex-1 px-4 py-3.5 bg-transparent border-none outline-none text-white text-[15px]" />
            <button onClick={() => doSearch()}
              className="px-6 text-white font-bold text-sm tracking-wider"
              style={{background:'linear-gradient(135deg, #166534, #15803d)'}}>
              {searching ? '...' : 'SEARCH'}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 rounded-b-xl overflow-hidden shadow-2xl"
              style={{background:'#0d1f15', border:'1px solid #1a3328', borderTop:'none'}}>
              {suggestions.slice(0, 8).map((c, i) => (
                <div key={i} onClick={() => { setQuery(c.name); setShowSuggestions(false); doSearch(c.name); }}
                  className="px-4 py-2.5 cursor-pointer text-sm flex justify-between items-center transition-colors"
                  style={{color:'#b0ccb5', borderBottom:'1px solid #1a3328'}}
                  onMouseEnter={e => e.currentTarget.style.background = '#142a1c'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <span>{c.name}</span>
                    {c.ticker && c.ticker !== 'Private' && c.ticker !== 'Co-op' && (
                      <span className="ml-2 font-mono text-xs" style={{color:'#4ade80'}}>${c.ticker}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold font-mono" style={{color: c.karmaScore >= 50 ? '#4ade80' : c.karmaScore >= 25 ? '#fbbf24' : '#f87171'}}>
                    K:{c.karmaScore}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Browse chips — cycling first */}
        {!result && !searching && (
          <div className={`mb-6 transition-opacity duration-700 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-center mb-3">
              <div className="text-[10px] tracking-[2px] uppercase mb-2" style={{color:'#2a4a38'}}>🚵 Cycling & Components</div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {cyclingBrands.map(n => (
                  <button key={n} onClick={() => { setQuery(n); doSearch(n); }}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{background:'#0d1f15', border:'1px solid #1a3328', color:'#4ade80'}}
                    onMouseEnter={e => {e.currentTarget.style.borderColor='#4ade80';e.currentTarget.style.color='#fff'}}
                    onMouseLeave={e => {e.currentTarget.style.borderColor='#1a3328';e.currentTarget.style.color='#4ade80'}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center mb-3">
              <div className="text-[10px] tracking-[2px] uppercase mb-2" style={{color:'#2a4a38'}}>🌲 Outdoor & Lifestyle</div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {outdoorBrands.map(n => (
                  <button key={n} onClick={() => { setQuery(n); doSearch(n); }}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{background:'#0d1f15', border:'1px solid #1a3328', color:'#6ee7b7'}}
                    onMouseEnter={e => {e.currentTarget.style.borderColor='#6ee7b7'}}
                    onMouseLeave={e => {e.currentTarget.style.borderColor='#1a3328'}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] tracking-[2px] uppercase mb-2" style={{color:'#2a4a38'}}>📊 Corporate & Ticker Search</div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {otherBrands.map(n => (
                  <button key={n} onClick={() => { setQuery(n); doSearch(n); }}
                    className="px-3 py-1.5 rounded-full text-xs font-mono transition-all"
                    style={{background:'#0d1f15', border:'1px solid #1a3328', color:'#8aaa8f'}}
                    onMouseEnter={e => {e.currentTarget.style.borderColor='#8aaa8f'}}
                    onMouseLeave={e => {e.currentTarget.style.borderColor='#1a3328'}}>
                    {n.startsWith('$') || n.match(/^[A-Z]{2,5}$/) ? `$${n}` : n}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center mt-4 text-[11px]" style={{color:'#2a4a38'}}>
              35 companies · 150+ brands & subsidiaries searchable
            </div>
          </div>
        )}

        {searching && (
          <div className="text-center py-12">
            <div className="w-9 h-9 rounded-full animate-spin-slow mx-auto" style={{border:'3px solid #1a3328', borderTopColor:'#4ade80'}} />
            <div className="mt-3 text-xs" style={{color:'#4a6b52'}}>Looking into it...</div>
          </div>
        )}

        {result && result !== 'not_found' && <CompanyResult data={result} />}

        {result === 'not_found' && (
          <div className="text-center py-10 max-w-sm mx-auto">
            <div className="text-4xl mb-3">🌱</div>
            <h3 className="text-white text-base font-bold mb-2">"{query}" not found yet</h3>
            <p className="text-sm leading-relaxed mb-5" style={{color:'#6b8f71'}}>
              We're growing the database. Want us to research this company?
            </p>
            {!requestSent ? (
              <div className="p-4 rounded-xl" style={{background:'#0d1f15', border:'1px solid #1a3328'}}>
                <div className="text-xs font-bold mb-2" style={{color:'#4ade80'}}>Request This Company</div>
                <div className="flex gap-2">
                  <input type="text" value={requestName} onChange={e => setRequestName(e.target.value)}
                    placeholder={query || "Company name"}
                    className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{background:'#0a1810', border:'1px solid #1a3328'}} />
                  <button onClick={() => { setRequestSent(true); }}
                    className="px-4 py-2 rounded-lg text-white text-xs font-bold"
                    style={{background:'linear-gradient(135deg, #166534, #15803d)'}}>
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl" style={{background:'#05200e20', border:'1px solid #16553525'}}>
                <div className="text-sm font-bold mb-1" style={{color:'#4ade80'}}>♥ Request received</div>
                <div className="text-xs" style={{color:'#6ee7b780'}}>We'll research and add this company. Check back soon.</div>
              </div>
            )}
          </div>
        )}

        <div className="text-center pt-8 pb-4">
          <div className="text-[10px]" style={{color:'#1a3328'}}>Love {'>'} Money · Nonpartisan · No editorial · Just data and karma</div>
          <div className="text-[10px] mt-1" style={{color:'#1a3328'}}>A One Love Outdoors 501(c)(3) project · © 2026</div>
        </div>
      </div>
    </div>
  );
}
