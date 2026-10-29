// Local keyword map for the free-text alternative on every quiz step.
// Each hit nudges the same scoring profile the multiple-choice answers use,
// so typing "cozy vanilla for winter nights" moves the shelf immediately.
// Everything here runs in the browser: no API, no network, no cost.

// effect fields (all optional, all additive):
//   family:  { key: weight }      added into the family mix
//   seasons: { key: weight }      added into the season mix
//   gender:  { key: weight }      added into the audience mix
//   occasions: { key: weight }    added into occasion weights
//   tier: number (0-3)            pulls the budget ceiling up/down
//   intensity: number (1-3)       pulls the intensity target toward this
export const KEYWORDS = [
  { re: /\b(beach|ocean|sea|marine|salty|saline|island|cruise|sailing|surf)\b/i,
    family: { aquatic: .9 }, seasons: { summer: .5 }, tag: 'aquatic and salty' },
  { re: /\b(citrus|lemon|bergamot|orange|grapefruit|zesty|zest|mandarin|neroli)\b/i,
    family: { citrus: .85 }, tag: 'bright citrus' },
  { re: /\b(fresh|crisp|clean|airy|light cologne|shower)\b/i,
    family: { citrus: .5, musk: .3 }, intensity: 1, tag: 'fresh and light' },
  { re: /\b(floral|flowers|rose|peony|jasmine|iris|tuberose|garden|petals?)\b/i,
    family: { floral: .85 }, tag: 'floral' },
  { re: /\b(woody|wood|cedar|sandal|vetiver|forest|pine|tree)\b/i,
    family: { woody: .85 }, tag: 'woody' },
  { re: /\b(spic(e|y)|cardamom|pepper|cinnamon|clove|saffron|smok(e|y)|incense|oud)\b/i,
    family: { amber: .85 }, tag: 'spiced' },
  { re: /\b(amber|ambergris|resin|warm|cozy|balsamic|tobacco)\b/i,
    family: { amber: .7 }, seasons: { winter: .3 }, tag: 'warm amber' },
  { re: /\b(sweet|vanilla|dessert|praline|caramel|chocolate|coffee|espresso|candy|gourmand|baklava|pastry)\b/i,
    family: { gourmand: .85 }, tag: 'sweet gourmand' },
  { re: /\b(musk|musky|skin ?scent|soapy|powder|powdery|baby|laundry)\b/i,
    family: { musk: .8 }, intensity: 1, tag: 'clean musk' },

  { re: /\b(summer|hot|heat|tropical|vacation|holiday|pool)\b/i,
    seasons: { summer: .8, spring: .3 }, intensity: 1, tag: 'made for heat' },
  { re: /\b(winter|cold|snow|christmas|noel|december)\b/i,
    seasons: { winter: .8, autumn: .3 }, tag: 'built for cold' },
  { re: /\b(autumn|fall|halloween|sweater)\b/i,
    seasons: { autumn: .8 }, tag: 'autumn layers' },
  { re: /\b(spring|blossom|bloom|garden party|easter)\b/i,
    seasons: { spring: .8 }, tag: 'spring air' },

  { re: /\b(office|work|meeting|meeting|interview|professional|corporate|salaryman|business|boss|client)\b/i,
    occasions: { office: .9 }, intensity: 1, tag: 'office-safe' },
  { re: /\b(night|evening|club|party|clubbing|concert|bar|lounge)\b/i,
    occasions: { evening: .9 }, intensity: 3, tag: 'after dark' },
  { re: /\b(date|romantic|romance|anniversary|dinner|seducti(ve|on)|valentine)\b/i,
    occasions: { date: .9 }, tag: 'date-night' },
  { re: /\b(weekend|casual|errands|saturday|sunday|everyday|daily|school|uni|college|gym|sport)\b/i,
    occasions: { casual: .85 }, intensity: 1, tag: 'everyday easy' },
  { re: /\b(wedding|gala|opera|award|black tie|ceremony|graduation|formal)\b/i,
    occasions: { special: .9 }, tag: 'big occasion' },

  { re: /\b(men|man|male|masculine|gentleman|for him|husband|boyfriend|bro)\b/i,
    gender: { m: .8 }, tag: 'masculine lean' },
  { re: /\b(women|woman|female|feminine|lady|for her|wife|girlfriend|girlie)\b/i,
    gender: { f: .8 }, tag: 'feminine lean' },
  { re: /\b(unisex|anyone|anybody|shared|neutral|couple|both)\b/i,
    gender: { u: .8 }, tag: 'unisex' },

  { re: /\b(cheap|budget|student|affordable|under 50|broke|bargain|dupes?)\b/i,
    tier: 1, tag: 'budget-friendly' },
  { re: /\b(mid.?range|reasonable|sensible|under 120)\b/i, tier: 2, tag: 'mid-range budget' },
  { re: /\b(luxur(y|ious)|niche|expensive|designer|splurge|premium|no limit|rich|oligarch)\b/i,
    tier: 3, tag: 'splurge welcome' },

  { re: /\b(quiet|subtle|whisper|intimate|discreet|understated|projectionless|soft)\b/i,
    intensity: 1, tag: 'a quiet one' },
  { re: /\b(loud|beast|strong|powerful|fill(s|ed)? the room|projection|noticeable)\b/i,
    intensity: 3, tag: 'room-filling' },
  { re: /\b(moderate|polite|balanced|medium)\b/i, intensity: 2, tag: 'polite presence' },

  { re: /\b(old money|timeless|classic|vintage|heritage|grandpa|grandma|nostalg)\b/i,
    family: { woody: .35, musk: .3 }, intensity: 2, tag: 'timeless classics' },
  { re: /\b(compliment|magnet|turn heads|stand out|attention)\b/i,
    intensity: 3, tag: 'compliment-seeking' },
  { re: /\b(blind buy|first (perfume|bottle|fragrance)|beginner|starter)\b/i,
    intensity: 1, occasions: { office: .5, casual: .5 }, tag: 'beginner-safe' }
];

// Analyze one free-text string into profile contributions + human-readable tags.
export function analyzeText(text) {
  const out = { family: {}, seasons: {}, gender: {}, occasions: {}, tier: 0, intensity: 0, tags: [] };
  if (!text || !text.trim()) return out;
  for (const kw of KEYWORDS) {
    if (kw.re.test(text)) {
      if (kw.family) for (const [k, v] of Object.entries(kw.family)) out.family[k] = (out.family[k] || 0) + v;
      if (kw.seasons) for (const [k, v] of Object.entries(kw.seasons)) out.seasons[k] = (out.seasons[k] || 0) + v;
      if (kw.gender) for (const [k, v] of Object.entries(kw.gender)) out.gender[k] = (out.gender[k] || 0) + v;
      if (kw.occasions) for (const [k, v] of Object.entries(kw.occasions)) out.occasions[k] = (out.occasions[k] || 0) + v;
      if (kw.tier) out.tier = Math.max(out.tier, kw.tier);
      if (kw.intensity) out.intensity = Math.max(out.intensity, kw.intensity);
      out.tags.push(kw.tag);
    }
  }
  return out;
}
