'use client';

import { useState, useEffect, useRef } from 'react';
import CompanyResult from './components/CompanyResult';
import CryptoDonate from './components/CryptoDonate';


function InlineHeart() {
  return (
    <svg viewBox="0 0 32 34" style={{display:'inline-block', width:'0.85em', height:'1.05em', verticalAlign:'-0.22em', flexShrink:0}}>
      {/* Halo arc */}
      <path d="M 10 7 Q 16 2 22 7" fill="none" stroke="#f0c040" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Heart */}
      <path d="M16 33 C16 33 1 22 1 13 A7.5 7.5 0 0 1 16 10 A7.5 7.5 0 0 1 31 13 C31 22 16 33 16 33Z" fill="#e74c3c"/>
    </svg>
  );
}


// EDIT THESE QUOTES MANUALLY - replace placeholders with your chosen quotes
const QUOTES = [
  { text: "Love's real, not fade away", attribution: "Grateful Dead, Not Fade Away" },
  { text: "Without love in the dream it'll never come true", attribution: "Grateful Dead, Help on the Way" },
  { text: "Put your gold money where your love is, baby", attribution: "Grateful Dead, Deal" },
  { text: "If your cup is full may it be again", attribution: "Grateful Dead, Ripple" },
  { text: "Heartless powers try to tell us what to think, if the spirit's sleeping then the flesh is ink", attribution: "Grateful Dead, Throwing Stones" },
];

export default function LoveMoneyApp() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestNumber, setRequestNumber] = useState(null);
  const [communityCount, setCommunityCount] = useState(null);
  const [quoteIndex, setQuoteIndex] = useState(null);
  const [quoteVisible, setQuoteVisible] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const start = Math.floor(Math.random() * QUOTES.length);
    setQuoteIndex(start);
    setTimeout(() => setQuoteVisible(true), 50);

    const cycle = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setQuoteIndex(i => (i + 1) % QUOTES.length);
        setQuoteVisible(true);
      }, 800);
    }, 10000);

    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    fetch('/api/request')
      .then(r => r.json())
      .then(d => setCommunityCount(d.count))
      .catch(() => {});
  }, []);

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

  const cyclingBrands = ['Specialized', 'Trek', 'Santa Cruz', 'SRAM', 'Shimano', 'Yeti', 'Chris King', 'Canyon', 'FOX', 'Ibis'];
  const outdoorBrands = ['Patagonia', 'REI', 'Cotopaxi', 'The North Face', 'Dr. Bronner\'s'];
  const otherBrands = ['AMZN', 'TSLA', 'UNH', 'LMT', 'META', 'BLK', 'Nestlé', 'Costco'];

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)'}} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>

          {/* One-line logo */}
          <h1 className="flex items-baseline justify-center select-none mb-3" style={{lineHeight:1, gap:'0.2em'}}>
            <span className="flex items-baseline" style={{fontFamily:'Playfair Display, serif', fontWeight:900, color:'#2d3436', fontSize:'2.25rem'}}>
              L<InlineHeart />ve
            </span>
            <span style={{fontFamily:'Playfair Display, serif', fontWeight:900, color:'#2d8653', fontSize:'3.4rem', lineHeight:0.85}}>&gt;</span>
            <span className="flex items-baseline" style={{fontFamily:'Playfair Display, serif', fontWeight:900, color:'#2d3436', fontSize:'2.25rem'}}>
              M<span style={{fontSize:'0.8em', verticalAlign:'0.05em'}}>💀</span>ney
            </span>
          </h1>

          <p className="text-sm" style={{color:'#9ca3af'}}>
            Know what your money supports.
          </p>
          <p className="text-[11px] mt-1" style={{color:'#b0b8b4'}}>A One Love Outdoors 501(c)(3) project</p>
        </div>

        {/* Search */}
        <div ref={searchRef} className={`relative mb-6 z-50 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="flex rounded-xl overflow-hidden" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 2px 20px rgba(45,134,83,0.08)'}}>
            <input type="text" value={query}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Company, $TICKER, or brand..."
              className="flex-1 px-4 py-3.5 bg-transparent border-none outline-none text-[15px]"
              style={{color:'#2d3436'}} />
            <button onClick={() => doSearch()}
              className="px-6 text-white font-bold text-sm tracking-wider"
              style={{background:'linear-gradient(135deg, #2d8653, #1a6e3f)'}}>
              {searching ? '...' : 'SEARCH'}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 rounded-b-xl overflow-hidden shadow-lg"
              style={{background:'#ffffff', border:'1px solid #e5e0d8', borderTop:'none'}}>
              {suggestions.slice(0, 8).map((c, i) => (
                <div key={i} onClick={() => { setQuery(c.name); setShowSuggestions(false); doSearch(c.name); }}
                  className="px-4 py-2.5 cursor-pointer text-sm flex justify-between items-center transition-colors"
                  style={{color:'#636e72', borderBottom:'1px solid #f0ede8'}}
                  onMouseEnter={e => e.currentTarget.style.background = '#f6fbf8'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <span style={{color:'#2d3436'}}>{c.name}</span>
                    {c.ticker && c.ticker !== 'Private' && c.ticker !== 'Co-op' && (
                      <span className="ml-2 font-mono text-xs" style={{color:'#2d8653'}}>${c.ticker}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold font-mono" style={{color: c.karmaScore >= 50 ? '#16a34a' : c.karmaScore >= 25 ? '#d97706' : '#dc2626'}}>
                    K:{c.karmaScore}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Browse chips */}
        {!result && !searching && (
          <div className={`mb-6 transition-opacity duration-700 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-center mb-3">
              <div className="text-[10px] tracking-[2px] uppercase mb-2" style={{color:'#9ca3af'}}>🚵 Cycling & Components</div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {cyclingBrands.map(n => (
                  <button key={n} onClick={() => { setQuery(n); doSearch(n); }}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{background:'#ffffff', border:'1px solid #d1ead9', color:'#2d8653'}}
                    onMouseEnter={e => {e.currentTarget.style.background='#f0faf5';e.currentTarget.style.borderColor='#2d8653'}}
                    onMouseLeave={e => {e.currentTarget.style.background='#ffffff';e.currentTarget.style.borderColor='#d1ead9'}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center mb-3">
              <div className="text-[10px] tracking-[2px] uppercase mb-2" style={{color:'#9ca3af'}}>🌲 Outdoor & Lifestyle</div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {outdoorBrands.map(n => (
                  <button key={n} onClick={() => { setQuery(n); doSearch(n); }}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{background:'#ffffff', border:'1px solid #d1ead9', color:'#4a9e6b'}}
                    onMouseEnter={e => {e.currentTarget.style.background='#f0faf5';e.currentTarget.style.borderColor='#4a9e6b'}}
                    onMouseLeave={e => {e.currentTarget.style.background='#ffffff';e.currentTarget.style.borderColor='#d1ead9'}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] tracking-[2px] uppercase mb-2" style={{color:'#9ca3af'}}>📊 Corporate & Ticker Search</div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {otherBrands.map(n => (
                  <button key={n} onClick={() => { setQuery(n); doSearch(n); }}
                    className="px-3 py-1.5 rounded-full text-xs font-mono transition-all"
                    style={{background:'#ffffff', border:'1px solid #e5e0d8', color:'#636e72'}}
                    onMouseEnter={e => {e.currentTarget.style.background='#faf9f6';e.currentTarget.style.borderColor='#636e72'}}
                    onMouseLeave={e => {e.currentTarget.style.background='#ffffff';e.currentTarget.style.borderColor='#e5e0d8'}}>
                    {n.startsWith('$') || n.match(/^[A-Z]{2,5}$/) ? `$${n}` : n}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center mt-4 text-[11px]" style={{color:'#9ca3af'}}>
              76 companies · 200+ brands & subsidiaries searchable
            </div>
            {communityCount > 0 && (
              <div className="text-center mt-1 text-[11px]" style={{color:'#b0b8b4'}}>
                {communityCount} {communityCount === 1 ? 'company' : 'companies'} requested by the community
              </div>
            )}
          </div>
        )}

        {searching && (
          <div className="text-center py-12">
            <div className="w-9 h-9 rounded-full animate-spin-slow mx-auto" style={{border:'3px solid #e5e0d8', borderTopColor:'#2d8653'}} />
            <div className="mt-3 text-xs" style={{color:'#9ca3af'}}>Looking into it...</div>
          </div>
        )}

        {result && result !== 'not_found' && <CompanyResult data={result} />}

        {result === 'not_found' && (
          <div className="text-center py-10 max-w-sm mx-auto">
            <div className="text-4xl mb-3">🌱</div>
            <h3 className="text-base font-bold mb-2" style={{color:'#2d3436'}}>"{query}" not found yet</h3>
            <p className="text-sm leading-relaxed mb-5" style={{color:'#636e72'}}>
              We're growing the database. Want us to research this company?
            </p>
            {!requestSent ? (
              <div className="p-4 rounded-xl" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
                <div className="text-xs font-bold mb-2" style={{color:'#2d8653'}}>Request This Company</div>
                <div className="flex gap-2">
                  <input type="text" value={requestName} onChange={e => setRequestName(e.target.value)}
                    placeholder={query || "Company name"}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{background:'#faf9f6', border:'1px solid #e5e0d8', color:'#2d3436'}} />
                  <button onClick={async () => {
                      const name = (requestName || query).trim();
                      if (!name) return;
                      try {
                        const res = await fetch('/api/request', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ company: name }),
                        });
                        const data = await res.json();
                        setRequestNumber(data.count);
                        setCommunityCount(data.count);
                      } catch {}
                      setRequestSent(true);
                    }}
                    className="px-4 py-2 rounded-lg text-white text-xs font-bold"
                    style={{background:'linear-gradient(135deg, #2d8653, #1a6e3f)'}}>
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl" style={{background:'#f6fbf8', border:'1px solid #d1ead9'}}>
                <div className="text-sm font-bold mb-1" style={{color:'#2d8653'}}>♥ Request received</div>
                {requestNumber && (
                  <div className="text-base font-extrabold font-mono mb-1" style={{color:'#d97706'}}>
                    You're request #{requestNumber}
                  </div>
                )}
                <div className="text-xs" style={{color:'#636e72'}}>We'll research and add this company. Check back soon.</div>
              </div>
            )}
          </div>
        )}

        {/* Donation section */}
        <div className="mt-10 mb-6 text-center">
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{color:'#b0b8b4'}}>Support the work</div>
          <p className="text-xs mb-4 max-w-xs mx-auto leading-relaxed" style={{color:'#9ca3af'}}>
            Love Over Money is free, ad-free, and nonprofit. Help us keep it that way.
          </p>
          <a href="https://www.paypal.com/donate?token=CVMQXpC4Y4SF0ukiHSLS3V-Msw4syFCNKFF6RQBn6H7F1FqpSH4W1uriTp_sewt1T8moT7FzP7eQPShz" target="_blank" rel="noopener noreferrer"
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-bold text-white mb-6"
            style={{background:'linear-gradient(135deg, #c0392b, #a93226)'}}>
            ♥ Spread some love
          </a>
        </div>

        <CryptoDonate />

        <div className="text-center pt-8 pb-4">
          {quoteIndex !== null && (
            <div className="mb-3" style={{opacity: quoteVisible ? 1 : 0, transition: 'opacity 0.8s ease'}}>
              <p style={{fontFamily:'Playfair Display, serif', fontStyle:'italic', color:'#636e72', fontSize:'12px', lineHeight:'1.6'}}>
                🌹 {QUOTES[quoteIndex].text}
              </p>
              <p style={{color:'#9ca3af', fontSize:'10px', marginTop:'4px'}}>
                — {QUOTES[quoteIndex].attribution}
              </p>
            </div>
          )}
          <p className="mb-4 max-w-sm mx-auto" style={{fontFamily:'Playfair Display, serif', fontStyle:'italic', color:'#636e72', fontSize:'0.82rem', lineHeight:1.6}}>
            "Doing the right thing may never pay, but we'll keep doing it anyway."
          </p>
          <div className="text-[10px]" style={{color:'#c4bdb5'}}>Love Over Money · A One Love Outdoors 501(c)(3) project</div>
          <div className="flex justify-center gap-4 mt-1">
            <a href="/about" className="text-[10px] hover:underline" style={{color:'#b0b8b4'}}>Why this exists</a>
            <a href="/methodology" className="text-[10px] hover:underline" style={{color:'#b0b8b4'}}>How we score</a>
          </div>
        </div>
      </div>
    </div>
  );
}
