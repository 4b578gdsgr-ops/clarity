'use client';

import { useState } from 'react';

const BIKE_TYPES = [
  { id: 'mountain', icon: '⛰️', label: 'Mountain' },
  { id: 'road', icon: '🚴', label: 'Road' },
  { id: 'gravel', icon: '🪨', label: 'Gravel / Adventure' },
  { id: 'touring', icon: '🗺️', label: 'Bikepacking / Touring' },
  { id: 'commuter', icon: '🏙️', label: 'Commuter / City' },
  { id: 'ebike', icon: '⚡', label: 'E-bike' },
  { id: 'kids', icon: '🧒', label: 'Kids' },
  { id: 'unsure', icon: '🤔', label: 'Not sure' },
];

const MTB_SUBTYPES = [
  { id: 'trail', label: 'Trail' },
  { id: 'enduro', label: 'Enduro' },
  { id: 'xc', label: 'XC / Cross-country' },
  { id: 'downhill', label: 'Downhill' },
];

const EBIKE_SUBTYPES = [
  { id: 'commuter', label: 'Commuter / City' },
  { id: 'mountain', label: 'Mountain (eMTB)' },
  { id: 'road', label: 'Road / Fitness' },
  { id: 'cargo', label: 'Cargo' },
];

const HEIGHT_RANGES = ["<5'2\"", "5'2\"–5'4\"", "5'4\"–5'6\"", "5'6\"–5'8\"", "5'8\"–6'0\"", "6'0\"–6'2\"", '6\'2"+'];
const EXPERIENCE_LEVELS = [
  { id: 'first', label: 'First bike (or first in a long time)' },
  { id: 'returning', label: 'Returning after years away' },
  { id: 'regular', label: 'Regular rider' },
  { id: 'experienced', label: 'Experienced / technical' },
  { id: 'racer', label: 'Racer' },
];
const PRIMARY_USES = [
  { id: 'weekend', label: 'Weekend fun' },
  { id: 'commuting', label: 'Commuting' },
  { id: 'training', label: 'Training' },
  { id: 'racing', label: 'Racing' },
  { id: 'touring', label: 'Touring / Travel' },
  { id: 'all', label: 'All of the above' },
];
const RADII = [
  { value: 10, label: '10 miles' },
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
  { value: 200, label: 'Any distance' },
];

function budgetLabel(val) {
  if (val < 1500) return { zone: 'value', text: 'Best value complete bikes from local shops', color: '#6b7280' };
  if (val < 3500) return { zone: 'sweet', text: 'Sweet spot — quality bikes that last', color: '#2d8653' };
  if (val < 6000) return { zone: 'high', text: 'High-end complete or custom territory', color: '#d97706' };
  return { zone: 'custom', text: 'Custom build territory — your dollar stays local longer', color: '#9333ea' };
}

const STEPS = ['Type', 'Budget', 'About You', 'Location', 'Details'];

export default function BikeWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [animating, setAnimating] = useState(false);

  const [bikeType, setBikeType] = useState(null);
  const [subtype, setSubtype] = useState(null);
  const [ebikeClass, setEbikeClass] = useState(null);
  const [budget, setBudget] = useState(2500);
  const [height, setHeight] = useState('');
  const [experience, setExperience] = useState('');
  const [primaryUse, setPrimaryUse] = useState('');
  const [zip, setZip] = useState('');
  const [radius, setRadius] = useState(25);
  // Conditional
  const [bikepackingNoCharge, setBikepackingNoCharge] = useState(null);
  const [roadGroupRides, setRoadGroupRides] = useState(null);
  const [commuteDistance, setCommuteDistance] = useState('');

  const budgetInfo = budgetLabel(budget);

  const goTo = (nextStep) => {
    if (animating) return;
    setDirection(nextStep > step ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 200);
  };

  const canNext = () => {
    if (step === 0) return !!bikeType;
    if (step === 1) return budget > 0;
    if (step === 2) return height && experience && primaryUse;
    if (step === 3) return zip.length === 5;
    return true;
  };

  const showConditionalStep = () => {
    return bikeType === 'touring' || bikeType === 'road' || bikeType === 'commuter';
  };

  const handleSubmit = () => {
    onComplete({
      bikeType,
      subtype,
      ebikeClass,
      budget,
      heightRange: height,
      experience,
      primaryUse,
      zip,
      radius,
      bikepackingNoCharge,
      roadGroupRides,
      commuteDistance: commuteDistance ? parseInt(commuteDistance) : null,
    });
  };

  const totalSteps = showConditionalStep() ? 5 : 4;

  return (
    <div className="wizard-container">
      {/* Step dots */}
      <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? 20 : 8,
              height: 8,
              background: i === step ? '#2d8653' : i < step ? '#a3d9b5' : '#e5e0d8',
            }} />
        ))}
      </div>

      {/* Step content */}
      <div style={{ overflow: 'hidden', minHeight: 320 }}>
        <div style={{
          transform: `translateX(${animating ? (direction > 0 ? '-30px' : '30px') : '0'})`,
          opacity: animating ? 0 : 1,
          transition: 'transform 0.2s ease, opacity 0.2s ease',
        }}>

          {/* Step 0: Bike type */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-center" style={{ color: '#2d3436' }}>
                What are you looking for?
              </h2>
              <p className="text-sm text-center mb-5" style={{ color: '#9ca3af' }}>No wrong answers.</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {BIKE_TYPES.map(t => (
                  <button key={t.id} onClick={() => { setBikeType(t.id); setSubtype(null); }}
                    className="flex flex-col items-center py-4 px-2 rounded-xl transition-all"
                    style={{
                      background: bikeType === t.id ? '#f0faf5' : '#ffffff',
                      border: bikeType === t.id ? '2px solid #2d8653' : '1px solid #e5e0d8',
                      cursor: 'pointer',
                    }}>
                    <span className="text-2xl mb-1">{t.icon}</span>
                    <span className="text-xs font-medium text-center" style={{ color: '#2d3436' }}>{t.label}</span>
                  </button>
                ))}
              </div>

              {bikeType === 'mountain' && (
                <div className="mt-4">
                  <p className="text-xs font-bold mb-2 text-center" style={{ color: '#636e72' }}>What kind of riding?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {MTB_SUBTYPES.map(s => (
                      <button key={s.id} onClick={() => setSubtype(s.id)}
                        className="px-4 py-2 rounded-full text-xs transition-all"
                        style={{
                          background: subtype === s.id ? '#2d8653' : '#ffffff',
                          color: subtype === s.id ? '#ffffff' : '#636e72',
                          border: subtype === s.id ? '1px solid #2d8653' : '1px solid #e5e0d8',
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bikeType === 'ebike' && (
                <div className="mt-4">
                  <p className="text-xs font-bold mb-2 text-center" style={{ color: '#636e72' }}>What kind of e-bike?</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {EBIKE_SUBTYPES.map(s => (
                      <button key={s.id} onClick={() => setSubtype(s.id)}
                        className="px-4 py-2 rounded-full text-xs transition-all"
                        style={{
                          background: subtype === s.id ? '#2d8653' : '#ffffff',
                          color: subtype === s.id ? '#ffffff' : '#636e72',
                          border: subtype === s.id ? '1px solid #2d8653' : '1px solid #e5e0d8',
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <p className="w-full text-xs text-center mb-1" style={{ color: '#9ca3af' }}>Speed class?</p>
                    {[{ id: 'class1', label: 'Class 1 (20mph pedal assist)' }, { id: 'class3', label: 'Class 3 (28mph)' }].map(c => (
                      <button key={c.id} onClick={() => setEbikeClass(c.id)}
                        className="px-4 py-2 rounded-full text-xs transition-all"
                        style={{
                          background: ebikeClass === c.id ? '#2d8653' : '#ffffff',
                          color: ebikeClass === c.id ? '#ffffff' : '#636e72',
                          border: ebikeClass === c.id ? '1px solid #2d8653' : '1px solid #e5e0d8',
                        }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Budget */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-center" style={{ color: '#2d3436' }}>What's your budget?</h2>
              <p className="text-sm text-center mb-6" style={{ color: '#9ca3af' }}>Be honest — there's a great bike at every price.</p>

              <div className="text-center mb-3">
                <span className="text-3xl font-extrabold font-mono" style={{ color: '#2d3436' }}>
                  {budget >= 15000 ? '$15,000+' : `$${budget.toLocaleString()}`}
                </span>
              </div>

              <div className="relative mb-2">
                <div className="absolute top-1/2 left-0 right-0 h-2 rounded-full pointer-events-none" style={{
                  background: 'linear-gradient(to right, #9ca3af 0%, #2d8653 30%, #d97706 65%, #9333ea 85%)',
                  transform: 'translateY(-50%)',
                  opacity: 0.3,
                }} />
                <input type="range" min={500} max={15000} step={100} value={budget}
                  onChange={e => setBudget(parseInt(e.target.value))}
                  className="w-full relative"
                  style={{ accentColor: budgetInfo.color, cursor: 'pointer' }} />
              </div>

              <div className="flex justify-between text-xs mb-5" style={{ color: '#9ca3af' }}>
                <span>$500</span>
                <span>$15,000+</span>
              </div>

              <div className="p-3 rounded-lg text-sm text-center" style={{
                background: '#f6fbf8',
                border: `1px solid ${budgetInfo.color}33`,
                color: budgetInfo.color,
              }}>
                {budgetInfo.text}
              </div>
            </div>
          )}

          {/* Step 2: About you */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-center" style={{ color: '#2d3436' }}>A little about you</h2>
              <p className="text-sm text-center mb-5" style={{ color: '#9ca3af' }}>Helps us get the fit and feel right.</p>

              <div className="mb-4">
                <label className="block text-xs font-bold mb-2" style={{ color: '#636e72' }}>Height</label>
                <select value={height} onChange={e => setHeight(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: '#ffffff', border: '1px solid #e5e0d8', color: height ? '#2d3436' : '#9ca3af' }}>
                  <option value="">Select height...</option>
                  {HEIGHT_RANGES.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold mb-2" style={{ color: '#636e72' }}>Riding experience</label>
                <div className="flex flex-col gap-2">
                  {EXPERIENCE_LEVELS.map(e => (
                    <button key={e.id} onClick={() => setExperience(e.id)}
                      className="text-left px-4 py-2.5 rounded-lg text-sm transition-all"
                      style={{
                        background: experience === e.id ? '#f0faf5' : '#ffffff',
                        border: experience === e.id ? '1px solid #2d8653' : '1px solid #e5e0d8',
                        color: '#2d3436',
                      }}>
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-bold mb-2" style={{ color: '#636e72' }}>Primary use</label>
                <div className="flex flex-wrap gap-2">
                  {PRIMARY_USES.map(u => (
                    <button key={u.id} onClick={() => setPrimaryUse(u.id)}
                      className="px-4 py-2 rounded-full text-xs transition-all"
                      style={{
                        background: primaryUse === u.id ? '#2d8653' : '#ffffff',
                        color: primaryUse === u.id ? '#ffffff' : '#636e72',
                        border: primaryUse === u.id ? '1px solid #2d8653' : '1px solid #e5e0d8',
                      }}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-center" style={{ color: '#2d3436' }}>Where are you?</h2>
              <p className="text-sm text-center mb-6" style={{ color: '#9ca3af' }}>We'll find shops near you that can help.</p>

              <div className="mb-4">
                <label className="block text-xs font-bold mb-2" style={{ color: '#636e72' }}>ZIP code</label>
                <input type="text" value={zip} onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="06001"
                  className="w-full px-4 py-3 rounded-lg text-lg font-mono text-center outline-none"
                  style={{ background: '#ffffff', border: '1px solid #e5e0d8', color: '#2d3436', letterSpacing: '0.2em' }} />
              </div>

              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: '#636e72' }}>How far will you travel to a shop?</label>
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
            </div>
          )}

          {/* Step 4: Conditional follow-up */}
          {step === 4 && showConditionalStep() && (
            <div>
              <h2 className="text-lg font-bold mb-1 text-center" style={{ color: '#2d3436' }}>One more thing</h2>
              <p className="text-sm text-center mb-6" style={{ color: '#9ca3af' }}>This helps us get the details right.</p>

              {bikeType === 'touring' && (
                <div className="mb-5">
                  <p className="text-sm font-medium mb-3" style={{ color: '#2d3436' }}>
                    Will you be riding in places where you can't charge a battery (remote routes, international travel)?
                  </p>
                  <div className="flex gap-3">
                    {[{ val: true, label: 'Yes — going remote' }, { val: false, label: 'No, I\'ll have access' }].map(o => (
                      <button key={String(o.val)} onClick={() => setBikepackingNoCharge(o.val)}
                        className="flex-1 py-3 rounded-lg text-sm transition-all"
                        style={{
                          background: bikepackingNoCharge === o.val ? '#f0faf5' : '#ffffff',
                          border: bikepackingNoCharge === o.val ? '1px solid #2d8653' : '1px solid #e5e0d8',
                          color: '#2d3436',
                        }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bikeType === 'road' && (
                <div className="mb-5">
                  <p className="text-sm font-medium mb-3" style={{ color: '#2d3436' }}>
                    Mostly group rides and events, or solo training?
                  </p>
                  <div className="flex gap-3">
                    {[{ val: true, label: 'Group rides & events' }, { val: false, label: 'Solo training' }].map(o => (
                      <button key={String(o.val)} onClick={() => setRoadGroupRides(o.val)}
                        className="flex-1 py-3 rounded-lg text-sm transition-all"
                        style={{
                          background: roadGroupRides === o.val ? '#f0faf5' : '#ffffff',
                          border: roadGroupRides === o.val ? '1px solid #2d8653' : '1px solid #e5e0d8',
                          color: '#2d3436',
                        }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bikeType === 'commuter' && (
                <div className="mb-5">
                  <p className="text-sm font-medium mb-3" style={{ color: '#2d3436' }}>
                    How far is your commute each way (roughly)?
                  </p>
                  <div className="flex items-center gap-3">
                    <input type="number" value={commuteDistance} onChange={e => setCommuteDistance(e.target.value)}
                      placeholder="5"
                      className="w-24 px-3 py-2 rounded-lg text-center font-mono outline-none"
                      style={{ background: '#ffffff', border: '1px solid #e5e0d8', color: '#2d3436' }} />
                    <span className="text-sm" style={{ color: '#636e72' }}>miles each way</span>
                  </div>
                  {commuteDistance >= 10 && (
                    <p className="mt-2 text-xs" style={{ color: '#2d8653' }}>
                      At {commuteDistance} miles, an e-bike might make your commute genuinely enjoyable.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button onClick={() => goTo(step - 1)}
            className="px-5 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: '#ffffff', border: '1px solid #e5e0d8', color: '#636e72' }}>
            ← Back
          </button>
        )}
        {step < totalSteps - 1 ? (
          <button onClick={() => goTo(step + 1)} disabled={!canNext()}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: canNext() ? 'linear-gradient(135deg, #2d8653, #1a6e3f)' : '#d1ead9',
              cursor: canNext() ? 'pointer' : 'default',
            }}>
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={!canNext()}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: canNext() ? 'linear-gradient(135deg, #2d8653, #1a6e3f)' : '#d1ead9',
              cursor: canNext() ? 'pointer' : 'default',
            }}>
            Find my bike →
          </button>
        )}
      </div>
    </div>
  );
}
