import { ASSUMPTIONS } from '../data/assumptions.js';
import { CATEGORIES } from '../data/categories.js';
import { blendedRto } from './floor.js';
import { applyLevers } from './levers.js';
import { baselineFor, bucketNear, projectTo } from './funnel.js';
import { adsUplift, savedBudget } from './adsUplift.js';
import { demandFor } from '../data/demandBuckets.js';
import { getSettings, channelKey, channelOf, deductionFor } from '../state/settingsStore.js';

/**
 * Turn a product record (one listing on one channel) into model inputs for floor.js, and record where the rates
 * came from (borrowed category averages, the seller's settings, or the seller's own data).
 * Own data replaces borrowed averages once the listing has enough orders.
 *
 *   shop     counter sale: no delivery, no failed deliveries; running costs per item stand in for ads
 *   online   that platform's fees from Settings; delivery by weight slab unless the platform sets a flat rate
 */
export function buildModel(product, A = ASSUMPTIONS, S = getSettings()) {
  const cat = CATEGORIES[product.categoryId];
  const key = channelKey(product, S);
  const c = product.cost;
  const t = deductionFor(key, S);
  const useOwn = !!product.own && product.orders >= A.ownDataThreshold;

  if (key === 'shop') {
    const sh = S.shop;
    const q = useOwn && product.own.returns != null ? product.own.returns : sh.returnRate;
    return {
      channel: 'shop', platform: null, c, t, r: 0, q,
      packaging: product.packaging, shipping: 0, ads: sh.overheadPerItem,
      F: product.packaging + sh.overheadPerItem,
      rtoHandling: 0, rtoStockLost: 0, returnReverse: 0, returnUnsellable: sh.unsellableShare,
      Lr: 0, Lq: sh.unsellableShare * c,
      codShare: 0, source: useOwn ? 'own' : 'seller', slab: null,
    };
  }

  const P = S.platforms[key];
  const shipping = product.shipping ?? P.shipping ?? cat.shipping;
  const codShare = P.codShare ?? cat.codShare;
  const r = useOwn && product.own.rto != null ? product.own.rto : blendedRto(codShare, cat.rtoCod, cat.rtoPrepaid);
  const q = useOwn && product.own.returns != null ? product.own.returns : cat.returnRate;
  const ads = (P.adsPerOrder ?? cat.ads) + (P.fixedFee ?? 0);
  return {
    channel: 'online', platform: key, c, t, r, q,
    packaging: product.packaging, shipping, ads, fixedFee: P.fixedFee ?? 0,
    F: product.packaging + shipping + ads,
    rtoHandling: P.rtoHandling, rtoStockLost: A.rtoStockLost,
    returnReverse: P.returnReverseLeg, returnUnsellable: A.returnUnsellable,
    Lr: P.rtoHandling + A.rtoStockLost * c,
    Lq: P.returnReverseLeg + A.returnUnsellable * c,
    codShare,
    source: useOwn ? 'own' : 'borrowed',
    slab: P.shipping != null ? null : cat.slab,
  };
}

/**
 * ₹ of ads each order carries when the seller has saved a monthly ads budget: the budget ÷ every order a month at
 * the listed price (her own orders + the ones the ads bring). null = no budget or no price: use the category average.
 */
export function adsPerOrder(product, price = product.listedPrice) {
  if (channelOf(product) === 'shop') return null; // counter sales: no online ads
  const S = savedBudget(product);
  if (!S || price == null) return null;
  const buckets = demandFor(product.categoryId).buckets;
  const bucket = bucketNear(price, buckets);
  if (!bucket) return null;
  const p = projectTo(baselineFor(product, buckets, price), bucket);
  const u = adsUplift({ categoryId: product.categoryId, bucket, ctr: p.ctr, opv: p.opv, spend: S, cpc: product.adCpc });
  const orders = p.orders + u.adOrders;
  return orders > 0 ? S / orders : null;
}

/**
 * Adapter: a product record → flat inputs for calculator.js (the UI-free engine).
 * These are the DEFAULTS shown in Price Coach; the seller can override any of them.
 * Ads: the category's ₹ per order average, or — once the seller saves a monthly ads budget — that budget per order.
 */
export function toCalcInputs(product, A = ASSUMPTIONS, S = getSettings()) {
  const mo = buildModel(product, A, S);
  const perOrder = adsPerOrder(product);
  // a saved ads budget replaces the per-order ads average; the platform's fixed fee per order still applies
  const ads = perOrder != null ? perOrder + (mo.fixedFee ?? 0) : mo.ads;
  return {
    productCost: mo.c, packagingCost: mo.packaging, shippingCost: mo.shipping, advertisingCost: ads,
    gstTds: mo.t, rtoRate: mo.r, rtoHandlingCost: mo.rtoHandling, rtoStockLossShare: mo.rtoStockLost,
    returnRate: mo.q, returnReverseCost: mo.returnReverse, returnUnsellableShare: mo.returnUnsellable,
    targetMargin: S.targetContribution ?? A.targetContribution, price: product.listedPrice ?? undefined,
  };
}

/** Situation the "Lower my floor" levers need for a product (category mix, box sizes). */
export function toLeverContext(product, S = getSettings()) {
  const cat = CATEGORIES[product.categoryId];
  const key = channelKey(product, S);
  if (key === 'shop') return { channel: 'shop', codShare: 0, rtoCod: cat.rtoCod, rtoPrepaid: cat.rtoPrepaid, pack: null };
  const P = S.platforms[key];
  // a flat shipping rate set for the platform can't be lowered by a smaller box
  return { channel: 'online', platform: key, codShare: P.codShare ?? cat.codShare, rtoCod: cat.rtoCod, rtoPrepaid: cat.rtoPrepaid, pack: P.shipping != null ? null : cat.pack ?? null };
}

/**
 * The inputs the seller is actually on today: the defaults above, with any cost fixes she has applied
 * (product.fixes, e.g. ['repack']) patched in by the lever engine. Fixes only ever change inputs
 * (shipping, RTO rate, return rate); every ₹ result is then recomputed by calculator.js.
 */
export function effectiveInputs(product, A = ASSUMPTIONS, S = getSettings()) {
  const base = toCalcInputs(product, A, S);
  const fixes = product.fixes ?? [];
  return fixes.length ? applyLevers(base, toLeverContext(product, S), fixes) : base;
}
