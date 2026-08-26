/* Real product listings from weedmaps.com brand pages, by brand.

   Each entry: [name, category, subcategory, weight, strain]

   Brand pages are the only Weedmaps surface that lists products without a
   location — the category pages are geo-gated and return nothing. Everything
   here was read from the brand's own page; prices and potency are still
   demonstration figures, as the footer discloses.

   To add a brand: append a block, then run `npm run brands:fill`. */

export const BRAND_LISTINGS = {
  Rove: [
    ["Maui Waui | Melted Diamond Live Resin Vaporizer", "vape", "Disposables", "1g", "Sativa"],
    ["Skywalker OG | Melted Diamond Live Resin Vaporizer", "vape", "Disposables", "1g", "Indica"],
    ["Fruit Punch | Melted Diamond Live Resin Vaporizer", "vape", "Disposables", "1g", "Hybrid"],
    ["Apple Jack | Melted Diamond Live Resin Vaporizer", "vape", "Disposables", "1g", "Sativa"],
    ["Blue Dream | Melted Diamond Live Resin Vaporizer", "vape", "Disposables", "1g", "Sativa"],
    ["Cherry Gelato | Melted Diamond Live Resin Vaporizer", "vape", "Disposables", "1g", "Hybrid"],
    ["Apple Jack | Melted Diamond Reload Pod", "vape", "Pods", "1g", "Sativa"],
    ["Blue Dream | Melted Diamond Reload Pod", "vape", "Pods", "1g", "Sativa"],
    ["Cherry Gelato | Melted Diamond Reload Pod", "vape", "Pods", "1g", "Hybrid"],
    ["Ape | ROVE Classics", "vape", "Cartridges", "1g", "Indica"],
    ["Bellini | ROVE Classics", "vape", "Cartridges", "1g", "Sativa"],
    ["Diamond Series Battery — BD Blue", "vape", "Batteries", "1 unit", "Accessory"],
    ["Diamond Series Battery — FP Pink", "vape", "Batteries", "1 unit", "Accessory"],
    ["Diamond Series Battery — GDP Purple", "vape", "Batteries", "1 unit", "Accessory"],
    ["Diamond Series Battery — PE Orange", "vape", "Batteries", "1 unit", "Accessory"],
    ["Apple Fritter | Infused Ice Packs", "pre-rolls", "Infused pre-rolls", "5 × 0.6g", "Hybrid"],
    ["Maui Waui | Infused Ice Packs", "pre-rolls", "Infused pre-rolls", "5 × 0.6g", "Sativa"],
    ["Watermelon Burst | Infused Ice Packs", "pre-rolls", "Infused pre-rolls", "5 × 0.6g", "Hybrid"],
    ["Acapulco Gold | Infused Ice Packs", "pre-rolls", "Infused pre-rolls", "5 × 0.5g", "Sativa"],
  ],
};
