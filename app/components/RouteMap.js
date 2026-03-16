'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function numberedIcon(n) {
  return L.divIcon({
    className: '',
    html: '<div style="width:28px;height:28px;background:#1a3328;color:#fff;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.35)">' + n + '</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function AutoFit({ stops }) {
  const map = useMap();
  const prevKey = useRef('');
  useEffect(() => {
    const coords = stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng]);
    const key = coords.map(c => c.join()).join('|');
    if (!coords.length || key === prevKey.current) return;
    prevKey.current = key;
    if (coords.length === 1) { map.setView(coords[0], 14); return; }
    map.fitBounds(coords, { padding: [40, 40] });
  }, [stops, map]);
  return null;
}

export default function RouteMap({ stops }) {
  const validStops = stops.filter(s => s.lat && s.lng);
  const line = validStops.map(s => [Number(s.lat), Number(s.lng)]);

  return (
    <MapContainer
      center={[41.76, -72.69]}
      zoom={10}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <AutoFit stops={validStops} />
      {line.length > 1 && (
        <Polyline positions={line} color="#1a3328" weight={3} dashArray="6 4" opacity={0.7} />
      )}
      {stops.map((stop, i) => {
        if (!stop.lat || !stop.lng) return null;
        return (
          <Marker key={stop.id} position={[Number(stop.lat), Number(stop.lng)]} icon={numberedIcon(i + 1)}>
            <Popup>
              <strong>{stop.name}</strong>
              {stop.address && <div style={{ fontSize: 13 }}>{stop.address}</div>}
              {stop.issues && stop.issues.length > 0 && (
                <div style={{ fontSize: 12, color: '#6b7280' }}>{stop.issues.join(', ')}</div>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
