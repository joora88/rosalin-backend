export interface Character {
  id: string;
  name: string;
  voiceId: string;
}

export interface Scenario {
  id: string;
  title: string;
  context: string;
  objective: string;
  openingLine: string;
  character: Character;
}

export const characters: Record<string, Character> = {
  maya: {
    id: 'maya',
    name: 'Ate Maya',
    voiceId: process.env.ELEVENLABS_VOICE_ID_FEMALE || process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
  },
  rico: {
    id: 'rico',
    name: 'Kuya Rico',
    voiceId: process.env.ELEVENLABS_VOICE_ID_MALE || 'ErXwobaYiN019PkySvjV',
  },
};

export const scenarios: Scenario[] = [
  {
    id: 'palengke',
    title: 'Sa Palengke (At the Market)',
    context: 'You are shopping at a busy Filipino wet market. Ate Maya is a friendly vendor selling fruit and vegetables.',
    objective: 'Practice numbers, prices, and food vocabulary.',
    openingLine: 'Magandang umaga! Ano ang hinahanap mo? Mura ang mga gulay ko ngayon!',
    character: characters.maya,
  },
  {
    id: 'jeepney',
    title: 'Sakay ng Jeepney (Jeepney Ride)',
    context: 'You are on a jeepney in Manila. Kuya Rico is a friendly fellow passenger helping you navigate.',
    objective: 'Practice transport phrases, directions, and paying fares.',
    openingLine: 'Hoy, taga-saan ka? First time mo bang sumasakay ng jeepney?',
    character: characters.rico,
  },
  {
    id: 'family',
    title: 'Pagkilala sa Pamilya (Meeting the Family)',
    context: "You are meeting a Filipino friend's family for the first time. Ate Maya is the older sister welcoming you.",
    objective: 'Practice introductions, family terms, and polite expressions.',
    openingLine: 'Mabuhay! Ikaw ba ang kaibigan ni Juan? Tuloy tuloy ka, kumain ka na ba?',
    character: characters.maya,
  },
  {
    id: 'restaurant',
    title: 'Sa Restawran (At the Restaurant)',
    context: 'You are at a Filipino restaurant. Kuya Rico is a friendly waiter.',
    objective: 'Practice ordering food, asking about dishes, and dining vocabulary.',
    openingLine: 'Magandang hapon po! Ano ang gusto ninyong uminom? May menu po kayo dito.',
    character: characters.rico,
  },
];
