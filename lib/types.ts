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
  widgetTimes: Record<string, any>
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
}

export interface ExperimentData {
  iterationId: string
  pages: PageVisit[]
  experimentStartTime: string
  experimentEndTime?: string
  selections: any[]
  uuid: string
  sampleCounter?: number
}
