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
  departureDate?: string // Fecha de salida en formato YYYY-MM-DD
  type: "outbound" | "return" // Tipo de vuelo: ida o vuelta
  isOffer?: boolean // Si es una oferta especial
  originalDate?: string // Fecha original solicitada (para ofertas)
  dateOffset?: number // Días de diferencia respecto a la fecha original (-1, 0, +1)
  offerType?: "earlier" | "later" // Tipo de oferta: más temprano o más tarde
  discountPercentage?: number // Porcentaje de descuento para ofertas
}

export interface SearchParameters {
  departure: string
  destination: string
  date: string
  returnDate?: string // Fecha de vuelta opcional
}

export interface SelectedFlights {
  outbound?: Flight
  return?: Flight
}

export interface MouseMoveInteraction {
  type: "mousemove"
  pageId: string
  x: number
  y: number
  timestamp: Date
  elementId: string | null
}

export interface ScrollInteraction {
  type: "scroll"
  pageId: string
  x: number
  y: number
  timestamp: Date
}

export interface ClickInteraction {
  type: "click"
  pageId: string
  x: number
  y: number
  timestamp: Date
  elementId: string | null
  elementType: string | null
}

export interface KeyPressInteraction {
  type: "keypress"
  pageId: string
  key: string
  timestamp: Date
  inputId: string | null
}

export type Interaction = MouseMoveInteraction | ScrollInteraction | ClickInteraction | KeyPressInteraction

export interface PageVisit {
  pageId: string
  entryTime: Date
  exitTime: Date | null
  duration?: number // in milliseconds, calculated when exitTime is set
  searchParams?: SearchParameters // Parámetros de búsqueda específicos para esta página
  selectedOptions?: Record<string, any> // Opciones seleccionadas en esta página
}

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

export interface ExperimentData {
  participantId: string | null
  iterationId: string | null
  interactions: Interaction[]
  pageVisits: PageVisit[]
  experimentStartTime: Date | null
  experimentEndTime: Date | null
  experimentDuration?: number // in milliseconds
  completedAt: Date | null
  blobUrl?: string // URL to the stored blob for this iteration
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
