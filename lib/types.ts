export interface Flight {
  id: string
  airline: string
  flightNumber: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  stops: number
  class: string
  luggage: string
  refundable: boolean
  isTarget?: boolean
  departureDate: string
  type: "outbound" | "return"
  originalDate?: string
  dateOffset?: number
  isOffer?: boolean
  offerType?: "earlier" | "later"
  discountPercentage?: number
}

export interface SearchParameters {
  departure: string
  destination: string
  date: string
  returnDate: string
  passengers?: number
}

export interface SelectedFlights {
  outbound?: Flight
  return?: Flight
}

// NEW: Interfaces for improved tracking system
export interface KeyPress {
  key: string
  inputId: string | null
  time: number
}

export interface SelectionHistoryEntry {
  type: string
  timestamp: string
  [key: string]: any
}

export interface ExperimentState {
  searchParams: SearchParameters | null
  outboundFlight: Partial<Flight> | null
  returnFlight: Partial<Flight> | null
}

// DEPRECATED: Old iteration system types - kept for backward compatibility
export interface OfferConfig {
  enabled: boolean
  earlierDayOffers: boolean // Ofertas para el día anterior
  laterDayOffers: boolean // Ofertas para el día siguiente
  discountRange: [number, number] // Rango de descuento [min, max] en porcentaje
  maxOffersPerType: number // Máximo número de ofertas por tipo (earlier/later)
}

export interface IterationConfig {
  id: string
  completed: boolean
  targetFlightId: string
  targetReturnFlightId: string // ID del vuelo de vuelta objetivo
  attemptsBeforeTarget: number
  offerConfig: OfferConfig // Configuración de ofertas para esta iteración
}

// NEW: Experiment-based configuration system
export interface ExperimentMetadata {
  id: string
  name: string
  description: string
  priceThreshold: number   // e.g. 2000 (combined outbound + return)
}

export interface SearchCombination {
  departure: string // Airport code (e.g., "EZE")
  destination: string // Airport code (e.g., "MAD")
  departureDate: string // ISO date string (e.g., "2025-06-15")
  returnDate: string // ISO date string (e.g., "2025-06-22")
  outboundFlights?: Flight[]
  returnFlights?: Flight[]
}

// Flight template without location/date fields — those are injected at runtime
export interface SolutionFlightTemplate {
  id: string
  airline: string
  flightNumber: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  stops: number
  class: string
  luggage: string
  refundable: boolean
}

export interface ExperimentConfig extends ExperimentMetadata {
  solutionIteration: number // Which unique search attempt reveals the target flight(s)
  solutionPosition: {
    outbound: number // 1-indexed position in the outbound list where the target replaces a flight
    return: number  // 1-indexed position in the return list where the target replaces a flight
  }
  solutionFlight: {
    outbound: SolutionFlightTemplate
    return: SolutionFlightTemplate
  }
  searchCombinations: SearchCombination[]
}

export interface SearchCacheEntry {
  combinationKey: string // e.g. "EZE-MAD-2026-06-15-2026-06-22"
  attemptNumber: number // which unique attempt this was (1-indexed)
  outboundFlights: Flight[] // cached outbound results (may include target)
  returnFlights: Flight[] // cached return results (may include target)
  timestamp: string
  resolvedSolutionPosition?: { outbound: number; return: number } // random position generated at solution iteration
}

export interface CentralExperimentData {
  participantId: string | null
  iterationOrder: string[]
  iterationBlobs: { iterationId: string; blobUrl: string }[]
  experimentStartTime: Date | null
  experimentEndTime: Date | null
  completedAt: Date
}

export interface TargetSearchConfig {
  iterationId: string
  targetParams: SearchParameters
}

// New types for tracking
export interface TrackingEvent {
  type: string
  timestamp: string
  data?: any
}

export interface PageVisit {
  page: string
  visitStartTime: string
  visitEndTime: string | null
  pageTransitionDuration?: number
  mouseMovements: MouseMovement[]
  scrollPositions: ScrollPosition[]
  clicks: ClickEvent[]
  keyPresses: KeyPress[]
  selectionHistory: SelectionHistoryEntry[]
  experimentState: ExperimentState
}

export interface MouseMovement {
  x: number
  y: number
  time: number
}

export interface ScrollPosition {
  scrollY: number
  time: number
}

export interface ClickEvent {
  x: number
  y: number
  element: string
  trackId: string | null
  time: number
  elementData?: any // Additional data about the clicked element if available
}

export interface ExperimentData {
  participantId?: string
  experimentId: string
  experimentName: string
  experimentDescription: string
  iterationId: string
  pages: PageVisit[]
  experimentStartTime: string
  experimentEndTime?: string
  uuid: string
  participantRunNumber?: number
  searchCache: SearchCacheEntry[]
  targetFlightSelected: { outbound: boolean; return: boolean } | null // null = not yet confirmed
}
