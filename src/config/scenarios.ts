export interface Character {
  id: string;
  name: string;
  voiceId: string;
  mood: string;
}

export interface Scenario {
  id: string;
  title: string;
  context: string;
  objective: string;
  openingLine: string;
  character: Character;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const characters: Record<string, Character> = {
  maya: {
    id: 'maya',
    name: 'Ate Maya',
    voiceId: process.env.ELEVENLABS_VOICE_ID_FEMALE || process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
    mood: 'warm and encouraging',
  },
  rico: {
    id: 'rico',
    name: 'Kuya Rico',
    voiceId: process.env.ELEVENLABS_VOICE_ID_MALE || 'ErXwobaYiN019PkySvjV',
    mood: 'friendly and easygoing',
  },
  lola: {
    id: 'lola',
    name: 'Lola Caring',
    voiceId: process.env.ELEVENLABS_VOICE_ID_LOLA || 'PLACEHOLDER_LOLA',
    mood: 'sharp-tongued and skeptical, but warms up with proper respect',
  },
  bata: {
    id: 'bata',
    name: 'Bata',
    voiceId: process.env.ELEVENLABS_VOICE_ID_BATA || 'PLACEHOLDER_BATA',
    mood: 'bluntly curious and easily amused by your mistakes',
  },
  doc: {
    id: 'doc',
    name: 'Doc Reyes',
    voiceId: process.env.ELEVENLABS_VOICE_ID_DOC || 'PLACEHOLDER_DOC',
    mood: 'impatient but professional',
  },
  guard: {
    id: 'guard',
    name: 'Manong Guard',
    voiceId: process.env.ELEVENLABS_VOICE_ID_GUARD || 'PLACEHOLDER_GUARD',
    mood: 'grumpy and suspicious, unhelpful unless addressed with exact politeness',
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
    difficulty: 'beginner',
  },
  {
    id: 'jeepney',
    title: 'Sakay ng Jeepney (Jeepney Ride)',
    context: 'You are on a jeepney in Manila. Kuya Rico is a friendly fellow passenger helping you navigate.',
    objective: 'Practice transport phrases, directions, and paying fares.',
    openingLine: 'Hoy, taga-saan ka? First time mo bang sumasakay ng jeepney?',
    character: characters.rico,
    difficulty: 'beginner',
  },
  {
    id: 'family',
    title: 'Pagkilala sa Pamilya (Meeting the Family)',
    context: "You are meeting a Filipino friend's family for the first time. Ate Maya is the older sister welcoming you.",
    objective: 'Practice introductions, family terms, and polite expressions.',
    openingLine: 'Mabuhay! Ikaw ba ang kaibigan ni Juan? Tuloy tuloy ka, kumain ka na ba?',
    character: characters.maya,
    difficulty: 'beginner',
  },
  {
    id: 'restaurant',
    title: 'Sa Restawran (At the Restaurant)',
    context: 'You are at a Filipino restaurant. Kuya Rico is a friendly waiter.',
    objective: 'Practice ordering food, asking about dishes, and dining vocabulary.',
    openingLine: 'Magandang hapon po! Ano ang gusto ninyong uminom? May menu po kayo dito.',
    character: characters.rico,
    difficulty: 'intermediate',
  },
  {
    id: 'klinika',
    title: 'Sa Klinika (At the Clinic)',
    context: 'You are sick and need to describe your symptoms to Doc Reyes at a busy barangay health clinic. Doc Reyes is overworked, speaks quickly, and has no patience for vague answers — give clear, direct responses or she will repeat herself with increasing irritation. She will ask follow-up questions about symptoms, duration, and pain level.',
    objective: 'Practice body parts, symptoms, and medical vocabulary.',
    openingLine: 'Susunod! Okay, ano ang problema mo? Mabilis lang, marami pang pasyente.',
    character: characters.doc,
    difficulty: 'intermediate',
  },
  {
    id: 'barangay',
    title: 'Sa Barangay Hall',
    context: "You need a barangay clearance. Manong Guard is sitting at the front desk and acts as the first gatekeeper. He is unhelpful by default — slow to respond, quick to say \"wala\" or \"bukas na lang\" — but responds well to formal polite Filipino and the correct honorifics. He will redirect you to the wrong window unless you ask precisely and respectfully.",
    objective: 'Practice formal phrases, bureaucratic requests, and patience vocabulary.',
    openingLine: 'Ano ang kailangan mo? Alam mo bang closed na ang window? Tanong ka muna sa tabi.',
    character: characters.guard,
    difficulty: 'intermediate',
  },
  {
    id: 'handaan',
    title: 'Sa Handaan (Birthday Party)',
    context: "You are at a Filipino birthday party. Lola Caring is a sharp-tongued elderly grandmother who immediately corners you with personal questions. She uses old-fashioned Tagalog and formal constructions, expects \"po\" and \"opo\" in every reply, and takes offense at informality. She will interrogate you about your job, salary, relationship status, and family — deflect too often and she gets suspicious. Answer respectfully and she softens.",
    objective: 'Practice personal descriptions, deflecting questions, and social vocabulary.',
    openingLine: 'Ay, ikaw ba yung banyaga? Kumain ka na? Ilang taon ka na? May asawa ka na ba?',
    character: characters.lola,
    difficulty: 'intermediate',
  },
  {
    id: 'sarisari',
    title: 'Sa Sari-Sari Store',
    context: "You are buying snacks and essentials from a sari-sari store. Bata, an 8-year-old, is minding the store while their parent is out. Bata finds your broken Filipino funny and will correct you bluntly and giggle. They use simple vocabulary mixed with kids' slang, ask random questions, and occasionally get distracted.",
    objective: 'Practice requesting items, quantities, and everyday objects.',
    openingLine: 'Ano? Ate/Kuya, hindi kita maintindihan! Hahaha. Ano ba talaga ang gusto mo?',
    character: characters.bata,
    difficulty: 'beginner',
  },
  {
    id: 'ospital_waiting',
    title: 'Sa Waiting Room (Hospital)',
    context: "You are waiting in a hospital waiting room. Lola Caring sits next to you and immediately starts describing all her ailments in vivid detail — using formal and old-fashioned Tagalog for body parts and medical terms. She expects you to listen sympathetically, respond with \"po\", and ask follow-up questions. If you seem uninterested, she gets louder.",
    objective: 'Practice listening comprehension, body parts, and sympathetic responses.',
    openingLine: 'Naku, masakit talaga ang aking tuhod! Ikaw, ano ang sakit mo? Matagal ka na rin ba dito?',
    character: characters.lola,
    difficulty: 'advanced',
  },
  {
    id: 'mall_entrance',
    title: 'Pasok sa Mall (Mall Entrance)',
    context: "You are trying to enter a mall but Manong Guard is making it difficult — claiming your bag needs extra inspection, your ID is wrong, or the entrance is VIP only today. He is not outright rude but he is clearly on a power trip. Using the right polite Filipino phrases and addressing him correctly as \"Manong\" will gradually wear him down. Impatience or informality will make him more obstructive.",
    objective: 'Practice explaining yourself, polite insistence, and formal requests.',
    openingLine: 'Sandali lang po. Bag inspection muna. Bakit walang ID? Ay, iba ang entrance mo, sir/ma\'am.',
    character: characters.guard,
    difficulty: 'advanced',
  },
];
