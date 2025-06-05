"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Check, Clock, Luggage } from "lucide-react"
import { ExperimentTracker } from "@/components/experiment-tracker"
import { getFlightById } from "@/lib/iterations"
import { useExperimentStore } from "@/lib/experiment-store"
import type { Flight, SearchParameters } from "@/lib/types"
import { submitExperimentData, submitCentralData } from "@/lib/submit-data"

export default function ConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const iterationId = searchParams.get("iteration")
  const outboundFlightId = searchParams.get("outboundFlightId")
  const returnFlightId = searchParams.get("returnFlightId")
  const [outboundFlight, setOutboundFlight] = useState<Flight | null>(null)
  const [returnFlight, setReturnFlight] = useState<Flight | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const pageExitRecordedRef = useRef(false)
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParameters | undefined>(undefined)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({})
  const initialRenderRef = useRef(true)
  const optionsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    completeIteration,
    endExperiment,
    getExperimentData,
    getCentralExperimentData,
    participantId,
    addIterationBlob,
    areAllIterationsCompleted,
    recordPageExit,
  } = useExperimentStore()

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

  useEffect(() => {
    // Si no hay ID de participante, redirigir a la página de ID de participante
    if (!participantId) {
      router.push("/")
      return
    }

    if (!iterationId || !outboundFlightId || !returnFlightId) {
      router.push("/welcome")
      return
    }

    // Solo ejecutar esto una vez en el renderizado inicial
    if (initialRenderRef.current) {
      initialRenderRef.current = false

      // Extraer parámetros de búsqueda de la URL
      const params = extractSearchParams()
      setCurrentSearchParams(params)

      console.log("Confirmation page - looking for flights:", { outboundFlightId, returnFlightId })

      const selectedOutboundFlight = getFlightById(outboundFlightId)
      const selectedReturnFlight = getFlightById(returnFlightId)

      console.log("Confirmation page - found flights:", {
        outbound: selectedOutboundFlight,
        return: selectedReturnFlight,
      })

      if (!selectedOutboundFlight) {
        console.error(`Outbound flight not found: ${outboundFlightId}`)
        router.push(`/results/outbound?${searchParams.toString()}`)
        return
      }

      if (!selectedReturnFlight) {
        console.error(`Return flight not found: ${returnFlightId}`)
        router.push(`/results/return?${searchParams.toString()}`)
        return
      }

      setOutboundFlight(selectedOutboundFlight)
      setReturnFlight(selectedReturnFlight)

      // Establecer opciones seleccionadas para el seguimiento - con un ligero retraso para evitar actualizaciones de estado inmediatas
      setTimeout(() => {
        setSelectedOptions({
          outboundFlightId: selectedOutboundFlight.id,
          returnFlightId: selectedReturnFlight.id,
          isTargetOutboundFlight: selectedOutboundFlight.isTarget || false,
          isTargetReturnFlight: selectedReturnFlight.isTarget || false,
          totalPrice: selectedOutboundFlight.price + selectedReturnFlight.price,
          outboundFlightDetails: {
            airline: selectedOutboundFlight.airline,
            flightNumber: selectedOutboundFlight.flightNumber,
            price: selectedOutboundFlight.price,
            departureTime: selectedOutboundFlight.departureTime,
            arrivalTime: selectedOutboundFlight.arrivalTime,
            origin: selectedOutboundFlight.origin,
            destination: selectedOutboundFlight.destination,
            departureDate: selectedOutboundFlight.departureDate,
            duration: selectedOutboundFlight.duration,
            stops: selectedOutboundFlight.stops,
            class: selectedOutboundFlight.class,
            luggage: selectedOutboundFlight.luggage,
            refundable: selectedOutboundFlight.refundable,
          },
          returnFlightDetails: {
            airline: selectedReturnFlight.airline,
            flightNumber: selectedReturnFlight.flightNumber,
            price: selectedReturnFlight.price,
            departureTime: selectedReturnFlight.departureTime,
            arrivalTime: selectedReturnFlight.arrivalTime,
            origin: selectedReturnFlight.origin,
            destination: selectedReturnFlight.destination,
            departureDate: selectedReturnFlight.departureDate,
            duration: selectedReturnFlight.duration,
            stops: selectedReturnFlight.stops,
            class: selectedReturnFlight.class,
            luggage: selectedReturnFlight.luggage,
            refundable: selectedReturnFlight.refundable,
          },
          searchCriteria: params,
        })
      }, 0)
    }

    // Función de limpieza para asegurar que se registre la salida de la página
    return () => {
      if (!pageExitRecordedRef.current) {
        console.log(`Manual page exit: confirmation at ${new Date().toISOString()}`)
        recordPageExit("confirmation", new Date())
        pageExitRecordedRef.current = true
      }

      // Limpiar cualquier timeout pendiente
      if (optionsUpdateTimeoutRef.current) {
        clearTimeout(optionsUpdateTimeoutRef.current)
      }
    }
  }, [iterationId, outboundFlightId, returnFlightId, router, participantId, recordPageExit, extractSearchParams])

  const handleBack = useCallback(() => {
    // Asegurar que se registre la salida de la página antes de la navegación
    if (!pageExitRecordedRef.current) {
      console.log(`Page exit (back button): confirmation at ${new Date().toISOString()}`)
      recordPageExit("confirmation", new Date())
      pageExitRecordedRef.current = true
    }
    router.push(`/results/return?${searchParams.toString()}`)
  }, [pageExitRecordedRef, recordPageExit, router, searchParams])

  const handleSubmit = useCallback(async () => {
    if (!iterationId || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Extraer parámetros de búsqueda actuales
      const params = extractSearchParams()

      // Actualizar opciones seleccionadas antes de enviar
      const updatedOptions = {
        ...selectedOptions,
        confirmed: true,
        confirmationTime: new Date().toISOString(),
      }
      setSelectedOptions(updatedOptions)

      // Asegurar que se registre la salida de la página antes de enviar datos
      if (!pageExitRecordedRef.current) {
        console.log(`Page exit (submit): confirmation at ${new Date().toISOString()}`)
        recordPageExit("confirmation", new Date())
        pageExitRecordedRef.current = true
      }

      // Finalizar el experimento antes de enviar datos
      endExperiment()

      // Obtener los datos del experimento directamente del store
      const experimentData = getExperimentData()

      // Enviar los datos
      const blobUrl = await submitExperimentData(experimentData)

      // Almacenar la URL del blob
      if (blobUrl) {
        addIterationBlob(iterationId, blobUrl)
      }

      // Marcar la iteración como completada
      completeIteration(iterationId, blobUrl || undefined)

      // Comprobar si todas las iteraciones están completadas
      if (areAllIterationsCompleted()) {
        // Enviar los datos centrales
        const centralData = getCentralExperimentData()
        await submitCentralData(centralData)
      }

      setIsSubmitted(true)
    } catch (error) {
      setSubmitError("Failed to submit data. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }, [
    iterationId,
    isSubmitting,
    selectedOptions,
    pageExitRecordedRef,
    recordPageExit,
    endExperiment,
    getExperimentData,
    addIterationBlob,
    completeIteration,
    areAllIterationsCompleted,
    getCentralExperimentData,
    extractSearchParams,
  ])

  const handleFinish = useCallback(() => {
    // Asegurar que se registre la salida de la página antes de la navegación
    if (!pageExitRecordedRef.current) {
      console.log(`Page exit (finish): confirmation at ${new Date().toISOString()}`)
      recordPageExit("confirmation", new Date())
      pageExitRecordedRef.current = true
    }
    router.push("/welcome")
  }, [pageExitRecordedRef, recordPageExit, router])

  if (!outboundFlight || !returnFlight) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ExperimentTracker pageId="confirmation" searchParams={currentSearchParams} selectedOptions={selectedOptions} />

      {!isSubmitted && (
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={handleBack}
            data-tracking-id="back-to-results"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Button>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{isSubmitted ? "Booking Complete" : "Confirm Your Flight"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">Thank You!</h3>
              <p className="text-muted-foreground mb-6">
                Your flight booking has been confirmed and your experiment data has been submitted.
              </p>
              <Button onClick={handleFinish} data-tracking-id="finish-experiment">
                Return to Home
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Outbound Flight Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Airline</div>
                    <div>{outboundFlight.airline}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Flight Number</div>
                    <div>{outboundFlight.flightNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div>{outboundFlight.departureDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Departure</div>
                    <div>
                      {outboundFlight.departureTime} • {outboundFlight.origin}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Arrival</div>
                    <div>
                      {outboundFlight.arrivalTime} • {outboundFlight.destination}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div>{outboundFlight.duration}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Stops</div>
                    <div>
                      {outboundFlight.stops === 0
                        ? "Direct Flight"
                        : `${outboundFlight.stops} Stop${outboundFlight.stops > 1 ? "s" : ""}`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Return Flight Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Airline</div>
                    <div>{returnFlight.airline}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Flight Number</div>
                    <div>{returnFlight.flightNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div>{returnFlight.departureDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Departure</div>
                    <div>
                      {returnFlight.departureTime} • {returnFlight.origin}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Arrival</div>
                    <div>
                      {returnFlight.arrivalTime} • {returnFlight.destination}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div>{returnFlight.duration}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Stops</div>
                    <div>
                      {returnFlight.stops === 0
                        ? "Direct Flight"
                        : `${returnFlight.stops} Stop${returnFlight.stops > 1 ? "s" : ""}`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Price Details</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <div>Base Fare</div>
                    <div className="text-sm text-muted-foreground">
                      Outbound: {outboundFlight.class} Class, Return: {returnFlight.class} Class
                    </div>
                  </div>
                  <div className="font-medium">${outboundFlight.price + returnFlight.price}</div>
                </div>
                <div className="h-px bg-border my-2"></div>
                <div className="flex justify-between items-center font-medium">
                  <div>Total Price</div>
                  <div>${outboundFlight.price + returnFlight.price}</div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Luggage className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Baggage (Outbound)</div>
                      <div className="text-sm text-muted-foreground">{outboundFlight.luggage}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Refund Policy (Outbound)</div>
                      <div className="text-sm text-muted-foreground">
                        {outboundFlight.refundable ? "Refundable" : "Non-refundable"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Luggage className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Baggage (Return)</div>
                      <div className="text-sm text-muted-foreground">{returnFlight.luggage}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Refund Policy (Return)</div>
                      <div className="text-sm text-muted-foreground">
                        {returnFlight.refundable ? "Refundable" : "Non-refundable"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {submitError && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">{submitError}</div>}

              <div className="text-center">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                  data-tracking-id="confirm-booking"
                >
                  {isSubmitting ? "Submitting..." : "Confirm Booking"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
