import { useMemo } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { Button } from '../ui/index.js';
import { ChannelChip } from '../ui/Channel.jsx';
import { useProducts } from '../../state/ProductsContext.jsx';
import { useT } from '../../i18n/LanguageContext.jsx';
import { calculate } from '../../engine/calculator.js';
import { effectiveInputs, toCalcInputs } from '../../engine/model.js';
import { activeChannels, channelKey } from '../../state/settingsStore.js';
import { inr, inrSigned } from '../../lib/format.js';

/**
 * The same product on every channel the seller uses: what each platform's fees do to the no-loss price, the price
 * that keeps the target profit, and the profit at today's price. A channel where the product is already listed uses
 * that listing (its own price, fixes and numbers); the others use the product's costs with that channel's fees only.
 */
export function PlatformCompare({ product }) {
  const t = useT();
  const { items, settings, listOn, select, notify } = useProducts();
  const group = product.group ?? product.id;
  const here = channelKey(product, settings);

  const rows = useMemo(() => {
    const siblings = items.filter((p) => (p.group ?? p.id) === group);
    const keys = [...new Set([...activeChannels(settings), ...siblings.map((p) => channelKey(p, settings))])];
    return keys.map((k) => {
      const listing = siblings.find((p) => channelKey(p, settings) === k) ?? null;
      const inputs = listing
        ? effectiveInputs(listing)
        : toCalcInputs({ id: `${group}-${k}`, name: product.name, categoryId: product.categoryId, cost: product.cost, packaging: product.packaging, channel: k, orders: 0, listedPrice: null });
      const c = calculate({ ...inputs, price: undefined });
      if (!c.valid) return { k, listing, valid: false };
      const price = listing?.listedPrice ?? null;
      return {
        k, listing, valid: true, floor: c.floor, target: Math.round(c.priceWithTargetMargin),
        price, profit: price != null ? calculate({ ...inputs, price }).contributionPerShippedOrder : null,
      };
    }).sort((a, b) => (a.k === here ? -1 : b.k === here ? 1 : (a.floor ?? 1e9) - (b.floor ?? 1e9)));
  }, [items, settings, group, here, product]);

  const lowest = Math.min(...rows.filter((r) => r.valid).map((r) => r.floor));
  const add = (k) => {
    const id = listOn(product.id, k);
    if (id) notify(t('pc.added', { name: product.name, ch: k === 'shop' ? t('ch.shop') : settings.platforms[k]?.name }));
  };

  return (
    <div className="pc-wrap" data-testid="platform-compare">
      <div className="table-wrap">
        <table className="tbl compact">
          <thead><tr>
            <th>{t('pc.where')}</th><th className="r">{t('pc.floor')}</th><th className="r">{t('pc.target', { amt: inr(settings.targetContribution) })}</th>
            <th className="r">{t('pc.yourPrice')}</th><th />
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k} className={r.k === here ? 'row-here' : ''} data-testid={`pc-row-${r.k}`}>
                <td><ChannelChip channel={r.k} /> {r.k === here && <span className="tiny muted">{t('pc.thisOne')}</span>}
                  {r.valid && r.floor === lowest && rows.length > 1 && <span className="badge tone-green" style={{ marginLeft: 6 }}>{t('pc.lowest')}</span>}</td>
                <td className="r num"><b className="red">{r.valid ? inr(r.floor) : '—'}</b></td>
                <td className="r num">{r.valid ? inr(r.target) : '—'}</td>
                <td className="r num">{r.price != null ? <>{inr(r.price)} <span className={r.profit < 0 ? 'neg' : 'pos'}>({inrSigned(r.profit)})</span></> : <span className="muted">—</span>}</td>
                <td className="r">
                  {r.listing ? (r.k !== here && <Button size="sm" variant="ghost" onClick={() => select(r.listing.id)}>{t('pc.open')}<ArrowRight size={13} aria-hidden /></Button>)
                    : <Button size="sm" variant="secondary" icon={Plus} onClick={() => add(r.k)} data-testid={`pc-add-${r.k}`}>{t('pc.sellHere')}</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tiny muted" style={{ marginTop: 8 }}>{t('pc.note')}</p>
    </div>
  );
}
