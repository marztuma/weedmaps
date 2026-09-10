import "server-only";
import { readFile, writeFile } from "fs/promises";
import path from "path";

/* Weekly Learn content update system
   Runs every Saturday 8 PM to refresh and add new articles
   Checks for stale content, adds new high-SEO-value articles,
   and maintains editorial freshness. */

const LEARN_DATA_PATH = path.join(process.cwd(), "data", "learn.json");
const UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

async function readLearnData() {
  try {
    const content = await readFile(LEARN_DATA_PATH, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to read learn.json:", err);
    return null;
  }
}

async function writeLearnData(data) {
  try {
    await writeFile(LEARN_DATA_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Failed to write learn.json:", err);
    return false;
  }
}

/* New article templates for automatic insertion
   Each quarter, adds fresh educational content for SEO
   Organized by priority and target keywords */

const PENDING_ARTICLES = [
  // Q4 2026 Tier 1 - Highest Impact Articles
  {
    slug: "cannabis-quality-indicators-complete-checklist",
    title: "How to Identify Premium Cannabis: Complete Quality Checklist",
    deck: "Visual guide to identifying high-quality cannabis products.",
    mins: 9,
    releaseDate: "2026-10-15", // Release in October
    sections: [
      {
        h: "What separates premium from mediocre",
        p: [
          "Quality cannabis is identifiable before you open the package. Appearance, aroma, and packaging all signal whether a grower prioritized potency, flavor, or both. Most prioritize potency alone, which produces flower that tests high and smells of nothing.",
          "Premium flower has visible trichomes (the tiny crystal-like structures), vibrant color (not brown or faded), a pungent aroma, and proper moisture (not dusty, not wet). The terpene panel, when available, confirms what your nose detects.",
          "Learning to identify quality saves money. You buy smaller quantities of good product instead of large quantities of mediocre product. After a few purchases, your eye trains fast."
        ]
      },
      {
        h: "Trichomes: The crystal structures that contain cannabinoids",
        p: [
          "Trichomes are tiny mushroom-shaped structures on cannabis flower. Each one contains cannabinoids, terpenes, and flavonoids. High-quality flower has visible, milky or amber trichomes.",
          "Milky trichomes = high THC, psychoactive. Amber trichomes = THC oxidized to CBN (more sedating). The mix determines the effect. All-clear trichomes = immature, weak potency. All-brown trichomes = overripe or old.",
          "How to check: Look at the flower closely (use a magnifying glass or macro on your phone). You should see crystalline structures covering the leaf surfaces. If the flower looks smooth and frosty, that is trichome density. If it looks wet, that is moisture, not quality."
        ]
      },
      {
        h: "Color and appearance",
        p: [
          "Fresh, quality flower is vibrant green, purple, or orange depending on genetics. Not brown. Not faded. Not dusty.",
          "Brown or rust color signals oxidation (age or poor storage). Faded color signals UV exposure or time. Dusty appearance signals loss of trichomes (old flower or rough handling).",
          "Purple, orange, or deep green are signs of proper genetics and curing. These colors fade with time, so vivid color is a good age indicator.",
          "Appearance alone is not enough (looks can be deceiving with selective lighting), but combined with aroma and trichome density, it is a strong signal."
        ]
      },
      {
        h: "Aroma: What your nose tells you",
        p: [
          "A strong aroma signals high terpene content (usually above 1.5%). Weak or no aroma signals low terpenes (poor quality, old product, or poor storage).",
          "Specific aromas predict effects: Earthy/musky = myrcene (sedating). Citrus = limonene (uplifting). Pine = pinene (clarity). Peppery = caryophyllene (pain relief).",
          "Unpleasant smells (ammonia, mold, chemical) signal problems. Mold is rare in legal products (labs test for it) but unpleasant chemical smell suggests poor extraction or contamination.",
          "Use your nose to screen products. If it smells weak or off, move on. If it smells pungent and pleasant, it usually contains what it promises."
        ]
      },
      {
        h: "Moisture content: The texture test",
        p: [
          "Quality flower has proper moisture (around 62% humidity when packaged). Overly dry flower crumbles, loses terpenes, and is harsh to smoke. Too-wet flower can develop mold.",
          "Proper moisture feels slightly sticky when squeezed gently (do not crush it). It breaks apart by hand but does not turn to powder. When smoked or vaped, it burns or vaporizes evenly.",
          "Dusty or crumbly flower has lost terpenes and potency. Too-moist flower feels sticky and can harbor mold spores (visible as white fuzz in the crevices). Both are lower quality."
        ]
      },
      {
        h: "Certificate of Analysis: The lab numbers",
        p: [
          "A COA is your proof of quality. It shows THC %, CBD %, terpene profile, and contaminant screens. High-quality products come with accessible COAs.",
          "What to check: Potency matches the label (±10% is normal). Terpenes above 1.5% (aromatic). No pesticides, heavy metals, or microbial contaminants. Sample date recent (within 3 months).",
          "A high-quality product with no COA available is a red flag. Growers confident in their product publish the results.",
          "If terpenes are listed, use them to predict aroma and effect. If potency is listed without terpenes, you have half the picture."
        ]
      },
      {
        h: "Comparing products side by side",
        p: [
          "Visual: Which has more visible crystal-like trichomes? Which is more vibrant in color?",
          "Aroma: Which smells more pungent? Which smells more like what you want (citrus for energy, earth for calm)?",
          "Feel: Which has better moisture? Which breaks apart properly?",
          "Numbers: Which has higher terpene content? Which has recent lab date?",
          "Buy small: Get an eighth (an ounce divided by 8) or less of a new product. Once you have tried it, you know if the quality matches the price."
        ]
      },
      {
        h: "Red flags that indicate lower quality",
        p: [
          "Dusty, powdery texture = old, lost terpenes, lost potency.",
          "No aroma = low terpene content = less flavorful and less effect complexity.",
          "Brown, faded, or discolored = oxidation, age, or poor storage.",
          "No COA available = producer not testing or hiding something.",
          "Extremely low price = either very old stock, lower potency, or lower quality. Suspicion is warranted.",
          "Mold, mildew smell, or visible white fuzz = health hazard, discard."
        ]
      }
    ]
  },
  // Q4 2026 Tier 2 - Medical/Wellness Articles
  {
    slug: "cannabis-for-sleep-dosing-guide-best-strains",
    title: "Cannabis for Better Sleep: Dosing Guide & Best Strains",
    deck: "Science-backed guide to using cannabis for sleep improvement.",
    mins: 10,
    releaseDate: "2026-11-01",
    sections: [
      {
        h: "Why cannabis affects sleep differently than sedatives",
        p: [
          "Cannabis does not force sleep the way benzodiazepines or barbiturates do. Instead, it reduces racing thoughts, anxiety, and muscle tension—the things that keep you awake. Remove those, and sleep often follows naturally.",
          "THC is the primary psychoactive and the one that affects sleep architecture (the stages of sleep). CBD supports relaxation without the psychoactive effect. The combination is more effective for sleep than either alone.",
          "Cannabis also increases the amount of time you spend in deep sleep (slow-wave sleep), which is the restorative stage. Over time, you may sleep more efficiently.",
          "One caveat: Regular cannabis use can suppress REM sleep (the dreaming stage). This is usually temporary and reverses with tolerance breaks, but it is worth knowing."
        ]
      },
      {
        h: "The evidence for cannabis and sleep",
        p: [
          "Research is limited but promising. Studies show THC can reduce sleep latency (time to fall asleep) and increase sleep duration. CBD appears to help with anxiety that prevents sleep.",
          "The evidence is strongest for insomnia caused by anxiety, pain, or PTSD. It is weaker for primary insomnia (insomnia without an underlying cause).",
          "Individual response varies enormously. Some people sleep perfectly on a low THC dose. Others need a higher dose or a CBD-dominant product. Some cannot sleep on cannabis at all.",
          "Long-term use is not well-studied for sleep specifically. Most evidence is short-term (weeks to months). You may benefit from tolerance breaks to re-sensitize your response."
        ]
      },
      {
        h: "Dosing for sleep",
        p: [
          "Start at 5-10mg THC one hour before bed. (Edibles take 45-90 minutes to onset; smoking/vaping takes 5-15 minutes.)",
          "Pair with CBD if possible. A 1:1 THC:CBD ratio or 1:2 CBD:THC is often more effective for sleep than pure THC.",
          "If 5-10mg does not help, increase by 5mg every 2-3 nights until you find a dose that works. Most people find their sleep dose between 5mg and 20mg.",
          "Timing: With edibles, take 1-2 hours before bed (onset is slow). With vape/smoke, 15-30 minutes before. Experiment to find when onset aligns with bedtime.",
          "Consistency matters: Taking the same dose at the same time every night produces better results than irregular use."
        ]
      },
      {
        h: "Best strains and terpenes for sleep",
        p: [
          "High myrcene strains are traditionally associated with sedation. Myrcene is found in herbal, earthy-smelling cannabis.",
          "Also look for caryophyllene and linalool, both associated with relaxation.",
          "Ideal terpene profile for sleep: High myrcene, moderate caryophyllene, some linalool, low limonene and pinene.",
          "Ideal cannabinoid profile: 1:1 or 1:2 THC:CBD. A 10mg THC + 10mg CBD combination is often more effective than 20mg THC alone.",
          "Strain examples (if available): Afghani, Northern Lights, Grandaddy Purple (all myrcene-heavy). Avoid high-limonene or high-pinene strains (these are energetic)."
        ]
      },
      {
        h: "Method of consumption matters",
        p: [
          "Edibles: 45-90 minute onset, 6-8 hour duration, often feel stronger. Best for people who want long-lasting sleep support. Worst for people who need to wake up quickly.",
          "Vape/smoke: 5-15 minute onset, 2-4 hour duration. Better if you want to sleep but might wake at 3 AM (you can re-dose). Shorter duration means you might wake at 2 AM as it wears off.",
          "Tinctures: 15-45 minute onset depending on sublingual absorption. Middle ground between edibles and smoking.",
          "Topicals: No systemic effect, so not useful for sleep.",
          "Best approach: Start with edibles for consistent, long-lasting effect. If you wake early, add a second dose of a faster-onset product."
        ]
      },
      {
        h: "Combining cannabis with sleep hygiene",
        p: [
          "Cannabis is not a replacement for sleep hygiene; it is an addition to it.",
          "Sleep hygiene: Dark, cool room (65-68°F), no screens 1 hour before bed, consistent sleep time, exercise during the day (not evening), no caffeine after 2 PM.",
          "Cannabis + good hygiene beats cannabis + poor hygiene. The combination is powerful.",
          "If you use cannabis nightly, periodically take 1-2 week breaks to reset your sleep system and prevent tolerance."
        ]
      },
      {
        h: "When cannabis might not help (and what to do instead)",
        p: [
          "Sleep apnea: Cannabis can worsen it (relaxes throat muscles). Seek a sleep study and treatment first.",
          "Circadian rhythm disorders: Cannabis might help a little, but light therapy and behavioral changes are more effective.",
          "Sleep maintenance insomnia (waking at 3 AM): A longer-acting edible or a second-dose product might help. Alternatively, CBD-dominant products may be better than high-THC.",
          "If cannabis is not working after 2-3 weeks of consistent use, try a different strain, ratio, or dose. If still not working after a month, consult a sleep specialist."
        ]
      }
    ]
  }
];

/* Check if an article is due for release
   Compares release date to current date */
function isArticleDue(article) {
  const releaseDate = new Date(article.releaseDate);
  const now = new Date();
  return now >= releaseDate;
}

/* Main update function
   Called by cron every Saturday evening
   Checks for new articles, updates stale content, maintains freshness */
export async function updateLearnContent() {
  console.log("[Learn Updater] Starting weekly update...");

  const data = await readLearnData();
  if (!data) {
    console.error("[Learn Updater] Could not read learn.json");
    return { success: false, error: "Could not read learn.json" };
  }

  let updated = false;
  let articlesAdded = 0;

  // Check for articles that are due for release
  for (const article of PENDING_ARTICLES) {
    const exists = data.reads.some((r) => r.slug === article.slug);
    if (!exists && isArticleDue(article)) {
      data.reads.push(article);
      articlesAdded++;
      updated = true;
      console.log(`[Learn Updater] Added article: ${article.title}`);
    }
  }

  // Optionally: Update timestamps or metadata on articles (future feature)
  // This could be used to track when articles were last reviewed or updated

  // Save if anything changed
  if (updated) {
    const success = await writeLearnData(data);
    if (success) {
      console.log(
        `[Learn Updater] Successfully saved. Articles added: ${articlesAdded}`
      );
      return {
        success: true,
        articlesAdded,
        timestamp: new Date().toISOString(),
      };
    } else {
      console.error("[Learn Updater] Failed to save changes");
      return { success: false, error: "Failed to save learn.json" };
    }
  }

  console.log("[Learn Updater] No updates needed this week.");
  return { success: true, articlesAdded: 0, message: "No updates needed" };
}

/* Audit function: Check article freshness and completeness
   Can be called manually to validate content quality */
export async function auditLearnContent() {
  const data = await readLearnData();
  if (!data) return null;

  const audit = {
    totalArticles: data.reads.length,
    articles: data.reads.map((article) => ({
      title: article.title,
      slug: article.slug,
      readTime: article.mins,
      sections: article.sections.length,
      hasAllFields: Boolean(
        article.title && article.slug && article.deck && article.mins
      ),
    })),
    missingContent: data.reads.filter(
      (a) => !a.title || !a.slug || !a.deck || !a.mins
    ),
  };

  return audit;
}

/* Queue new articles for future release
   Use this to add articles without immediately publishing them */
export function queueArticle(article, releaseDate) {
  const queued = {
    ...article,
    releaseDate: releaseDate.toISOString().split("T")[0],
  };
  // In a production system, this would save to a database or queue
  // For now, articles are stored in PENDING_ARTICLES above
  return queued;
}
