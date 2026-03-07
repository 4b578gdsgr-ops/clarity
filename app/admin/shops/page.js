'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICES = [
  { id: 'repair', label: 'Repair' },
  { id: 'custom_builds', label: 'Custom Builds' },
  { id: 'wheel_building', label: 'Wheel Building' },
  { id: 'fitting', label: 'Bike Fitting' },
  { id: 'rental', label: 'Rentals' },
];

const SHOP_TYPES = ['indie', 'chain', 'co-op'];

const TYPE_COLORS = {
  indie: { bg: '#f0faf5', color: '#2d8653' },
  chain: { bg: '#f5f5f5', color: '#636e72' },
  'co-op': { bg: '#eff6ff', color: '#2563eb' },
};

const EMPTY = {
  name: '', address: '', city: '', state: '', zip: '',
  phone: '', website: '', email: '',
  brands_carried: '', services: [],
  shop_type: 'indie', active: true, verified: false,
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  input: {
    width: '100%', padding: '8px 10px', borderRadius: 6,
    border: '1px solid #e5e0d8', fontSize: 13, color: '#2d3436',
    background: '#faf9f6', outline: 'none', boxSizing: 'border-box',
  },
  label: {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#9ca3af', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  btn: (variant = 'primary') => ({
    padding: variant === 'sm' ? '5px 12px' : '10px 18px',
    borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600,
    fontSize: variant === 'sm' ? 12 : 13,
    background: variant === 'primary' ? 'linear-gradient(135deg,#2d8653,#1a6e3f)'
      : variant === 'danger' ? '#fee2e2'
      : variant === 'ghost' ? '#f5f5f5'
      : '#f5f5f5',
    color: variant === 'primary' ? '#fff'
      : variant === 'danger' ? '#dc2626'
      : '#636e72',
  }),
};

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: value ? '#2d8653' : '#d1d5db',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}>
      <span style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

// ─── Shop form (add / edit) ───────────────────────────────────────────────────

function ShopForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...initial,
    brands_carried: Array.isArray(initial?.brands_carried)
      ? initial.brands_carried.join(', ')
      : (initial?.brands_carried || ''),
    services: initial?.services || [],
  }));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSvc = (svc) => setForm(f => ({
    ...f,
    services: f.services.includes(svc) ? f.services.filter(s => s !== svc) : [...f.services, svc],
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Name */}
      <div>
        <label style={S.label}>Name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)}
          style={S.input} placeholder="Shop name" />
      </div>

      {/* Address */}
      <div>
        <label style={S.label}>Street address</label>
        <input value={form.address} onChange={e => set('address', e.target.value)}
          style={S.input} placeholder="123 Main St" />
      </div>

      {/* City / State / ZIP */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={S.label}>City</label>
          <input value={form.city} onChange={e => set('city', e.target.value)}
            style={S.input} placeholder="Hartford" />
        </div>
        <div>
          <label style={S.label}>State</label>
          <input value={form.state} onChange={e => set('state', e.target.value.toUpperCase().slice(0, 2))}
            style={S.input} placeholder="CT" maxLength={2} />
        </div>
        <div>
          <label style={S.label}>ZIP</label>
          <input value={form.zip} onChange={e => set('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
            style={S.input} placeholder="06001" />
        </div>
      </div>

      {/* Phone / Website */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={S.label}>Phone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)}
            style={S.input} placeholder="(860) 555-0100" />
        </div>
        <div>
          <label style={S.label}>Website</label>
          <input value={form.website} onChange={e => set('website', e.target.value)}
            style={S.input} placeholder="https://..." />
        </div>
      </div>

      {/* Brands */}
      <div>
        <label style={S.label}>Brands carried <span style={{ fontWeight: 400 }}>(comma-separated)</span></label>
        <input value={form.brands_carried} onChange={e => set('brands_carried', e.target.value)}
          style={S.input} placeholder="Trek, Specialized, Shimano" />
      </div>

      {/* Services */}
      <div>
        <label style={S.label}>Services</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
          {SERVICES.map(s => (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13, color: '#2d3436' }}>
              <input type="checkbox" checked={form.services.includes(s.id)} onChange={() => toggleSvc(s.id)} />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {/* Type + Active + Verified */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div>
          <label style={S.label}>Shop type</label>
          <select value={form.shop_type} onChange={e => set('shop_type', e.target.value)} style={S.input}>
            {SHOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#2d3436' }}>
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
            Active
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#2d3436' }}>
            <input type="checkbox" checked={form.verified} onChange={e => set('verified', e.target.checked)} />
            Verified
          </label>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <button
          onClick={() => onSave(form)}
          disabled={!form.name || saving}
          style={{
            ...S.btn('primary'), flex: 1,
            background: form.name ? 'linear-gradient(135deg,#2d8653,#1a6e3f)' : '#d1ead9',
            cursor: form.name && !saving ? 'pointer' : 'default',
          }}>
          {saving ? 'Saving…' : 'Save shop'}
        </button>
        <button onClick={onCancel} style={S.btn('ghost')}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '48px 16px', overflowY: 'auto',
    }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e5e0d8',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#2d3436' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirm({ shop, onConfirm, onCancel, deleting }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#2d3436', marginBottom: 6 }}>Delete "{shop.name}"?</div>
      <div style={{ fontSize: 13, color: '#636e72', marginBottom: 20 }}>This can't be undone.</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={onConfirm} disabled={deleting}
          style={{ ...S.btn('danger'), background: '#dc2626', color: '#fff', minWidth: 100 }}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
        <button onClick={onCancel} style={S.btn('ghost')}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state: null | { mode: 'add' } | { mode: 'edit', shop } | { mode: 'delete', shop }
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null); // shop id being toggled

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/shops');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load shops');
      setShops(data.shops);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Toggle active ──
  const handleToggle = async (shop) => {
    setToggling(shop.id);
    // Optimistic update
    setShops(prev => prev.map(s => s.id === shop.id ? { ...s, active: !s.active } : s));
    try {
      const res = await fetch(`/api/admin/shops/${shop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !shop.active }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, active: shop.active } : s));
    }
    setToggling(null);
  };

  // ── Save (add or edit) ──
  const handleSave = async (form) => {
    setSaving(true);
    const isEdit = modal?.mode === 'edit';
    try {
      const url = isEdit ? `/api/admin/shops/${modal.shop.id}` : '/api/admin/shops';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      if (isEdit) {
        setShops(prev => prev.map(s => s.id === modal.shop.id ? data.shop : s));
      } else {
        setShops(prev => [...prev, data.shop]);
      }
      setModal(null);
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  };

  // ── Delete ──
  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/shops/${modal.shop.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setShops(prev => prev.filter(s => s.id !== modal.shop.id));
      setModal(null);
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f6', padding: '32px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Admin
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2d3436', margin: 0 }}>Shop Database</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={load} style={S.btn('ghost')} title="Refresh">↻ Refresh</button>
            <button onClick={() => setModal({ mode: 'add' })}
              style={S.btn('primary')}>
              + Add Shop
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 }}>
            Loading shops…
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e0d8', overflow: 'hidden' }}>
            {shops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🚲</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#636e72' }}>No shops yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Click "Add Shop" to get started.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e0d8', background: '#faf9f6' }}>
                    {['Name', 'Location', 'Type', 'Services', 'Active', ''].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left', fontSize: 11,
                        fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shops.map((shop, i) => {
                    const tc = TYPE_COLORS[shop.shop_type] || TYPE_COLORS.indie;
                    return (
                      <tr key={shop.id}
                        style={{
                          borderBottom: i < shops.length - 1 ? '1px solid #f0ede8' : 'none',
                          background: shop.active ? '#fff' : '#fafafa',
                          opacity: shop.active ? 1 : 0.65,
                        }}>
                        {/* Name */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#2d3436' }}>{shop.name}</div>
                          {shop.phone && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{shop.phone}</div>}
                        </td>

                        {/* Location */}
                        <td style={{ padding: '12px 14px', color: '#636e72' }}>
                          {[shop.city, shop.state].filter(Boolean).join(', ')}
                          {shop.zip && <div style={{ fontSize: 11, color: '#9ca3af' }}>{shop.zip}</div>}
                        </td>

                        {/* Type */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                            background: tc.bg, color: tc.color,
                          }}>
                            {shop.shop_type}
                          </span>
                        </td>

                        {/* Services */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {(shop.services || []).map(s => (
                              <span key={s} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: '#f5f5f5', color: '#636e72' }}>
                                {s.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Active toggle */}
                        <td style={{ padding: '12px 14px' }}>
                          <Toggle
                            value={shop.active}
                            onChange={() => handleToggle(shop)}
                            disabled={toggling === shop.id}
                          />
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setModal({ mode: 'edit', shop })}
                              style={S.btn('sm')} title="Edit">
                              Edit
                            </button>
                            <button
                              onClick={() => setModal({ mode: 'delete', shop })}
                              style={{ ...S.btn('sm'), color: '#dc2626', background: '#fee2e2' }}
                              title="Delete">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Count */}
        {!loading && shops.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#b0b8b4', textAlign: 'right' }}>
            {shops.filter(s => s.active).length} active · {shops.length} total
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.mode === 'add' && (
        <Modal title="Add Shop" onClose={() => setModal(null)}>
          <ShopForm initial={EMPTY} onSave={handleSave} onCancel={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {modal?.mode === 'edit' && (
        <Modal title={`Edit — ${modal.shop.name}`} onClose={() => setModal(null)}>
          <ShopForm initial={modal.shop} onSave={handleSave} onCancel={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {modal?.mode === 'delete' && (
        <Modal title="Confirm delete" onClose={() => setModal(null)}>
          <DeleteConfirm shop={modal.shop} onConfirm={handleDelete} onCancel={() => setModal(null)} deleting={saving} />
        </Modal>
      )}
    </div>
  );
}
