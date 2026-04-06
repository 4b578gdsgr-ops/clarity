'use client';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CENTER      = [41.7658, -72.6734];
const RADIUS_M    = 48280;

const greenDot = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#16a34a;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function FlyTo({ pin }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!pin) return;
    if (prev.current && prev.current.lat === pin.lat && prev.current.lng === pin.lng) return;
    map.flyTo([pin.lat, pin.lng], 14, { duration: 0.8 });
    prev.current = pin;
  }, [pin, map]);
  return null;
}

export default function ServiceMap({ pin, onMapClick, showBoundary = false }) {
  return (
    <>
      <style>{`.leaflet-tooltip { display: none !important; }`}</style>
      <MapContainer
        center={[41.88, -72.65]}
        zoom={10}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {showBoundary && (
          <Circle
            center={CENTER}
            radius={RADIUS_M}
            pathOptions={{ color: '#276749', fillColor: '#276749', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
          />
        )}
        <ClickHandler onMapClick={onMapClick} />
        {pin && <FlyTo pin={pin} />}
        {pin && <Marker position={[pin.lat, pin.lng]} icon={greenDot} />}
      </MapContainer>
    </>
  );
}
