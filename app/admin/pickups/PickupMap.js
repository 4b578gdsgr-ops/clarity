'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ZONES } from '../../../lib/zones';

// Fix Leaflet default icon webpack issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makePin(number, color) {
  return L.divIcon({
    className: '',
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
    html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="8" fill="white" fill-opacity="0.9"/>
      <text x="14" y="18.5" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="10" fill="${color}">${number}</text>
    </svg>`,
  });
}

function BoundsController({ bookings }) {
  const map = useMap();
  useEffect(() => {
    const pts = bookings.filter(b => b.lat && b.lng).map(b => [b.lat, b.lng]);
    if (pts.length > 0) map.fitBounds(pts, { padding: [40, 40] });
  }, [bookings, map]);
  return null;
}

export default function PickupMap({ bookings }) {
  const withCoords = bookings.filter(b => b.lat && b.lng);

  const routeCoords = withCoords.map(b => [b.lat, b.lng]);

  return (
    <>
      <style>{`
        .leaflet-popup-content-wrapper { border-radius: 10px; border: 1px solid #e5e0d8; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
        .leaflet-popup-tip { background: #fff; }
      `}</style>
      <MapContainer
        center={[41.6032, -72.6851]}
        zoom={10}
        style={{ height: '380px', width: '100%', borderRadius: '12px' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {withCoords.length > 0 && <BoundsController bookings={withCoords} />}

        {/* Route line */}
        {routeCoords.length > 1 && (
          <Polyline positions={routeCoords} color="#2d8653" weight={2} dashArray="6 4" opacity={0.7} />
        )}

        {withCoords.map((b, i) => {
          const zone = b.zone ? ZONES[b.zone] : null;
          const color = zone?.color || '#636e72';
          return (
            <Marker key={b.id} position={[b.lat, b.lng]} icon={makePin(i + 1, color)}>
              <Popup>
                <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: 180 }}>
                  <div style={{ fontWeight: 700, color: '#2d3436', marginBottom: 4 }}>
                    {i + 1}. {b.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#636e72', marginBottom: 2 }}>{b.address}</div>
                  <div style={{ fontSize: 12, color: '#636e72', marginBottom: 2 }}>{b.city}, {b.state} {b.zip}</div>
                  {b.phone && <div style={{ fontSize: 12, color: '#2d8653' }}>{b.phone}</div>}
                  {b.bike_brand && (
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      {b.bike_brand} {b.bike_model}
                    </div>
                  )}
                  <div style={{ fontSize: 11, marginTop: 4 }}>
                    <span style={{
                      background: b.status === 'booked' ? '#dcfce7' : '#f3f4f6',
                      color: b.status === 'booked' ? '#16a34a' : '#6b7280',
                      padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                    }}>
                      {b.status}
                    </span>
                    {b.is_member && (
                      <span style={{ marginLeft: 4, background: '#f0eeff', color: '#9333ea', padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
                        member
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}
