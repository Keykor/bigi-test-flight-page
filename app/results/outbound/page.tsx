"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Luggage, Plane, Calendar } from "lucide-react"
import { getFlightsForSearch } from "@/lib/experiments"
import type { Flight, SearchParameters } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { useEventTracker } from "@/context/EventTrackerProvider"
import AirlineLayout from "@/components/airline-layout"
import { FloatingTaskCard } from "@/components/floating-task-card"

export default function OutboundResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const iterationId = searchParams.get("iteration")
  const [flights, setFlights] = useState<Flight[]>([])
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParameters | undefined>(undefined)
  const initialRenderRef = useRef(true)
  const { addSelection } = useEventTracker()

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

  // Inicializar datos de la página
  useEffect(() => {
    // Redirect handling if needed
    if (!iterationId) {
      router.push("/welcome")
      return
    }

    // Solo ejecutar esto una vez en el renderizado inicial
    if (initialRenderRef.current) {
      initialRenderRef.current = false

      // Extraer parámetros de búsqueda de la URL
      const params = extractSearchParams()

      // Establecer los parámetros de búsqueda actuales
      setCurrentSearchParams(params)

      // Obtener vuelos basados en el experimento y los parámetros de búsqueda
      const flightsResult = getFlightsForSearch(iterationId, params)

      if (!flightsResult) {
        // No matching combination found - redirect to no-flights page
        console.warn("No matching search combination found for parameters:", params)

        // Track no flights found event
        addSelection({
          type: "no_flights_found_redirect",
          reason: "no_matching_combination",
          searchParams: params,
          iterationId: iterationId,
        })

        // Redirect to no-flights page with iteration and search params
        const searchParamsObj = new URLSearchParams(searchParams)
        router.push(`/no-flights?${searchParamsObj.toString()}`)
        return
      }

      // Set outbound flights
      setFlights(flightsResult.outbound)
    }
  }, [iterationId, router, extractSearchParams, searchParams, addSelection])

  const handleSelectFlight = useCallback(
    (flight: Flight) => {
      // Record the flight selection before navigation
      addSelection({
        type: "outbound_flight_selection",
        flight: flight
      })
      
      // Navigate immediately
      const searchParamsObj = new URLSearchParams(searchParams)
      searchParamsObj.set("outboundFlightId", flight.id)
      router.push(`/results/return?${searchParamsObj.toString()}`)
    },
    [searchParams, router, addSelection]
  )

  const handleBack = useCallback(() => {
    router.push(`/search?iteration=${iterationId}`)
  }, [router, iterationId])

  return (
    <AirlineLayout activeTab="flights">
      <FloatingTaskCard experimentId={iterationId} />
      <div className="container mx-auto px-4 py-8 max-w-4xl bg-gray-50 min-h-screen">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-gray-200"
            onClick={handleBack}
            data-track-id="back-to-search"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Button>
        </div>

        <Card className="mb-8 shadow-md border-t-4 border-t-green-500">
          <CardHeader className="bg-gray-100 border-b py-6">
            <CardTitle className="text-2xl text-green-600 font-bold">Outbound Flight Results</CardTitle>
            <p className="text-muted-foreground">Select your outbound flight from {currentSearchParams?.departure} to {currentSearchParams?.destination}</p>
          </CardHeader>
          <CardContent className="pt-8 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Plane className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-lg font-semibold text-green-600">{flights.length} outbound flights found</div>
            </div>

            {flights.length === 0 ? (
              <div className="text-center py-12 bg-green-50 rounded-lg border border-green-100 shadow-sm">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Plane className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-xl font-bold mb-2 text-green-700">No Flights Found</p>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">Try adjusting your search criteria or select different dates</p>
                <Button 
                  onClick={handleBack} 
                  data-track-id="no-results-back"
                  size="lg"
                  className="bg-green-500 hover:bg-green-600"
                >
                  Back to Search
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {flights.map((flight) => (
                  <Card
                    key={flight.id}
                    className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-gray-200"
                  >
                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="text-green-500 mt-1 bg-gray-50 p-1.5 rounded-full">
                            <Plane className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-lg">{flight.airline}</div>
                            <div className="text-sm text-muted-foreground">Flight {flight.flightNumber}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-green-500 mt-1 bg-gray-50 p-1.5 rounded-full">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Date</div>
                            <div className="font-medium">{formatFlightDate(flight.departureDate || "")}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        <div className="text-right">
                          <div className="font-medium text-lg">{flight.departureTime}</div>
                          <div className="text-sm font-medium">{flight.origin}</div>
                        </div>

                        <div className="flex flex-col items-center mx-4 min-w-[100px]">
                          <div className="text-xs text-muted-foreground">{flight.duration}</div>
                          <div className="relative w-full h-[2px] bg-gray-300 my-2">
                            {flight.stops === 0 ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Plane className="h-3 w-3 text-green-500 rotate-90" />
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-2.5 w-2.5 rounded-full bg-gray-400"></div>
                              </div>
                            )}
                          </div>
                          <div className="text-xs font-medium text-green-600">
                            {flight.stops === 0 ? "Direct Flight" : `${flight.stops} Stop${flight.stops > 1 ? "s" : ""}`}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-lg">{flight.arrivalTime}</div>
                          <div className="text-sm font-medium">{flight.destination}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="text-2xl font-bold text-green-600">${flight.price}</div>
                        <div className="text-sm font-medium mb-4">{flight.class} Class</div>
                        <Button
                          className="px-6 py-2 shadow-md transition-all bg-green-500 hover:bg-green-600"
                          onClick={() => handleSelectFlight(flight)}
                          data-track-id={`select-outbound-flight-${flight.id}`}
                        >
                          Select Flight
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gray-100 px-5 py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="text-green-500 bg-green-100 p-1.5 rounded-full">
                          <Luggage className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{flight.luggage}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-green-500 bg-green-100 p-1.5 rounded-full">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{flight.refundable ? "Refundable" : "Non-refundable"}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AirlineLayout>
  )
}
