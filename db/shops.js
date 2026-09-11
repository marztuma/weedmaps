/* Every shop is a delivery service — this product has no pickup.
   Names are real businesses; every rating, fee, window and menu figure is demo data. */

export const SHOPS = [
  // state, name, area, license, rating, reviews, live, window, etaMin, etaMax, minOrder, fee, freeOver, menu, deal
  // California
  ["CA", "Grassdoor", "Greater LA", "Adult use · C9", 4.5, 8210, true, "Until 11:00 PM", 45, 90, 5000, 0, 6000, 1180, "Free delivery over $60"],
  ["CA", "Amuse", "LA · OC", "Adult use · C9", 4.3, 6455, true, "Until 10:00 PM", 60, 120, 4000, 500, 8000, 940, null],
  ["CA", "Eaze", "Statewide", "Adult use · C9", 4.4, 12903, true, "Until 9:00 PM", 60, 120, 3500, 500, 7500, 1420, "20% off first order"],
  ["CA", "Emjay", "LA Metro", "Adult use · C9", 4.6, 5177, true, "Until 11:00 PM", 30, 60, 3000, 0, 5000, 760, "Under 60 min or it's free"],
  ["CA", "Kushagram", "LA · OC · IE", "Adult use · C9", 4.2, 3318, true, "Until 12:00 AM", 50, 100, 3000, 700, 10000, 812, "15% off orders over $100"],
  ["CA", "Driven by STIIIZY", "LA Metro", "Adult use · C9", 4.5, 4402, true, "Until 10:00 PM", 45, 75, 5000, 0, 5000, 690, null],
  ["CA", "Ganja Goddess", "Statewide", "Adult use · C9", 4.1, 2288, true, "Until 8:00 PM", 90, 180, 6000, 0, 6000, 1015, null],
  ["CA", "Onit Delivery", "South Bay", "Adult use · C9", 4.4, 1876, true, "Until 10:00 PM", 40, 80, 3500, 600, 9000, 548, "BOGO pre-rolls"],
  ["CA", "Sweet Flower", "Melrose · Westwood", "Adult use · C10", 4.8, 1247, true, "Until 10:00 PM", 35, 50, 5000, 0, 5000, 612, "20% off first order"],
  ["CA", "Catalyst", "Florence · Long Beach", "Adult use · C10", 4.5, 5108, true, "Until 10:00 PM", 30, 45, 2500, 400, 7500, 704, "$1 pre-roll with any order"],
  ["CA", "Erba Markets", "Venice · Mid-City", "Adult use · C10", 4.6, 1942, true, "Until 10:00 PM", 40, 65, 4500, 0, 4500, 447, null],
  ["CA", "From The Earth", "Santa Ana", "Adult use · C10", 4.7, 2154, true, "Until 10:00 PM", 45, 70, 4000, 500, 8000, 523, "BOGO pre-rolls"],
  ["CA", "The Pottery", "Mid-City", "Adult use · C10", 4.7, 1633, true, "Until 9:30 PM", 50, 75, 5000, 0, 5000, 389, null],
  ["CA", "Green Qween", "DTLA", "Adult use · C10", 4.9, 876, true, "Until 8:00 PM", 40, 60, 6000, 0, 6000, 291, null],
  ["CA", "Cookies Melrose", "Fairfax", "Adult use · C10", 4.6, 3902, true, "Until 9:00 PM", 35, 60, 4000, 500, 8000, 438, null],
  ["CA", "Urbn Leaf", "Culver City", "Adult use · C10", 4.4, 2871, false, "Opens 8:00 AM", 45, 80, 3500, 600, 9000, 566, "25% off concentrates"],
  ["CA", "MedMen", "Abbot Kinney", "Adult use · C10", 4.1, 4126, false, "Opens 9:00 AM", 50, 90, 4000, 500, 8000, 355, null],
  ["CA", "Stone Road Delivery", "Hollywood", "Adult use · C9", 4.3, 1104, true, "Until 11:00 PM", 40, 70, 3000, 500, 7000, 402, null],

  // Colorado
  ["CO", "High Country Delivery", "Denver", "Adult use · C9", 4.6, 3421, true, "Until 10:00 PM", 35, 60, 4500, 250, 7500, 845, "Free delivery over $75"],
  ["CO", "Peak Cannabis Co", "Boulder", "Adult use · C10", 4.7, 2156, true, "Until 9:00 PM", 30, 50, 3500, 0, 5000, 612, "20% off first time"],
  ["CO", "Rocky Mountain Herb", "Fort Collins", "Adult use · C9", 4.4, 1876, true, "Until 11:00 PM", 45, 75, 4000, 300, 6000, 534, null],
  ["CO", "Mile High Delivery", "Aurora", "Adult use · C10", 4.5, 2342, true, "Until 10:30 PM", 40, 70, 3500, 400, 7000, 723, "15% off concentrates"],

  // Nevada
  ["NV", "Desert Bloom Delivery", "Las Vegas", "Adult use · C9", 4.5, 2876, true, "Until 11:00 PM", 40, 75, 4000, 350, 8000, 654, "Free delivery over $80"],
  ["NV", "Nevada Cannabis Co", "Henderson", "Adult use · C10", 4.6, 1945, true, "Until 10:00 PM", 35, 65, 3500, 250, 6500, 521, null],
  ["NV", "Sin City Supply", "Las Vegas Strip", "Adult use · C9", 4.3, 3421, true, "Until 12:00 AM", 50, 100, 5000, 500, 10000, 892, "Free 1oz with order"],

  // Arizona
  ["AZ", "Phoenix Flower Delivery", "Phoenix", "Adult use · C9", 4.6, 2654, true, "Until 9:00 PM", 35, 60, 3500, 300, 7000, 712, "20% off orders over $100"],
  ["AZ", "Tempe Cannabis Hub", "Tempe", "Adult use · C10", 4.4, 1832, true, "Until 8:30 PM", 40, 70, 4000, 400, 7500, 489, null],
  ["AZ", "Scottsdale Botanical", "Scottsdale", "Adult use · C10", 4.7, 1456, true, "Until 9:30 PM", 30, 50, 5000, 0, 5000, 634, "Free delivery"],

  // Oregon
  ["OR", "Portland Green Delivery", "Portland", "Adult use · C9", 4.6, 3124, true, "Until 9:00 PM", 35, 60, 3000, 200, 5500, 789, "Free delivery over $60"],
  ["OR", "Eugene Cannabis Co", "Eugene", "Adult use · C10", 4.5, 1923, true, "Until 10:00 PM", 40, 75, 3500, 300, 6000, 567, null],
  ["OR", "Salem Dispensary Delivery", "Salem", "Adult use · C9", 4.3, 1456, true, "Until 8:00 PM", 50, 90, 4000, 400, 7000, 421, "15% off pre-rolls"],
];
