import { useMemo, useRef, useState } from 'react';
import { Download, Upload, Save, CheckCircle2, FileSpreadsheet, UserCheck, ClipboardList, FlaskConical } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/index.js';
import { ChannelChip, useChannelName } from '../components/ui/Channel.jsx';
import { useProducts } from '../state/ProductsContext.jsx';
import { useT } from '../i18n/LanguageContext.jsx';
import { channelKey } from '../state/settingsStore.js';
import { readNumbersCsv, templateCsv } from '../lib/numbersCsv.js';
import { ASSUMPTIONS } from '../data/assumptions.js';

const FIELDS = [
  { k: 'price', online: true, shop: true },
  { k: 'views', online: true, shop: false },
  { k: 'clicks', online: true, shop: false },
  { k: 'orders', online: true, shop: true },
  { k: 'totalOrders', online: true, shop: true },
  { k: 'returnsPct', online: true, shop: true },
  { k: 'rtoPct', online: true, shop: false },
  { k: 'adSpend', online: true, shop: false },
  { k: 'adClicks', online: true, shop: false },
];

/** What the listing already has, as the text shown in its row. */
function current(p) {
  const pc = (x) => (x == null ? '' : String(Math.round(x * 1000) / 10));
  return {
    price: p.listedPrice ?? '', views: p.last30?.views ?? '', clicks: p.last30?.clicks ?? '', orders: p.last30?.orders ?? '',
    totalOrders: p.orders || '', returnsPct: pc(p.own?.returns), rtoPct: pc(p.own?.rto), adSpend: '', adClicks: '',
  };
}

function Row({ p }) {
  const t = useT();
  const { recordNumbers, notify } = useProducts();
  const [v, setV] = useState(() => current(p));
  const [dirty, setDirty] = useState(false);
  const shop = channelKey(p) === 'shop';
  const bad = Object.entries(v).some(([k, x]) => x !== '' && (!Number.isFinite(Number(x)) || Number(x) < 0 || ((k === 'returnsPct' || k === 'rtoPct') && Number(x) > 100)));
  const save = () => {
    recordNumbers(p.id, v);
    setDirty(false);
    notify(t('mn.saved', { name: p.name }));
  };
  const own = p.orders >= ASSUMPTIONS.ownDataThreshold && p.own;
  return (
    <tr data-testid={`mn-row-${p.id}`}>
      <td>
        <div className="cell-title">{p.name}</div>
        <div className="cell-sub"><ChannelChip product={p} />{' '}
          <Badge tone={own ? 'green' : p.last30 ? 'teal' : 'amber'}>{own ? t('mn.st.own') : p.last30 ? t('mn.st.some') : t('mn.st.none')}</Badge>
          {p.adCpc > 0 && <span className="tiny muted"> · {t('mn.cpc', { cpc: `₹${p.adCpc}` })}</span>}</div>
      </td>
      {FIELDS.map((f) => (
        <td key={f.k} className="mn-cell">
          {(shop ? f.shop : f.online)
            ? <input inputMode="decimal" aria-label={`${t(`mn.f.${f.k}`)} — ${p.name}`} value={v[f.k]} data-testid={`mn-${f.k}-${p.id}`}
                onChange={(e) => { setV((s) => ({ ...s, [f.k]: e.target.value })); setDirty(true); }} />
            : <span className="muted">—</span>}
        </td>
      ))}
      <td><Button size="sm" variant={dirty ? 'primary' : 'ghost'} icon={Save} disabled={!dirty || bad} onClick={save} data-testid={`mn-save-${p.id}`}>{t('mn.save')}</Button></td>
    </tr>
  );
}

export default function MyNumbers() {
  const t = useT();
  const { items, settings, importNumbers, notify } = useProducts();
  const chName = useChannelName();
  const fileRef = useRef(null);
  const [result, setResult] = useState(null);
  const [version, setVersion] = useState(0); // remount rows after an import so they show the new numbers
  const chans = useMemo(() => [...new Set(items.map((p) => channelKey(p)))], [items]);

  const download = () => {
    const blob = new Blob([templateCsv(items, settings)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `farsh-my-numbers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const upload = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const { rows, errors } = readNumbersCsv(await f.text(), settings);
    const r = rows.length ? importNumbers(rows) : { updated: 0, created: 0, skipped: [] };
    setResult({ ...r, errors });
    setVersion((n) => n + 1);
    notify(t('mn.imported', { n: r.updated }), r.updated ? 'green' : 'amber');
  };

  return (
    <>
      <div className="page-head"><div><h1>{t('mn.title')}</h1><p>{t('mn.sub')}</p></div></div>
      <div className="stack">
        <Card title={t('mn.where')} subtitle={t('mn.whereSub')}>
          <div className="grid cols-3 mn-sources">
            <div className="mn-src tone-green"><UserCheck size={18} aria-hidden /><b>{t('mn.src1')}</b><p className="small">{t('mn.src1s')}</p></div>
            <div className="mn-src tone-teal"><ClipboardList size={18} aria-hidden /><b>{t('mn.src2')}</b><p className="small">{t('mn.src2s')}</p></div>
            <div className="mn-src tone-amber"><FlaskConical size={18} aria-hidden /><b>{t('mn.src3')}</b><p className="small">{t('mn.src3s')}</p></div>
          </div>
        </Card>

        <Card title={t('mn.import')} subtitle={t('mn.importSub')}>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <Button variant="secondary" icon={Download} onClick={download} data-testid="mn-template">{t('mn.template')}</Button>
            <Button icon={Upload} onClick={() => fileRef.current?.click()} data-testid="mn-upload">{t('mn.upload')}</Button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={upload} data-testid="mn-file" />
          </div>
          {result && (
            <div className={`banner tone-${result.updated ? 'green' : 'amber'}`} style={{ marginTop: 12 }} role="status" data-testid="mn-result">
              <CheckCircle2 size={16} aria-hidden />
              <span>{t('mn.result', { u: result.updated, c: result.created })}
                {result.skipped.length > 0 && ` ${t('mn.skipped', { names: result.skipped.slice(0, 5).join(', ') })}`}
                {result.errors.length > 0 && ` ${result.errors.slice(0, 3).join(' ')}`}</span>
            </div>
          )}
          <details className="mn-help" style={{ marginTop: 12 }}>
            <summary><FileSpreadsheet size={14} aria-hidden /> {t('mn.findTitle')}</summary>
            <ul className="small">
              {['amazon', 'flipkart', 'meesho', 'website', 'shop'].map((k) => <li key={k}><b>{k === 'shop' ? t('ch.shop') : chName(k)}:</b> {t(`mn.find.${k}`)}</li>)}
            </ul>
            <p className="tiny muted">{t('mn.cols')}</p>
          </details>
        </Card>

        <Card flush title={t('mn.table')} subtitle={t('mn.tableSub', { n: ASSUMPTIONS.ownDataThreshold })}>
          <div className="table-wrap">
            <table className="tbl compact mn-table" key={version}>
              <thead><tr>
                <th>{t('col.product')}</th>
                {FIELDS.map((f) => <th key={f.k} className="r">{t(`mn.f.${f.k}`)}</th>)}
                <th />
              </tr></thead>
              <tbody>
                {chans.flatMap((k) => items.filter((p) => channelKey(p) === k)).map((p) => <Row key={`${p.id}-${version}`} p={p} />)}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
