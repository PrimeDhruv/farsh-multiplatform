import { useState, useRef, useEffect } from 'react';
import { RotateCcw, Download, Upload } from 'lucide-react';
import { Card, Input, Select, Badge, Button } from '../components/ui/index.js';
import { LanguageTiles } from '../components/layout/LanguagePicker.jsx';
import { useProducts } from '../state/ProductsContext.jsx';
import { useT } from '../i18n/LanguageContext.jsx';
import { ASSUMPTIONS } from '../data/assumptions.js';
import { pct } from '../lib/format.js';
import { PLATFORM_KEYS, CHANNEL_KEYS, PLATFORM_PRESETS, deductionFor } from '../state/settingsStore.js';
import { ChannelChip } from '../components/ui/Channel.jsx';

/** One platform's fees, folded away until the seller opens it. */
function PlatformSettings({ k, P, total, onSave }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const f = (field) => (v) => onSave({ [field]: v });
  return (
    <div className={`plat ${P.enabled ? '' : 'off'}`} data-testid={`plat-${k}`}>
      <div className="plat-head">
        <label className="plat-toggle"><input type="checkbox" checked={P.enabled} onChange={(e) => onSave({ enabled: e.target.checked })} data-testid={`plat-on-${k}`} />
          <ChannelChip channel={k} /></label>
        <span className="small muted">{t('set.pl.total', { pct: pct(total, 1), fee: `₹${P.fixedFee ?? 0}` })}</span>
        <button type="button" className="btn ghost sm" onClick={() => setOpen((v) => !v)} aria-expanded={open} data-testid={`plat-edit-${k}`}>{open ? t('set.pl.hide') : t('set.pl.edit')}</button>
      </div>
      {open && (
        <div className="plat-body">
          <p className="tiny muted" style={{ margin: '0 0 10px' }}>{t(`set.pl.note.${k}`)} {t('set.pl.check')}</p>
          <div className="grid cols-2">
            <Input label={t('set.pl.name')} value={P.name} onChange={(e) => onSave({ name: e.target.value })} />
            <NumField label={t('set.pl.commission')} hint={t('set.pl.commissionHint')} value={P.commission} onSave={f('commission')} percent max={60} prefix="%" />
            <NumField label={t('set.pl.payment')} hint={t('set.pl.paymentHint')} value={P.paymentFee} onSave={f('paymentFee')} percent max={20} prefix="%" />
            <NumField label={t('set.pl.tax')} hint={t('set.pl.taxHint')} value={P.taxDeduct} onSave={f('taxDeduct')} percent max={20} prefix="%" />
            <NumField label={t('set.pl.fixed')} hint={t('set.pl.fixedHint')} value={P.fixedFee} onSave={f('fixedFee')} />
            <NumField label={t('set.pl.ship')} hint={t('set.pl.shipHint')} value={P.shipping} onSave={f('shipping')} optional />
            <NumField label={t('set.on.ads')} hint={t('set.on.adsHint')} value={P.adsPerOrder} onSave={f('adsPerOrder')} optional />
            <NumField label={t('set.on.cod')} hint={t('set.on.codHint')} value={P.codShare} onSave={f('codShare')} percent optional prefix="%" />
            <NumField label={t('set.on.rto')} hint={t('set.on.rtoHint')} value={P.rtoHandling} onSave={f('rtoHandling')} />
            <NumField label={t('set.on.ret')} hint={t('set.on.retHint')} value={P.returnReverseLeg} onSave={f('returnReverseLeg')} />
          </div>
          <button type="button" className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => { const { name, ...rest } = PLATFORM_PRESETS[k]; onSave({ ...rest, enabled: P.enabled }); }}>{t('set.pl.restore')}</button>
        </div>
      )}
    </div>
  );
}

/**
 * A number field that keeps what the seller is typing and only saves a valid value.
 * `percent` fields show 0–100 and store 0–1. `optional` fields may be left blank (saved as null).
 */
function NumField({ label, hint, value, onSave, percent = false, min = 0, max, optional = false, prefix, suffix, testId }) {
  const t = useT();
  const show = (v) => (v == null ? '' : String(percent ? Math.round(v * 10000) / 100 : v));
  const [text, setText] = useState(show(value));
  const [bad, setBad] = useState(false);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setText(show(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const top = max ?? (percent ? 100 : 100000);
  const commit = (s) => {
    if (s.trim() === '') { if (optional) { setBad(false); onSave(null); } else setBad(true); return; }
    const n = Number(s);
    if (!Number.isFinite(n) || n < min || n > top) { setBad(true); return; }
    setBad(false);
    onSave(percent ? n / 100 : n);
  };
  return (
    <Input label={label} prefix={prefix ?? (percent ? undefined : '₹')} type="number" inputMode="decimal" step="any"
      value={text} data-testid={testId}
      onFocus={() => { focused.current = true; }}
      onBlur={() => { focused.current = false; setText(show(value)); setBad(false); }}
      onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
      hint={bad ? t('set.invalid', { min, max: top }) : `${hint ?? ''}${suffix ? ` ${suffix}` : ''}`}
      className={bad ? 'field-bad' : ''} />
  );
}

export default function Settings() {
  const t = useT();
  const { resetDemo, notify, settings: S, updateSettings, exportData, importData } = useProducts();
  const [alertCh, setAlertCh] = useState('whatsapp');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef(null);
  const A = ASSUMPTIONS;

  const setProfile = (k) => (e) => updateSettings({ profile: { [k]: e.target.value } });
  const sh = (k) => (v) => updateSettings({ shop: { [k]: v } });

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `farsh-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const restore = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const ok = importData(JSON.parse(await f.text()));
      notify(t(ok ? 'set.imported' : 'set.importBad'), ok ? 'green' : 'red');
    } catch { notify(t('set.importBad'), 'red'); }
  };

  const rows = [
    ['Share of stock lost on a failed delivery', pct(A.rtoStockLost), 'Assumption', 'amber'],
    ['Share of online returns that can\'t be resold', pct(A.returnUnsellable), 'Assumption', 'amber'],
    ['Failed deliveries: cash on delivery / prepaid', 'category typical', 'Industry estimate', 'amber'],
    ['Online customer returns', 'category typical', 'Assumption', 'amber'],
    ['Delivery charge', 'by weight slab', 'Typical courier rates', 'amber'],
    ['Your own numbers replace averages at', `${A.ownDataThreshold} orders`, 'Farsh rule', 'teal'],
  ];

  return (
    <>
      <div className="page-head"><div><h1>{t('set.title')}</h1><p>{t('set.sub')}</p></div></div>
      <div className="stack">
        <div className="grid cols-2" style={{ alignItems: 'start' }}>
          <div className="stack">
            <Card title={t('set.profile')} subtitle={t('set.profileSub')}>
              <div className="grid cols-2">
                <Input label={t('set.name')} value={S.profile.name} onChange={setProfile('name')} data-testid="set-name" />
                <Input label={t('set.business')} value={S.profile.business} onChange={setProfile('business')} data-testid="set-business" />
                <Input label={t('set.city')} value={S.profile.city} onChange={setProfile('city')} />
                <Input label={t('set.phone')} value={S.profile.phone} onChange={setProfile('phone')} inputMode="tel" hint={t('set.phoneHint')} />
              </div>
            </Card>
            <Card title={t('set.how')} subtitle={t('set.howSub')}>
              <div className="grid cols-2">
                <Select label={t('set.defaultChannel')} value={S.defaultChannel} onChange={(e) => updateSettings({ defaultChannel: e.target.value })}
                  options={CHANNEL_KEYS.map((k) => ({ value: k, label: k === 'shop' ? t('ch.shopLong') : `${t('ch.onlinePrefix')} ${S.platforms[k].name}` }))} data-testid="set-default-channel" />
                <NumField label={t('set.target')} hint={t('set.targetHint')} value={S.targetContribution} onSave={(v) => updateSettings({ targetContribution: v })} max={100000} testId="set-target" />
                <NumField label={t('set.gst')} hint={t('set.gstHint')} value={S.gstRate} onSave={(v) => updateSettings({ gstRate: v })} percent max={40} prefix="%" testId="set-gst" />
              </div>
            </Card>
            <Card title={t('set.shop')} subtitle={t('set.shopSub')}>
              <div className="grid cols-2">
                <NumField label={t('set.sh.overhead')} hint={t('set.sh.overheadHint')} value={S.shop.overheadPerItem} onSave={sh('overheadPerItem')} testId="set-overhead" />
                <NumField label={t('set.sh.fees')} hint={t('set.sh.feesHint')} value={S.shop.paymentFee} onSave={sh('paymentFee')} percent max={50} prefix="%" />
                <NumField label={t('set.sh.returns')} hint={t('set.sh.returnsHint')} value={S.shop.returnRate} onSave={sh('returnRate')} percent max={90} prefix="%" />
                <NumField label={t('set.sh.unsellable')} hint={t('set.sh.unsellableHint')} value={S.shop.unsellableShare} onSave={sh('unsellableShare')} percent prefix="%" />
              </div>
            </Card>
          </div>
          <div className="stack">
            <Card title={t('set.platforms')} subtitle={t('set.platformsSub')}>
              <div className="stack" style={{ gap: 10 }}>
                {PLATFORM_KEYS.map((k) => <PlatformSettings key={k} k={k} P={S.platforms[k]} total={deductionFor(k, S)} onSave={(patch) => updateSettings({ platforms: { [k]: patch } })} />)}
              </div>
            </Card>
            <Card title={t('set.assump')} subtitle={t('set.assumpSub')}>
              <div className="table-wrap"><table className="tbl compact"><tbody>
                {rows.map(([k, v, s, tone]) => <tr key={k}><td>{k}</td><td className="r num"><b>{v}</b></td><td><Badge tone={tone}>{s}</Badge></td></tr>)}
              </tbody></table></div>
            </Card>
          </div>
        </div>
        <div className="grid cols-2" style={{ alignItems: 'start' }}>
          <Card title={t('set.data')} subtitle={t('set.dataSub')}>
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <Button variant="secondary" icon={Download} onClick={download} data-testid="export">{t('set.export')}</Button>
              <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()} data-testid="import">{t('set.import')}</Button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={restore} />
            </div>
            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '16px 0' }} />
            <p className="small"><b>{t('set.reset')}</b></p>
            <p className="small muted" style={{ margin: '4px 0 10px' }}>{t('set.resetSub')}</p>
            {confirmReset ? (
              <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="small">{t('set.resetConfirm')}</span>
                <Button variant="secondary" icon={RotateCcw} onClick={() => { resetDemo(); setConfirmReset(false); notify(t('set.resetDone')); }} data-testid="reset-demo-yes">{t('set.reset')}</Button>
                <Button variant="ghost" onClick={() => setConfirmReset(false)}>{t('np.cancel')}</Button>
              </div>
            ) : (
              <Button variant="ghost" icon={RotateCcw} onClick={() => setConfirmReset(true)} data-testid="reset-demo">{t('set.reset')}</Button>
            )}
          </Card>
          <div className="stack">
            <Card title={t('set.lang')} subtitle={t('set.langSub')}><LanguageTiles /></Card>
            <Card title={t('set.alerts')} subtitle={t('set.alertsSub')}>
              <Select label={t('set.channel')} value={alertCh} onChange={(e) => setAlertCh(e.target.value)}
                options={[{ value: 'whatsapp', label: t('set.ch.whatsapp') }, { value: 'app', label: t('set.ch.app') }, { value: 'both', label: t('set.ch.both') }]} hint={t('set.preview')} />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
