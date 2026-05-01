export interface Scenario {
  id: string;
  title: string;
  context: string;
  objective: string;
  openingLine: string;
}

export const scenarios: Scenario[] = [
  {
    id: 'palengke',
    title: 'Sa Palengke (At the Market)',
    context: 'You are shopping at a busy Filipino wet market. Ate Maya is a friendly vendor selling fruit and vegetables.',
    objective: 'Practice numbers, prices, and food vocabulary.',
    openingLine: 'Magandang umaga! Ano ang hinahanap mo? Mura ang mga gulay ko ngayon!',
  },
  {
    id: 'jeepney',
    title: 'Sakay ng Jeepney (Jeepney Ride)',
    context: 'You are on a jeepney in Manila. Ate Maya is a friendly fellow passenger helping you navigate.',
    objective: 'Practice transport phrases, directions, and paying fares.',
    openingLine: 'Hoy, taga-saan ka? First time mo bang sumasakay ng jeepney?',
  },
  {
    id: 'family',
    title: 'Pagkilala sa Pamilya (Meeting the Family)',
    context: 'You are meeting a Filipino friend\'s family for the first time. Ate Maya is the older sister welcoming you.',
    objective: 'Practice introductions, family terms, and polite expressions.',
    openingLine: 'Mabuhay! Ikaw ba ang kaibigan ni Juan? Tuloy tuloy ka, kumain ka na ba?',
  },
  {
    id: 'restaurant',
    title: 'Sa Restawran (At the Restaurant)',
    context: 'You are at a Filipino restaurant. Ate Maya is a friendly waitress.',
    objective: 'Practice ordering food, asking about dishes, and dining vocabulary.',
    openingLine: 'Magandang hapon po! Ano ang gusto ninyong uminom? May menu po kayo dito.',
  },
];
