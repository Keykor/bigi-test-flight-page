"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, Luggage, Plane, Calendar } from "lucide-react"
import { getFlightsForSearch, getFlightById } from "@/lib/experiments"
import type { Flight, SearchParameters } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { useEventTracker } from "@/context/EventTrackerProvider"
import AirlineLayout from "@/components/airline-layout"
import { FloatingTaskCard } from "@/components/floating-task-card"

export default function ReturnResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const iterationId = searchParams.get("iteration")
  const outboundFlightId = searchParams.get("outboundFlightId")
  const [flights, setFlights] = useState<Flight[]>([])
  const [outboundFlight, setOutboundFlight] = useState<Flight | null>(null)
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
      setCurrentSearchParams(params)

      // Obtener el vuelo de ida seleccionado
      const selectedOutboundFlight = getFlightById(outboundFlightId)
      if (!selectedOutboundFlight) {
        console.error(`Outbound flight not found: ${outboundFlightId}`)
        router.push(`/results/outbound?${searchParams.toString()}`)
        return
      }

      console.log("Found outbound flight:", selectedOutboundFlight)
      setOutboundFlight(selectedOutboundFlight)

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
          page: "return",
        })

        // Redirect to no-flights page with iteration and search params
        const searchParamsObj = new URLSearchParams(searchParams)
        router.push(`/no-flights?${searchParamsObj.toString()}`)
        return
      }

      // Set return flights
      setFlights(flightsResult.return)
    }
  }, [iterationId, outboundFlightId, router, extractSearchParams, searchParams, addSelection])

  const handleSelectFlight = useCallback(
    (flight: Flight) => {
      // Record the flight selection before navigation
      addSelection({
        type: "return_flight_selection",
        flight: flight
      })
      
      // Navigate to the confirmation page with selected flights
      const newParams = new URLSearchParams(searchParams)
      newParams.set("returnFlightId", flight.id)
      console.log("Navigating to confirmation with params:", newParams.toString())
      router.push(`/confirmation?${newParams.toString()}`)
    },
    [searchParams, router, addSelection]
  )

  const handleBack = useCallback(() => {
    // Maintain all parameters when going back
    const backParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (key !== "returnFlightId") {
        backParams.set(key, value)
      }
    })

    console.log("Going back to outbound results with params:", backParams.toString())
    router.push(`/results/outbound?${backParams.toString()}`)
  }, [router, searchParams])

  if (!outboundFlight) {
    return (
      <AirlineLayout activeTab="flights">
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
          <div className="text-center py-12 bg-green-50 rounded-lg border border-green-100 shadow-sm max-w-md mx-auto">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Plane className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xl font-bold mb-2 text-green-700">Loading Flight Information</p>
            <p className="text-muted-foreground mb-6">Please wait while we retrieve your outbound flight details</p>
            <Button 
              onClick={() => router.push(`/results/outbound?${searchParams.toString()}`)}
              className="bg-green-500 hover:bg-green-600"
            >
              Back to Outbound Results
            </Button>
          </div>
        </div>
      </AirlineLayout>
    )
  }

  return (
    <AirlineLayout activeTab="flights">
      <FloatingTaskCard experimentId={iterationId} />
      <div className="container mx-auto px-4 py-8 max-w-4xl bg-gray-50 min-h-screen">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-gray-200"
            onClick={handleBack}
            data-track-id="back-to-outbound-results"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Outbound Flights
          </Button>
        </div>

        {/* Mostrar el vuelo de ida seleccionado */}
        <Card className="mb-8 shadow-md border-t-4 border-t-green-500">
          <CardHeader className="bg-gray-100 border-b py-4">
            <CardTitle className="text-xl text-green-600 font-bold">Selected Outbound Flight</CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="flex items-center justify-between p-5 rounded-lg bg-green-50 border border-green-100 shadow-sm">
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <div className="text-green-500 mt-1 bg-green-50 p-1.5 rounded-full">
                    <Plane className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{outboundFlight.airline}</div>
                    <div className="text-sm text-muted-foreground">Flight {outboundFlight.flightNumber}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-green-500 mt-1 bg-green-50 p-1.5 rounded-full">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium">{formatFlightDate(outboundFlight.departureDate || "")}</div>
                  </div>
                </div>
                {outboundFlight.isOffer && (
                  <Badge variant="secondary" className="mt-2 ml-8 bg-orange-200 text-orange-800">
                    {outboundFlight.offerType === "earlier" ? "1 Day Earlier" : "1 Day Later"} -{" "}
                    {outboundFlight.discountPercentage}% Off
                  </Badge>
                )}
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  {outboundFlight.origin} → {outboundFlight.destination}
                </div>
                <div className="font-medium">
                  {outboundFlight.departureTime} - {outboundFlight.arrivalTime}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{outboundFlight.duration}</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-xl text-green-600">${outboundFlight.price}</div>
                <div className="text-sm font-medium">{outboundFlight.class} Class</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-md border-t-4 border-t-green-500">
          <CardHeader className="bg-gray-100 border-b py-6">
            <CardTitle className="text-2xl text-green-600 font-bold">Return Flight Results</CardTitle>
            <p className="text-muted-foreground">Select your return flight from {currentSearchParams?.destination} to {currentSearchParams?.departure}</p>
          </CardHeader>
          <CardContent className="pt-8 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Plane className="h-5 w-5 text-green-500 transform rotate-180" />
              </div>
              <div className="text-lg font-semibold text-green-600">{flights.length} return flights found</div>
            </div>

            {flights.length === 0 ? (
              <div className="text-center py-12 bg-green-50 rounded-lg border border-green-100 shadow-sm">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Plane className="h-8 w-8 text-green-400 transform rotate-180" />
                </div>
                <p className="text-xl font-bold mb-2 text-green-700">No Return Flights Found</p>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">Try adjusting your search criteria or select different dates</p>
                <Button 
                  onClick={handleBack} 
                  data-track-id="no-return-results-back"
                  size="lg"
                  className="bg-green-500 hover:bg-green-600"
                >
                  Back to Outbound Flights
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
                          data-track-id={`select-return-flight-${flight.id}`}
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
