'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon paths broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored pin using divIcon
function makePin(color) {
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z"
        fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4" fill="#fff" opacity="0.9"/>
    </svg>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

const PIN_DEFAULT = makePin('#2d8653');
const PIN_SELECTED = makePin('#fbbf24');

// Recenter map when center prop changes
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], 10, { animate: true });
  }, [center, map]);
  return null;
}

export default function ShopMap({ shops, center, onSelectShop, selectedShop }) {
  const defaultCenter = center || { lat: 41.6032, lng: -73.0877 }; // CT center

  return (
    <>
      <style>{`
        .leaflet-container { border-radius: 12px; font-family: Inter, sans-serif; }
        .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          border: 1px solid #e5e0d8;
          padding: 0;
        }
        .leaflet-popup-content { margin: 0; }
        .leaflet-popup-tip { background: #fff; }
        .leaflet-control-zoom a { color: #2d8653 !important; }
        .leaflet-control-zoom a:hover { background: #f0faf5 !important; }
      `}</style>
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={center ? 10 : 8}
        style={{ width: '100%', height: 280, borderRadius: 12 }}
        zoomControl={true}
        attributionControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapController center={center} />
        {shops.map(shop => (
          <Marker
            key={shop.id}
            position={[shop.lat, shop.lng]}
            icon={selectedShop?.id === shop.id ? PIN_SELECTED : PIN_DEFAULT}
            eventHandlers={{
              click: () => onSelectShop && onSelectShop(shop),
            }}>
            <Popup>
              <div style={{ padding: '10px 12px', minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#2d3436', marginBottom: 2 }}>{shop.name}</div>
                {shop.distance != null && (
                  <div style={{ fontSize: 11, color: '#2d8653', fontWeight: 600, marginBottom: 3 }}>{shop.distance} miles away</div>
                )}
                <div style={{ fontSize: 11, color: '#636e72' }}>{shop.city}, {shop.state}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
