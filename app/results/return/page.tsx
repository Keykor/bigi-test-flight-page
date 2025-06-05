"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, Luggage, Plane } from "lucide-react"
import { ExperimentTracker } from "@/components/experiment-tracker"
import { getReturnFlightsForIteration, getFlightById } from "@/lib/iterations"
import { useExperimentStore } from "@/lib/experiment-store"
import type { Flight, SearchParameters } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Calendar, Percent } from "lucide-react"
import { format, parseISO } from "date-fns"

export default function ReturnResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const iterationId = searchParams.get("iteration")
  const outboundFlightId = searchParams.get("outboundFlightId")
  const [flights, setFlights] = useState<Flight[]>([])
  const [outboundFlight, setOutboundFlight] = useState<Flight | null>(null)
  const pageExitRecordedRef = useRef(false)
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParameters | undefined>(undefined)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({})
  const initialRenderRef = useRef(true)
  const optionsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { currentIteration, participantId, recordPageExit } = useExperimentStore()

  // Extraer parámetros de búsqueda de la URL - memorizado para evitar recrear en cada renderizado
  const extractSearchParams = useCallback(() => {
    const departure = searchParams.get("departure") || ""
    const destination = searchParams.get("destination") || ""
    const date = searchParams.get("date") || ""
    const returnDate = searchParams.get("returnDate") || ""

    return {
      departure,
      destination,
      date,
      returnDate,
    }
  }, [searchParams])

  // Función para formatear la fecha de manera legible
  const formatFlightDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy")
    } catch {
      return dateString
    }
  }

  // Función para obtener el texto de la oferta
  const getOfferText = (flight: Flight, originalDate: string) => {
    if (!flight.isOffer) return null

    const originalDateFormatted = formatFlightDate(originalDate)
    const flightDateFormatted = formatFlightDate(flight.departureDate || "")

    if (flight.offerType === "earlier") {
      return `Fly 1 day earlier (${flightDateFormatted}) instead of ${originalDateFormatted}`
    } else if (flight.offerType === "later") {
      return `Fly 1 day later (${flightDateFormatted}) instead of ${originalDateFormatted}`
    }

    return null
  }

  // Inicializar datos de la página
  useEffect(() => {
    // Si no hay ID de participante, redirigir a la página de ID de participante
    if (!participantId) {
      router.push("/")
      return
    }

    if (!iterationId) {
      router.push("/welcome")
      return
    }

    if (!outboundFlightId) {
      console.error("No outbound flight ID provided")
      router.push(`/results/outbound?${searchParams.toString()}`)
      return
    }

    // Solo ejecutar esto una vez en el renderizado inicial
    if (initialRenderRef.current) {
      initialRenderRef.current = false

      // Extraer parámetros de búsqueda de la URL
      const params = extractSearchParams()

      // Obtener el vuelo de ida seleccionado
      const selectedOutboundFlight = getFlightById(outboundFlightId)
      if (!selectedOutboundFlight) {
        console.error(`Outbound flight not found: ${outboundFlightId}`)
        router.push(`/results/outbound?${searchParams.toString()}`)
        return
      }

      console.log("Found outbound flight:", selectedOutboundFlight)
      setOutboundFlight(selectedOutboundFlight)

      // Establecer los parámetros de búsqueda actuales
      setCurrentSearchParams(params)

      // Obtener vuelos de vuelta basados en la iteración actual, los parámetros de búsqueda y el vuelo de ida
      const flightsData = getReturnFlightsForIteration(iterationId, params, selectedOutboundFlight)
      setFlights(flightsData)

      // Establecer opciones seleccionadas para el seguimiento inmediatamente
      const options = {
        flightType: "return",
        flightsCount: flightsData.length,
        hasTargetFlight: flightsData.some((flight) => flight.isTarget),
        hasOffers: flightsData.some((flight) => flight.isOffer),
        offerCount: flightsData.filter((flight) => flight.isOffer).length,
        searchCriteria: params,
        outboundFlightId: selectedOutboundFlight.id,
        outboundFlightDetails: {
          airline: selectedOutboundFlight.airline,
          flightNumber: selectedOutboundFlight.flightNumber,
          price: selectedOutboundFlight.price,
          origin: selectedOutboundFlight.origin,
          destination: selectedOutboundFlight.destination,
          departureDate: selectedOutboundFlight.departureDate,
          isOffer: selectedOutboundFlight.isOffer,
          offerType: selectedOutboundFlight.offerType,
        },
      }

      setSelectedOptions(options)
      console.log("Return results page - setting selected options:", options)
      console.log("Return results page - setting search params:", params)
      console.log(`Return results page mounted with iteration: ${iterationId}`)
    }

    // Función de limpieza para asegurar que se registre la salida de la página
    return () => {
      if (!pageExitRecordedRef.current) {
        console.log(`Manual page exit: return-results at ${new Date().toISOString()}`)
        recordPageExit("return-results", new Date())
        pageExitRecordedRef.current = true
      }

      // Limpiar cualquier timeout pendiente
      if (optionsUpdateTimeoutRef.current) {
        clearTimeout(optionsUpdateTimeoutRef.current)
      }
    }
  }, [iterationId, outboundFlightId, participantId, recordPageExit, router, extractSearchParams, searchParams])

  const handleSelectFlight = useCallback(
    (flight: Flight) => {
      // Extraer parámetros de búsqueda actuales
      const params = extractSearchParams()

      // Actualizar opciones seleccionadas antes de la navegación
      const updatedOptions = {
        ...selectedOptions,
        selectedReturnFlightId: flight.id,
        isTargetReturnFlight: flight.isTarget || false,
        isOfferReturnFlight: flight.isOffer || false,
        offerTypeReturn: flight.offerType || null,
        dateOffsetReturn: flight.dateOffset || 0,
        discountPercentageReturn: flight.discountPercentage || 0,
        returnFlightDetails: {
          airline: flight.airline,
          flightNumber: flight.flightNumber,
          price: flight.price,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          origin: flight.origin,
          destination: flight.destination,
          departureDate: flight.departureDate,
          duration: flight.duration,
          stops: flight.stops,
          class: flight.class,
          luggage: flight.luggage,
          refundable: flight.refundable,
          isOffer: flight.isOffer,
          offerType: flight.offerType,
          originalDate: flight.originalDate,
          dateOffset: flight.dateOffset,
          discountPercentage: flight.discountPercentage,
        },
        searchCriteria: params,
      }

      console.log("Return results page - updating selected options before navigation:", updatedOptions)
      setSelectedOptions(updatedOptions)

      // Asegurar que se registre la salida de la página antes de la navegación
      if (!pageExitRecordedRef.current) {
        console.log(`Page exit (select flight): return-results at ${new Date().toISOString()}`)
        recordPageExit("return-results", new Date())
        pageExitRecordedRef.current = true
      }

      // Navegar a la página de confirmación con ambos vuelos seleccionados
      setTimeout(() => {
        const newParams = new URLSearchParams(searchParams)
        newParams.set("returnFlightId", flight.id)
        console.log("Navigating to confirmation with params:", newParams.toString())
        router.push(`/confirmation?${newParams.toString()}`)
      }, 10)
    },
    [selectedOptions, pageExitRecordedRef, recordPageExit, searchParams, router, extractSearchParams],
  )

  const handleBack = useCallback(() => {
    // Asegurar que se registre la salida de la página antes de la navegación
    if (!pageExitRecordedRef.current) {
      console.log(`Page exit (back): return-results at ${new Date().toISOString()}`)
      recordPageExit("return-results", new Date())
      pageExitRecordedRef.current = true
    }

    // Mantener todos los parámetros al volver
    const backParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (key !== "returnFlightId") {
        backParams.set(key, value)
      }
    })

    console.log("Going back to outbound results with params:", backParams.toString())
    router.push(`/results/outbound?${backParams.toString()}`)
  }, [pageExitRecordedRef, recordPageExit, router, searchParams])

  if (!outboundFlight) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Loading outbound flight information...</p>
          <Button onClick={() => router.push(`/results/outbound?${searchParams.toString()}`)}>
            Back to Outbound Results
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ExperimentTracker pageId="return-results" searchParams={currentSearchParams} selectedOptions={selectedOptions} />

      <div className="mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={handleBack}
          data-tracking-id="back-to-outbound-results"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Outbound Flights
        </Button>
      </div>

      {/* Mostrar el vuelo de ida seleccionado */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Selected Outbound Flight</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`flex items-center justify-between p-4 rounded-lg ${outboundFlight.isOffer ? "bg-orange-50 border border-orange-200" : "bg-muted"}`}
          >
            <div>
              <div className="font-medium">{outboundFlight.airline}</div>
              <div className="text-sm text-muted-foreground">Flight {outboundFlight.flightNumber}</div>
              <div className="text-sm text-muted-foreground">
                Date: {formatFlightDate(outboundFlight.departureDate || "")}
              </div>
              {outboundFlight.isOffer && (
                <Badge variant="secondary" className="mt-1 bg-orange-200 text-orange-800">
                  {outboundFlight.offerType === "earlier" ? "1 Day Earlier" : "1 Day Later"} -{" "}
                  {outboundFlight.discountPercentage}% Off
                </Badge>
              )}
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                {outboundFlight.origin} → {outboundFlight.destination}
              </div>
              <div className="font-medium">
                {outboundFlight.departureTime} - {outboundFlight.arrivalTime}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-lg">${outboundFlight.price}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Return Flight Results</CardTitle>
          <p className="text-muted-foreground">Select your return flight</p>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">{flights.length} return flights found</div>

          {flights.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg font-medium mb-2">No return flights found</p>
              <p className="text-muted-foreground mb-4">Try adjusting your search criteria</p>
              <Button onClick={handleBack} data-tracking-id="no-return-results-back">
                Back to Outbound Flights
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {flights.map((flight) => (
                <Card
                  key={flight.id}
                  className={`overflow-hidden ${flight.isOffer ? "border-orange-200 bg-orange-50" : ""}`}
                >
                  {flight.isOffer && (
                    <div className="bg-orange-100 px-4 py-2 border-b border-orange-200">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">
                          Special Offer - {flight.discountPercentage}% Off
                        </span>
                        <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                          {flight.offerType === "earlier" ? "1 Day Earlier" : "1 Day Later"}
                        </Badge>
                      </div>
                      <div className="text-xs text-orange-700 mt-1">
                        {getOfferText(flight, flight.originalDate || currentSearchParams?.returnDate || "")}
                      </div>
                    </div>
                  )}

                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="font-medium">{flight.airline}</div>
                      <div className="text-sm text-muted-foreground">Flight {flight.flightNumber}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Date: {formatFlightDate(flight.departureDate || "")}</span>
                      </div>
                      {flight.isOffer && (
                        <div className="text-xs text-orange-600 mt-1">
                          Original: {formatFlightDate(flight.originalDate || "")}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <div className="text-right">
                        <div className="font-medium">{flight.departureTime}</div>
                        <div className="text-sm text-muted-foreground">{flight.origin}</div>
                      </div>

                      <div className="flex flex-col items-center mx-2">
                        <div className="text-xs text-muted-foreground">{flight.duration}</div>
                        <div className="relative w-20 h-px bg-gray-300 my-1">
                          {flight.stops === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Plane className="h-3 w-3 text-primary rotate-90" />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                        </div>
                      </div>

                      <div>
                        <div className="font-medium">{flight.arrivalTime}</div>
                        <div className="text-sm text-muted-foreground">{flight.destination}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="font-medium text-lg">${flight.price}</div>
                      <div className="text-sm text-muted-foreground">{flight.class}</div>
                      <Button
                        className={`mt-2 ${flight.isOffer ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                        onClick={() => handleSelectFlight(flight)}
                        data-tracking-id={`select-return-flight-${flight.id}`}
                      >
                        Select
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted px-4 py-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Luggage className="h-4 w-4" />
                      <span>{flight.luggage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{flight.refundable ? "Refundable" : "Non-refundable"}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
