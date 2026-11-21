/**
 * Business settings — what the seller tells Farsh about how and where they sell. Plain module (no React), so the
 * pricing engine can read it. ProductsContext keeps it in React state, saves it on this device and calls
 * setSettings() whenever it changes.
 *
 * Every product is ONE LISTING on ONE CHANNEL:
 *   shop                         sold over the counter: no delivery, no failed deliveries, no courier returns
 *   meesho | amazon | flipkart | website   sold online on that platform, with that platform's fees
 * The same product sold on two platforms is two listings (linked by `group`), because each platform has its own
 * fees, price, buyers, competitors and performance numbers.
 *
 * What is deducted from each sale (t, as a share of the selling price):
 *   GST on the sale (gstRate is the rate on the product; prices include GST, so the share is g ÷ (1 + g))
 *   + commission + payment / collection fee + TCS / TDS and other % deductions   (online)
 *   + card / UPI fees                                                            (shop)
 * Fees are entered INCLUDING the 18% GST charged on them.
 *
 * PLATFORM PRESETS are starting values from each platform's published rate cards (Nov 2026). They change often and
 * depend on category, price band and fulfilment, so the seller is asked to check them against their own fee card.
 * The Meesho preset reproduces the original worked example exactly (7.15% deducted in all, ₹365 kurti no-loss price).
 */
import { ASSUMPTIONS as A } from '../data/assumptions.js';

const DEFAULT_GST = 0.05;
const gstShare = (g) => g / (1 + g);

export const PLATFORM_KEYS = ['meesho', 'amazon', 'flipkart', 'website'];
export const CHANNEL_KEYS = ['shop', ...PLATFORM_KEYS];

const platform = (p) => ({
  enabled: true,
  commission: 0, paymentFee: 0, taxDeduct: 0.006, fixedFee: 0,
  shipping: null,            // ₹ per order; null = courier weight slab for the category
  adsPerOrder: null,         // ₹ per order; null = typical for the category (or the saved monthly ads budget)
  codShare: null,            // share of orders paid cash on delivery; null = typical for the category
  rtoHandling: A.rtoHandling, returnReverseLeg: A.returnReverseLeg,
  ...p,
});

export const PLATFORM_PRESETS = {
  meesho: platform({
    name: 'Meesho',
    // 0% commission. The original team measured 7.15% deducted in all on a live listing (GST + TCS/TDS).
    taxDeduct: A.gstTds - gstShare(DEFAULT_GST),
    note: '0% commission. Shipping is charged by weight slab.',
  }),
  amazon: platform({
    name: 'Amazon',
    commission: 0, fixedFee: 31,
    note: '0% referral fee under ₹1,000 in most categories (Mar 2026). Closing fee about ₹20–27 + GST on low-priced items; above ₹1,000 the referral fee applies. Check your fee card.',
  }),
  flipkart: platform({
    name: 'Flipkart',
    commission: 0, fixedFee: 35,
    note: '0% commission on fashion (Jul 2026) and most items under ₹1,000. Fixed fee by price band + GST. Check your rate card.',
  }),
  website: platform({
    name: 'Own website / Shopify',
    paymentFee: 0.047, taxDeduct: 0,
    note: 'Payment gateway about 2% + Shopify fee 0.6–2% by plan, + GST on fees. Cash-on-delivery orders skip both. Use your own courier rate.',
  }),
};

export const DEFAULT_SETTINGS = {
  profile: { name: 'Rekha Sharma', business: 'Sharma Kurti House', city: 'Jaipur', phone: '' },
  defaultChannel: 'meesho',
  targetContribution: A.targetContribution, // ₹ profit per order the seller aims to keep
  gstRate: DEFAULT_GST,                     // GST rate on the seller's products (0 if not registered)
  platforms: PLATFORM_PRESETS,
  shop: {
    paymentFee: 0,           // card / UPI fees as a share of the price (0 for cash)
    overheadPerItem: 10,     // ₹ share of rent, staff and electricity carried by each item sold
    returnRate: 0.02,        // share of items customers bring back
    unsellableShare: 0.2,    // share of returned items that can't be sold again
  },
};

let current = DEFAULT_SETTINGS;
export const getSettings = () => current;
export function setSettings(s) { current = mergeSettings(s); return current; }

/** Fill in any missing fields (e.g. settings saved by an older version) from the defaults. */
export function mergeSettings(s = {}) {
  const D = DEFAULT_SETTINGS;
  const platforms = {};
  for (const k of PLATFORM_KEYS) platforms[k] = { ...D.platforms[k], ...(s.platforms?.[k] ?? {}) };
  const out = {
    ...D, ...s,
    profile: { ...D.profile, ...(s.profile ?? {}) },
    shop: { ...D.shop, ...(s.shop ?? {}) },
    platforms,
  };
  if (!CHANNEL_KEYS.includes(out.defaultChannel)) out.defaultChannel = D.defaultChannel;
  delete out.online; // first general version had a single "online" block
  return out;
}

/** The product's channel key. Products from older versions ('online' or none) are treated as the default platform. */
export function channelKey(product, S = current) {
  const c = product?.channel;
  if (CHANNEL_KEYS.includes(c)) return c;
  return PLATFORM_KEYS.includes(S.defaultChannel) ? S.defaultChannel : 'meesho';
}
/** 'shop' or 'online' — which pricing model applies. */
export const channelOf = (product, S = current) => (channelKey(product, S) === 'shop' ? 'shop' : 'online');
export const isShop = (product) => channelOf(product) === 'shop';

/** Display name of a channel. */
export const channelName = (key, S = current) => (key === 'shop' ? null : S.platforms[key]?.name ?? key);

/** Total share of the price deducted from each sale on a channel. */
export function deductionFor(key, S = current) {
  const g = gstShare(S.gstRate ?? DEFAULT_GST);
  if (key === 'shop') return g + (S.shop.paymentFee ?? 0);
  const P = S.platforms[key] ?? S.platforms.meesho;
  return g + (P.commission ?? 0) + (P.paymentFee ?? 0) + (P.taxDeduct ?? 0);
}

/** Channels the seller sells on (shop + enabled platforms), for pickers. */
export const activeChannels = (S = current) => ['shop', ...PLATFORM_KEYS.filter((k) => S.platforms[k]?.enabled)];
