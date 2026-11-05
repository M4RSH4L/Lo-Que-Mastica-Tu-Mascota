import { BrandName, ProductMarginItem, ProfitabilityStatus } from '../data/marginsData';

export type SortOption =
  | 'default'
  | 'profit_desc'
  | 'profit_asc'
  | 'margin_desc'
  | 'margin_asc'
  | 'price_desc'
  | 'price_asc';

export type StatusFilter = 'all' | 'profitable' | 'loss' | 'buyer_shipping' | 'pending';

export interface FilterCriteria {
  search: string;
  brand: BrandName | 'Todas';
  status: StatusFilter;
  sortBy: SortOption;
}

export interface SummaryStats {
  totalCount: number;
  profitableCount: number;
  lossCount: number;
  pendingCount: number;
  buyerShippingScenarioCount: number;
  averageMarginWithShippingPct: number;
  averageMarginWithoutShippingPct: number;
  bestProduct: ProductMarginItem | null;
  worstProduct: ProductMarginItem | null;
}

export function getProfitabilityStatus(item: ProductMarginItem): ProfitabilityStatus {
  if (item.finalProfitWithShipping === null || item.purchaseCost === null) {
    return 'pending';
  }
  return item.finalProfitWithShipping >= 0 ? 'profitable' : 'loss';
}

/**
 * Formats a number in Argentine Peso format: $149.200,00 or $-3.302,86
 * Matches the exact notation in the user's markdown document.
 */
export function formatARS(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Sin dato';
  }
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  const [intPart, decPart] = absVal.toFixed(2).split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${isNegative ? '-' : ''}${formattedInt},${decPart}`;
}

/**
 * Formats a percentage in Argentine format: 13,0% or -7,9%
 */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Sin dato';
  }
  const fixed = value.toFixed(1).replace('.', ',');
  return `${fixed}%`;
}

/**
 * Pure calculation of margin metrics given custom parameters (used in Simulator & unit tests)
 */
export function calculateSimulatedMargin(params: {
  commissionBase: number;
  purchaseCost: number;
  commissionRatePct?: number; // Default 12.5% in ML for these products
  mlCommissionOverride?: number;
  sellerShipping: number;
  buyerPaysFixedFee?: number;
}) {
  const {
    commissionBase,
    purchaseCost,
    commissionRatePct = 12.5,
    mlCommissionOverride,
    sellerShipping,
    buyerPaysFixedFee,
  } = params;

  const mlCommission =
    mlCommissionOverride !== undefined
      ? roundToTwo(mlCommissionOverride)
      : roundToTwo((commissionBase * commissionRatePct) / 100);

  const receivedBeforeShipping = roundToTwo(commissionBase - mlCommission);
  const receivedAfterShipping = roundToTwo(receivedBeforeShipping - sellerShipping);
  const profitWithoutShipping = roundToTwo(receivedBeforeShipping - purchaseCost);
  const marginWithoutShippingPct =
    commissionBase > 0 ? roundToOne((profitWithoutShipping / commissionBase) * 100) : 0;

  const finalProfitWithShipping = roundToTwo(
    commissionBase - mlCommission - sellerShipping - purchaseCost
  );
  const finalMarginWithShippingPct =
    commissionBase > 0 ? roundToOne((finalProfitWithShipping / commissionBase) * 100) : 0;

  const buyerPaysShippingProfit =
    buyerPaysFixedFee !== undefined
      ? roundToTwo(profitWithoutShipping - buyerPaysFixedFee)
      : undefined;

  return {
    mlCommission,
    receivedBeforeShipping,
    receivedAfterShipping,
    profitWithoutShipping,
    marginWithoutShippingPct,
    finalProfitWithShipping,
    finalMarginWithShippingPct,
    buyerPaysShippingProfit,
  };
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function roundToOne(num: number): number {
  return Math.round((num + Number.EPSILON) * 10) / 10;
}

export function filterAndSortProducts(
  products: ProductMarginItem[],
  criteria: FilterCriteria
): ProductMarginItem[] {
  const normalizedSearch = criteria.search.trim().toLowerCase();

  const filtered = products.filter((item) => {
    if (criteria.brand !== 'Todas' && item.brand !== criteria.brand) {
      return false;
    }

    const status = getProfitabilityStatus(item);
    if (criteria.status === 'profitable' && status !== 'profitable') {
      return false;
    }
    if (criteria.status === 'loss' && status !== 'loss') {
      return false;
    }
    if (criteria.status === 'pending' && status !== 'pending') {
      return false;
    }
    if (
      criteria.status === 'buyer_shipping' &&
      item.buyerPaysShippingProfit === undefined
    ) {
      return false;
    }

    if (normalizedSearch.length > 0) {
      const haystack = `${item.name} ${item.brand} ${item.weightLabel}`.toLowerCase();
      if (!haystack.includes(normalizedSearch)) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (criteria.sortBy) {
      case 'default':
        return a.index - b.index;
      case 'profit_desc': {
        const valA = a.finalProfitWithShipping ?? -Infinity;
        const valB = b.finalProfitWithShipping ?? -Infinity;
        return valB - valA;
      }
      case 'profit_asc': {
        const valA = a.finalProfitWithShipping ?? Infinity;
        const valB = b.finalProfitWithShipping ?? Infinity;
        return valA - valB;
      }
      case 'margin_desc': {
        const valA = a.finalMarginWithShippingPct ?? -Infinity;
        const valB = b.finalMarginWithShippingPct ?? -Infinity;
        return valB - valA;
      }
      case 'margin_asc': {
        const valA = a.finalMarginWithShippingPct ?? Infinity;
        const valB = b.finalMarginWithShippingPct ?? Infinity;
        return valA - valB;
      }
      case 'price_desc':
        return b.suggestedPrice - a.suggestedPrice;
      case 'price_asc':
        return a.suggestedPrice - b.suggestedPrice;
      default:
        return a.index - b.index;
    }
  });

  return sorted;
}

export function computeSummaryStats(products: ProductMarginItem[]): SummaryStats {
  let profitableCount = 0;
  let lossCount = 0;
  let pendingCount = 0;
  let buyerShippingScenarioCount = 0;

  let sumMarginWithShipping = 0;
  let sumMarginWithoutShipping = 0;
  let validMarginCount = 0;

  let bestProduct: ProductMarginItem | null = null;
  let worstProduct: ProductMarginItem | null = null;

  for (const item of products) {
    const status = getProfitabilityStatus(item);
    if (status === 'profitable') profitableCount++;
    else if (status === 'loss') lossCount++;
    else pendingCount++;

    if (item.buyerPaysShippingProfit !== undefined) {
      buyerShippingScenarioCount++;
    }

    if (
      item.finalMarginWithShippingPct !== null &&
      item.marginWithoutShippingPct !== null &&
      item.finalProfitWithShipping !== null
    ) {
      sumMarginWithShipping += item.finalMarginWithShippingPct;
      sumMarginWithoutShipping += item.marginWithoutShippingPct;
      validMarginCount++;

      if (
        bestProduct === null ||
        item.finalProfitWithShipping > (bestProduct.finalProfitWithShipping ?? -Infinity)
      ) {
        bestProduct = item;
      }

      if (
        worstProduct === null ||
        item.finalProfitWithShipping < (worstProduct.finalProfitWithShipping ?? Infinity)
      ) {
        worstProduct = item;
      }
    }
  }

  return {
    totalCount: products.length,
    profitableCount,
    lossCount,
    pendingCount,
    buyerShippingScenarioCount,
    averageMarginWithShippingPct:
      validMarginCount > 0 ? roundToOne(sumMarginWithShipping / validMarginCount) : 0,
    averageMarginWithoutShippingPct:
      validMarginCount > 0 ? roundToOne(sumMarginWithoutShipping / validMarginCount) : 0,
    bestProduct,
    worstProduct,
  };
}
