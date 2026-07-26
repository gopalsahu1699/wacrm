export interface RegionPricing {
  currency: string;
  symbol: string;
  marketing: number;
  utility: number;
  authentication: number;
}

export type PricingRegion = 'us' | 'india' | 'brazil' | 'uk' | 'germany' | 'france' | 'default';

export const REGION_PRICING: Record<PricingRegion, RegionPricing> = {
  us: {
    currency: 'USD',
    symbol: '$',
    marketing: 0.025,
    utility: 0.004,
    authentication: 0.004,
  },
  india: {
    currency: 'INR',
    symbol: '₹',
    marketing: 0.8631,
    utility: 0.115,
    authentication: 0.115,
  },
  brazil: {
    currency: 'USD',
    symbol: '$',
    marketing: 0.0625,
    utility: 0.0068,
    authentication: 0.0068,
  },
  uk: {
    currency: 'GBP',
    symbol: '£',
    marketing: 0.0382,
    utility: 0.0159,
    authentication: 0.0159,
  },
  germany: {
    currency: 'EUR',
    symbol: '€',
    marketing: 0.1131,
    utility: 0.0216,
    authentication: 0.0216,
  },
  france: {
    currency: 'EUR',
    symbol: '€',
    marketing: 0.1432,
    utility: 0.0216,
    authentication: 0.0216,
  },
  default: {
    currency: 'USD',
    symbol: '$',
    marketing: 0.025,
    utility: 0.004,
    authentication: 0.004,
  },
};

const REGIONS: { label: string; key: PricingRegion }[] = [
  { label: 'United States', key: 'us' },
  { label: 'India', key: 'india' },
  { label: 'Brazil', key: 'brazil' },
  { label: 'United Kingdom', key: 'uk' },
  { label: 'Germany', key: 'germany' },
  { label: 'France', key: 'france' },
];

export type TemplateCategory = 'Marketing' | 'Utility' | 'Authentication';

export function estimateCost(
  category: TemplateCategory,
  recipientCount: number,
  region: PricingRegion = 'default',
): { perMessage: number; total: number; currency: string; symbol: string } {
  const pricing = REGION_PRICING[region] ?? REGION_PRICING.default;
  let perMessage: number;

  switch (category) {
    case 'Marketing':
      perMessage = pricing.marketing;
      break;
    case 'Utility':
      perMessage = pricing.utility;
      break;
    case 'Authentication':
      perMessage = pricing.authentication;
      break;
    default:
      perMessage = pricing.utility;
  }

  return {
    perMessage,
    total: perMessage * recipientCount,
    currency: pricing.currency,
    symbol: pricing.symbol,
  };
}

export function formatCost(amount: number, currency: string, symbol: string): string {
  if (currency === 'INR') {
    return `${symbol}${amount.toFixed(2)}`;
  }
  return `${symbol}${amount.toFixed(4)}`;
}

export function getRegionLabel(region: PricingRegion): string {
  return REGIONS.find((r) => r.key === region)?.label ?? 'United States';
}

export { REGIONS };
