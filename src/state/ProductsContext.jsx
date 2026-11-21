import { createContext, useContext, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { DEFAULT_SETTINGS, mergeSettings, setSettings as pushSettings, channelKey } from './settingsStore.js';
import { useT } from '../i18n/LanguageContext.jsx';
import { PRODUCTS, WORKED_EXAMPLE_ID } from '../data/products.js';
import { analyseProduct, STATUS } from '../engine/position.js';
import { INITIAL_TRACKED, competitorsFor } from '../data/competitors.js';

const Ctx = createContext(null);
export const useProducts = () => useContext(Ctx);

/**
 * Products + selected product + derived analysis (floor, busy zone, status) for every SKU.
 * Seller actions in Price Coach (apply a cost fix, use a suggested price, edit cost) update the catalogue here,
 * so the Dashboard, Products and Farsh Watch always show the same numbers.
 *
 * Everything (products, prices, fixes, followed competitors, business settings) is saved in this browser
 * (localStorage) so it survives a refresh. Nothing is sent to any server. exportData()/importData() give the
 * seller a backup file they can keep or move to another device.
 */
const STORE_KEY = 'farsh.data.v2';
const OLD_KEYS = ['farsh.data.v1']; // first general version: same shape, single "online" channel
const initialFollow = () => ({ tracked: { ...INITIAL_TRACKED }, dismissed: {}, custom: {} });

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORE_KEY) ?? OLD_KEYS.map((k) => localStorage.getItem(k)).find(Boolean);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && Array.isArray(d.products) ? d : null;
  } catch { return null; }
}

export function ProductsProvider({ children }) {
  const t = useT();
  const saved = useRef(loadSaved()).current;
  const [products, setProducts] = useState(saved?.products ?? PRODUCTS);
  const [selectedId, setSelectedId] = useState(saved?.selectedId ?? WORKED_EXAMPLE_ID);
  const [settings, setSettingsState] = useState(() => mergeSettings(saved?.settings ?? DEFAULT_SETTINGS));
  const [toast, setToast] = useState(null);
  // competitors the seller follows, per product: approved suggestions, ones they said are not a match, ones they added
  const [follow, setFollow] = useState(() => saved?.follow ?? initialFollow());
  const timer = useRef(null);

  // save on every change
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ version: 2, products, selectedId, settings, follow })); } catch { /* storage full or blocked */ }
  }, [products, selectedId, settings, follow]);

  // the engine reads settings from settingsStore; push them before anything is analysed
  const items = useMemo(() => {
    pushSettings(settings);
    return products.map((p) => {
      const ch = channelKey(p, settings);
      // `label` = name + where it is sold, for pickers (the same product can be listed on several channels)
      return { ...p, a: analyseProduct(p), label: `${p.name} · ${ch === 'shop' ? t('ch.shop') : settings.platforms[ch]?.name ?? ch}` };
    });
  }, [products, settings, t]);
  const selected = items.find((p) => p.id === selectedId) || items[0];

  const summary = useMemo(() => {
    const live = items.filter((p) => p.status === 'live'), priced = items.filter((p) => p.a.contribution != null);
    const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
    const count = (...st) => items.filter((p) => st.includes(p.a.status)).length;
    return {
      total: items.length, live: live.length, drafts: items.length - live.length,
      alerts: items.filter((p) => p.a.isAlert).length,
      attention: items.filter((p) => p.a.needsAttention).length,
      losing: count('below_floor', 'skip'), fewerOrders: count('wont_rank', 'above_zone'),
      smallFix: count('thin', 'unpriced'), onTrack: count('healthy'),
      avgContribution: avg(priced.map((p) => p.a.contribution)),
      avgMarginPct: avg(priced.map((p) => p.a.marginPct)),
      pricedCount: priced.length,
    };
  }, [items]);

  const notify = useCallback((message, tone = 'green') => {
    setToast({ message, tone, id: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const updateProduct = useCallback((id, patch) => {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const toggleFix = useCallback((id, fixId) => {
    setProducts((ps) => ps.map((p) => {
      if (p.id !== id) return p;
      const fixes = p.fixes ?? [];
      return { ...p, fixes: fixes.includes(fixId) ? fixes.filter((f) => f !== fixId) : [...fixes, fixId] };
    }));
  }, []);

  const addProduct = useCallback(({ name, categoryId, cost, packaging, channel, listedPrice = null }) => {
    const next = 1 + Math.max(1000, ...products.map((p) => Number(String(p.id).replace(/\D/g, '')) || 0));
    const id = `SKU-${next}`;
    setProducts((ps) => [...ps, { id, name, categoryId, cost, packaging, channel: channel ?? settings.defaultChannel, status: 'draft', listedPrice, orders: 0, note: 'Added by you.' }]);
    setSelectedId(id);
    return id;
  }, [products, settings.defaultChannel]);

  const nextId = (ps) => `SKU-${1 + Math.max(1000, ...ps.map((p) => Number(String(p.id).replace(/\D/g, '')) || 0))}`;

  /**
   * Sell the same product on another channel: a new listing with the same name, category and costs, linked to the
   * original by `group`. It starts with no price and no numbers of its own: each platform has its own fees, buyers,
   * competitors and performance.
   */
  const listOn = useCallback((sourceId, channel) => {
    let newId = null;
    setProducts((ps) => {
      const src = ps.find((p) => p.id === sourceId);
      if (!src) return ps;
      const group = src.group ?? src.id;
      const existing = ps.find((p) => (p.group ?? p.id) === group && (p.channel ?? settings.defaultChannel) === channel);
      if (existing) { newId = existing.id; return ps; }
      newId = nextId(ps);
      const copy = { id: newId, group, name: src.name, categoryId: src.categoryId, cost: src.cost, packaging: src.packaging, attrs: src.attrs,
        channel, status: 'draft', listedPrice: null, orders: 0, note: 'Added by you.' };
      return [...ps.map((p) => (p.id === sourceId ? { ...p, group } : p)), copy];
    });
    if (newId) setSelectedId(newId);
    return newId;
  }, [settings.defaultChannel]);

  /**
   * The seller's own numbers for one listing, copied from the platform's seller reports (or the shop's billing):
   *   views, clicks, orders   last 30 days, at `price`
   *   totalOrders            orders so far (Farsh trusts own return / failed-delivery rates from 30)
   *   returnsPct, rtoPct     % of orders returned / failed to deliver (0–100)
   *   adSpend, adClicks      last 30 days of ads → own cost per click
   * Blank fields are left as they were. Returns the patch applied.
   */
  const recordNumbers = useCallback((id, n) => {
    const num = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
    const patch = { numbersUpdated: new Date().toISOString() };
    setProducts((ps) => ps.map((p) => {
      if (p.id !== id) return p;
      const views = num(n.views), clicks = num(n.clicks), orders = num(n.orders), price = num(n.price) ?? p.listedPrice;
      if (views != null && views > 0) patch.last30 = { views, clicks: clicks ?? Math.round(views * 0.06), orders: orders ?? 0, atPrice: price ?? undefined };
      else if (orders != null && p.channel === 'shop') patch.last30 = { ...(p.last30 ?? {}), orders, atPrice: price ?? undefined };
      const total = num(n.totalOrders);
      if (total != null) patch.orders = Math.max(0, Math.round(total));
      const ret = num(n.returnsPct), rto = num(n.rtoPct);
      if (ret != null || rto != null) patch.own = { returns: ret != null ? ret / 100 : p.own?.returns ?? null, rto: rto != null ? rto / 100 : p.own?.rto ?? 0 };
      const spend = num(n.adSpend), adClicks = num(n.adClicks);
      if (spend != null && adClicks != null && adClicks > 0) patch.adCpc = Math.round((spend / adClicks) * 100) / 100;
      if (num(n.price) != null) patch.listedPrice = Math.round(num(n.price));
      if ((patch.orders ?? p.orders) > 0 || patch.last30) patch.status = 'live';
      return { ...p, ...patch };
    }));
    return patch;
  }, []);

  /**
   * Import rows from a CSV (see lib/numbersCsv.js). A row matches a listing by its Farsh ID, or by product name +
   * channel. A known product name on a new channel becomes a new listing (same costs). Unknown products are skipped,
   * because Farsh needs their cost. Returns { updated, created, skipped: [names] }.
   */
  const importNumbers = useCallback((rows) => {
    const out = { updated: 0, created: 0, skipped: [] };
    let ps = products;
    const norm = (x) => String(x ?? '').trim().toLowerCase();
    const updates = [];
    for (const r of rows) {
      const chan = r.channel;
      let hit = r.id ? ps.find((p) => norm(p.id) === norm(r.id)) : null;
      if (!hit && r.name) hit = ps.find((p) => norm(p.name) === norm(r.name) && (!chan || (p.channel ?? settings.defaultChannel) === chan));
      if (!hit && r.name && chan) {
        const src = ps.find((p) => norm(p.name) === norm(r.name));
        if (src) {
          const id = nextId(ps), group = src.group ?? src.id;
          hit = { id, group, name: src.name, categoryId: src.categoryId, cost: src.cost, packaging: src.packaging, attrs: src.attrs, channel: chan, status: 'draft', listedPrice: null, orders: 0, note: 'Added from import.' };
          ps = [...ps.map((p) => (p.id === src.id ? { ...p, group } : p)), hit];
          out.created += 1;
        }
      }
      if (!hit) { out.skipped.push(r.name || r.id || '?'); continue; }
      updates.push([hit.id, r]);
      out.updated += 1;
    }
    if (ps !== products) setProducts(ps);
    for (const [id, r] of updates) recordNumbers(id, r);
    return out;
  }, [products, settings.defaultChannel, recordNumbers]);

  const deleteProduct = useCallback((id) => {
    setProducts((ps) => {
      const left = ps.filter((p) => p.id !== id);
      setSelectedId((cur) => (cur === id ? left[0]?.id ?? null : cur));
      return left;
    });
  }, []);

  /** Change business settings (shallow-merged per section: profile, online, shop). */
  const updateSettings = useCallback((patch) => {
    setSettingsState((s) => {
      const platforms = { ...s.platforms };
      for (const [k, v] of Object.entries(patch.platforms ?? {})) platforms[k] = { ...platforms[k], ...v };
      return mergeSettings({
        ...s, ...patch,
        profile: { ...s.profile, ...(patch.profile ?? {}) },
        shop: { ...s.shop, ...(patch.shop ?? {}) },
        platforms,
      });
    });
  }, []);

  const resetDemo = useCallback(() => {
    setProducts(PRODUCTS); setSelectedId(WORKED_EXAMPLE_ID);
    setFollow(initialFollow());
  }, []);

  /** Backup: everything the seller has entered, as one JSON object. */
  const exportData = useCallback(() => ({ app: 'farsh', version: 1, exportedAt: new Date().toISOString(), products, selectedId, settings, follow }), [products, selectedId, settings, follow]);
  /** Restore a backup made by exportData(). Returns true if it looked valid. */
  const importData = useCallback((d) => {
    if (!d || d.app !== 'farsh' || !Array.isArray(d.products)) return false;
    setProducts(d.products);
    setSelectedId(d.selectedId ?? d.products[0]?.id ?? null);
    setSettingsState(mergeSettings(d.settings ?? DEFAULT_SETTINGS));
    setFollow(d.follow ?? initialFollow());
    return true;
  }, []);

  /** Follow / unfollow a suggested listing (the seller decides which look-alikes are genuine competitors). */
  const toggleCompetitor = useCallback((productId, compId) => {
    setFollow((f) => {
      const cur = f.tracked[productId] ?? [];
      const next = cur.includes(compId) ? cur.filter((x) => x !== compId) : [...cur, compId];
      return { ...f, tracked: { ...f.tracked, [productId]: next }, dismissed: { ...f.dismissed, [productId]: (f.dismissed[productId] ?? []).filter((x) => x !== compId) } };
    });
  }, []);
  /** "Not a match": hide a suggestion (and unfollow it if it was followed). */
  const dismissCompetitor = useCallback((productId, compId, undo = false) => {
    setFollow((f) => {
      const hidden = f.dismissed[productId] ?? [];
      return {
        ...f,
        tracked: { ...f.tracked, [productId]: (f.tracked[productId] ?? []).filter((x) => x !== compId) },
        dismissed: { ...f.dismissed, [productId]: undo ? hidden.filter((x) => x !== compId) : [...new Set([...hidden, compId])] },
      };
    });
  }, []);
  /** A listing the seller knows about that Farsh did not suggest. Its price history starts today. */
  const addCustomCompetitor = useCallback((productId, { name, price }) => {
    const id = `custom-${productId}-${Date.now()}`;
    setFollow((f) => ({
      ...f,
      custom: { ...f.custom, [productId]: [...(f.custom[productId] ?? []), { id, name, price, categoryId: null, material: null, feature: null, rating: null, history: [price], custom: true, addedOn: new Date().toISOString() }] },
      tracked: { ...f.tracked, [productId]: [...(f.tracked[productId] ?? []), id] },
    }));
    return id;
  }, []);
  const removeCustomCompetitor = useCallback((productId, compId) => {
    setFollow((f) => ({
      ...f,
      custom: { ...f.custom, [productId]: (f.custom[productId] ?? []).filter((c) => c.id !== compId) },
      tracked: { ...f.tracked, [productId]: (f.tracked[productId] ?? []).filter((x) => x !== compId) },
    }));
  }, []);
  /** Everything about one product's competitors: suggestions, the ones she follows, hidden ones. */
  const competitorsOf = useCallback((product) => {
    const all = [...competitorsFor(product.categoryId), ...(follow.custom[product.id] ?? [])];
    const ids = follow.tracked[product.id] ?? [], hidden = follow.dismissed[product.id] ?? [];
    return {
      tracked: ids.map((id) => all.find((c) => c.id === id)).filter(Boolean),
      suggestions: all.filter((c) => !c.custom && !ids.includes(c.id) && !hidden.includes(c.id)),
      hidden: all.filter((c) => hidden.includes(c.id)),
    };
  }, [follow]);

  const value = {
    items, selected, selectedId, select: setSelectedId, addProduct, deleteProduct, updateProduct, toggleFix, resetDemo,
    listOn, recordNumbers, importNumbers,
    settings, updateSettings, exportData, importData,
    competitorsOf, toggleCompetitor, dismissCompetitor, addCustomCompetitor, removeCustomCompetitor,
    summary, STATUS, toast, notify, dismissToast: () => setToast(null),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
