import { round2, assertNonNegative } from './money.js';

/** Simple demand curve: the higher the price, the fewer customers buy. */
export function demand({ price, base = 100, sensitivity = 8 }) {
  assertNonNegative({ price, base, sensitivity });
  return Math.max(0, Math.round(base - sensitivity * price));
}

/** Profit & loss for a small business. */
export function pnl({ price, unitCost, unitsSold, fixedCosts = 0 }) {
  assertNonNegative({ price, unitCost, unitsSold, fixedCosts });
  const revenue = round2(price * unitsSold);
  const variableCosts = round2(unitCost * unitsSold);
  const grossProfit = round2(revenue - variableCosts);
  const profit = round2(grossProfit - fixedCosts);
  return { revenue, variableCosts, grossProfit, fixedCosts: round2(fixedCosts), profit, margin: revenue ? round2((profit / revenue) * 100) : 0 };
}

/** Units needed to cover fixed costs. */
export function breakEvenUnits(price, unitCost, fixedCosts) {
  assertNonNegative({ price, unitCost, fixedCosts });
  const perUnit = price - unitCost;
  if (perUnit <= 0) return Infinity;
  return Math.ceil(fixedCosts / perUnit);
}

/** Try every price step and return the one with the highest profit. */
export function bestPrice({ unitCost, fixedCosts = 0, base, sensitivity, min = 0, max = 20, step = 0.5 }) {
  let best = null;
  for (let p = min; p <= max + 1e-9; p = round2(p + step)) {
    const r = pnl({ price: p, unitCost, unitsSold: demand({ price: p, base, sensitivity }), fixedCosts });
    if (!best || r.profit > best.profit) best = { price: p, ...r };
  }
  return best;
}

/**
 * Monthly café / restaurant P&L estimate.
 * Revenue = customers per day × average spend × days open. Food & drink cost (COGS) is a % of revenue.
 */
export function cafePnl({ customersPerDay, avgSpend, daysOpen = 26, foodCostPct = 30, staff = 0, rent = 0, utilities = 0, other = 0 }) {
  assertNonNegative({ customersPerDay, avgSpend, daysOpen, foodCostPct, staff, rent, utilities, other });
  const revenue = round2(customersPerDay * avgSpend * daysOpen);
  const cogs = round2((revenue * foodCostPct) / 100);
  const grossProfit = round2(revenue - cogs);
  const expenses = round2(staff + rent + utilities + other);
  const netProfit = round2(grossProfit - expenses);
  return {
    revenue,
    cogs,
    grossProfit,
    grossMargin: revenue ? round2((grossProfit / revenue) * 100) : 0,
    expenses,
    netProfit,
    netMargin: revenue ? round2((netProfit / revenue) * 100) : 0,
  };
}

/** Customers needed per day to cover all monthly expenses. */
export function cafeBreakEvenCustomers({ avgSpend, daysOpen = 26, foodCostPct = 30, staff = 0, rent = 0, utilities = 0, other = 0 }) {
  const perCustomer = avgSpend * (1 - foodCostPct / 100) * daysOpen;
  if (perCustomer <= 0) return Infinity;
  return Math.ceil((staff + rent + utilities + other) / perCustomer);
}
