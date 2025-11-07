import launches from '../data/newHealthyLaunches.json';
import { HealthyProductLaunch } from '../types';

export interface LaunchFilter {
  maxPriceINR?: number;
  preferenceQuery?: string; // match against name/category/healthBenefit
}

// Return all launches (static JSON) optionally filtered by price and preference
export function getNewHealthyProductLaunches(filter?: LaunchFilter): HealthyProductLaunch[] {
  const data = (launches as HealthyProductLaunch[]).map(l => ({ ...l }));
  if (!filter) return data;
  const { maxPriceINR, preferenceQuery } = filter;
  const q = (preferenceQuery || '').trim().toLowerCase();
  return data.filter(item => {
    const priceOk = maxPriceINR ? item.priceINR <= maxPriceINR : true;
    const prefOk = q
      ? [item.name, item.category, item.healthBenefit].some(v => v.toLowerCase().includes(q))
      : true;
    return priceOk && prefOk;
  });
}