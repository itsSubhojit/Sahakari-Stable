/**
 * Utility formatters for Sahakari Indian local marketplace
 */

// Format price in Indian Rupee format (e.g. ₹1,500)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format distance (e.g. 1.2 km)
export const formatDistance = (km) => {
  if (!km && km !== 0) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

// Format dates (e.g. Oct 24, 2023 - 10:00 AM)
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Calculate booking payment summary breakdown
export const calculatePaymentSummary = (basePrice) => {
  const price = Number(basePrice) || 0;
  const platformFee = Math.round(price * 0.05); // 5% platform fee
  const taxes = Math.round(price * 0.012); // ~1.2% GST on service fee
  const total = price + platformFee + taxes;

  return {
    basePrice: price,
    platformFee,
    taxes,
    total,
  };
};
