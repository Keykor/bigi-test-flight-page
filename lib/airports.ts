export interface Airport {
  code: string
  name: string
  city: string
  country: string
}

export const airports: Airport[] = [
  { code: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", country: "United States" },
  { code: "PEK", name: "Beijing Capital International Airport", city: "Beijing", country: "China" },
  { code: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom" },
  { code: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States" },
  { code: "CDG", name: "Paris Charles de Gaulle Airport", city: "Paris", country: "France" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany" },
  { code: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "United States" },
  { code: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong" },
  { code: "DEN", name: "Denver International Airport", city: "Denver", country: "United States" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore" },
  { code: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands" },
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States" },
  { code: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "United States" },
  { code: "CAN", name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China" },
  { code: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "United States" },
  { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand" },
  { code: "LGW", name: "London Gatwick Airport", city: "London", country: "United Kingdom" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey" },
  { code: "MIA", name: "Miami International Airport", city: "Miami", country: "United States" },
  { code: "MAD", name: "Madrid Barajas Airport", city: "Madrid", country: "Spain" },
  { code: "LAS", name: "McCarran International Airport", city: "Las Vegas", country: "United States" },
  { code: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea" },
  { code: "FCO", name: "Leonardo da Vinci–Fiumicino Airport", city: "Rome", country: "Italy" },
  { code: "SYD", name: "Sydney Airport", city: "Sydney", country: "Australia" },
  { code: "MEX", name: "Mexico City International Airport", city: "Mexico City", country: "Mexico" },
  { code: "MUC", name: "Munich Airport", city: "Munich", country: "Germany" },
  { code: "DEL", name: "Indira Gandhi International Airport", city: "Delhi", country: "India" },
  { code: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada" },
  { code: "EZE", name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina" },
  { code: "AEP", name: "Aeroparque Jorge Newbery", city: "Buenos Aires", country: "Argentina" },
  { code: "BCN", name: "Barcelona El Prat Airport", city: "Barcelona", country: "Spain" },
]

/**
 * Get an airport by its code
 * @param code - Airport code (e.g., "EZE", "MAD")
 * @returns Airport object or undefined if not found
 */
export function getAirportByCode(code: string): Airport | undefined {
  return airports.find((airport) => airport.code.toUpperCase() === code.toUpperCase())
}

/**
 * Get all airports in a specific city
 * @param city - City name (e.g., "Buenos Aires", "Madrid")
 * @returns Array of airports in that city
 */
export function getAirportsByCity(city: string): Airport[] {
  return airports.filter((airport) => airport.city.toLowerCase() === city.toLowerCase())
}

/**
 * Extract airport code from autocomplete value
 * Autocomplete format is typically "CODE - Airport Name, City"
 * @param value - Value from airport autocomplete
 * @returns Airport code or null if not found
 */
export function extractAirportCode(value: string): string | null {
  if (!value) return null

  // Try to match the pattern "CODE" at the start (e.g., "EZE - Ministro Pistarini...")
  const match = value.match(/^([A-Z]{3})/)
  if (match && match[1]) {
    return match[1]
  }

  // If exact match to a code, return it
  const upperValue = value.toUpperCase()
  if (airports.some((airport) => airport.code === upperValue)) {
    return upperValue
  }

  return null
}
