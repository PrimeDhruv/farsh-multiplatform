/**
 * "My numbers" CSV — how a seller brings their own performance numbers into Farsh without any platform connection.
 * They copy them from each platform's seller reports (Amazon Business Reports, Flipkart Seller Hub listing
 * performance, Meesho supplier panel, Shopify analytics) or from the shop's billing app, into one simple sheet.
 *
 * Columns (header names are matched loosely, order doesn't matter, blank cells are skipped):
 *   farsh_id · product · channel · price · views_30d · clicks_30d · orders_30d · total_orders ·
 *   returns_pct · failed_delivery_pct · ad_spend_30d · ad_clicks_30d
 */
import { CHANNEL_KEYS, getSettings } from '../state/settingsStore.js';

export const CSV_COLUMNS = ['farsh_id', 'product', 'channel', 'price', 'views_30d', 'clicks_30d', 'orders_30d', 'total_orders',
  'returns_pct', 'failed_delivery_pct', 'ad_spend_30d', 'ad_clicks_30d'];

const FIELD = {
  farsh_id: 'id', id: 'id', sku: 'id',
  product: 'name', name: 'name', product_name: 'name', title: 'name',
  channel: 'channel', platform: 'channel', marketplace: 'channel',
  price: 'price', selling_price: 'price',
  views_30d: 'views', views: 'views', sessions: 'views', page_views: 'views', impressions: 'views',
  clicks_30d: 'clicks', clicks: 'clicks',
  orders_30d: 'orders', orders: 'orders', units_ordered: 'orders', units: 'orders',
  total_orders: 'totalOrders', orders_total: 'totalOrders', lifetime_orders: 'totalOrders',
  returns_pct: 'returnsPct', return_pct: 'returnsPct', returns: 'returnsPct', return_rate: 'returnsPct',
  failed_delivery_pct: 'rtoPct', rto_pct: 'rtoPct', rto: 'rtoPct', rto_rate: 'rtoPct',
  ad_spend_30d: 'adSpend', ad_spend: 'adSpend', ads_spend: 'adSpend',
  ad_clicks_30d: 'adClicks', ad_clicks: 'adClicks',
};
const key = (h) => String(h).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** Minimal RFC-4180 CSV parser: quotes, escaped quotes, commas and newlines inside quotes. */
export function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  const s = String(text).replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Channel text → channel key ('Amazon.in' → amazon, 'shop'/'counter'/'offline' → shop, 'Shopify' → website). */
export function channelFromText(v, S = getSettings()) {
  const t = String(v ?? '').trim().toLowerCase();
  if (!t) return null;
  if (CHANNEL_KEYS.includes(t)) return t;
  if (/shop|counter|offline|store|dukan|दुकान/.test(t) && !/shopify/.test(t)) return 'shop';
  if (/amazon/.test(t)) return 'amazon';
  if (/flipkart|shopsy/.test(t)) return 'flipkart';
  if (/meesho/.test(t)) return 'meesho';
  if (/shopify|website|site|woo|instagram|whatsapp|d2c|own/.test(t)) return 'website';
  const byName = Object.entries(S.platforms).find(([, p]) => p.name?.toLowerCase() === t);
  return byName ? byName[0] : null;
}

const toNum = (v) => {
  if (v == null) return null;
  const t = String(v).replace(/[₹,%\s]/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

/**
 * CSV text → { rows, errors }. Each row: { id, name, channel, price, views, clicks, orders, totalOrders, returnsPct,
 * rtoPct, adSpend, adClicks } with numbers parsed (₹, %, commas allowed) and unknown columns ignored.
 */
export function readNumbersCsv(text, S = getSettings()) {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], errors: ['The file has no rows.'] };
  const fields = table[0].map((h) => FIELD[key(h)] ?? null);
  if (!fields.includes('id') && !fields.includes('name')) return { rows: [], errors: ['Add a "product" or "farsh_id" column.'] };
  const rows = [], errors = [];
  table.slice(1).forEach((cells, i) => {
    const r = {};
    fields.forEach((f, j) => { if (f) r[f] = cells[j]; });
    const out = { id: r.id?.trim() || null, name: r.name?.trim() || null, channel: channelFromText(r.channel, S) };
    if (r.channel && !out.channel) errors.push(`Row ${i + 2}: unknown channel "${r.channel}".`);
    for (const f of ['price', 'views', 'clicks', 'orders', 'totalOrders', 'returnsPct', 'rtoPct', 'adSpend', 'adClicks']) {
      const n = toNum(r[f]);
      if (r[f] != null && String(r[f]).trim() !== '' && n == null) errors.push(`Row ${i + 2}: "${r[f]}" is not a number (${f}).`);
      if (n != null && n < 0) { errors.push(`Row ${i + 2}: ${f} can't be negative.`); continue; }
      if (n != null && (f === 'returnsPct' || f === 'rtoPct') && n > 100) { errors.push(`Row ${i + 2}: ${f} must be 0–100.`); continue; }
      out[f] = n;
    }
    if (out.id || out.name) rows.push(out);
  });
  return { rows, errors };
}

const cell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** A template pre-filled with the seller's listings (and any numbers already entered), ready to fill in. */
export function templateCsv(products, S = getSettings()) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const p of products) {
    const ch = p.channel ?? S.defaultChannel;
    const l = p.last30 ?? {};
    lines.push([p.id, p.name, ch, p.listedPrice ?? '', l.views ?? '', l.clicks ?? '', l.orders ?? '', p.orders ?? '',
      p.own?.returns != null ? Math.round(p.own.returns * 1000) / 10 : '', p.own?.rto != null ? Math.round(p.own.rto * 1000) / 10 : '', '', ''].map(cell).join(','));
  }
  return lines.join('\n') + '\n';
}
