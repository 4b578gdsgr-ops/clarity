'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ShopCard from '../components/ShopCard';

const ShopMap = dynamic(() => import('../components/ShopMap'), { ssr: false });

const RADII = [
  { value: 10, label: '10 mi' },
  { value: 25, label: '25 mi' },
  { value: 50, label: '50 mi' },
  { value: 200, label: 'Any' },
];

export default function FindAShopPage() {
  const [zip, setZip] = useState('');
  const [radius, setRadius] = useState(25);
  const [shops, setShops] = useState([]);
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Submit shop form
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitForm, setSubmitForm] = useState({ shop_name: '', city: '', state: 'CT', zip: '', submitted_by_email: '' });
  const [submitSent, setSubmitSent] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const resultsRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const searchShops = async () => {
    if (zip.length !== 5) return;
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/shops?zip=${zip}&radius=${radius}`);
      const data = await res.json();
      setShops(data.shops || []);
      setCenter(data.center || null);
      setSearched(true);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setShops([]);
      setSearched(true);
    }
    setLoading(false);
  };

  const handleSubmitShop = async () => {
    if (!submitForm.shop_name) return;
    setSubmitLoading(true);
    try {
      await fetch('/api/shop-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitForm),
      });
      setSubmitSent(true);
    } catch { }
    setSubmitLoading(false);
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, #e8f5ee, #faf9f6 70%)' }} />
      <div className="fixed inset-0 nature-bg pointer-events-none" />

      <div className="relative z-10 px-4 py-8 max-w-2xl mx-auto">
        <div className={`text-center mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#2d3436', fontFamily: 'Playfair Display, serif' }}>
            Find a Local Bike Shop
          </h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Buying local keeps money in your community. These shops can help.
          </p>
        </div>

        {/* Search bar */}
        <div className={`mb-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="flex rounded-xl overflow-hidden mb-3"
            style={{ background: '#ffffff', border: '1px solid #e5e0d8', boxShadow: '0 2px 20px rgba(45,134,83,0.08)' }}>
            <input type="text" value={zip}
              onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onKeyDown={e => e.key === 'Enter' && searchShops()}
              placeholder="Enter ZIP code"
              className="flex-1 px-4 py-3.5 bg-transparent border-none outline-none text-[15px] font-mono tracking-widest"
              style={{ color: '#2d3436' }} />
            <button onClick={searchShops} disabled={zip.length !== 5 || loading}
              className="px-6 text-white font-bold text-sm tracking-wider"
              style={{
                background: zip.length === 5 ? 'linear-gradient(135deg, #2d8653, #1a6e3f)' : '#a3d9b5',
                cursor: zip.length === 5 ? 'pointer' : 'default',
              }}>
              {loading ? '...' : 'Search'}
            </button>
          </div>
          <div className="flex gap-2">
            {RADII.map(r => (
              <button key={r.value} onClick={() => setRadius(r.value)}
                className="flex-1 py-2 rounded-lg text-xs transition-all"
                style={{
                  background: radius === r.value ? '#2d8653' : '#ffffff',
                  color: radius === r.value ? '#ffffff' : '#636e72',
                  border: radius === r.value ? '1px solid #2d8653' : '1px solid #e5e0d8',
                }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {(searched || loading) && (
          <div ref={resultsRef}>
            {loading && (
              <div className="text-center py-12">
                <div className="w-8 h-8 rounded-full animate-spin mx-auto" style={{ border: '2px solid #e5e0d8', borderTopColor: '#2d8653' }} />
                <div className="mt-3 text-xs" style={{ color: '#9ca3af' }}>Finding shops near you...</div>
              </div>
            )}

            {searched && !loading && (
              <>
                {shops.length > 0 ? (
                  <>
                    <div className="text-xs mb-3" style={{ color: '#9ca3af' }}>
                      {shops.length} shop{shops.length !== 1 ? 's' : ''} found within {radius === 200 ? 'any distance' : `${radius} miles`}
                    </div>
                    <div className="mb-4">
                      <ShopMap
                        shops={shops}
                        center={center}
                        onSelectShop={setSelectedShop}
                        selectedShop={selectedShop}
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      {shops.map(shop => (
                        <ShopCard key={shop.id} shop={shop}
                          selected={selectedShop?.id === shop.id}
                          onSelect={setSelectedShop} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-sm" style={{ color: '#636e72' }}>No shops found within {radius} miles of {zip}.</p>
                    <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Try a larger radius, or submit your local shop below.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Submit a shop */}
        <div className="mt-8">
          <button onClick={() => setShowSubmit(!showSubmit)}
            className="w-full text-center py-3 rounded-xl text-sm transition-all"
            style={{ background: '#ffffff', border: '1px dashed #d1ead9', color: '#4a9e6b' }}>
            {showSubmit ? '▲ Close' : '+ Submit a local shop'}
          </button>

          {showSubmit && !submitSent && (
            <div className="mt-3 p-4 rounded-xl" style={{ background: '#ffffff', border: '1px solid #e5e0d8' }}>
              <div className="text-xs font-bold mb-3" style={{ color: '#2d8653' }}>Add a shop to the map</div>
              <div className="flex flex-col gap-2">
                <input placeholder="Shop name *" value={submitForm.shop_name}
                  onChange={e => setSubmitForm(f => ({ ...f, shop_name: e.target.value }))}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
                <div className="flex gap-2">
                  <input placeholder="City" value={submitForm.city}
                    onChange={e => setSubmitForm(f => ({ ...f, city: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
                  <input placeholder="State" value={submitForm.state}
                    onChange={e => setSubmitForm(f => ({ ...f, state: e.target.value }))}
                    className="w-16 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
                  <input placeholder="ZIP" value={submitForm.zip}
                    onChange={e => setSubmitForm(f => ({ ...f, zip: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
                    className="w-20 px-3 py-2 rounded-lg text-sm outline-none font-mono"
                    style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
                </div>
                <input placeholder="Your email (optional)" value={submitForm.submitted_by_email}
                  onChange={e => setSubmitForm(f => ({ ...f, submitted_by_email: e.target.value }))}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: '#faf9f6', border: '1px solid #e5e0d8', color: '#2d3436' }} />
                <button onClick={handleSubmitShop} disabled={!submitForm.shop_name || submitLoading}
                  className="py-2.5 rounded-lg text-sm font-bold text-white"
                  style={{ background: submitForm.shop_name ? 'linear-gradient(135deg, #2d8653, #1a6e3f)' : '#d1ead9' }}>
                  {submitLoading ? 'Submitting...' : 'Submit shop'}
                </button>
              </div>
            </div>
          )}

          {submitSent && (
            <div className="mt-3 p-4 rounded-xl text-center" style={{ background: '#f6fbf8', border: '1px solid #d1ead9' }}>
              <div className="text-sm font-bold mb-1" style={{ color: '#2d8653' }}>♥ Thanks!</div>
              <div className="text-xs" style={{ color: '#636e72' }}>We'll review and add it to the map.</div>
            </div>
          )}
        </div>

        <div className="text-center pt-10 pb-4">
          <div className="text-[10px]" style={{ color: '#c4bdb5' }}>Love Over Money · A One Love Outdoors 501(c)(3) project</div>
        </div>
      </div>
    </div>
  );
}
