'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const MAP_CONTAINER_STYLE = { width: '100%', height: '280px', borderRadius: '12px' };

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#f5f0ea' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#636e72' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8d5' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5e0d8' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d1ead9' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e8f5ee' }] },
  ],
};

export default function ShopMap({ shops, center, onSelectShop, selectedShop }) {
  const [activePin, setActivePin] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const onMapClick = useCallback(() => setActivePin(null), []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center rounded-xl text-sm"
        style={{ height: 280, background: '#f6fbf8', border: '1px solid #d1ead9', color: '#636e72' }}>
        Map unavailable
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center rounded-xl"
        style={{ height: 280, background: '#f6fbf8', border: '1px solid #d1ead9' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid #e5e0d8', borderTopColor: '#2d8653' }} />
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl text-sm gap-2"
        style={{ height: 280, background: '#f6fbf8', border: '1px dashed #d1ead9', color: '#636e72' }}>
        <span className="text-2xl">🗺️</span>
        <span>Map requires Google Maps API key</span>
        <span className="text-xs">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment</span>
      </div>
    );
  }

  const mapCenter = center || { lat: 41.6032, lng: -73.0877 }; // CT center

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={mapCenter}
      zoom={center ? 10 : 8}
      options={MAP_OPTIONS}
      onClick={onMapClick}>
      {shops.map(shop => (
        <Marker
          key={shop.id}
          position={{ lat: shop.lat, lng: shop.lng }}
          title={shop.name}
          icon={{
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: shop === selectedShop ? '#fbbf24' : '#2d8653',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 1.5,
          }}
          onClick={() => {
            setActivePin(shop);
            onSelectShop && onSelectShop(shop);
          }}
        />
      ))}

      {activePin && (
        <InfoWindow
          position={{ lat: activePin.lat, lng: activePin.lng }}
          onCloseClick={() => setActivePin(null)}>
          <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 140 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#2d3436', marginBottom: 2 }}>{activePin.name}</div>
            {activePin.distance != null && (
              <div style={{ fontSize: 11, color: '#2d8653', fontWeight: 600, marginBottom: 3 }}>{activePin.distance} miles away</div>
            )}
            <div style={{ fontSize: 11, color: '#636e72' }}>{activePin.city}, {activePin.state}</div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
