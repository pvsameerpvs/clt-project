/**
 * Shared utility for parsing and formatting product metadata (Bundle Offers)
 * stored within product names.
 */

export interface ParsedProductInfo {
  cleanName: string;
  bundleTitle: string | null;
  originalPrice: number | null;
  isOffer: boolean;
}

/**
 * Extracts bundle information from a product name string.
 * Expected formats:
 * - "Product Name (Offer:Bundle Title:AED 259.00)"
 * - "Product Name (Offer:AED 259.00)"
 * - "Product Name (Offer)"
 */
export function parseProductMetadata(rawName: string): ParsedProductInfo {
  if (!rawName) {
    return { cleanName: "", bundleTitle: null, originalPrice: null, isOffer: false };
  }

  const isOffer = rawName.includes('(Offer');
  
  // 1. Extract Bundle Title
  // Regex matches (Offer:TITLE:AED ...) or (Offer:TITLE)
  const titleMatch = rawName.match(/\(Offer:(.*?)(?::AED|(?:\s*\d)|$)/);
  let bundleTitle = titleMatch ? titleMatch[1].trim() : null;
  
  // If no specific title but has (Offer), default to "OFFER"
  if (!bundleTitle && isOffer) {
    bundleTitle = "OFFER";
  }

  // 2. Extract Original Price
  // Regex matches AED followed by digits/dots inside the offer tag
  const priceMatch = rawName.match(/AED\s*([\d.]+)\)/);
  const originalPrice = priceMatch ? parseFloat(priceMatch[1]) : null;

  // 3. Get Clean Name (Remove all metadata tags)
  const cleanName = rawName
    .replace(/\(Offer:.*?\)/g, '')
    .replace(/\(Offer\)/g, '')
    .trim();

  return {
    cleanName,
    bundleTitle: bundleTitle === "OFFER" && originalPrice ? "BUNDLE OFFER" : bundleTitle,
    originalPrice,
    isOffer
  };
}

/**
 * Formats a currency value for display.
 */
export function formatAED(amount: number | string | null | undefined): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
}
