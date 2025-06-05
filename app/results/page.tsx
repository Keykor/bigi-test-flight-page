"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, Luggage, Plane } from "lucide-react"
import { ExperimentTracker } from "@/components/experiment-tracker"
import { getFlightsForIteration } from "@/lib/iterations"
import { useExperimentStore } from "@/lib/experiment-store"
import type { Flight, SearchParameters } from "@/lib/types"

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const iterationId = searchParams.get("iteration")
  const [flights, setFlights] = useState<Flight[]>([])
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

    return {
      departure,
      destination,
      date,
    }
  }, [searchParams])

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

    // Solo ejecutar esto una vez en el renderizado inicial
    if (initialRenderRef.current) {
      initialRenderRef.current = false

      // Extraer parámetros de búsqueda de la URL
      const params = extractSearchParams()

      // Establecer los parámetros de búsqueda actuales
      setCurrentSearchParams(params)

      // Obtener vuelos basados en la iteración actual y los parámetros de búsqueda
      const flightsData = getFlightsForIteration(iterationId, params)
      setFlights(flightsData)

      // Establecer opciones seleccionadas para el seguimiento inmediatamente
      const options = {
        flightsCount: flightsData.length,
        hasTargetFlight: flightsData.some((flight) => flight.isTarget),
        // No duplicar los parámetros de búsqueda aquí
        searchCriteria: params, // Mantener los criterios de búsqueda como referencia
      }

      setSelectedOptions(options)
      console.log("Results page - setting selected options:", options)
      console.log("Results page - setting search params:", params)
      console.log(`Results page mounted with iteration: ${iterationId}`)
    }

    // Función de limpieza para asegurar que se registre la salida de la página
    return () => {
      if (!pageExitRecordedRef.current) {
        console.log(`Manual page exit: results at ${new Date().toISOString()}`)
        recordPageExit("results", new Date())
        pageExitRecordedRef.current = true
      }

      // Limpiar cualquier timeout pendiente
      if (optionsUpdateTimeoutRef.current) {
        clearTimeout(optionsUpdateTimeoutRef.current)
      }
    }
  }, [iterationId, participantId, recordPageExit, router, extractSearchParams])

  const handleSelectFlight = useCallback(
    (flight: Flight) => {
      // Extraer parámetros de búsqueda actuales
      const params = extractSearchParams()

      // Actualizar opciones seleccionadas antes de la navegación
      // Usar los datos reales del vuelo, no duplicar los parámetros de búsqueda
      const updatedOptions = {
        ...selectedOptions,
        selectedFlightId: flight.id,
        isTargetFlight: flight.isTarget || false,
        // Incluir los datos reales del vuelo
        flightDetails: {
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
        },
        // Mantener los criterios de búsqueda como referencia
        searchCriteria: params,
      }

      console.log("Results page - updating selected options before navigation:", updatedOptions)
      setSelectedOptions(updatedOptions)

      // Asegurar que se registre la salida de la página antes de la navegación
      if (!pageExitRecordedRef.current) {
        console.log(`Page exit (select flight): results at ${new Date().toISOString()}`)
        recordPageExit("results", new Date())
        pageExitRecordedRef.current = true
      }

      // Navegar con un ligero retraso para asegurar que las actualizaciones de estado se procesen
      setTimeout(() => {
        const params = new URLSearchParams(searchParams)
        params.set("flightId", flight.id)
        router.push(`/confirmation?${params.toString()}`)
      }, 10)
    },
    [selectedOptions, pageExitRecordedRef, recordPageExit, searchParams, router, extractSearchParams],
  )

  const handleBack = useCallback(() => {
    // Asegurar que se registre la salida de la página antes de la navegación
    if (!pageExitRecordedRef.current) {
      console.log(`Page exit (back): results at ${new Date().toISOString()}`)
      recordPageExit("results", new Date())
      pageExitRecordedRef.current = true
    }

    router.push(`/search?iteration=${iterationId}`)
  }, [pageExitRecordedRef, recordPageExit, router, iterationId])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ExperimentTracker pageId="results" searchParams={currentSearchParams} selectedOptions={selectedOptions} />

      <div className="mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={handleBack}
          data-tracking-id="back-to-search"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Flight Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">{flights.length} flights found for your search</div>

          {flights.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg font-medium mb-2">No flights found</p>
              <p className="text-muted-foreground mb-4">Try adjusting your search criteria</p>
              <Button onClick={handleBack} data-tracking-id="no-results-back">
                Back to Search
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {flights.map((flight) => (
                <Card key={flight.id} className="overflow-hidden">
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="font-medium">{flight.airline}</div>
                      <div className="text-sm text-muted-foreground">Flight {flight.flightNumber}</div>
                      <div className="text-sm text-muted-foreground">Date: {flight.departureDate}</div>
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
                        className="mt-2"
                        onClick={() => handleSelectFlight(flight)}
                        data-tracking-id={`select-flight-${flight.id}`}
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
