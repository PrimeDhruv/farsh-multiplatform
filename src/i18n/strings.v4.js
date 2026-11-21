/**
 * Strings for the general-use version (Nov 2026): sales channels (shop counter / online), editable business
 * settings, saving on this device and backups. Merged over strings.js and strings.v2.js.
 */
export const en4 = {
  'brand.sub': 'price coach for shops & online sellers',
  'ch.online': 'Online', 'ch.shop': 'Shop counter',
  'ch.onlineLong': 'Online (marketplace or own website)', 'ch.shopLong': 'In my shop (over the counter)',
  'ch.label': 'Where you sell it',

  // cost sheet, per channel
  'sheet.delivered.shop': '= one item sold', 'sheet.again.shop': 'Packing & running costs lost on items brought back',
  'term.floorHelp.shop': 'The lowest price at which you don\'t lose money on an average item, after packing, running costs, card fees and items brought back.',
  's1.below.shop': 'Below this, every item you sell loses money.',
  'sheet.ads.online': 'Ads & platform fees', 'sheet.adsHow.online': 'from your Settings (category typical if blank)',
  'sheet.ads.shop': 'Shop running costs', 'sheet.adsHow.shop': 'rent, staff, power per item (Settings)',
  'sheet.tax.shop': 'Card / UPI fees ({pct})',
  'sheet.backHead.shop': 'Items brought back: {fail} of every 100',
  'sheet.note.shop': 'Rows add up exactly. {g} = what is left after {pct} card / UPI fees. Counter sales have no delivery and no failed deliveries. Change these numbers in Settings.',
  's1.sum.f.shop': 'packing & running costs', 's1.sum.back.shop': 'items brought back',

  // new product
  'np.sub': 'Two numbers in, one decision out. The rest comes from your Settings and typical numbers for the category.',
  'np.namePh': 'e.g. Cotton kurti, steel bottle, school bag',
  'np.price': 'Current selling price (optional)', 'np.priceHint': 'Leave blank if not priced yet',

  // products
  'prod.count': '{n} of {total} products',
  'prod.delete': 'Delete', 'prod.deleteConfirm': 'Delete {name}? This cannot be undone.', 'prod.deleted': '{name} deleted.',
  'prod.lastOne': 'Keep at least one product.',

  // returns page for shop products
  'rc.shopTitle': 'Returns & claims are for online orders',
  'rc.shopBody': '{name} is sold over the counter, so there are no courier returns, failed deliveries or platform claims. Items customers bring back are already counted in its no-loss price ({rate} of items, set in Settings).',
  'rc.shopPick': 'Pick an online product to see its returns and claims.',

  // watch for shop products
  'watch.shopNote': 'Weekly checks use online listing data (views, ratings, group prices). For shop products, add the nearby shops you compete with on the Competitors page and review your price there.',

  // settings
  'set.sub': 'Your business, how you sell, the numbers Farsh uses, language and backups.',
  'set.profileSub': 'Shown in the sidebar and on alerts. Saved on this device.',
  'set.phone': 'WhatsApp number', 'set.phoneHint': 'For alerts (sending is not set up yet)',
  'set.how': 'How you sell', 'set.howSub': 'New products start with this channel. You can change it per product.',
  'set.defaultChannel': 'Most of my products are sold', 'set.target': 'Profit you want to keep per order', 'set.targetHint': 'Farsh suggests prices that keep at least this much',
  'set.online': 'Online selling', 'set.onlineSub': 'Copy these from your marketplace or payment statements. They apply to every online product.',
  'set.on.platform': 'Platform name', 'set.on.platformPh': 'e.g. Meesho, Amazon, Flipkart, own website',
  'set.on.deduct': 'Deducted from each payout', 'set.on.deductHint': 'Commission + GST/TCS/TDS as a % of the selling price',
  'set.on.fixed': 'Fixed fee per order', 'set.on.fixedHint': 'Closing, collection or platform fee in ₹',
  'set.on.ads': 'Ads per order', 'set.on.adsHint': 'Blank = typical for the category',
  'set.on.cod': 'Orders paid cash on delivery', 'set.on.codHint': 'Blank = typical for the category',
  'set.on.rto': 'Lost per failed delivery', 'set.on.rtoHint': 'Handling charge in ₹ (plus some stock lost)',
  'set.on.ret': 'Return courier per return', 'set.on.retHint': 'Reverse shipping charge in ₹',
  'set.shop': 'Shop counter', 'set.shopSub': 'For products you sell in your shop. No delivery, no failed deliveries.',
  'set.sh.fees': 'Card / UPI fees', 'set.sh.feesHint': '% of the price. 0 if customers pay cash',
  'set.sh.overhead': 'Running costs per item', 'set.sh.overheadHint': 'Rent + staff + electricity a month ÷ items sold a month',
  'set.sh.returns': 'Items customers bring back', 'set.sh.returnsHint': '% of items sold',
  'set.sh.unsellable': 'Brought back and can\'t be resold', 'set.sh.unsellableHint': '% of returned items',
  'set.saved': 'Saved',
  'set.invalid': 'Enter a number from {min} to {max}.',
  'set.assumpSub': 'Other starting values Farsh uses. Your own numbers replace category averages after 30 orders.',
  'set.data': 'Your data', 'set.dataSub': 'Everything is saved in this browser on this device. Download a backup to keep it safe or move it to another phone or computer.',
  'set.export': 'Download backup', 'set.import': 'Restore from backup', 'set.imported': 'Backup restored.', 'set.importBad': 'That file is not a Farsh backup.',
  'set.reset': 'Load sample shop', 'set.resetSub': 'Replace your products with the sample shop. Your settings are kept. Download a backup first if you need your products.',
  'set.resetDone': 'Sample shop loaded.', 'set.resetConfirm': 'Replace all your products with the sample shop?',
};

export const hi4 = {
  'brand.sub': 'दुकान और ऑनलाइन विक्रेताओं के लिए दाम सलाहकार',
  'ch.online': 'ऑनलाइन', 'ch.shop': 'दुकान काउंटर',
  'ch.onlineLong': 'ऑनलाइन (मार्केटप्लेस या अपनी वेबसाइट)', 'ch.shopLong': 'मेरी दुकान में (काउंटर पर)',
  'ch.label': 'आप इसे कहाँ बेचते हैं',

  'sheet.delivered.shop': '= एक आइटम बिका', 'sheet.again.shop': 'वापस आए आइटम पर पैकिंग व चालू ख़र्च का नुकसान',
  'term.floorHelp.shop': 'सबसे कम दाम जिस पर औसत आइटम पर नुकसान न हो, पैकिंग, चालू ख़र्च, कार्ड फ़ीस और वापस आए आइटम के बाद।',
  's1.below.shop': 'इससे कम पर हर बिकने वाले आइटम पर नुकसान होगा।',
  'sheet.ads.online': 'विज्ञापन व प्लेटफ़ॉर्म फ़ीस', 'sheet.adsHow.online': 'आपकी सेटिंग्स से (ख़ाली हो तो कैटेगरी औसत)',
  'sheet.ads.shop': 'दुकान का चालू ख़र्च', 'sheet.adsHow.shop': 'किराया, स्टाफ़, बिजली प्रति आइटम (सेटिंग्स)',
  'sheet.tax.shop': 'कार्ड / UPI फ़ीस ({pct})',
  'sheet.backHead.shop': 'वापस लाए गए आइटम: हर 100 में {fail}',
  'sheet.note.shop': 'सभी लाइनें जुड़कर पूरी होती हैं। {g} = {pct} कार्ड / UPI फ़ीस के बाद बचा हिस्सा। काउंटर बिक्री में डिलीवरी और फ़ेल डिलीवरी नहीं होती। ये नंबर सेटिंग्स में बदलें।',
  's1.sum.f.shop': 'पैकिंग व चालू ख़र्च', 's1.sum.back.shop': 'वापस लाए गए आइटम',

  'np.sub': 'दो नंबर डालिए, एक फ़ैसला पाइए। बाक़ी आपकी सेटिंग्स और कैटेगरी के आम नंबरों से आता है।',
  'np.namePh': 'जैसे: कॉटन कुर्ती, स्टील बोतल, स्कूल बैग',
  'np.price': 'अभी का बिक्री दाम (वैकल्पिक)', 'np.priceHint': 'दाम तय नहीं है तो ख़ाली छोड़ें',

  'prod.count': '{total} में से {n} प्रोडक्ट',
  'prod.delete': 'हटाएँ', 'prod.deleteConfirm': '{name} हटाएँ? यह वापस नहीं होगा।', 'prod.deleted': '{name} हटाया गया।',
  'prod.lastOne': 'कम से कम एक प्रोडक्ट रखें।',

  'rc.shopTitle': 'रिटर्न और क्लेम ऑनलाइन ऑर्डर के लिए हैं',
  'rc.shopBody': '{name} काउंटर पर बिकता है, इसलिए कूरियर रिटर्न, फ़ेल डिलीवरी या प्लेटफ़ॉर्म क्लेम नहीं होते। ग्राहक जो आइटम वापस लाते हैं, वे पहले से इसके बिना-नुकसान दाम में गिने गए हैं (आइटम का {rate}, सेटिंग्स में तय)।',
  'rc.shopPick': 'रिटर्न और क्लेम देखने के लिए कोई ऑनलाइन प्रोडक्ट चुनें।',

  'watch.shopNote': 'साप्ताहिक जाँच ऑनलाइन लिस्टिंग डेटा (व्यू, रेटिंग, ग्रुप के दाम) से होती है। दुकान के प्रोडक्ट के लिए, कॉम्पिटिटर पेज पर पास की दुकानें जोड़ें और वहाँ अपना दाम जाँचें।',

  'set.sub': 'आपका व्यापार, आप कैसे बेचते हैं, फ़र्श कौन से नंबर इस्तेमाल करता है, भाषा और बैकअप।',
  'set.profileSub': 'साइडबार और अलर्ट में दिखता है। इसी डिवाइस पर सेव।',
  'set.phone': 'WhatsApp नंबर', 'set.phoneHint': 'अलर्ट के लिए (भेजना अभी चालू नहीं)',
  'set.how': 'आप कैसे बेचते हैं', 'set.howSub': 'नए प्रोडक्ट इसी माध्यम से शुरू होते हैं। हर प्रोडक्ट के लिए बदल सकते हैं।',
  'set.defaultChannel': 'मेरे ज़्यादातर प्रोडक्ट बिकते हैं', 'set.target': 'हर ऑर्डर पर जितना मुनाफ़ा चाहिए', 'set.targetHint': 'फ़र्श ऐसे दाम सुझाता है जिनमें कम से कम इतना बचे',
  'set.online': 'ऑनलाइन बिक्री', 'set.onlineSub': 'ये अपने मार्केटप्लेस या पेमेंट स्टेटमेंट से भरें। हर ऑनलाइन प्रोडक्ट पर लागू।',
  'set.on.platform': 'प्लेटफ़ॉर्म का नाम', 'set.on.platformPh': 'जैसे: Meesho, Amazon, Flipkart, अपनी वेबसाइट',
  'set.on.deduct': 'हर भुगतान से कटौती', 'set.on.deductHint': 'कमीशन + GST/TCS/TDS, बिक्री दाम का %',
  'set.on.fixed': 'हर ऑर्डर की तय फ़ीस', 'set.on.fixedHint': 'क्लोज़िंग, कलेक्शन या प्लेटफ़ॉर्म फ़ीस ₹ में',
  'set.on.ads': 'हर ऑर्डर पर विज्ञापन', 'set.on.adsHint': 'ख़ाली = कैटेगरी का आम ख़र्च',
  'set.on.cod': 'कैश ऑन डिलीवरी वाले ऑर्डर', 'set.on.codHint': 'ख़ाली = कैटेगरी का आम हिस्सा',
  'set.on.rto': 'हर फ़ेल डिलीवरी पर नुकसान', 'set.on.rtoHint': 'हैंडलिंग चार्ज ₹ में (साथ में कुछ स्टॉक का नुकसान)',
  'set.on.ret': 'हर रिटर्न का कूरियर', 'set.on.retHint': 'रिवर्स शिपिंग चार्ज ₹ में',
  'set.shop': 'दुकान काउंटर', 'set.shopSub': 'दुकान में बिकने वाले प्रोडक्ट के लिए। न डिलीवरी, न फ़ेल डिलीवरी।',
  'set.sh.fees': 'कार्ड / UPI फ़ीस', 'set.sh.feesHint': 'दाम का %। नकद में 0',
  'set.sh.overhead': 'हर आइटम पर चालू ख़र्च', 'set.sh.overheadHint': 'महीने का किराया + स्टाफ़ + बिजली ÷ महीने में बिके आइटम',
  'set.sh.returns': 'ग्राहक जो आइटम वापस लाते हैं', 'set.sh.returnsHint': 'बिके आइटम का %',
  'set.sh.unsellable': 'वापस आए और दोबारा न बिकें', 'set.sh.unsellableHint': 'वापस आए आइटम का %',
  'set.saved': 'सेव हुआ',
  'set.invalid': '{min} से {max} के बीच नंबर डालें।',
  'set.assumpSub': 'फ़र्श जो दूसरे शुरुआती नंबर लेता है। 30 ऑर्डर के बाद आपके अपने नंबर कैटेगरी औसत की जगह लेते हैं।',
  'set.data': 'आपका डेटा', 'set.dataSub': 'सब कुछ इसी डिवाइस के ब्राउज़र में सेव है। सुरक्षित रखने या दूसरे फ़ोन/कंप्यूटर पर ले जाने के लिए बैकअप डाउनलोड करें।',
  'set.export': 'बैकअप डाउनलोड करें', 'set.import': 'बैकअप से वापस लाएँ', 'set.imported': 'बैकअप वापस आ गया।', 'set.importBad': 'यह फ़र्श का बैकअप नहीं है।',
  'set.reset': 'नमूना दुकान लोड करें', 'set.resetSub': 'आपके प्रोडक्ट की जगह नमूना दुकान आएगी। सेटिंग्स बनी रहेंगी। ज़रूरत हो तो पहले बैकअप लें।',
  'set.resetDone': 'नमूना दुकान लोड हुई।', 'set.resetConfirm': 'अपने सारे प्रोडक्ट की जगह नमूना दुकान लाएँ?',
};
