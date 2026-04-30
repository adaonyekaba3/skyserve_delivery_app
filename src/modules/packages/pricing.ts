export type PackageWeightClass = 'light' | 'medium' | 'heavy';
export type PackagePriority = 'standard' | 'priority';

export interface PriceBreakdown {
  baseFee: number;
  weightSurcharge: number;
  prioritySurcharge: number;
  total: number;
  currency: 'NGN';
  estimatedMinutes: number;
}

const BASE_FEE = 1500;

const WEIGHT_SURCHARGE: Record<PackageWeightClass, number> = {
  light: 0,
  medium: 500,
  heavy: 1500,
};

const PRIORITY_SURCHARGE: Record<PackagePriority, number> = {
  standard: 0,
  priority: 1000,
};

const ETA_MINUTES: Record<PackagePriority, number> = {
  standard: 13,
  priority: 8,
};

export function quotePackage(
  weight: PackageWeightClass,
  priority: PackagePriority,
): PriceBreakdown {
  const weightSurcharge = WEIGHT_SURCHARGE[weight];
  const prioritySurcharge = PRIORITY_SURCHARGE[priority];
  const total = BASE_FEE + weightSurcharge + prioritySurcharge;
  return {
    baseFee: BASE_FEE,
    weightSurcharge,
    prioritySurcharge,
    total,
    currency: 'NGN',
    estimatedMinutes: ETA_MINUTES[priority],
  };
}
