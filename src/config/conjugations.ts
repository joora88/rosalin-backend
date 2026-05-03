export interface VerbForms {
  affix: string;
  infinitive: string;
  completed: string;
  incomplete: string;
  contemplated: string;
}

export interface ConjugationVerb {
  id: string;
  root: string;
  english: string;
  category: string;
  actorFocus?: VerbForms;
  objectFocus?: VerbForms;
  locativeFocus?: VerbForms;
  beneficiaryFocus?: VerbForms;
  notes?: string;
}

export const conjugationVerbs: ConjugationVerb[] = [
  // ─── um- actor-focus verbs ───────────────────────────────────────────────
  {
    id: 'kain',
    root: 'kain',
    english: 'to eat',
    category: 'daily actions',
    actorFocus: {
      affix: 'um-',
      infinitive: 'kumain',
      completed: 'kumain',
      incomplete: 'kumakain',
      contemplated: 'kakain',
    },
    objectFocus: {
      affix: '-in',
      infinitive: 'kainin',
      completed: 'kinain',
      incomplete: 'kinakain',
      contemplated: 'kakainin',
    },
    locativeFocus: {
      affix: '-an',
      infinitive: 'kainan',
      completed: 'kinainan',
      incomplete: 'kinakainan',
      contemplated: 'kakainan',
    },
    notes: 'For um- verbs, the infinitive and completed forms are identical.',
  },
  {
    id: 'inom',
    root: 'inom',
    english: 'to drink',
    category: 'daily actions',
    actorFocus: {
      affix: 'um-',
      infinitive: 'uminom',
      completed: 'uminom',
      incomplete: 'umiinom',
      contemplated: 'iinom',
    },
    objectFocus: {
      affix: '-in',
      infinitive: 'inumin',
      completed: 'ininom',
      incomplete: 'iniinom',
      contemplated: 'iinumin',
    },
  },
  {
    id: 'lakad',
    root: 'lakad',
    english: 'to walk',
    category: 'movement',
    actorFocus: {
      affix: 'um-',
      infinitive: 'lumakad',
      completed: 'lumakad',
      incomplete: 'lumalakad',
      contemplated: 'lalakad',
    },
  },
  {
    id: 'upo',
    root: 'upo',
    english: 'to sit',
    category: 'movement',
    actorFocus: {
      affix: 'um-',
      infinitive: 'umupo',
      completed: 'umupo',
      incomplete: 'umuupo',
      contemplated: 'uupo',
    },
  },
  {
    id: 'alis',
    root: 'alis',
    english: 'to leave',
    category: 'movement',
    actorFocus: {
      affix: 'um-',
      infinitive: 'umalis',
      completed: 'umalis',
      incomplete: 'umaalis',
      contemplated: 'aalis',
    },
  },
  {
    id: 'dating',
    root: 'dating',
    english: 'to arrive',
    category: 'movement',
    actorFocus: {
      affix: 'um-',
      infinitive: 'dumating',
      completed: 'dumating',
      incomplete: 'dumarating',
      contemplated: 'darating',
    },
  },
  // ─── mag- actor-focus verbs ──────────────────────────────────────────────
  {
    id: 'luto',
    root: 'luto',
    english: 'to cook',
    category: 'daily actions',
    actorFocus: {
      affix: 'mag-',
      infinitive: 'magluto',
      completed: 'nagluto',
      incomplete: 'nagluluto',
      contemplated: 'magluto',
    },
    objectFocus: {
      affix: '-in',
      infinitive: 'lutuin',
      completed: 'niluto',
      incomplete: 'niluluto',
      contemplated: 'lulutuin',
    },
    locativeFocus: {
      affix: '-an',
      infinitive: 'lutuan',
      completed: 'nilutuan',
      incomplete: 'nilulutuan',
      contemplated: 'lulutuan',
    },
    beneficiaryFocus: {
      affix: 'i-',
      infinitive: 'iluto',
      completed: 'iniluto',
      incomplete: 'iniluluto',
      contemplated: 'iluluto',
    },
    notes: 'For mag- verbs, the infinitive and contemplated forms are identical.',
  },
  {
    id: 'basa',
    root: 'basa',
    english: 'to read',
    category: 'learning',
    actorFocus: {
      affix: 'mag-',
      infinitive: 'magbasa',
      completed: 'nagbasa',
      incomplete: 'nagbabasa',
      contemplated: 'magbasa',
    },
    objectFocus: {
      affix: '-in',
      infinitive: 'basahin',
      completed: 'binasa',
      incomplete: 'binabasa',
      contemplated: 'babasahin',
    },
    locativeFocus: {
      affix: '-an',
      infinitive: 'basahan',
      completed: 'binasahan',
      incomplete: 'binababasahan',
      contemplated: 'babasahan',
    },
    beneficiaryFocus: {
      affix: 'i-',
      infinitive: 'ibasa',
      completed: 'ibinasa',
      incomplete: 'ibinabasa',
      contemplated: 'ibibasa',
    },
  },
  {
    id: 'bili',
    root: 'bili',
    english: 'to buy',
    category: 'daily actions',
    actorFocus: {
      affix: 'mag-',
      infinitive: 'magbili',
      completed: 'nagbili',
      incomplete: 'nagbibili',
      contemplated: 'magbili',
    },
    objectFocus: {
      affix: '-in',
      infinitive: 'bilhin',
      completed: 'binili',
      incomplete: 'binibili',
      contemplated: 'bibilhin',
    },
    locativeFocus: {
      affix: '-an',
      infinitive: 'bilhan',
      completed: 'binilhan',
      incomplete: 'binibilhan',
      contemplated: 'bibilhan',
    },
  },
  {
    id: 'sulat',
    root: 'sulat',
    english: 'to write',
    category: 'learning',
    actorFocus: {
      affix: 'mag-',
      infinitive: 'magsulat',
      completed: 'nagsulat',
      incomplete: 'nagsusulat',
      contemplated: 'magsulat',
    },
    objectFocus: {
      affix: '-in',
      infinitive: 'sulatin',
      completed: 'sinulat',
      incomplete: 'sinusulat',
      contemplated: 'susulatin',
    },
    beneficiaryFocus: {
      affix: 'i-',
      infinitive: 'isulat',
      completed: 'isinulat',
      incomplete: 'isinusulat',
      contemplated: 'isusulat',
    },
  },
  {
    id: 'hanap',
    root: 'hanap',
    english: 'to look for / find',
    category: 'daily actions',
    actorFocus: {
      affix: 'mag-',
      infinitive: 'maghanap',
      completed: 'naghanap',
      incomplete: 'naghahanap',
      contemplated: 'maghanap',
    },
    objectFocus: {
      affix: '-in',
      infinitive: 'hanapin',
      completed: 'hinanap',
      incomplete: 'hinahanap',
      contemplated: 'hahanapin',
    },
  },
  {
    id: 'bigay',
    root: 'bigay',
    english: 'to give',
    category: 'daily actions',
    actorFocus: {
      affix: 'mag-',
      infinitive: 'magbigay',
      completed: 'nagbigay',
      incomplete: 'nagbibigay',
      contemplated: 'magbigay',
    },
    locativeFocus: {
      affix: '-an',
      infinitive: 'bigyan',
      completed: 'binigyan',
      incomplete: 'binibigyan',
      contemplated: 'bibigyan',
    },
    beneficiaryFocus: {
      affix: 'i-',
      infinitive: 'ibigay',
      completed: 'ibinigay',
      incomplete: 'ibinibigay',
      contemplated: 'ibibigay',
    },
  },
  {
    id: 'salita',
    root: 'salita',
    english: 'to speak',
    category: 'communication',
    actorFocus: {
      affix: 'mag-',
      infinitive: 'magsalita',
      completed: 'nagsalita',
      incomplete: 'nagsasalita',
      contemplated: 'magsalita',
    },
  },
  {
    id: 'trabaho',
    root: 'trabaho',
    english: 'to work',
    category: 'work & leisure',
    actorFocus: {
      affix: 'mag-',
      infinitive: 'magtrabaho',
      completed: 'nagtrabaho',
      incomplete: 'nagtatrabaho',
      contemplated: 'magtrabaho',
    },
  },
  {
    id: 'laro',
    root: 'laro',
    english: 'to play',
    category: 'work & leisure',
    actorFocus: {
      affix: 'mag-',
      infinitive: 'maglaro',
      completed: 'naglaro',
      incomplete: 'naglalaro',
      contemplated: 'maglaro',
    },
  },
];
