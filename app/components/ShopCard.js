'use client';

const SHOP_TYPE_LABELS = {
  indie: { label: 'Independent', color: '#2d8653', bg: '#f0faf5' },
  chain: { label: 'Chain', color: '#636e72', bg: '#f5f5f5' },
  'co-op': { label: 'Co-op', color: '#2563eb', bg: '#eff6ff' },
};

const SERVICE_LABELS = {
  repair: 'Repair',
  custom_builds: 'Custom Builds',
  wheel_building: 'Wheel Building',
  fitting: 'Bike Fitting',
  rental: 'Rentals',
};

export default function ShopCard({ shop, onSelect, selected }) {
  const typeInfo = SHOP_TYPE_LABELS[shop.shop_type] || SHOP_TYPE_LABELS.indie;
  const canCustomBuild = shop.services?.includes('custom_builds') && shop.services?.includes('wheel_building');

  return (
    <div
      className="p-4 rounded-xl transition-all cursor-pointer"
      onClick={() => onSelect && onSelect(shop)}
      style={{
        background: '#ffffff',
        border: selected ? '2px solid #2d8653' : '1px solid #e5e0d8',
        boxShadow: selected ? '0 2px 16px rgba(45,134,83,0.12)' : '0 1px 6px rgba(0,0,0,0.04)',
      }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-base font-bold" style={{ color: '#2d3436' }}>{shop.name}</div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: typeInfo.bg, color: typeInfo.color }}>
            {typeInfo.label}
          </span>
        </div>
        {shop.distance != null && (
          <div className="text-right shrink-0 ml-2">
            <div className="text-xs font-bold font-mono" style={{ color: '#2d8653' }}>{shop.distance} mi</div>
          </div>
        )}
      </div>

      {canCustomBuild && (
        <div className="mb-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: '#fef9ec', border: '1px solid #fbbf2440', color: '#d97706' }}>
          This shop can build your custom bike
        </div>
      )}

      <div className="text-xs mb-1" style={{ color: '#636e72' }}>
        {shop.address}, {shop.city}, {shop.state} {shop.zip}
      </div>

      {shop.phone && (
        <a href={`tel:${shop.phone}`} className="text-xs block mb-1" style={{ color: '#2d8653' }}>
          {shop.phone}
        </a>
      )}

      {shop.website && (
        <a href={shop.website} target="_blank" rel="noopener noreferrer"
          className="text-xs block mb-2" style={{ color: '#2d8653' }}
          onClick={e => e.stopPropagation()}>
          {shop.website.replace(/^https?:\/\//, '')} ↗
        </a>
      )}

      {shop.brands_carried?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {shop.brands_carried.slice(0, 5).map(b => (
            <span key={b} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#f6fbf8', color: '#4a9e6b', border: '1px solid #d1ead9' }}>
              {b}
            </span>
          ))}
        </div>
      )}

      {shop.services?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {shop.services.map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#f5f5f5', color: '#636e72' }}>
              {SERVICE_LABELS[s] || s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
