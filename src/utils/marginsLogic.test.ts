import test from 'node:test';
import assert from 'node:assert/strict';
import { RAW_PRODUCTS } from '../data/marginsData';
import {
  formatARS,
  formatPct,
  getProfitabilityStatus,
  calculateSimulatedMargin,
  filterAndSortProducts,
  computeSummaryStats,
} from './marginsLogic';

test('RAW_PRODUCTS contains all 51 items from the markdown document', () => {
  assert.equal(RAW_PRODUCTS.length, 51);
  assert.equal(RAW_PRODUCTS[0].name, 'Royal Canin Mini Adulto 15 kg');
  assert.equal(RAW_PRODUCTS[50].name, 'Fawna Cachorro Mordida Pequeña 3 kg');
  assert.equal(RAW_PRODUCTS[50].purchaseCost, null);
});

test('formatARS formats positive, negative, and null values in Argentine notation', () => {
  assert.equal(formatARS(149200), '$149.200,00');
  assert.equal(formatARS(94817.13), '$94.817,13');
  assert.equal(formatARS(-3302.86), '$-3.302,86');
  assert.equal(formatARS(null), 'Sin dato');
});

test('formatPct formats percentages with comma decimal separator', () => {
  assert.equal(formatPct(13.0), '13,0%');
  assert.equal(formatPct(-7.9), '-7,9%');
  assert.equal(formatPct(null), 'Sin dato');
});

test('calculateSimulatedMargin reproduces exact markdown formula', () => {
  // Royal Canin Mini Adulto 15 kg
  const res = calculateSimulatedMargin({
    commissionBase: 149200.0,
    purchaseCost: 94817.13,
    mlCommissionOverride: 18650.0,
    sellerShipping: 16290.0,
  });

  assert.equal(res.receivedBeforeShipping, 130550.0);
  assert.equal(res.receivedAfterShipping, 114260.0);
  assert.equal(res.profitWithoutShipping, 35732.87);
  assert.equal(res.marginWithoutShippingPct, 23.9);
  assert.equal(res.finalProfitWithShipping, 19442.87);
  assert.equal(res.finalMarginWithShippingPct, 13.0);
});

test('computeSummaryStats tallies profitable, loss, and pending items accurately', () => {
  const stats = computeSummaryStats(RAW_PRODUCTS);
  assert.equal(stats.totalCount, 51);
  assert.equal(stats.pendingCount, 1);
  assert.equal(stats.profitableCount + stats.lossCount + stats.pendingCount, 51);
  assert.equal(stats.buyerShippingScenarioCount, 9);
  assert.ok(stats.bestProduct !== null);
  assert.equal(stats.bestProduct?.name, 'Royal Canin Maxi Ageing 8+ 15 kg');
});

test('filterAndSortProducts filters by brand, status, search, and sorts by profit', () => {
  const onlyBuyerShipping = filterAndSortProducts(RAW_PRODUCTS, {
    search: '',
    brand: 'Todas',
    status: 'buyer_shipping',
    sortBy: 'default',
  });
  assert.equal(onlyBuyerShipping.length, 9);

  const royalCaninLoss = filterAndSortProducts(RAW_PRODUCTS, {
    search: '',
    brand: 'Royal Canin',
    status: 'loss',
    sortBy: 'profit_asc',
  });
  assert.ok(royalCaninLoss.length > 0);
  assert.equal(
    royalCaninLoss[0].name,
    'Royal Canin Appetite Control Care Gato 7.5 kg'
  );
  assert.equal(getProfitabilityStatus(royalCaninLoss[0]), 'loss');
});
