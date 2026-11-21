import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Select, Button } from '../ui/index.js';
import { CATEGORY_LIST } from '../../data/categories.js';
import { useProducts } from '../../state/ProductsContext.jsx';
import { useT } from '../../i18n/LanguageContext.jsx';
import { ChannelSelect } from '../ui/Channel.jsx';

/** Two numbers in (product cost and packing) plus where it is sold. Settings fill in the rest. Opens Price Coach after. */
export function NewProductForm({ onDone }) {
  const { addProduct, settings } = useProducts();
  const t = useT();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', categoryId: 'kurtis', cost: '', packaging: '', channel: settings.defaultChannel, price: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const priceOk = f.price === '' || Number(f.price) > 0;
  const valid = f.name.trim() && Number(f.cost) > 0 && Number(f.packaging) >= 0 && f.packaging !== '' && priceOk;
  const submit = () => {
    addProduct({ name: f.name.trim(), categoryId: f.categoryId, cost: Number(f.cost), packaging: Number(f.packaging), channel: f.channel, listedPrice: f.price === '' ? null : Math.round(Number(f.price)) });
    onDone?.();
    nav('/price-coach');
  };
  return (
    <Card title={t('np.title')} subtitle={t('np.sub')} tint="plum">
      <div className="grid cols-2">
        <Input label={t('np.name')} value={f.name} onChange={set('name')} placeholder={t('np.namePh')} data-testid="np-name" />
        <Select label={t('np.cat')} value={f.categoryId} onChange={set('categoryId')} options={CATEGORY_LIST.map((c) => ({ value: c.id, label: `${c.label} — ${c.group}` }))} />
        <Input label={t('s1.cost')} prefix="₹" type="number" min="1" inputMode="decimal" value={f.cost} onChange={set('cost')} hint={t('s1.costHint')} data-testid="np-cost" />
        <Input label={t('s1.pack')} prefix="₹" type="number" min="0" inputMode="decimal" value={f.packaging} onChange={set('packaging')} hint={t('s1.packHint')} data-testid="np-pack" />
        <ChannelSelect value={f.channel} onChange={set('channel')} data-testid="np-channel" />
        <Input label={t('np.price')} prefix="₹" type="number" min="1" inputMode="decimal" value={f.price} onChange={set('price')} hint={t('np.priceHint')} data-testid="np-price" />
      </div>
      <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
        {onDone && <Button variant="ghost" onClick={onDone}>{t('np.cancel')}</Button>}
        <Button disabled={!valid} onClick={submit} data-testid="np-add">{t('np.add')}</Button>
      </div>
    </Card>
  );
}
