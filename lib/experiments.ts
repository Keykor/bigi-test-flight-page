"use client"

import type { ExperimentConfig, SearchCombination, Flight, SearchParameters } from "./types"
import experimentsData from "../experiments.json"
import { extractAirportCode } from "./airports"

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

  return {
    outbound: combination.outboundFlights,
    return: combination.returnFlights,
  }
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
