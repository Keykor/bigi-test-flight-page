"use client"

import { useExperimentStore } from "./experiment-store"
import type { Flight, IterationConfig, SearchParameters, OfferConfig } from "./types"
import { addDays, format, parseISO } from "date-fns"

// Sample iteration configurations with offer settings
const iterationsConfig: IterationConfig[] = [
  {
    id: "1",
    completed: false,
    targetFlightId: "flight-123",
    targetReturnFlightId: "return-flight-123",
    attemptsBeforeTarget: 1,
    offerConfig: {
      enabled: true,
      earlierDayOffers: true,
      laterDayOffers: true,
      discountRange: [10, 25],
      maxOffersPerType: 2,
    },
  },
  {
    id: "2",
    completed: false,
    targetFlightId: "flight-456",
    targetReturnFlightId: "return-flight-456",
    attemptsBeforeTarget: 2,
    offerConfig: {
      enabled: true,
      earlierDayOffers: false,
      laterDayOffers: true,
      discountRange: [15, 30],
      maxOffersPerType: 1,
    },
  },
  {
    id: "3",
    completed: false,
    targetFlightId: "flight-789",
    targetReturnFlightId: "return-flight-789",
    attemptsBeforeTarget: 3,
    offerConfig: {
      enabled: false,
      earlierDayOffers: false,
      laterDayOffers: false,
      discountRange: [0, 0],
      maxOffersPerType: 0,
    },
  },
]

// Sample flights data - Outbound flights
const outboundFlightsData: Flight[] = [
  {
    id: "flight-123",
    airline: "Delta Airlines",
    flightNumber: "DL1234",
    origin: "New York (JFK)",
    destination: "Los Angeles (LAX)",
    departureTime: "08:00 AM",
    arrivalTime: "11:30 AM",
    duration: "5h 30m",
    price: 349,
    stops: 0,
    class: "Economy",
    luggage: "Carry-on included",
    refundable: false,
    isTarget: true,
    departureDate: "2025-05-28",
    type: "outbound",
  },
  {
    id: "flight-456",
    airline: "United Airlines",
    flightNumber: "UA5678",
    origin: "New York (JFK)",
    destination: "San Francisco (SFO)",
    departureTime: "10:15 AM",
    arrivalTime: "01:45 PM",
    duration: "6h 30m",
    price: 429,
    stops: 0,
    class: "Economy",
    luggage: "Checked bag included",
    refundable: true,
    isTarget: true,
    departureDate: "2025-05-28",
    type: "outbound",
  },
  {
    id: "flight-789",
    airline: "American Airlines",
    flightNumber: "AA9012",
    origin: "New York (JFK)",
    destination: "Chicago (ORD)",
    departureTime: "12:30 PM",
    arrivalTime: "02:15 PM",
    duration: "2h 45m",
    price: 289,
    stops: 0,
    class: "Economy",
    luggage: "Carry-on included",
    refundable: false,
    isTarget: true,
    departureDate: "2025-05-28",
    type: "outbound",
  },
  // Non-target outbound flights
  {
    id: "flight-234",
    airline: "JetBlue",
    flightNumber: "B6789",
    origin: "New York (JFK)",
    destination: "Los Angeles (LAX)",
    departureTime: "09:45 AM",
    arrivalTime: "01:15 PM",
    duration: "6h 30m",
    price: 379,
    stops: 1,
    class: "Economy",
    luggage: "Carry-on included",
    refundable: false,
    departureDate: "2025-05-28",
    type: "outbound",
  },
  {
    id: "flight-345",
    airline: "Southwest",
    flightNumber: "WN456",
    origin: "New York (LGA)",
    destination: "Los Angeles (LAX)",
    departureTime: "07:30 AM",
    arrivalTime: "11:00 AM",
    duration: "6h 30m",
    price: 329,
    stops: 1,
    class: "Economy",
    luggage: "Two checked bags included",
    refundable: true,
    departureDate: "2025-05-28",
    type: "outbound",
  },
  {
    id: "flight-567",
    airline: "Alaska Airlines",
    flightNumber: "AS789",
    origin: "New York (JFK)",
    destination: "Los Angeles (LAX)",
    departureTime: "02:15 PM",
    arrivalTime: "05:45 PM",
    duration: "6h 30m",
    price: 399,
    stops: 0,
    class: "Premium Economy",
    luggage: "Checked bag included",
    refundable: false,
    departureDate: "2025-05-28",
    type: "outbound",
  },
]

// Sample flights data - Return flights
const returnFlightsData: Flight[] = [
  {
    id: "return-flight-123",
    airline: "Delta Airlines",
    flightNumber: "DL5678",
    origin: "Los Angeles (LAX)",
    destination: "New York (JFK)",
    departureTime: "02:00 PM",
    arrivalTime: "10:30 PM",
    duration: "5h 30m",
    price: 359,
    stops: 0,
    class: "Economy",
    luggage: "Carry-on included",
    refundable: false,
    isTarget: true,
    departureDate: "2025-06-02",
    type: "return",
  },
  {
    id: "return-flight-456",
    airline: "United Airlines",
    flightNumber: "UA9012",
    origin: "San Francisco (SFO)",
    destination: "New York (JFK)",
    departureTime: "04:15 PM",
    arrivalTime: "12:45 AM",
    duration: "5h 30m",
    price: 439,
    stops: 0,
    class: "Economy",
    luggage: "Checked bag included",
    refundable: true,
    isTarget: true,
    departureDate: "2025-06-02",
    type: "return",
  },
  {
    id: "return-flight-789",
    airline: "American Airlines",
    flightNumber: "AA3456",
    origin: "Chicago (ORD)",
    destination: "New York (JFK)",
    departureTime: "06:30 PM",
    arrivalTime: "09:15 PM",
    duration: "2h 45m",
    price: 299,
    stops: 0,
    class: "Economy",
    luggage: "Carry-on included",
    refundable: false,
    isTarget: true,
    departureDate: "2025-06-02",
    type: "return",
  },
  // Non-target return flights
  {
    id: "return-flight-234",
    airline: "JetBlue",
    flightNumber: "B6345",
    origin: "Los Angeles (LAX)",
    destination: "New York (JFK)",
    departureTime: "11:45 AM",
    arrivalTime: "08:15 PM",
    duration: "5h 30m",
    price: 389,
    stops: 1,
    class: "Economy",
    luggage: "Carry-on included",
    refundable: false,
    departureDate: "2025-06-02",
    type: "return",
  },
  {
    id: "return-flight-345",
    airline: "Southwest",
    flightNumber: "WN789",
    origin: "Los Angeles (LAX)",
    destination: "New York (LGA)",
    departureTime: "01:30 PM",
    arrivalTime: "09:00 PM",
    duration: "5h 30m",
    price: 339,
    stops: 1,
    class: "Economy",
    luggage: "Two checked bags included",
    refundable: true,
    departureDate: "2025-06-02",
    type: "return",
  },
]

// Combine all flights
const allFlightsData = [...outboundFlightsData, ...returnFlightsData]

// Store para mantener los vuelos generados dinámicamente
let generatedFlightsCache: { [key: string]: Flight[] } = {}

// Helper function to generate offer flights
function generateOfferFlights(baseFlights: Flight[], originalDate: string, offerConfig: OfferConfig): Flight[] {
  if (!offerConfig.enabled) return []

  const offerFlights: Flight[] = []
  const originalDateObj = parseISO(originalDate)

  // Generate earlier day offers
  if (offerConfig.earlierDayOffers) {
    const earlierDate = addDays(originalDateObj, -1)
    const earlierDateStr = format(earlierDate, "yyyy-MM-dd")

    const earlierOffers = baseFlights.slice(0, offerConfig.maxOffersPerType).map((flight, index) => {
      const discountPercentage = Math.floor(
        Math.random() * (offerConfig.discountRange[1] - offerConfig.discountRange[0] + 1) +
          offerConfig.discountRange[0],
      )
      const discountedPrice = Math.round(flight.price * (1 - discountPercentage / 100))

      return {
        ...flight,
        id: `${flight.id}-earlier-${index}`,
        departureDate: earlierDateStr,
        originalDate: originalDate,
        dateOffset: -1,
        isOffer: true,
        offerType: "earlier" as const,
        price: discountedPrice,
        discountPercentage,
        flightNumber: `${flight.flightNumber}E`, // Add suffix to distinguish
      }
    })

    offerFlights.push(...earlierOffers)
  }

  // Generate later day offers
  if (offerConfig.laterDayOffers) {
    const laterDate = addDays(originalDateObj, 1)
    const laterDateStr = format(laterDate, "yyyy-MM-dd")

    const laterOffers = baseFlights.slice(0, offerConfig.maxOffersPerType).map((flight, index) => {
      const discountPercentage = Math.floor(
        Math.random() * (offerConfig.discountRange[1] - offerConfig.discountRange[0] + 1) +
          offerConfig.discountRange[0],
      )
      const discountedPrice = Math.round(flight.price * (1 - discountPercentage / 100))

      return {
        ...flight,
        id: `${flight.id}-later-${index}`,
        departureDate: laterDateStr,
        originalDate: originalDate,
        dateOffset: 1,
        isOffer: true,
        offerType: "later" as const,
        price: discountedPrice,
        discountPercentage,
        flightNumber: `${flight.flightNumber}L`, // Add suffix to distinguish
      }
    })

    offerFlights.push(...laterOffers)
  }

  return offerFlights
}

// Get available iterations (marking completed ones)
export function getAvailableIterations(): IterationConfig[] {
  const { completedIterations } = useExperimentStore.getState()

  return iterationsConfig.map((iteration) => ({
    ...iteration,
    completed: completedIterations.includes(iteration.id),
  }))
}

// Get iteration config by ID
export function getIterationConfig(iterationId: string): IterationConfig | undefined {
  return iterationsConfig.find((iteration) => iteration.id === iterationId)
}

// Get outbound flights based on iteration and search parameters
export function getOutboundFlightsForIteration(iterationId: string, searchParams: SearchParameters): Flight[] {
  const iteration = getIterationConfig(iterationId)

  if (!iteration) return []

  // Crear una clave única para el cache
  const cacheKey = `outbound-${iterationId}-${searchParams.departure}-${searchParams.destination}-${searchParams.date}`

  // Si ya tenemos los vuelos en cache, devolverlos
  if (generatedFlightsCache[cacheKey]) {
    return generatedFlightsCache[cacheKey]
  }

  // Actualizar las fechas de salida de los vuelos según la fecha de búsqueda
  const flightsWithUpdatedDates = outboundFlightsData.map((flight) => ({
    ...flight,
    departureDate: searchParams.date || flight.departureDate || "2025-05-28",
  }))

  // Filter flights based on departure and destination
  const matchingFlights = flightsWithUpdatedDates.filter(
    (flight) =>
      flight.origin.toLowerCase().includes(searchParams.departure.toLowerCase()) ||
      flight.destination.toLowerCase().includes(searchParams.destination.toLowerCase()),
  )

  // If no matching flights, return some default flights
  const baseFlights =
    matchingFlights.length === 0 ? shuffleArray(flightsWithUpdatedDates).slice(0, 3) : matchingFlights.slice(0, 3)

  // Always include the target flight for this iteration
  const targetFlight = flightsWithUpdatedDates.find((flight) => flight.id === iteration.targetFlightId)
  const otherFlights = baseFlights.filter((flight) => flight.id !== iteration.targetFlightId)

  // Get regular flights
  const regularFlights = targetFlight
    ? [targetFlight, ...shuffleArray(otherFlights).slice(0, 2)]
    : shuffleArray(otherFlights).slice(0, 3)

  // Generate offer flights
  const offerFlights = generateOfferFlights(
    otherFlights.slice(0, 2), // Use some base flights for offers
    searchParams.date || "2025-05-28",
    iteration.offerConfig,
  )

  // Combine regular flights and offers, shuffle the final result
  const allFlights = shuffleArray([...regularFlights, ...offerFlights])

  // Guardar en cache
  generatedFlightsCache[cacheKey] = allFlights

  return allFlights
}

// Get return flights based on iteration and search parameters
export function getReturnFlightsForIteration(
  iterationId: string,
  searchParams: SearchParameters,
  outboundFlight: Flight,
): Flight[] {
  const iteration = getIterationConfig(iterationId)

  if (!iteration) return []

  const returnDate = searchParams.returnDate || "2025-06-02"

  // Crear una clave única para el cache
  const cacheKey = `return-${iterationId}-${outboundFlight.id}-${returnDate}`

  // Si ya tenemos los vuelos en cache, devolverlos
  if (generatedFlightsCache[cacheKey]) {
    return generatedFlightsCache[cacheKey]
  }

  // Actualizar las fechas de salida de los vuelos según la fecha de vuelta
  const flightsWithUpdatedDates = returnFlightsData.map((flight) => ({
    ...flight,
    departureDate: returnDate,
    // Intercambiar origen y destino basado en el vuelo de ida
    origin: outboundFlight.destination,
    destination: outboundFlight.origin,
  }))

  // Get base flights
  const baseFlights = flightsWithUpdatedDates.slice(0, 3)

  // Always include the target return flight for this iteration
  const targetFlight = flightsWithUpdatedDates.find((flight) => flight.id === iteration.targetReturnFlightId)
  const otherFlights = baseFlights.filter((flight) => flight.id !== iteration.targetReturnFlightId)

  // Get regular flights
  const regularFlights = targetFlight
    ? [targetFlight, ...shuffleArray(otherFlights).slice(0, 2)]
    : shuffleArray(otherFlights).slice(0, 3)

  // Generate offer flights for return
  const offerFlights = generateOfferFlights(
    otherFlights.slice(0, 2), // Use some base flights for offers
    returnDate,
    iteration.offerConfig,
  )

  // Combine regular flights and offers, shuffle the final result
  const allFlights = shuffleArray([...regularFlights, ...offerFlights])

  // Guardar en cache
  generatedFlightsCache[cacheKey] = allFlights

  return allFlights
}

// Get a specific flight by ID - MEJORADA para manejar vuelos de oferta
export function getFlightById(flightId: string): Flight | undefined {
  // Primero buscar en los vuelos base
  const baseFlight = allFlightsData.find((flight) => flight.id === flightId)
  if (baseFlight) {
    return baseFlight
  }

  // Si no se encuentra, buscar en todos los vuelos generados en cache
  for (const cacheKey in generatedFlightsCache) {
    const cachedFlights = generatedFlightsCache[cacheKey]
    const foundFlight = cachedFlights.find((flight) => flight.id === flightId)
    if (foundFlight) {
      return foundFlight
    }
  }

  // Si aún no se encuentra, intentar reconstruir el vuelo de oferta desde el ID
  if (flightId.includes("-earlier-") || flightId.includes("-later-")) {
    const baseId = flightId.split("-earlier-")[0].split("-later-")[0]
    const baseFlight = allFlightsData.find((flight) => flight.id === baseId)

    if (baseFlight) {
      // Esto es un fallback, pero idealmente no debería llegar aquí
      console.warn(`Flight ${flightId} not found in cache, returning base flight as fallback`)
      return baseFlight
    }
  }

  return undefined
}

// Función para limpiar el cache (útil para testing)
export function clearFlightsCache() {
  generatedFlightsCache = {}
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}
