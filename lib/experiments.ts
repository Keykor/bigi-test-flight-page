"use client"

import type { ExperimentConfig, SearchCombination, Flight, SearchParameters } from "./types"
import experimentsData from "../experiments.json"
import { extractAirportCode } from "./airports"

// Registry for dynamically injected solution flights (keyed by flight id)
const solutionFlightRegistry = new Map<string, Flight>()

// Registry for programmatically generated regular flights
const generatedFlightRegistry = new Map<string, Flight>()

interface FlightTemplate {
  airline: string
  flightNumber: string
  stops: number
  luggage: string
  refundable: boolean
  departureTime: string
  arrivalTime: string
  duration: string
}

// Per-route flight templates. Prices are assigned algorithmically at runtime by getFlightsWithCache.
// Times are local at origin/destination accounting for GRU (UTC-3) ↔ Italy (UTC+2) timezone diff.
const ROUTE_TEMPLATES: Record<string, [FlightTemplate, FlightTemplate, FlightTemplate]> = {
  "GRU-FCO": [
    { airline: "TAP Portugal",  flightNumber: "TP189",  stops: 1, luggage: "Carry-on only",  refundable: false, departureTime: "09:30", arrivalTime: "05:50+1", duration: "15h 20m" },
    { airline: "LATAM",         flightNumber: "LA8170", stops: 0, luggage: "1 checked bag",  refundable: false, departureTime: "22:15", arrivalTime: "14:45+1", duration: "11h 30m" },
    { airline: "ITA Airways",   flightNumber: "AZ673",  stops: 0, luggage: "1 checked bag",  refundable: true,  departureTime: "23:00", arrivalTime: "15:45+1", duration: "11h 45m" },
  ],
  "FCO-GRU": [
    { airline: "TAP Portugal",  flightNumber: "TP190",  stops: 1, luggage: "Carry-on only",  refundable: false, departureTime: "10:15", arrivalTime: "21:15",   duration: "16h 00m" },
    { airline: "LATAM",         flightNumber: "LA8171", stops: 0, luggage: "1 checked bag",  refundable: false, departureTime: "17:30", arrivalTime: "00:45+1", duration: "12h 15m" },
    { airline: "ITA Airways",   flightNumber: "AZ674",  stops: 0, luggage: "1 checked bag",  refundable: true,  departureTime: "19:00", arrivalTime: "02:00+1", duration: "12h 00m" },
  ],
  "GRU-PSA": [
    { airline: "KLM",           flightNumber: "KL792",  stops: 1, luggage: "Carry-on only",  refundable: false, departureTime: "08:00", arrivalTime: "05:30+1", duration: "16h 30m" },
    { airline: "Iberia",        flightNumber: "IB6531", stops: 1, luggage: "1 checked bag",  refundable: false, departureTime: "21:30", arrivalTime: "17:10+1", duration: "14h 40m" },
    { airline: "Air France",    flightNumber: "AF459",  stops: 1, luggage: "1 checked bag",  refundable: true,  departureTime: "22:45", arrivalTime: "19:00+1", duration: "15h 15m" },
  ],
  "PSA-GRU": [
    { airline: "KLM",           flightNumber: "KL793",  stops: 1, luggage: "Carry-on only",  refundable: false, departureTime: "09:45", arrivalTime: "21:55",   duration: "17h 10m" },
    { airline: "Iberia",        flightNumber: "IB6532", stops: 1, luggage: "1 checked bag",  refundable: false, departureTime: "16:30", arrivalTime: "02:20+1", duration: "14h 50m" },
    { airline: "Air France",    flightNumber: "AF460",  stops: 1, luggage: "1 checked bag",  refundable: true,  departureTime: "14:00", arrivalTime: "00:45+1", duration: "15h 45m" },
  ],
  "GRU-FLR": [
    { airline: "Turkish Airlines", flightNumber: "TK16",  stops: 1, luggage: "Carry-on only", refundable: false, departureTime: "07:15", arrivalTime: "05:25+1", duration: "17h 10m" },
    { airline: "Lufthansa",        flightNumber: "LH517", stops: 1, luggage: "1 checked bag", refundable: false, departureTime: "22:00", arrivalTime: "17:15+1", duration: "14h 15m" },
    { airline: "Swiss",            flightNumber: "LX93",  stops: 1, luggage: "1 checked bag", refundable: true,  departureTime: "23:30", arrivalTime: "19:20+1", duration: "14h 50m" },
  ],
  "FLR-GRU": [
    { airline: "Turkish Airlines", flightNumber: "TK17",  stops: 1, luggage: "Carry-on only", refundable: false, departureTime: "08:30", arrivalTime: "21:10",   duration: "17h 40m" },
    { airline: "Lufthansa",        flightNumber: "LH518", stops: 1, luggage: "1 checked bag", refundable: false, departureTime: "15:00", arrivalTime: "00:50+1", duration: "14h 50m" },
    { airline: "Swiss",            flightNumber: "LX94",  stops: 1, luggage: "1 checked bag", refundable: true,  departureTime: "16:45", arrivalTime: "02:55+1", duration: "15h 10m" },
  ],
  "GRU-NAP": [
    { airline: "Turkish Airlines", flightNumber: "TK18",   stops: 1, luggage: "Carry-on only", refundable: false, departureTime: "07:00", arrivalTime: "05:00+1", duration: "17h 00m" },
    { airline: "ITA Airways",      flightNumber: "AZ671",  stops: 1, luggage: "1 checked bag",  refundable: false, departureTime: "22:30", arrivalTime: "18:00+1", duration: "14h 30m" },
    { airline: "Air France",       flightNumber: "AF8521", stops: 1, luggage: "1 checked bag",  refundable: true,  departureTime: "21:00", arrivalTime: "17:45+1", duration: "15h 45m" },
  ],
  "NAP-GRU": [
    { airline: "Turkish Airlines", flightNumber: "TK19",   stops: 1, luggage: "Carry-on only", refundable: false, departureTime: "08:00", arrivalTime: "20:40",   duration: "17h 40m" },
    { airline: "ITA Airways",      flightNumber: "AZ672",  stops: 1, luggage: "1 checked bag",  refundable: false, departureTime: "15:00", arrivalTime: "00:00+1", duration: "14h 00m" },
    { airline: "Air France",       flightNumber: "AF8522", stops: 1, luggage: "1 checked bag",  refundable: true,  departureTime: "13:00", arrivalTime: "00:15+1", duration: "16h 15m" },
  ],
  "GRU-BLQ": [
    { airline: "KLM",       flightNumber: "KL794", stops: 1, luggage: "Carry-on only", refundable: false, departureTime: "08:30", arrivalTime: "06:15+1", duration: "16h 45m" },
    { airline: "Lufthansa", flightNumber: "LH519", stops: 1, luggage: "1 checked bag", refundable: false, departureTime: "22:45", arrivalTime: "18:30+1", duration: "14h 45m" },
    { airline: "Swiss",     flightNumber: "LX95",  stops: 1, luggage: "1 checked bag", refundable: true,  departureTime: "23:00", arrivalTime: "19:20+1", duration: "15h 20m" },
  ],
  "BLQ-GRU": [
    { airline: "KLM",       flightNumber: "KL795", stops: 1, luggage: "Carry-on only", refundable: false, departureTime: "09:00", arrivalTime: "21:20",   duration: "17h 20m" },
    { airline: "Lufthansa", flightNumber: "LH520", stops: 1, luggage: "1 checked bag", refundable: false, departureTime: "14:30", arrivalTime: "00:40+1", duration: "15h 10m" },
    { airline: "Swiss",     flightNumber: "LX96",  stops: 1, luggage: "1 checked bag", refundable: true,  departureTime: "15:45", arrivalTime: "02:35+1", duration: "15h 50m" },
  ],
}

function generateFlightsForRoute(
  departure: string,
  destination: string,
  date: string,
  type: "outbound" | "return"
): Flight[] {
  const key = `${departure.toUpperCase()}-${destination.toUpperCase()}`
  const templates = ROUTE_TEMPLATES[key]
  if (!templates) {
    console.warn(`No flight templates found for route ${key}`)
    return []
  }
  return templates.map((tpl, i) => {
    const flight: Flight = {
      id: `${departure.toLowerCase()}-${destination.toLowerCase()}-${date}-${i + 1}`,
      airline: tpl.airline,
      flightNumber: tpl.flightNumber,
      origin: departure,
      destination: destination,
      departureTime: tpl.departureTime,
      arrivalTime: tpl.arrivalTime,
      duration: tpl.duration,
      price: 0, // assigned algorithmically by getFlightsWithCache
      stops: tpl.stops,
      class: "Economy",
      luggage: tpl.luggage,
      refundable: tpl.refundable,
      departureDate: date,
      type,
    }
    generatedFlightRegistry.set(flight.id, flight)
    return flight
  })
}

export function registerSolutionFlight(id: string, flight: Flight): void {
  solutionFlightRegistry.set(id, flight)
}

export function registerGeneratedFlight(id: string, flight: Flight): void {
  generatedFlightRegistry.set(id, flight)
}

/**
 * Generate a unique cache key for a search combination
 * @param searchParams - The search parameters
 * @returns A string key identifying the combination
 */
export function getCombinationKey(searchParams: SearchParameters): string {
  const dep = extractAirportCode(searchParams.departure) ?? searchParams.departure
  const dest = extractAirportCode(searchParams.destination) ?? searchParams.destination
  return `${dep.toUpperCase()}-${dest.toUpperCase()}-${searchParams.date}-${searchParams.returnDate}`
}

/**
 * Load all experiments from the JSON configuration
 * @returns Array of experiment configurations
 */
export function loadExperiments(): ExperimentConfig[] {
  return experimentsData.experiments as ExperimentConfig[]
}

/**
 * Get a specific experiment by its ID
 * @param id - The experiment ID
 * @returns The experiment configuration or undefined if not found
 */
export function getExperimentById(id: string): ExperimentConfig | undefined {
  const experiments = loadExperiments()
  return experiments.find((exp) => exp.id === id)
}

/**
 * Find a matching search combination for the given parameters
 * @param experimentId - The experiment ID
 * @param searchParams - The search parameters (with airport codes or autocomplete values)
 * @returns The matching search combination or null if not found
 */
export function findMatchingCombination(
  experimentId: string,
  searchParams: SearchParameters
): SearchCombination | null {
  const experiment = getExperimentById(experimentId)
  if (!experiment) {
    console.error(`Experiment with ID ${experimentId} not found`)
    return null
  }

  // Extract airport codes from search parameters
  const departureCode = extractAirportCode(searchParams.departure)
  const destinationCode = extractAirportCode(searchParams.destination)

  if (!departureCode || !destinationCode) {
    console.warn("Could not extract airport codes from search parameters", {
      departure: searchParams.departure,
      destination: searchParams.destination,
    })
    return null
  }

  // Find exact match
  const match = experiment.searchCombinations.find(
    (combo) =>
      combo.departure.toUpperCase() === departureCode.toUpperCase() &&
      combo.destination.toUpperCase() === destinationCode.toUpperCase() &&
      combo.departureDate === searchParams.date &&
      combo.returnDate === searchParams.returnDate
  )

  if (!match) {
    console.warn("No matching search combination found", {
      experimentId,
      departureCode,
      destinationCode,
      dates: {
        departure: searchParams.date,
        return: searchParams.returnDate,
      },
    })
  }

  return match || null
}

/**
 * Get flights for a specific search
 * @param experimentId - The experiment ID
 * @param searchParams - The search parameters
 * @returns Object with outbound and return flights, or null if no match found
 */
export function getFlightsForSearch(
  experimentId: string,
  searchParams: SearchParameters
): { outbound: Flight[]; return: Flight[] } | null {
  const combination = findMatchingCombination(experimentId, searchParams)

  if (!combination) {
    return null
  }

  const outbound = combination.outboundFlights?.length
    ? combination.outboundFlights
    : generateFlightsForRoute(combination.departure, combination.destination, combination.departureDate, "outbound")

  const ret = combination.returnFlights?.length
    ? combination.returnFlights
    : generateFlightsForRoute(combination.destination, combination.departure, combination.returnDate, "return")

  return { outbound, return: ret }
}

/**
 * Validate that search parameters match an expected combination in the experiment
 * @param experimentId - The experiment ID
 * @param searchParams - The search parameters to validate
 * @returns true if the search parameters match a combination, false otherwise
 */
export function validateSearchParameters(experimentId: string, searchParams: SearchParameters): boolean {
  const combination = findMatchingCombination(experimentId, searchParams)
  return combination !== null
}

/**
 * Get a specific flight by ID from any experiment
 * @param flightId - The flight ID
 * @returns The flight object or undefined if not found
 */
export function getFlightById(flightId: string): Flight | undefined {
  // Check registries first (solution flights and generated flights)
  if (solutionFlightRegistry.has(flightId)) {
    return solutionFlightRegistry.get(flightId)
  }
  if (generatedFlightRegistry.has(flightId)) {
    return generatedFlightRegistry.get(flightId)
  }

  const experiments = loadExperiments()

  for (const experiment of experiments) {
    for (const combo of experiment.searchCombinations) {
      // Search in outbound flights
      const outboundFlight = combo.outboundFlights.find((f) => f.id === flightId)
      if (outboundFlight) return outboundFlight

      // Search in return flights
      const returnFlight = combo.returnFlights.find((f) => f.id === flightId)
      if (returnFlight) return returnFlight
    }
  }

  return undefined
}

/**
 * Get all available experiments (for the welcome page)
 * @returns Array of experiment metadata
 */
export function getAvailableExperiments(): ExperimentConfig[] {
  return loadExperiments()
}
