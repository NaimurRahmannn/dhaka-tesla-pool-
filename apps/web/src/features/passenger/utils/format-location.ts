export type DhakaHub = {
  name: string;
  area: string;
  lat: number;
  lng: number;
};

export const DHAKA_HUBS: readonly DhakaHub[] = [
  // Gulshan, Banani & Baridhara
  { name: "Banani (Road 11)", area: "Gulshan & Banani", lat: 23.7937, lng: 90.4043 },
  { name: "Banani (Chairman Bari)", area: "Gulshan & Banani", lat: 23.7891, lng: 90.4009 },
  { name: "Gulshan 1 Circle", area: "Gulshan & Banani", lat: 23.7797, lng: 90.4184 },
  { name: "Gulshan 2 Circle", area: "Gulshan & Banani", lat: 23.7925, lng: 90.4078 },
  { name: "Baridhara DOHS", area: "Gulshan & Banani", lat: 23.8065, lng: 90.4162 },
  { name: "Baridhara Diplomatic Zone", area: "Gulshan & Banani", lat: 23.7998, lng: 90.4241 },

  // Uttara & Airport
  { name: "Hazrat Shahjalal Airport (DAC)", area: "Uttara & Airport", lat: 23.8433, lng: 90.4029 },
  { name: "Airport Railway Station", area: "Uttara & Airport", lat: 23.8517, lng: 90.4078 },
  { name: "Uttara (Sector 3 - Rajlakshmi)", area: "Uttara & Airport", lat: 23.869, lng: 90.3986 },
  { name: "Uttara (Sector 7 - Rabindra Sarani)", area: "Uttara & Airport", lat: 23.8668, lng: 90.4042 },
  { name: "Uttara (Sector 11)", area: "Uttara & Airport", lat: 23.8785, lng: 90.3887 },
  { name: "Uttara (Diabari / Metro Station)", area: "Uttara & Airport", lat: 23.8752, lng: 90.3639 },

  // Bashundhara, Kuril & Badda
  { name: "Bashundhara R/A (Gate 1 - Jamuna Future Park)", area: "Bashundhara & Badda", lat: 23.8134, lng: 90.4242 },
  { name: "Bashundhara R/A (Block D - IUB / NSU)", area: "Bashundhara & Badda", lat: 23.8103, lng: 90.4225 },
  { name: "Kuril Flyover / 300 Feet", area: "Bashundhara & Badda", lat: 23.8197, lng: 90.4227 },
  { name: "Badda (Middle Badda)", area: "Bashundhara & Badda", lat: 23.7805, lng: 90.4267 },
  { name: "Rampura Bridge", area: "Bashundhara & Badda", lat: 23.7634, lng: 90.4255 },

  // Dhanmondi & Mohammadpur
  { name: "Dhanmondi (Road 27)", area: "Dhanmondi & Mohammadpur", lat: 23.7533, lng: 90.3769 },
  { name: "Dhanmondi (Road 32 - Sukrabad)", area: "Dhanmondi & Mohammadpur", lat: 23.7516, lng: 90.3798 },
  { name: "Dhanmondi (Science Lab)", area: "Dhanmondi & Mohammadpur", lat: 23.7388, lng: 90.3837 },
  { name: "Dhanmondi (Jigatola)", area: "Dhanmondi & Mohammadpur", lat: 23.7397, lng: 90.3752 },
  { name: "Lalmatia (Block C)", area: "Dhanmondi & Mohammadpur", lat: 23.7567, lng: 90.3695 },
  { name: "Mohammadpur (Town Hall)", area: "Dhanmondi & Mohammadpur", lat: 23.7602, lng: 90.3627 },
  { name: "Mohammadpur (Asad Gate)", area: "Dhanmondi & Mohammadpur", lat: 23.7588, lng: 90.3732 },

  // Mirpur & Metro Corridor
  { name: "Mirpur 10 Circle", area: "Mirpur", lat: 23.8071, lng: 90.3686 },
  { name: "Mirpur 1 (Sony Cinema)", area: "Mirpur", lat: 23.7956, lng: 90.3537 },
  { name: "Mirpur 2 (Cricket Stadium)", area: "Mirpur", lat: 23.8042, lng: 90.3621 },
  { name: "Mirpur 12 (Bus Stand)", area: "Mirpur", lat: 23.8262, lng: 90.3643 },
  { name: "Mirpur DOHS", area: "Mirpur", lat: 23.8344, lng: 90.3671 },
  { name: "Shewrapara (Metro Station)", area: "Mirpur", lat: 23.7874, lng: 90.3733 },
  { name: "Kazipara (Metro Station)", area: "Mirpur", lat: 23.7972, lng: 90.3719 },
  { name: "Agargaon (Passport Office)", area: "Mirpur", lat: 23.7774, lng: 90.3789 },

  // Mohakhali, Tejgaon & Farmgate
  { name: "Mohakhali Wireless", area: "Central Dhaka", lat: 23.7776, lng: 90.4035 },
  { name: "Mohakhali Bus Terminal", area: "Central Dhaka", lat: 23.7735, lng: 90.4005 },
  { name: "Tejgaon (Nabisco / Industrial Area)", area: "Central Dhaka", lat: 23.7692, lng: 90.4019 },
  { name: "Farmgate (Ananda Cinema)", area: "Central Dhaka", lat: 23.7565, lng: 90.3872 },
  { name: "Karwan Bazar (Metro / CA Bhaban)", area: "Central Dhaka", lat: 23.7509, lng: 90.3934 },
  { name: "Panthapath (Square Hospital)", area: "Central Dhaka", lat: 23.7525, lng: 90.3862 },

  // Shahbagh, Motijheel & Old Dhaka
  { name: "Shahbagh / TSC", area: "South & Old Dhaka", lat: 23.738, lng: 90.3957 },
  { name: "Nilkhet (New Market)", area: "South & Old Dhaka", lat: 23.7335, lng: 90.3848 },
  { name: "Motijheel C/A (Shapla Chattar)", area: "South & Old Dhaka", lat: 23.733, lng: 90.4172 },
  { name: "Paltan / Bijoynagar", area: "South & Old Dhaka", lat: 23.7323, lng: 90.4116 },
  { name: "Kakrail (Rajmoni Cinema)", area: "South & Old Dhaka", lat: 23.7394, lng: 90.4079 },
  { name: "Shantinagar / Malibagh", area: "South & Old Dhaka", lat: 23.7441, lng: 90.4144 },
  { name: "Kamalapur Railway Station", area: "South & Old Dhaka", lat: 23.7314, lng: 90.4258 },
  { name: "Sadarghat Launch Terminal", area: "South & Old Dhaka", lat: 23.7045, lng: 90.4124 },
  { name: "Lalbagh Fort", area: "South & Old Dhaka", lat: 23.7196, lng: 90.3881 },
];

export const DHAKA_AREAS = Array.from(
  new Set(DHAKA_HUBS.map((hub) => hub.area)),
);

export function formatLocationName(
  lat?: number | string,
  lng?: number | string,
): string {
  if (lat === undefined || lng === undefined) {
    return "Dhaka Hub";
  }

  const numLat = Number(lat);
  const numLng = Number(lng);

  if (Number.isNaN(numLat) || Number.isNaN(numLng)) {
    return "Dhaka Hub";
  }

  let closestHub: DhakaHub | null = null;
  let minDistanceSq = Number.POSITIVE_INFINITY;

  for (const hub of DHAKA_HUBS) {
    const dLat = hub.lat - numLat;
    const dLng = hub.lng - numLng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestHub = hub;
    }
  }

  if (closestHub && minDistanceSq < 0.0004) {
    return closestHub.name;
  }

  return "Dhaka Hub";
}
