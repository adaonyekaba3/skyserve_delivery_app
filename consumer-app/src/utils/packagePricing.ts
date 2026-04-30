import type {
  DeliveryPriority,
  PackagePriceBreakdown,
  PackageWeightClass,
} from '../services/types';

/**
 * Client-side mirror of `src/modules/packages/pricing.ts` on the backend.
 * Used as an immediate fallback so Step 5 of Send Package always shows a price,
 * even if the network quote endpoint is unreachable. The server response, when
 * it arrives, is treated as the source of truth and overwrites this estimate.
 */

const BASE_FEE = 1500;

const WEIGHT_SURCHARGE: Record<PackageWeightClass, number> = {
  light: 0,
  medium: 500,
  heavy: 1500,
};

const PRIORITY_SURCHARGE: Record<DeliveryPriority, number> = {
  standard: 0,
  priority: 1000,
};

const ETA_MINUTES: Record<DeliveryPriority, number> = {
  standard: 13,
  priority: 8,
};

export function computeLocalQuote(
  weight: PackageWeightClass,
  priority: DeliveryPriority,
): PackagePriceBreakdown {
  const weightSurcharge = WEIGHT_SURCHARGE[weight];
  const prioritySurcharge = PRIORITY_SURCHARGE[priority];
  return {
    baseFee: BASE_FEE,
    weightSurcharge,
    prioritySurcharge,
    total: BASE_FEE + weightSurcharge + prioritySurcharge,
    currency: 'NGN',
    estimatedMinutes: ETA_MINUTES[priority],
  };
}
