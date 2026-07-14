// Best-effort carrier tracking URL builder for Box & Ship bookings.
// BikeFlights and "Other" have no reliable public tracking URL pattern —
// callers should fall back to showing the tracking number as plain text.
export function getCarrierTrackingUrl(carrier, trackingNumber) {
  if (!trackingNumber) return null;
  const num = encodeURIComponent(trackingNumber.trim());
  switch (carrier) {
    case 'UPS':   return `https://www.ups.com/track?tracknum=${num}`;
    case 'FedEx': return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
    default:      return null;
  }
}
