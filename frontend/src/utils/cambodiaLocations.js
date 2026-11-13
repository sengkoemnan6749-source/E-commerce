// Phnom Penh Store Hub coordinate (TechTonic Central Logistics Hub, Toul Kork St 598)
export const HUB_COORD = [11.5724, 104.8967];

const CAMBODIA_COORDINATES = [
  { keys: ['bkk', 'boeng keng kang', '310', 'chamkarmon', 'chamkar mon'], coord: [11.5475, 104.9228], label: 'BKK1 / Chamkarmon, Phnom Penh' },
  { keys: ['toul kork', 'tuol kouk', '598', '289'], coord: [11.5762, 104.8924], label: 'Toul Kork, Phnom Penh' },
  { keys: ['daun penh', 'riverfront', 'wat phnom', 'central market'], coord: [11.5706, 104.9259], label: 'Daun Penh, Phnom Penh' },
  { keys: ['7 makara', 'olympic', 'orusey'], coord: [11.5608, 104.9135], label: '7 Makara, Phnom Penh' },
  { keys: ['sen sok', 'aeon 2', 'makro', 'kmouch'], coord: [11.5994, 104.8767], label: 'Sen Sok, Phnom Penh' },
  { keys: ['mean chey', 'meanchey', 'boeng tumpun', '271', 'stung meanchey'], coord: [11.5318, 104.8992], label: 'Mean Chey, Phnom Penh' },
  { keys: ['chbar ampov', 'chba ampov', 'niroth'], coord: [11.5349, 104.9438], label: 'Chbar Ampov, Phnom Penh' },
  { keys: ['chroy changvar'], coord: [11.6083, 104.9296], label: 'Chroy Changvar, Phnom Penh' },
  { keys: ['russey keo', 'russei kaev'], coord: [11.6163, 104.9061], label: 'Russey Keo, Phnom Penh' },
  { keys: ['por senchey', 'porsenchey', 'chaom chau', 'airport'], coord: [11.5396, 104.8351], label: 'Por Senchey, Phnom Penh' },
  { keys: ['dangkao', 'dangkor'], coord: [11.4981, 104.8832], label: 'Dangkao, Phnom Penh' },
  { keys: ['preak pnov', 'prek pnov'], coord: [11.6623, 104.8615], label: 'Prek Pnov, Phnom Penh' },
  { keys: ['siem reap', 'siemreap', 'angkor'], coord: [13.3633, 103.8564], label: 'Siem Reap' },
  { keys: ['battambang'], coord: [13.0957, 103.2022], label: 'Battambang' },
  { keys: ['sihanouk', 'preah sihanouk', 'kampong som'], coord: [10.6253, 103.5234], label: 'Preah Sihanouk' },
  { keys: ['kampot'], coord: [10.6104, 104.1815], label: 'Kampot' },
  { keys: ['kep'], coord: [10.4832, 104.3167], label: 'Kep' },
  { keys: ['kampong cham'], coord: [11.9934, 105.4635], label: 'Kampong Cham' },
  { keys: ['kandal', 'ta khmau', 'takhmao'], coord: [11.4833, 104.9500], label: 'Ta Khmau, Kandal' },
  { keys: ['takeo'], coord: [10.9908, 104.7850], label: 'Takeo' },
  { keys: ['prey veng'], coord: [11.4868, 105.3253], label: 'Prey Veng' },
  { keys: ['svay rieng', 'bavet'], coord: [11.0879, 105.7993], label: 'Svay Rieng' },
  { keys: ['kampong speu'], coord: [11.4533, 104.5208], label: 'Kampong Speu' },
  { keys: ['kampong chhnang'], coord: [12.2500, 104.6667], label: 'Kampong Chhnang' },
  { keys: ['kampong thom'], coord: [12.7111, 104.8887], label: 'Kampong Thom' },
  { keys: ['pursat'], coord: [12.5388, 103.9192], label: 'Pursat' },
  { keys: ['banteay meanchey', 'poipet', 'sisophon'], coord: [13.5859, 102.9737], label: 'Banteay Meanchey' },
  { keys: ['koh kong'], coord: [11.6153, 102.9838], label: 'Koh Kong' },
  { keys: ['kratie'], coord: [12.4881, 106.0188], label: 'Kratie' },
  { keys: ['stung treng'], coord: [13.5259, 105.9683], label: 'Stung Treng' },
  { keys: ['mondulkiri', 'senmonorom'], coord: [12.4558, 107.1881], label: 'Mondulkiri' },
  { keys: ['ratanakiri', 'banlung'], coord: [13.7394, 106.9873], label: 'Ratanakiri' },
  { keys: ['preah vihear'], coord: [13.8073, 104.9805], label: 'Preah Vihear' },
  { keys: ['pailin'], coord: [12.8489, 102.6093], label: 'Pailin' },
  { keys: ['oddar meanchey', 'samraong'], coord: [14.1818, 103.5176], label: 'Oddar Meanchey' },
  { keys: ['tboung khmum', 'tbong khmum'], coord: [11.8891, 105.6612], label: 'Tboung Khmum' },
];

export function resolveDestinationCoord(shippingAddress = {}) {
  const haystack = [
    shippingAddress.address,
    shippingAddress.city,
    shippingAddress.province,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const entry of CAMBODIA_COORDINATES) {
    if (entry.keys.some((k) => haystack.includes(k))) {
      return { coord: entry.coord, label: entry.label };
    }
  }

  return {
    coord: [11.5475, 104.9228],
    label: [shippingAddress.city, shippingAddress.province].filter(Boolean).join(', ') || 'Phnom Penh',
  };
}

export function buildRouteWaypoints(destinationCoord) {
  const [lat1, lng1] = HUB_COORD;
  const [lat2, lng2] = destinationCoord || [11.5475, 104.9228];
  const steps = 7;
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const curveOffset = Math.sin(t * Math.PI) * 0.004;
    points.push([
      Number((lat1 + (lat2 - lat1) * t + curveOffset).toFixed(5)),
      Number((lng1 + (lng2 - lng1) * t).toFixed(5)),
    ]);
  }
  return points;
}

