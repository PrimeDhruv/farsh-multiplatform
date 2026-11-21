import { Store, Globe, ShoppingBag, ShoppingCart, Package } from 'lucide-react';
import { Select } from './Field.jsx';
import { useProducts } from '../../state/ProductsContext.jsx';
import { useT } from '../../i18n/LanguageContext.jsx';
import { activeChannels, channelKey, PLATFORM_KEYS } from '../../state/settingsStore.js';

const ICON = { shop: Store, meesho: ShoppingBag, amazon: ShoppingCart, flipkart: Package, website: Globe };

/** Name of a channel in the seller's words: "Shop counter" or the platform name from Settings. */
export function useChannelName() {
  const { settings } = useProducts();
  const t = useT();
  return (key) => (key === 'shop' ? t('ch.shop') : settings.platforms[key]?.name ?? key);
}

/** Small coloured chip: where a listing is sold. */
export function ChannelChip({ product, channel }) {
  const { settings } = useProducts();
  const name = useChannelName();
  const key = channel ?? channelKey(product, settings);
  const Icon = ICON[key] ?? Globe;
  return <span className={`ch-chip ch-${key}`} data-testid="ch-chip"><Icon size={11} aria-hidden />{name(key)}</span>;
}

/** Picker for where a product is sold: the shop and every platform switched on in Settings. */
export function ChannelSelect({ value, onChange, className = '', ...rest }) {
  const { settings } = useProducts();
  const t = useT();
  const keys = activeChannels(settings);
  if (value && !keys.includes(value)) keys.push(value); // a platform switched off later still shows on its listings
  const label = (k) => (k === 'shop' ? t('ch.shopLong') : `${t('ch.onlinePrefix')} ${settings.platforms[k]?.name ?? k}`);
  return <Select label={t('ch.label')} value={value} onChange={onChange} className={className}
    options={keys.map((k) => ({ value: k, label: label(k) }))} {...rest} />;
}

export { PLATFORM_KEYS };
