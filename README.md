# Farsh (फ़र्श) — floor-first price coach for shops and online sellers

**Farsh helps sellers lower their FLOOR before they lower their PRICE.**

Farsh works out the lowest price at which a product doesn't lose money (the *no-loss price*), shows where similar
products sell, and suggests a price that keeps the seller's profit. It works for:

- **Shopkeepers selling over the counter.** No delivery and no failed deliveries. Rent, staff and electricity are
  spread over each item, and card/UPI fees and items brought back are counted.
- **Online sellers on Meesho, Amazon, Flipkart or their own website / Shopify.** Each platform has its own
  commission, payment fee, TCS/TDS, fixed fee, shipping, ads, cash-on-delivery failures, returns and claims.

Every product record is **one listing on one channel**. The same product sold on two platforms is two linked
listings, because each platform has its own fees, price, buyers, competitors and performance. Price Coach's
**"Where should you sell it?"** table shows the no-loss price and suggested price on every channel, and
**Sell here too** creates the linked listing.

## Platform data: what Farsh can and can't know
Only a platform knows other sellers' clicks and orders, and no platform shares them. So Farsh separates three kinds
of number and labels each in the UI:

| Kind | Examples | Where it comes from |
|---|---|---|
| Exact | cost, packing, price, platform fees, GST | the seller and Settings (fee presets from published rate cards, editable) |
| The seller's own results | views, clicks, orders, returns, failed deliveries, ad spend → own cost per click | **My numbers**: typed in, or a CSV filled from each platform's seller reports |
| Estimates | price ranges where similar products sell, competitors' orders, buyer searches, top sellers | example data, clearly labelled. Real competitors are tracked by price on the Competitors page |

A listing's own numbers replace the estimates as they come in. Views, clicks and orders are used straight away.
Return and failed-delivery rates are used from 30 orders, and own cost per click replaces the category value in the
Ads Planner.

**Later: direct connections.** Amazon (SP-API: sales and traffic reports, competitive pricing on your own items),
Shopify (Admin API) and ads APIs could fill My numbers automatically. They need a small server to hold the seller's
login tokens and developer approval from each platform. Flipkart and Meesho don't offer open APIs for these reports,
so CSV stays the route there.

## Getting started

### 1. Prerequisites
- **Node.js 18 or newer** (includes npm). Check with `node -v`. Download the LTS version from https://nodejs.org.

### 2. Install and run
```bash
cd Farsh-main             # the folder that contains package.json
npm install               # installs dependencies into node_modules/
npm run dev
```
Open **http://localhost:5173**. On the first visit you pick a language (English or Hindi), which you can change
later from the top bar or Settings.

### 3. Other commands
| Command | What it does |
|---|---|
| `npm test` | Runs the 141 engine tests (Node's built-in test runner, no browser needed) |
| `npm run build` | Creates a production build in `dist/` |
| `npm run preview` | Serves the `dist/` build locally to check it |

The build uses relative paths, so `dist/` can be hosted on any static host (Netlify, Vercel, GitHub Pages) or opened
from a sub-folder.

## First steps for a new customer
1. **Settings → Your profile:** name, business, city.
2. **Settings → How you sell:** the main channel, the profit to keep per order, and the GST rate (0 if not
   registered).
3. **Settings → Shop counter:** running costs per item (monthly rent + staff + electricity ÷ items sold a month),
   card/UPI fees, and how many items customers bring back.
4. **Settings → Where you sell online:** tick the platforms used and check each one's fees against the seller's own
   fee card (presets: Meesho, Amazon, Flipkart, Own website / Shopify; checked Nov 2026).
5. **Products → New product:** name, category, cost, packing, where it's sold, and the current price if there is
   one. Price Coach opens with the no-loss price and a suggestion.
6. **My numbers:** each month, download the template, fill it from each platform's reports, and upload it.
7. **Settings → Your data → Download backup** now and then.

## Data and privacy
- Everything the seller enters (products, prices, applied fixes, followed competitors, settings) is **saved in the
  browser on this device** (`localStorage` key `farsh.data.v1`). Nothing is sent to a server.
- **Download backup / Restore from backup** in Settings moves the data to another device or keeps it safe. Clearing
  the browser's site data erases it, so keep a backup.
- **Load sample shop** replaces the products with the demo catalogue and keeps the settings.

## Sample data (what is still an example)
The app opens with a sample shop (a kurti seller in Jaipur) so it can be explored straight away. These are
**examples, not live data**, and are labelled in the UI:
- market price bands, "where buyers buy" order ranges, views and clicks per price range (until a listing has its own)
- Ads Planner cost per click (until the seller enters their own ad spend and clicks)
- Launch Ideas: buyer searches, seasons and top sellers
- suggested competitor listings and their price histories (sellers can add the real shops or listings they compete with)
- weekly Farsh Watch history, claim approval rates, category averages for failed deliveries and returns

The seller's own costs, prices and settings are always used as typed.

## Structure
    src/engine/        pure pricing logic, no UI
      calculator.js    E = k(p(1−t) − c) − F − r·Lr − q·Lq;  no-loss price = price where E = 0
      model.js         listing + settings → calculator inputs, per channel (shop / each platform)
      ads.js, adsUplift.js, launch.js   Ads Planner and Launch Ideas
      levers.js        cost fixes (smaller box, prepaid nudge, size chart). Online only.
      coach.js, demand.js, position.js, signals.js, watchAll.js, claims.js, funnel.js …
      channels.test.js tests for shop vs online and editable settings
    src/state/
      settingsStore.js business settings, platform fee presets, channel helpers (read by the engine)
      ProductsContext.jsx  listings, settings, linked listings, own numbers, CSV import, saving, backup
    src/lib/numbersCsv.js  My numbers CSV: reader (understands common report headings) and template
    src/pages/MyNumbers.jsx, src/components/seller/PlatformCompare.jsx
    src/data/          sample shop and example market data
    src/i18n/          English + Hindi (strings.js and strings.v2–v5.js, later files override earlier ones)
    src/components/, src/pages/, src/styles/

## How the channels change the maths
| | Shop counter | Online (per platform) |
|---|---|---|
| Deducted from the price (t) | GST share + card / UPI fees | GST share + commission + payment fee + TCS/TDS (Meesho preset = 7.15%, the original example) |
| Per-item costs (F) | packing + running costs per item | packing + delivery slab (or flat rate) + ads + fixed fee |
| Failed deliveries (r) | none | from cash-on-delivery share and category rates |
| Returns (q) | items brought back (default 2%), part unsellable | category average, reverse courier + unsellable stock |
| Cost fixes | not shown | smaller box, prepaid nudge, size chart |
| Returns & Claims, Ads Planner | explain that they don't apply | full breakdown |

## Languages
English and Hindi are complete for the seller-facing screens. Marathi, Bengali, Tamil, Telugu, Gujarati and Kannada
are listed as "coming soon": add a `STRINGS` entry and set `ready: true`. Farsh Watch alert sentences and the expert
panel are generated in English.

## Known limits
- Categories and their market bands are the sample set (mostly fashion, plus footwear, bottles and bags). A product
  outside them uses the closest category's market numbers. Its own no-loss price is still correct, but "where buyers
  buy" is only a rough guide.
- WhatsApp alerts are a preview; nothing is sent yet.
- Data lives in one browser. There are no accounts and no sync between devices other than backup files.
