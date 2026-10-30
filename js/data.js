// Curated library of 40 well-known fragrances, summarized from public note
// pyramids. This is a curated shelf, not a database: tiers are rough price
// bands, seasons and occasions are consensus impressions, not measurements.

export const FAMILIES = {
  citrus:   { label: 'Citrus & fresh',  juice: '#EFD75E', chip: '#B98A00' },
  aquatic:  { label: 'Aquatic',         juice: '#7FD0D9', chip: '#1E7F8C' },
  floral:   { label: 'Floral',          juice: '#E8A7B8', chip: '#B44E6E' },
  woody:    { label: 'Woody',           juice: '#A5713F', chip: '#7A4E22' },
  amber:    { label: 'Spicy & amber',   juice: '#C96F2E', chip: '#A54E12' },
  gourmand: { label: 'Sweet gourmand',  juice: '#B5773A', chip: '#8A5220' },
  musk:     { label: 'Clean musk',      juice: '#EDE9E2', chip: '#8A857C' }
};

// family similarity, used to soften a hard one-hot pick from the quiz
export const FAMILY_AFFINITY = {
  citrus:   { aquatic: .5,  floral: .25, musk:  .2,  woody: .15, amber: .1,  gourmand: 0 },
  aquatic:  { citrus: .5,   musk:  .2,   woody: .15, floral: .15, amber: .1, gourmand: 0 },
  floral:   { musk:  .3,    citrus: .25, gourmand: .2, amber: .2, woody: .15, aquatic: .1 },
  woody:    { amber: .45,   citrus: .3,  musk:  .2,  gourmand: .15, floral: .15, aquatic: .1 },
  amber:    { gourmand: .5, woody: .45,  floral: .25, citrus: .15, musk: .1,  aquatic: 0 },
  gourmand: { amber: .5,    floral: .25, woody: .2,  musk:  .15, citrus: .1, aquatic: 0 },
  musk:     { floral: .3,   citrus: .25, aquatic: .2, woody: .2, gourmand: .1, amber: .1 }
};

export const OCCASION_LABELS = {
  office: 'the office', evening: 'evenings out', date: 'date nights',
  casual: 'casual weekends', special: 'big occasions'
};

export const FRAGRANCES = [
  {
    id: 'allure-homme-sport', name: 'Allure Homme Sport', house: 'Chanel', year: 2004, pop: 4,
    gender: 'm', tier: 3, mix: { citrus: .75, aquatic: .15, musk: .1 },
    seasons: { spring: .8, summer: .9, autumn: .5, winter: .3 },
    occasions: ['office', 'casual', 'date'], intensity: 1,
    notes: { top: ['aldehydes', 'orange', 'sea notes'], heart: ['pepper', 'neroli', 'cedar'], base: ['tonka bean', 'vetiver', 'vanilla'] },
    blurb: 'The clean citrus that behaves in a suit. Bright on the way in, quietly warm by lunch.',
    bottle: { shape: 'column', cap: 'puck', metal: 'silver', juice: '#EFD75E' }
  },
  {
    id: 'ck-one', name: 'CK One', house: 'Calvin Klein', year: 1994, pop: 4,
    gender: 'u', tier: 1, mix: { citrus: .6, musk: .3, floral: .1 },
    seasons: { spring: .8, summer: .9, autumn: .4, winter: .2 },
    occasions: ['office', 'casual'], intensity: 1,
    notes: { top: ['pineapple', 'papaya', 'bergamot'], heart: ['nutmeg', 'violet', 'jasmine'], base: ['sandawood', 'amber', 'musk'] },
    blurb: 'The unisex citrus that started the category. Shared bathroom shelf energy, in a good way.',
    bottle: { shape: 'flask', cap: 'puck', metal: 'silver', juice: '#EDE37A' }
  },
  {
    id: 'light-blue', name: 'Light Blue', house: 'Dolce & Gabbana', year: 2001, pop: 4,
    gender: 'f', tier: 1, mix: { citrus: .65, aquatic: .35 },
    seasons: { spring: .7, summer: 1, autumn: .3, winter: .1 },
    occasions: ['casual', 'office'], intensity: 1,
    notes: { top: ['sicilian lemon', 'apple', 'cedar'], heart: ['bamboo', 'jasmine', 'white rose'], base: ['cedar', 'musk', 'amber'] },
    blurb: 'Lemon granita on a Mediterranean summer. Simple, cheap, and it always smells like holiday.',
    bottle: { shape: 'classic', cap: 'puck', metal: 'silver', juice: '#BFE3EA' }
  },
  {
    id: 'terre-hermes', name: 'Terre d’Hermès', house: 'Hermès', year: 2006, pop: 4,
    gender: 'm', tier: 3, mix: { citrus: .45, woody: .55 },
    seasons: { spring: .8, summer: .6, autumn: .8, winter: .5 },
    occasions: ['office', 'date', 'evening'], intensity: 2,
    notes: { top: ['grapefruit', 'orange', 'pepper'], heart: ['flint', 'pelargonium', 'pink pepper'], base: ['vetiver', 'cedar', 'benzoin'] },
    blurb: 'Grapefruit over wet earth and vetiver. Reads as grown-up and expensive without shouting.',
    bottle: { shape: 'column', cap: 'column', metal: 'black', juice: '#C86A28' }
  },
  {
    id: 'acqua-di-gio', name: 'Acqua di Giò', house: 'Giorgio Armani', year: 1996, pop: 5,
    gender: 'm', tier: 2, mix: { aquatic: .75, citrus: .25 },
    seasons: { spring: .7, summer: 1, autumn: .4, winter: .1 },
    occasions: ['casual', 'office'], intensity: 1,
    notes: { top: ['lime', 'lemon', 'bergamot'], heart: ['sea notes', 'jasmine', 'rosemary'], base: ['white musk', 'patchouli', 'cedar'] },
    blurb: 'The ocean-in-a-bottle benchmark of the nineties. Still the safest blind buy for heat.',
    bottle: { shape: 'slab', cap: 'puck', metal: 'silver', juice: '#8FD8DC' }
  },
  {
    id: 'cool-water', name: 'Cool Water', house: 'Davidoff', year: 1988, pop: 4,
    gender: 'm', tier: 1, mix: { aquatic: .7, citrus: .3 },
    seasons: { spring: .6, summer: .9, autumn: .4, winter: .1 },
    occasions: ['office', 'casual'], intensity: 1,
    notes: { top: ['sea water', 'lavender', 'mint'], heart: ['sandalwood', 'jasmine', 'geranium'], base: ['amber', 'musk', 'oakmoss'] },
    blurb: 'The original aquatic fougère, older than most of its copycats. Under twenty and never embarrassing.',
    bottle: { shape: 'slab', cap: 'puck', metal: 'silver', juice: '#79C8D6' }
  },
  {
    id: 'dylan-blue', name: 'Dylan Blue', house: 'Versace', year: 2016, pop: 4,
    gender: 'm', tier: 2, mix: { aquatic: .55, citrus: .2, amber: .25 },
    seasons: { spring: .6, summer: .7, autumn: .6, winter: .4 },
    occasions: ['office', 'date', 'evening'], intensity: 2,
    notes: { top: ['bergamot', 'grapefruit', 'fig leaf'], heart: ['violet leaf', 'papyrus', 'patchouli'], base: ['ambroxan', 'incense', 'mineral notes'] },
    blurb: 'A aquatic fragrance with a clean sweet base. Office by day, dinner by night, one bottle.',
    bottle: { shape: 'classic', cap: 'sphere', metal: 'gold', juice: '#5B8FB5' }
  },
  {
    id: 'nautica-voyage', name: 'Nautica Voyage', house: 'Nautica', year: 2008, pop: 4,
    gender: 'm', tier: 1, mix: { aquatic: .65, citrus: .35 },
    seasons: { spring: .7, summer: .9, autumn: .4, winter: .1 },
    occasions: ['casual', 'office'], intensity: 1,
    notes: { top: ['apple', 'green leaves', 'lotus'], heart: ['dewy mimosa', 'marine notes', 'linen'], base: ['moss', 'cedarwood', 'tonka'] },
    blurb: 'Wet apple and sea breeze for the price of lunch. The classic first-bottle recommendation.',
    bottle: { shape: 'flask', cap: 'puck', metal: 'silver', juice: '#A9D9C9' }
  },
  {
    id: 'chanel-no5', name: 'N°5', house: 'Chanel', year: 1921, pop: 5,
    gender: 'f', tier: 3, mix: { floral: .7, musk: .3 },
    seasons: { spring: .4, summer: .2, autumn: .7, winter: .8 },
    occasions: ['special', 'evening'], intensity: 3,
    notes: { top: ['aldehydes', 'ylang-ylang', 'neroli'], heart: ['may rose', 'jasmine', 'iris'], base: ['sandalwood', 'vetiver', 'vanilla'] },
    blurb: 'The most famous perfume ever made. Powder, aldehydes, history. Not for blending in.',
    bottle: { shape: 'classic', cap: 'column', metal: 'silver', juice: '#EFD9B8' }
  },
  {
    id: 'miss-dior-bb', name: 'Miss Dior Blooming Bouquet', house: 'Dior', year: 2014, pop: 4,
    gender: 'f', tier: 2, mix: { floral: .8, citrus: .2 },
    seasons: { spring: .9, summer: .6, autumn: .4, winter: .2 },
    occasions: ['date', 'casual', 'office'], intensity: 2,
    notes: { top: ['sicilian mandarin', 'orange'], heart: ['peony', 'damask rose', 'apricot'], base: ['white musk', 'vetiver'] },
    blurb: 'Peony and rose with nothing sharp in it. The safe wedding-guest compliment magnet.',
    bottle: { shape: 'flask', cap: 'puck', metal: 'silver', juice: '#F2B7C6' }
  },
  {
    id: 'chance-tendre', name: 'Chance Eau Tendre', house: 'Chanel', year: 2010, pop: 4,
    gender: 'f', tier: 3, mix: { floral: .65, citrus: .35 },
    seasons: { spring: .8, summer: .7, autumn: .4, winter: .2 },
    occasions: ['office', 'date', 'casual'], intensity: 1,
    notes: { top: ['grapefruit', 'quince'], heart: ['hyacinth', 'jasmine'], base: ['white musk', 'cedar', 'amber'] },
    blurb: 'A grapefruit-and-jasmine whisper. Polite enough for any meeting, pretty enough for a date.',
    bottle: { shape: 'orb', cap: 'puck', metal: 'silver', juice: '#F6CDD4' }
  },
  {
    id: 'ysl-libre', name: 'Libre', house: 'Yves Saint Laurent', year: 2019, pop: 4,
    gender: 'f', tier: 3, mix: { amber: .5, floral: .5 },
    seasons: { spring: .4, summer: .3, autumn: .8, winter: .7 },
    occasions: ['evening', 'date'], intensity: 2,
    notes: { top: ['mandarin', 'lavender', 'black currant'], heart: ['orange blossom', 'jasmine', 'lavender'], base: ['vanilla', 'musk', 'ambergris'] },
    blurb: 'Lavender and warm orange blossom. Modern, confident, and louder than it first lets on.',
    bottle: { shape: 'slab', cap: 'column', metal: 'gold', juice: '#E9A13B' }
  },
  {
    id: 'gucci-bloom', name: 'Bloom', house: 'Gucci', year: 2017, pop: 4,
    gender: 'f', tier: 2, mix: { floral: .85, musk: .15 },
    seasons: { spring: .7, summer: .6, autumn: .5, winter: .3 },
    occasions: ['date', 'casual'], intensity: 2,
    notes: { top: ['tuberose', 'jasmine bud'], heart: ['rangoon creeper', 'jasmine'], base: ['white musk', 'sandalwood'] },
    blurb: 'A white-flower wall, tuberose in front. Unmistakably feminine and unapologetic about it.',
    bottle: { shape: 'slab', cap: 'puck', metal: 'gold', juice: '#F0A8BC' }
  },
  {
    id: 'daisy', name: 'Daisy', house: 'Marc Jacobs', year: 2007, pop: 4,
    gender: 'f', tier: 2, mix: { floral: .6, citrus: .4 },
    seasons: { spring: .9, summer: .8, autumn: .4, winter: .1 },
    occasions: ['casual', 'office'], intensity: 1,
    notes: { top: ['wild strawberry', 'violet leaf', 'blood grapefruit'], heart: ['violet', 'jasmine', 'gardenia'], base: ['white woods', 'musk', 'vanilla'] },
    blurb: 'Light violet and strawberry for young skin and warm days. The refillable-first-bottle classic.',
    bottle: { shape: 'orb', cap: 'sphere', metal: 'silver', juice: '#F5E29A' }
  },
  {
    id: 'narciso-for-her', name: 'For Her', house: 'Narciso Rodriguez', year: 2004, pop: 3,
    gender: 'f', tier: 2, mix: { musk: .65, floral: .35 },
    seasons: { spring: .5, summer: .4, autumn: .7, winter: .6 },
    occasions: ['evening', 'date'], intensity: 2,
    notes: { top: ['osmanthus', 'african orange flower'], heart: ['musk', 'amber'], base: ['vetiver', 'patchouli', 'vanilla'] },
    blurb: 'Skin but closer: clean musk with a floral shadow. Quietly one of the best date scents made.',
    bottle: { shape: 'slab', cap: 'puck', metal: 'silver', juice: '#F2D5D8' }
  },
  {
    id: 'bleu-de-chanel', name: 'Bleu de Chanel', house: 'Chanel', year: 2010, pop: 5,
    gender: 'm', tier: 3, mix: { woody: .55, citrus: .3, amber: .15 },
    seasons: { spring: .7, summer: .6, autumn: .8, winter: .7 },
    occasions: ['office', 'evening', 'date'], intensity: 2,
    notes: { top: ['grapefruit', 'lemon', 'mint'], heart: ['ginger', 'jasmine', 'nutmeg'], base: ['incense', 'sandalwood', 'cedar'] },
    blurb: 'The answer to "which one bottle for everything". Citrus opening, woody heart, never out of place.',
    bottle: { shape: 'classic', cap: 'puck', metal: 'black', juice: '#D9C98F' }
  },
  {
    id: 'oud-wood', name: 'Oud Wood', house: 'Tom Ford', year: 2007, pop: 4,
    gender: 'u', tier: 3, mix: { woody: .75, amber: .25 },
    seasons: { spring: .4, summer: .2, autumn: .8, winter: .8 },
    occasions: ['special', 'evening'], intensity: 2,
    notes: { top: ['oud', 'rosewood', 'cardamom'], heart: ['sandalwood', 'palisander', 'tonka'], base: ['amber', 'vanilla', 'tonka bean'] },
    blurb: 'Smooth expensive woods, no animalic roughness. Niche money, tailor-made for dark rooms.',
    bottle: { shape: 'column', cap: 'column', metal: 'gold', juice: '#6E4A2E' }
  },
  {
    id: 'encre-noire', name: 'Encre Noire', house: 'Lalique', year: 2006, pop: 3,
    gender: 'm', tier: 1, mix: { woody: .8, musk: .2 },
    seasons: { spring: .5, summer: .2, autumn: .8, winter: .5 },
    occasions: ['office', 'casual'], intensity: 2,
    notes: { top: ['cypress'], heart: ['vetiver', 'cashmeran'], base: ['vetiver', 'musk', 'incense'] },
    blurb: 'Inky, rooty vetiver for pocket change. Serious and a little strange, in the best way.',
    bottle: { shape: 'slab', cap: 'column', metal: 'silver', juice: '#3F4A44' }
  },
  {
    id: 'ysl-lhomme', name: 'L’Homme', house: 'Yves Saint Laurent', year: 2006, pop: 3,
    gender: 'm', tier: 2, mix: { woody: .45, citrus: .3, floral: .25 },
    seasons: { spring: .7, summer: .6, autumn: .7, winter: .5 },
    occasions: ['office', 'date'], intensity: 2,
    notes: { top: ['ginger', 'bergamot', 'lemon'], heart: ['violet leaf', 'basil', 'white pepper'], base: ['cedar', 'vetiver', 'tonka'] },
    blurb: 'Ginger and violet in a pressed shirt. The safe interview-to-dinner pick for under a hundred.',
    bottle: { shape: 'classic', cap: 'sphere', metal: 'silver', juice: '#E5D9B7' }
  },
  {
    id: 'aventus', name: 'Aventus', house: 'Creed', year: 2010, pop: 5,
    gender: 'm', tier: 3, mix: { woody: .4, citrus: .35, amber: .25 },
    seasons: { spring: .8, summer: .5, autumn: .8, winter: .4 },
    occasions: ['special', 'evening', 'date'], intensity: 3,
    notes: { top: ['pineapple', 'bergamot', 'black currant'], heart: ['birch', 'patchouli', 'moroccan jasmine'], base: ['oakmoss', 'musk', 'ambergris'] },
    blurb: 'Smoky pineapple and birch, the most talked-about bottle of the century. Batch gossip included free.',
    bottle: { shape: 'classic', cap: 'column', metal: 'black', juice: '#C9974C' }
  },
  {
    id: 'santal-33', name: 'Santal 33', house: 'Le Labo', year: 2011, pop: 4,
    gender: 'u', tier: 3, mix: { woody: .55, musk: .3, amber: .15 },
    seasons: { spring: .6, summer: .4, autumn: .8, winter: .7 },
    occasions: ['special', 'evening', 'casual'], intensity: 2,
    notes: { top: ['violet', 'cardamom'], heart: ['iris', 'papyrus', 'ambrox'], base: ['sandalwood', 'leather', 'cedarwood'] },
    blurb: 'The hipster-hotel-lobby sandalwood. Creamy, leathery, instantly recognizable to the internet.',
    bottle: { shape: 'column', cap: 'puck', metal: 'silver', juice: '#D8C49A' }
  },
  {
    id: 'la-nuit-lhomme', name: 'La Nuit de L’Homme', house: 'Yves Saint Laurent', year: 2009, pop: 4,
    gender: 'm', tier: 2, mix: { amber: .55, woody: .35, citrus: .1 },
    seasons: { spring: .4, summer: .2, autumn: .85, winter: .8 },
    occasions: ['date', 'evening'], intensity: 2,
    notes: { top: ['cardamom'], heart: ['lavender', 'cedar', 'bergamot'], base: ['vetiver', 'caraway'] },
    blurb: 'Cardamom and low light. Decades of internet consensus call it the best date-night bottle there is.',
    bottle: { shape: 'classic', cap: 'column', metal: 'silver', juice: '#56506B' }
  },
  {
    id: 'le-male', name: 'Le Male', house: 'Jean Paul Gaultier', year: 1995, pop: 5,
    gender: 'm', tier: 2, mix: { amber: .45, gourmand: .3, woody: .25 },
    seasons: { spring: .5, summer: .2, autumn: .7, winter: .85 },
    occasions: ['evening', 'date'], intensity: 3,
    notes: { top: ['mint', 'lavender', 'bergamot'], heart: ['cinnamon', 'cumin', 'orange blossom'], base: ['vanilla', 'tonka bean', 'sandalwood'] },
    blurb: 'Mint and vanilla in a sailor’s torso. Loud, sweet, nostalgic, still filling clubs thirty years on.',
    bottle: { shape: 'flask', cap: 'puck', metal: 'silver', juice: '#A6A0D8' }
  },
  {
    id: 'spicebomb-extreme', name: 'Spicebomb Extreme', house: 'Viktor & Rolf', year: 2015, pop: 4,
    gender: 'm', tier: 2, mix: { amber: .6, gourmand: .25, woody: .15 },
    seasons: { spring: .3, summer: .1, autumn: .7, winter: .9 },
    occasions: ['evening', 'date'], intensity: 3,
    notes: { top: ['black pepper', 'saffron', 'grapefruit'], heart: ['cinnamon', 'tobacco', 'cumin'], base: ['vanilla', 'tonka bean', 'amberwood'] },
    blurb: 'Cinnamon, tobacco and vanilla at full volume. Built for cold air and black coats.',
    bottle: { shape: 'orb', cap: 'column', metal: 'silver', juice: '#B05A28' }
  },
  {
    id: 'shalimar', name: 'Shalimar', house: 'Guerlain', year: 1925, pop: 3,
    gender: 'f', tier: 3, mix: { amber: .65, woody: .35 },
    seasons: { spring: .3, summer: .1, autumn: .8, winter: .8 },
    occasions: ['special', 'evening'], intensity: 3,
    notes: { top: ['bergamot', 'lemon', 'cedar'], heart: ['iris', 'jasmine', 'rose'], base: ['vanilla', 'tonka bean', 'opoponax'] },
    blurb: 'The first amber legend: vanilla, smoke and iris from 1925. Cinema in a fan-shaped bottle.',
    bottle: { shape: 'orb', cap: 'cone', metal: 'silver', juice: '#D3A96A' }
  },
  {
    id: 'br540', name: 'Baccarat Rouge 540', house: 'Maison Francis Kurkdjian', year: 2015, pop: 5,
    gender: 'u', tier: 3, mix: { amber: .7, floral: .3 },
    seasons: { spring: .6, summer: .5, autumn: .8, winter: .7 },
    occasions: ['special', 'evening', 'date'], intensity: 3,
    notes: { top: ['saffron', 'jasmine'], heart: ['amberwood', 'mineral notes'], base: ['fir resin', 'cedar'] },
    blurb: 'Saffron and sweet burnt sugar that fills every elevator. The most cloned smell of the decade.',
    bottle: { shape: 'slab', cap: 'column', metal: 'gold', juice: '#E8B04B' }
  },
  {
    id: 'prada-lhomme', name: 'L’Homme', house: 'Prada', year: 2016, pop: 3,
    gender: 'm', tier: 2, mix: { musk: .35, floral: .4, amber: .25 },
    seasons: { spring: .7, summer: .4, autumn: .6, winter: .4 },
    occasions: ['office', 'date'], intensity: 1,
    notes: { top: ['neroli', 'black pepper', 'cardamom'], heart: ['iris', 'violet', 'geranium'], base: ['patchouli', 'amber', 'cedar'] },
    blurb: 'Powdery iris, pressed collar, no noise. The cleanest office scent on this shelf.',
    bottle: { shape: 'column', cap: 'column', metal: 'silver', juice: '#EADFCB' }
  },
  {
    id: 'angel', name: 'Angel', house: 'Mugler', year: 1992, pop: 4,
    gender: 'f', tier: 2, mix: { gourmand: .75, woody: .25 },
    seasons: { spring: .4, summer: .2, autumn: .6, winter: .85 },
    occasions: ['evening', 'special'], intensity: 3,
    notes: { top: ['melon', 'cassis', 'bergamot'], heart: ['honey', 'red berries', 'cotton candy'], base: ['patchouli', 'vanilla', 'caramel'] },
    blurb: 'The perfume that invented gourmand: caramel, patchouli, fireworks. People never forget it.',
    bottle: { shape: 'orb', cap: 'puck', metal: 'silver', juice: '#6FB7E8' }
  },
  {
    id: 'black-opium', name: 'Black Opium', house: 'Yves Saint Laurent', year: 2014, pop: 4,
    gender: 'f', tier: 2, mix: { gourmand: .65, amber: .35 },
    seasons: { spring: .4, summer: .2, autumn: .8, winter: .8 },
    occasions: ['evening', 'date'], intensity: 3,
    notes: { top: ['pink pepper', 'orange blossom', 'pear'], heart: ['coffee', 'jasmine', 'licorice'], base: ['vanilla', 'patchouli', 'cedar'] },
    blurb: 'Espresso and vanilla for after dark. The club-night bestseller of the last ten years.',
    bottle: { shape: 'column', cap: 'sphere', metal: 'black', juice: '#4A3327' }
  },
  {
    id: 'one-million', name: '1 Million', house: 'Paco Rabanne', year: 2008, pop: 5,
    gender: 'm', tier: 2, mix: { amber: .5, gourmand: .3, musk: .2 },
    seasons: { spring: .3, summer: .1, autumn: .7, winter: .9 },
    occasions: ['evening', 'special'], intensity: 3,
    notes: { top: ['grapefruit', 'mint', 'blood mandarin'], heart: ['cinnamon', 'rose', 'spicy notes'], base: ['leather', 'amber', 'indian patchouli'] },
    blurb: 'Cinnamon, leather and a gold ingot. Immature reputation, undeniably effective projection.',
    bottle: { shape: 'slab', cap: 'column', metal: 'gold', juice: '#D4A017' }
  },
  {
    id: 'la-vie-est-belle', name: 'La Vie Est Belle', house: 'Lancôme', year: 2012, pop: 5,
    gender: 'f', tier: 2, mix: { gourmand: .7, floral: .3 },
    seasons: { spring: .5, summer: .3, autumn: .8, winter: .7 },
    occasions: ['date', 'evening'], intensity: 3,
    notes: { top: ['black currant', 'pear'], heart: ['iris', 'jasmine', 'orange blossom'], base: ['praline', 'vanilla', 'patchouli'] },
    blurb: 'Iris dipped in praline. The best-selling feminine sweet scent in Europe, and it smells like it.',
    bottle: { shape: 'orb', cap: 'sphere', metal: 'silver', juice: '#DD8F5C' }
  },
  {
    id: 'prada-candy', name: 'Candy', house: 'Prada', year: 2011, pop: 3,
    gender: 'f', tier: 2, mix: { gourmand: .85, musk: .15 },
    seasons: { spring: .3, summer: .1, autumn: .7, winter: .8 },
    occasions: ['casual', 'evening'], intensity: 2,
    notes: { top: ['caramel'], heart: ['musks', 'bourbon vanilla'], base: ['benzoin', 'tonka bean'] },
    blurb: 'Literally caramel, benzoin and musk. Cozy winter comfort with zero pretension.',
    bottle: { shape: 'slab', cap: 'puck', metal: 'gold', juice: '#C96A2E' }
  },
  {
    id: 'by-the-fireplace', name: 'By the Fireplace', house: 'Maison Margiela', year: 2015, pop: 4,
    gender: 'u', tier: 3, mix: { gourmand: .5, woody: .5 },
    seasons: { spring: .2, summer: .1, autumn: .6, winter: .95 },
    occasions: ['casual', 'evening', 'date'], intensity: 2,
    notes: { top: ['clove', 'pink pepper', 'orange blossom'], heart: ['chestnut', 'guaiac wood', 'juniper'], base: ['vanilla', 'cashmeran', 'smoke'] },
    blurb: 'Roasted chestnuts and woodsmoke. The most convincing winter-cabin illusion in a bottle.',
    bottle: { shape: 'slab', cap: 'puck', metal: 'silver', juice: '#8A5A33' }
  },
  {
    id: 'not-a-perfume', name: 'Not a Perfume', house: 'Juliette Has a Gun', year: 2010, pop: 3,
    gender: 'u', tier: 2, mix: { musk: 1 },
    seasons: { spring: .6, summer: .6, autumn: .6, winter: .6 },
    occasions: ['office', 'casual', 'date'], intensity: 1,
    notes: { top: ['cetalox'], heart: ['ambergris accord'], base: ['musks'] },
    blurb: 'One synthetic amber molecule and nothing else. The answer for scent-sensitive offices.',
    bottle: { shape: 'column', cap: 'puck', metal: 'silver', juice: '#F0EDE6' }
  },
  {
    id: 'sauvage', name: 'Sauvage', house: 'Dior', year: 2015, pop: 5,
    gender: 'm', tier: 2, mix: { amber: .4, citrus: .35, woody: .25 },
    seasons: { spring: .7, summer: .6, autumn: .8, winter: .5 },
    occasions: ['evening', 'office', 'date'], intensity: 3,
    notes: { top: ['calabrian bergamot', 'pepper'], heart: ['lavender', 'sichuan pepper', 'star anise'], base: ['ambroxan', 'vanilla', 'patchouli'] },
    blurb: 'Bergamot and ambroxan with Johnny Depp behind it. Ubiquitous, durable, instantly noticed.',
    bottle: { shape: 'classic', cap: 'column', metal: 'silver', juice: '#E3C77F' }
  },
  {
    id: 'eros', name: 'Eros', house: 'Versace', year: 2012, pop: 4,
    gender: 'm', tier: 2, mix: { gourmand: .45, citrus: .3, amber: .25 },
    seasons: { spring: .5, summer: .3, autumn: .6, winter: .8 },
    occasions: ['evening', 'date'], intensity: 3,
    notes: { top: ['mint', 'green apple', 'lemon'], heart: ['tonka bean', 'ambroxan', 'geranium'], base: ['vanilla', 'vetiver', 'oakmoss'] },
    blurb: 'Mint, apple and vanilla with gym-hall projection. Twenty-something nightlife in a column.',
    bottle: { shape: 'column', cap: 'column', metal: 'gold', juice: '#7FCFE0' }
  },
  {
    id: 'good-girl', name: 'Good Girl', house: 'Carolina Herrera', year: 2016, pop: 5,
    gender: 'f', tier: 2, mix: { amber: .45, gourmand: .35, floral: .2 },
    seasons: { spring: .4, summer: .2, autumn: .8, winter: .8 },
    occasions: ['evening', 'date', 'special'], intensity: 3,
    notes: { top: ['almond', 'coffee'], heart: ['tuberose', 'jasmine sambac'], base: ['tonka bean', 'cacao', 'vanilla'] },
    blurb: 'Almond, coffee and tuberose in a stiletto. Sweet with a backend, everywhere it goes.',
    bottle: { shape: 'flask', cap: 'cone', metal: 'gold', juice: '#C9974C' }
  },
  {
    id: 'alien', name: 'Alien', house: 'Mugler', year: 2005, pop: 4,
    gender: 'f', tier: 2, mix: { amber: .55, floral: .45 },
    seasons: { spring: .4, summer: .3, autumn: .7, winter: .7 },
    occasions: ['evening', 'special'], intensity: 3,
    notes: { top: ['jasmine sambac'], heart: ['cashmeran', 'white amber'], base: ['white amber', 'woods'] },
    blurb: 'Solar jasmine over warm amber, otherworldly by design. One spray more than you planned.',
    bottle: { shape: 'orb', cap: 'puck', metal: 'silver', juice: '#C8863B' }
  },
  {
    id: 'aqva-pour-homme', name: 'Aqva pour Homme', house: 'Bvlgari', year: 2005, pop: 3,
    gender: 'm', tier: 1, mix: { aquatic: .8, citrus: .2 },
    seasons: { spring: .6, summer: .9, autumn: .4, winter: .1 },
    occasions: ['casual', 'office'], intensity: 2,
    notes: { top: ['mandarin', 'orange', 'petitgrain'], heart: ['posidonia', 'seaweed'], base: ['vetiver', 'sage', 'amber'] },
    blurb: 'Salt and seaweed, darker and stranger than the usual blue. Summer performance for little money.',
    bottle: { shape: 'orb', cap: 'puck', metal: 'silver', juice: '#4FA8B8' }
  },
  {
    id: 'chloe-edp', name: 'Chloé Eau de Parfum', house: 'Chloé', year: 2008, pop: 4,
    gender: 'f', tier: 2, mix: { floral: .75, musk: .25 },
    seasons: { spring: .8, summer: .6, autumn: .5, winter: .2 },
    occasions: ['date', 'office', 'casual'], intensity: 2,
    notes: { top: ['peony', 'litchi', 'freesia'], heart: ['rose', 'magnolia', 'lily of the valley'], base: ['cedarwood', 'amber', 'musk'] },
    blurb: 'Rose and peony with a powder finish. Romantic but grown, the spring-blazer signature.',
    bottle: { shape: 'slab', cap: 'puck', metal: 'silver', juice: '#F1D4D2' }
  }
];

// Bespoke 3D design per bottle: form, glass finish, juice, cap and label echo
// each real bottle's iconic look. Rendered by js/bottles.js.
//
// form:    column | slab | flask | torso | orb | ingot | taper | star | ribbed | urn
// glass:   clear | frosted | tinted | opaque   (+ color when tinted/opaque)
// juice:   '#hex' or { from, to } vertical gradient
// cap:     { form: none|puck|column|sphere|dome|disc|cone, material: gold|silver|black|pearl|navy|red, h, r }
// label:   none | band | plate | plaque | tall    (+ ink color, plate color)
export const DESIGNS = {
  'allure-homme-sport': { form: 'column', h: 2.25, r: .55, glass: 'clear', cool: true, juice: { from: '#E8C24A', to: '#F6E8B0' }, cap: { form: 'puck', material: 'silver', h: .3, r: .26 }, label: 'band', ink: '#31435C' },
  'ck-one': { form: 'column', h: 2.0, r: .58, glass: 'frosted', cool: true, juice: '#E9E2C8', cap: { form: 'column', material: 'silver', h: .38, r: .24 }, label: 'band', ink: '#3A3A3E' },
  'light-blue': { form: 'column', h: 2.1, r: .56, glass: 'clear', juice: '#9FD8E8', cap: { form: 'puck', material: 'white', h: .26, r: .26 }, label: 'plate', ink: '#4A6E8A', plate: '#FDFDFB' },
  'terre-hermes': { form: 'slab', h: 2.45, r: .5, scaleX: .72, glass: 'frosted', juice: '#B4561E', cap: { form: 'column', material: 'black', h: .42, r: .19 }, label: 'none', ring: 'silver' },
  'acqua-di-gio': { form: 'slab', h: 2.2, r: .56, scaleX: .58, glass: 'clear', juice: '#8FD4DC', cap: { form: 'puck', material: 'navy', h: .3, r: .27 }, label: 'band', ink: '#2E4A66' },
  'cool-water': { form: 'column', h: 2.15, r: .57, glass: 'tinted', color: '#9FD0E4', juice: '#7FC2DC', cap: { form: 'puck', material: 'silver', h: .28, r: .27 }, label: 'band', ink: '#1E4E66' },
  'dylan-blue': { form: 'column', h: 2.3, r: .54, glass: 'tinted', color: '#3C6C9E', juice: '#2A4E78', cap: { form: 'puck', material: 'silver', h: .3, r: .26 }, ring: 'gold', label: 'band', ink: '#DDE8F2' },
  'nautica-voyage': { form: 'flask', h: 2.0, r: .72, glass: 'clear', juice: '#A8D8CC', cap: { form: 'puck', material: 'silver', h: .26, r: .25 }, label: 'band', ink: '#1E5A50' },
  'chanel-no5': { form: 'slab', h: 2.2, r: .58, scaleX: .68, glass: 'clear', juice: '#EBD9B4', cap: { form: 'column', material: 'white', h: .4, r: .2, scaleX: 1.1 }, label: 'plate', ink: '#1D1D1F', plate: '#FBFAF6' },
  'miss-dior-bb': { form: 'flask', h: 2.1, r: .68, glass: 'clear', juice: '#EEB2C4', cap: { form: 'puck', material: 'silver', h: .24, r: .24 }, ring: 'gold', label: 'plate', ink: '#8A4E62', plate: '#FBF3F5' },
  'chance-tendre': { form: 'orb', h: 1.9, r: .74, glass: 'clear', juice: '#F4C9D2', cap: { form: 'puck', material: 'silver', h: .22, r: .2 }, bandRings: ['silver'], label: 'band', ink: '#7A5E68' },
  'ysl-libre': { form: 'slab', h: 2.55, r: .46, scaleX: .5, glass: 'clear', juice: { from: '#D8963C', to: '#F0C882' }, cap: { form: 'column', material: 'gold', h: .5, r: .2 }, label: 'none', ring: 'gold' },
  'gucci-bloom': { form: 'column', h: 2.15, r: .56, glass: 'opaque', color: '#F0D2D8', juice: '#F0D2D8', cap: { form: 'puck', material: 'black', h: .3, r: .27 }, label: 'band', ink: '#6E4E56', plate: '#F6E4E8' },
  'daisy': { form: 'orb', h: 1.95, r: .72, glass: 'frosted', color: '#F4EFE8', juice: '#F2E2A8', cap: { form: 'dome', material: 'silver', h: .3, r: .3 }, label: 'none' },
  'narciso-for-her': { form: 'slab', h: 2.15, r: .54, scaleX: .6, glass: 'opaque', color: '#191319', juice: '#191319', cap: { form: 'puck', material: 'black', h: .22, r: .24 }, label: 'plate', ink: '#F2EEF2', plate: '#262028' },
  'bleu-de-chanel': { form: 'column', h: 2.3, r: .55, glass: 'tinted', color: '#1E3A5E', juice: '#2E4E78', cap: { form: 'puck', material: 'black', h: .3, r: .27 }, label: 'none' },
  'oud-wood': { form: 'column', h: 2.35, r: .5, glass: 'tinted', color: '#4A2E1C', juice: '#5A3A22', cap: { form: 'column', material: 'gold', h: .48, r: .18 }, label: 'none', ring: 'gold' },
  'encre-noire': { form: 'taper', h: 2.4, r: .5, scaleX: .55, glass: 'opaque', color: '#15181A', juice: '#15181A', cap: { form: 'column', material: 'black', h: .34, r: .17 }, label: 'plate', ink: '#C9CDD4', plate: '#1E2226' },
  'ysl-lhomme': { form: 'column', h: 2.25, r: .53, glass: 'clear', juice: '#E8DCB0', cap: { form: 'sphere', material: 'silver', h: .3, r: .24 }, label: 'band', ink: '#4A4458' },
  'aventus': { form: 'flask', h: 2.25, r: .7, glass: 'clear', juice: '#C08C3E', cap: { form: 'column', material: 'black', h: .42, r: .2 }, label: 'plaque', ink: '#DDE2E8', plate: '#14161A' },
  'santal-33': { form: 'column', h: 2.5, r: .44, glass: 'opaque', color: '#E4D6BC', juice: '#E4D6BC', cap: { form: 'puck', material: 'black', h: .2, r: .2 }, label: 'tall', ink: '#26221C', plate: '#E4D6BC' },
  'la-nuit-lhomme': { form: 'column', h: 2.3, r: .54, glass: 'tinted', color: '#2A2532', juice: '#241F2E', cap: { form: 'column', material: 'silver', h: .4, r: .19 }, label: 'none', ring: 'silver' },
  'le-male': { form: 'torso', h: 2.1, r: .62, glass: 'frosted', color: '#E8ECF6', juice: '#9A94CC', cap: { form: 'none' }, label: 'none' },
  'spicebomb-extreme': { form: 'orb', h: 1.95, r: .7, glass: 'tinted', color: '#4A2A18', juice: '#7A3E1A', cap: { form: 'puck', material: 'silver', h: .3, r: .3 }, bandRings: ['silver', 'silver'], label: 'none' },
  'shalimar': { form: 'urn', h: 2.05, r: .66, glass: 'clear', juice: '#D8A860', cap: { form: 'cone', material: 'navy', h: .4, r: .24 }, label: 'none', ring: 'gold' },
  'br540': { form: 'slab', h: 2.25, r: .56, scaleX: .8, glass: 'clear', juice: '#D89A3E', cap: { form: 'puck', material: 'gold', h: .32, r: .28 }, label: 'plate', ink: '#7A5A1E', plate: '#F6ECD4' },
  'prada-lhomme': { form: 'column', h: 2.3, r: .5, glass: 'clear', juice: '#EADFC8', cap: { form: 'disc', material: 'silver', h: .18, r: .24 }, label: 'band', ink: '#3E3E46' },
  'angel': { form: 'star', h: 1.9, r: .78, glass: 'tinted', color: '#4A8AC8', juice: '#6FB0E0', cap: { form: 'none' }, label: 'none', ring: 'silver' },
  'black-opium': { form: 'column', h: 2.4, r: .5, glass: 'tinted', color: '#17131A', speckle: '#F2EEF6', juice: '#3A2A20', cap: { form: 'sphere', material: 'pearl', h: .32, r: .26 }, label: 'none', ring: 'silver' },
  'one-million': { form: 'ingot', h: 1.7, r: .7, glass: 'opaque', color: '#C89A28', juice: '#C89A28', cap: { form: 'none' }, label: 'plaque', ink: '#5A4210', plate: '#D8AE3E' },
  'la-vie-est-belle': { form: 'flask', h: 2.15, r: .7, glass: 'clear', juice: { from: '#C07A4A', to: '#E0B070' }, cap: { form: 'sphere', material: 'silver', h: .3, r: .24 }, label: 'band', ink: '#6E4E66' },
  'prada-candy': { form: 'slab', h: 1.9, r: .56, scaleX: .7, glass: 'opaque', color: '#B8202E', juice: '#B8202E', cap: { form: 'column', material: 'gold', h: .3, r: .18 }, label: 'none', ring: 'gold' },
  'by-the-fireplace': { form: 'column', h: 2.3, r: .54, glass: 'tinted', color: '#D8CCB4', juice: '#8A5A33', cap: { form: 'puck', material: 'silver', h: .28, r: .26 }, label: 'plate', ink: '#3A322A', plate: '#F2ECDC' },
  'not-a-perfume': { form: 'column', h: 2.35, r: .46, glass: 'clear', juice: '#F0EDE6', cap: { form: 'puck', material: 'silver', h: .26, r: .22 }, label: 'band', ink: '#4A4A4E' },
  'sauvage': { form: 'column', h: 2.5, r: .5, glass: 'tinted', color: '#2A3E6E', juice: { from: '#1E325E', to: '#8FA8C8' }, cap: { form: 'column', material: 'silver', h: .34, r: .2 }, label: 'none', ring: 'silver' },
  'eros': { form: 'column', h: 2.45, r: .5, glass: 'clear', juice: '#5EC8DC', cap: { form: 'column', material: 'gold', h: .44, r: .19 }, label: 'none', ring: 'gold' },
  'good-girl': { form: 'slab', h: 2.2, r: .5, scaleX: .62, glass: 'tinted', color: '#1A1E30', juice: '#C9974C', cap: { form: 'cone', material: 'gold', h: .72, r: .16 }, label: 'none' },
  'alien': { form: 'orb', h: 1.95, r: .7, glass: 'tinted', color: '#5A3A8A', juice: '#C8863B', cap: { form: 'puck', material: 'silver', h: .24, r: .24 }, label: 'none', ring: 'silver' },
  'aqva-pour-homme': { form: 'orb', h: 1.95, r: .72, scaleX: .85, glass: 'clear', juice: '#5EB8A8', cap: { form: 'puck', material: 'silver', h: .26, r: .25 }, label: 'none', ring: 'silver' },
  'chloe-edp': { form: 'ribbed', h: 2.2, r: .54, glass: 'clear', juice: '#EFC8C4', cap: { form: 'puck', material: 'silver', h: .26, r: .26 }, label: 'band', ink: '#8A6E72' }
};
