'use client';

import { useState, useEffect, useRef } from 'react';
import CompanyResult from './components/CompanyResult';

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
