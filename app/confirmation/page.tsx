"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Check, Clock, Luggage } from "lucide-react"
import { getFlightById } from "@/lib/iterations"
import { useEventTracker } from "@/context/EventTrackerProvider"
import type { Flight, SearchParameters } from "@/lib/types"

export default function ConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const iterationId = searchParams.get("iteration")
  const outboundFlightId = searchParams.get("outboundFlightId")
  const returnFlightId = searchParams.get("returnFlightId")
  const [outboundFlight, setOutboundFlight] = useState<Flight | null>(null)
  const [returnFlight, setReturnFlight] = useState<Flight | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const initialRenderRef = useRef(true)
  const { stopExperiment, addSelection } = useEventTracker()

  // Initialize page data
  useEffect(() => {
    if (!iterationId || !outboundFlightId || !returnFlightId) {
      router.push("/welcome")
      return
    }

    // Only execute this once on the initial render
    if (initialRenderRef.current) {
      initialRenderRef.current = false

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
      
      // Record the final flight selections
      addSelection({
        type: "final_selection",
        outboundFlight: selectedOutboundFlight,
        returnFlight: selectedReturnFlight,
        timestamp: new Date().toISOString()
      });
    }
  }, [iterationId, outboundFlightId, returnFlightId, router, searchParams, addSelection])

  const handleBack = useCallback(() => {
    router.push(`/results/return?${searchParams.toString()}`)
  }, [router, searchParams])

  const handleSubmit = useCallback(async () => {
    if (!iterationId) return

    // Record booking confirmation event
    addSelection({
      type: "booking_confirmed",
      timestamp: new Date().toISOString()
    });

    // Stop tracking the iteration
    stopExperiment();
    
    // Mark as submitted to show completion screen
    setIsSubmitted(true)
  }, [iterationId, addSelection, stopExperiment])

  const handleFinish = useCallback(() => {
    router.push("/welcome")
  }, [router])

  if (!outboundFlight || !returnFlight) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {!isSubmitted && (
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={handleBack}
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
              <Button onClick={handleFinish}>
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

              <div className="text-center">
                <Button
                  onClick={handleSubmit}
                  className="w-full md:w-auto"
                  data-track-id="confirm-booking-button"
                >
                  Confirm Booking
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
