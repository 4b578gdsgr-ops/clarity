'use client';
import { useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'booking-photos';
const MAX_FILES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIM = 1400;
const QUALITY = 0.78;

async function compressImage(file) {
  // HEIC can't be reliably decoded by Canvas — skip, just pass through
  if (file.type === 'image/heic' || file.name?.toLowerCase().endsWith('.heic')) return file;
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      // Already small enough — skip canvas round-trip
      if (ratio === 1 && file.size < 400_000) { resolve(file); return; }
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', QUALITY);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadFile(file) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  const client = createClient(url, key);
  const ext = (file.type === 'image/png') ? 'png' : 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}/${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// photos: [{ id, preview, url, uploading, error }]
// onChange: (updater) => void  — always use functional form
export default function PhotoUpload({ photos, onChange, useVars = false }) {
  const inputRef = useRef(null);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const toProcess = files.slice(0, MAX_FILES - photos.length);
    const oversized = toProcess.find(f => f.size > MAX_BYTES);
    if (oversized) {
      alert(`${oversized.name} is over 5 MB. Please choose a smaller file.`);
      return;
    }

    const entries = toProcess.map(file => ({
      id: Math.random().toString(36).slice(2),
      preview: URL.createObjectURL(file),
      url: null,
      uploading: true,
      error: null,
      _file: file,
    }));

    onChange(prev => [...prev, ...entries]);

    for (const entry of entries) {
      try {
        const compressed = await compressImage(entry._file);
        const publicUrl = await uploadFile(compressed);
        onChange(prev => prev.map(p => p.id === entry.id ? { ...p, url: publicUrl, uploading: false } : p));
      } catch (err) {
        onChange(prev => prev.map(p => p.id === entry.id ? { ...p, uploading: false, error: err?.message || 'Upload failed' } : p));
      }
    }
  }

  function remove(id) {
    onChange(prev => {
      const entry = prev.find(p => p.id === id);
      if (entry?.preview) URL.revokeObjectURL(entry.preview);
      return prev.filter(p => p.id !== id);
    });
  }

  const canAdd = photos.length < MAX_FILES;

  const lblStyle = useVars
    ? { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ol-text-muted)', marginBottom: 4, letterSpacing: '0.01em' }
    : { display: 'block', fontSize: 14, color: '#374151', fontWeight: 500, marginBottom: 4 };

  const hintStyle = useVars
    ? { fontSize: 12, color: 'var(--ol-text-hint)', margin: '0 0 10px' }
    : { fontSize: 13, color: '#6b7280', margin: '0 0 10px' };

  const btnStyle = {
    padding: '8px 14px',
    background: useVars ? 'var(--ol-bg-input)' : '#f9fafb',
    border: useVars ? '1px solid var(--ol-border)' : '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    color: useVars ? 'var(--ol-text-muted)' : '#374151',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  };

  return (
    <div>
      <label style={lblStyle}>Photos (optional)</label>
      <p style={hintStyle}>Snap a photo of the issue — helps us quote accurately.</p>

      {photos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              <img
                src={p.preview}
                alt="upload preview"
                style={{
                  width: 72, height: 72, objectFit: 'cover', borderRadius: 8,
                  border: p.error ? '2px solid #dc2626' : '1px solid #d1d5db',
                  opacity: p.uploading ? 0.55 : 1,
                  display: 'block',
                }}
              />
              {p.uploading && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', borderRadius: 8, fontSize: 11, color: '#fff', fontWeight: 600,
                }}>
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}
              {p.error && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#dc2626', color: '#fff', fontSize: 9, textAlign: 'center', borderRadius: '0 0 7px 7px', padding: '2px 4px' }}>
                  Failed
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(p.id)}
                style={{
                  position: 'absolute', top: -7, right: -7,
                  width: 20, height: 20,
                  background: '#dc2626', color: '#fff',
                  border: '2px solid #fff', borderRadius: '50%',
                  fontSize: 13, lineHeight: 1, cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,.jpg,.jpeg,.png,.heic"
            multiple
            onChange={handleFiles}
            style={{ display: 'none' }}
          />
          <button type="button" onClick={() => inputRef.current?.click()} style={btnStyle}>
            <span>📷</span>
            {photos.length === 0 ? 'Add photos' : 'Add another'}
            <span style={{ fontSize: 11, color: useVars ? 'var(--ol-text-hint)' : '#9ca3af' }}>
              {MAX_FILES - photos.length} remaining
            </span>
          </button>
        </>
      )}

      {/* Spinner keyframe — injected once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
