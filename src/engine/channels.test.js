// Sales channels (shop counter vs online) and editable business settings.  Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCalcInputs, effectiveInputs, toLeverContext } from './model.js';
import { calculate } from './calculator.js';
import { buildLevers } from './levers.js';
import { analyseProduct } from './position.js';
import { buildCoach } from './coach.js';
import { festiveCheck } from './watchAll.js';
import { DEFAULT_SETTINGS, mergeSettings, setSettings, getSettings } from '../state/settingsStore.js';
import { PRODUCTS } from '../data/products.js';

const kurti = PRODUCTS.find((p) => p.id === 'SKU-1001');
const shopKurti = { ...kurti, id: 'SKU-9001', channel: 'shop' };
const withDefaults = (fn) => { setSettings(DEFAULT_SETTINGS); try { fn(); } finally { setSettings(DEFAULT_SETTINGS); } };

test('online defaults keep the original worked example: no-loss price ₹365', () => withDefaults(() => {
  assert.equal(Math.round(calculate(toCalcInputs(kurti)).floor), 365);
}));

test('shop sale: no delivery, no failed deliveries, running costs instead of ads', () => withDefaults(() => {
  const i = toCalcInputs(shopKurti);
  assert.equal(i.shippingCost, 0);
  assert.equal(i.rtoRate, 0);
  assert.equal(i.advertisingCost, DEFAULT_SETTINGS.shop.overheadPerItem);
  assert.ok(Math.abs(i.gstTds - 0.05 / 1.05) < 1e-12, 'only the GST share of the price, no card fees by default');
  assert.equal(i.returnReverseCost, 0);
  const r = calculate(i);
  assert.ok(r.valid);
  // (cost 150 + packing 12 + running costs 10 = 172) ÷ 0.952 for GST ≈ 180.6, plus 2% returns with 20% unsellable
  assert.ok(r.floor > 180 && r.floor < 188, `floor ${r.floor}`);
  assert.ok(r.floor < calculate(toCalcInputs(kurti)).floor, 'a counter sale needs a lower floor than an online one');
}));

test('online-only fixes (smaller box, prepaid, size chart) are not offered for shop products', () => withDefaults(() => {
  assert.equal(buildLevers(toLeverContext(shopKurti)).length, 0);
  assert.ok(buildLevers(toLeverContext(kurti)).length >= 2);
  // a fix saved on the product before it moved to the shop changes nothing
  assert.deepEqual(effectiveInputs({ ...shopKurti, fixes: ['repack', 'prepaid'] }), toCalcInputs(shopKurti));
}));

test('shop products get a status and a full coach view, with no festive COD test', () => withDefaults(() => {
  const a = analyseProduct(shopKurti);
  assert.ok(a.status);
  const c = buildCoach(shopKurti, { status: a.status });
  assert.equal(c.valid, true);
  assert.equal(c.channel, 'shop');
  assert.equal(c.fixes.length, 0);
  assert.equal(festiveCheck(shopKurti), null);
}));

test('online settings flow into the price: higher commission → higher floor; fixed fee adds per order', () => withDefaults(() => {
  const base = calculate(toCalcInputs(kurti)).floor;
  const meesho = (patch) => setSettings({ ...DEFAULT_SETTINGS, platforms: { ...DEFAULT_SETTINGS.platforms, meesho: { ...DEFAULT_SETTINGS.platforms.meesho, ...patch } } });
  meesho({ commission: 0.13 });
  assert.ok(calculate(toCalcInputs(kurti)).floor > base + 30);
  meesho({ fixedFee: 20 });
  const withFee = toCalcInputs(kurti);
  assert.equal(withFee.advertisingCost, 8 + 20);
  assert.ok(calculate(withFee).floor > base);
}));

test('shop settings flow into the price, and target profit is the seller\'s own', () => withDefaults(() => {
  const base = calculate(toCalcInputs(shopKurti)).floor;
  setSettings({ ...DEFAULT_SETTINGS, shop: { ...DEFAULT_SETTINGS.shop, overheadPerItem: 30 }, targetContribution: 50 });
  const i = toCalcInputs(shopKurti);
  assert.ok(calculate(i).floor > base + 19);
  assert.equal(i.targetMargin, 50);
}));

test('settings saved by an older version are filled in from defaults', () => {
  const m = mergeSettings({ profile: { name: 'Asha' }, online: { deductionRate: 0.1 }, platforms: { amazon: { fixedFee: 40 } } });
  assert.equal(m.profile.name, 'Asha');
  assert.equal(m.profile.city, DEFAULT_SETTINGS.profile.city);
  assert.equal(m.online, undefined, 'the old single online block is dropped');
  assert.equal(m.platforms.amazon.fixedFee, 40);
  assert.equal(m.platforms.amazon.name, 'Amazon');
  assert.deepEqual(m.platforms.flipkart, DEFAULT_SETTINGS.platforms.flipkart);
  assert.deepEqual(m.shop, DEFAULT_SETTINGS.shop);
  setSettings(DEFAULT_SETTINGS);
  assert.deepEqual(getSettings().platforms.meesho, DEFAULT_SETTINGS.platforms.meesho);
});

test('the same product on each platform: fees change the no-loss price', () => withDefaults(() => {
  const floorOn = (channel) => calculate(toCalcInputs({ ...kurti, channel })).floor;
  const f = { meesho: floorOn('meesho'), amazon: floorOn('amazon'), flipkart: floorOn('flipkart'), website: floorOn('website'), shop: floorOn('shop') };
  assert.equal(Math.round(f.meesho), 365);
  assert.ok(f.amazon > f.meesho, 'Amazon closing fee raises the floor');
  assert.ok(f.flipkart > f.meesho, 'Flipkart fixed fee raises the floor');
  assert.ok(f.website > f.meesho, 'payment gateway fees raise the floor');
  assert.ok(f.shop < f.meesho, 'counter sale has no delivery or failed deliveries');
  // legacy products with no channel (or the old "online") use the default platform
  assert.equal(calculate(toCalcInputs({ ...kurti, channel: 'online' })).floor, f.meesho);
}));

test('a platform with a flat shipping rate uses it and offers no box fix', () => withDefaults(() => {
  setSettings({ ...DEFAULT_SETTINGS, platforms: { ...DEFAULT_SETTINGS.platforms, website: { ...DEFAULT_SETTINGS.platforms.website, shipping: 60 } } });
  const web = { ...kurti, channel: 'website' };
  assert.equal(toCalcInputs(web).shippingCost, 60);
  assert.ok(!buildLevers(toLeverContext(web)).some((l) => l.id === 'repack'));
}));

test("the seller's own cost per click replaces the category guess in the ads model", () => withDefaults(() => {
  const withBudget = { ...kurti, adsBudget: 750 };
  const cheap = toCalcInputs({ ...withBudget, adCpc: 1 }).advertisingCost;
  const dear = toCalcInputs({ ...withBudget, adCpc: 6 }).advertisingCost;
  assert.ok(cheap < dear, `ads per order: cpc ₹1 → ${cheap}, cpc ₹6 → ${dear}`);
  assert.equal(toCalcInputs({ ...shopKurti, adsBudget: 750 }).advertisingCost, DEFAULT_SETTINGS.shop.overheadPerItem, 'no online ads on counter sales');
}));
