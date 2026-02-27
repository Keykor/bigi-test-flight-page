"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Check, Clock, Luggage, Plane, Calendar, MapPin, Timer, Ban, DollarSign } from "lucide-react"
import { getFlightById } from "@/lib/experiments"
import { useEventTracker } from "@/context/EventTrackerProvider"
import type { Flight, SearchParameters } from "@/lib/types"
import AirlineLayout from "@/components/airline-layout"
import { FloatingTaskCard } from "@/components/floating-task-card"

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
    return (
      <AirlineLayout activeTab="flights">
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </AirlineLayout>
    )
  }

  return (
    <AirlineLayout activeTab="flights">
      <FloatingTaskCard experimentId={iterationId} />
      <div className="container mx-auto px-4 py-8 max-w-4xl bg-gray-50 min-h-screen">
        {!isSubmitted && (
          <div className="mb-6">
            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-gray-200"
              onClick={handleBack}
              data-track-id="back-to-return-results"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
          </div>
        )}

        <Card className="mb-8 shadow-md border-t-4 border-t-green-500">
          <CardHeader className="bg-gray-100 border-b py-6">
            <CardTitle className="text-2xl text-green-600 font-bold">{isSubmitted ? "Booking Complete" : "Confirm Your Flight"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-6">
            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 border-4 border-green-200">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-green-700">Thank You!</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Your flight booking has been confirmed and your experiment data has been submitted successfully.
                </p>
                <Button 
                  onClick={handleFinish} 
                  data-track-id="return-to-home"
                  size="lg"
                  className="px-8 bg-green-500 hover:bg-green-600"
                >
                  Return to Home
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Plane className="h-5 w-5 text-green-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-green-600">Flight Itinerary</h2>
                  </div>
                  
                  <div className="mb-6 p-5 bg-green-50 rounded-lg border border-green-100 shadow-sm">
                    <h3 className="font-medium mb-3 text-green-700 flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Outbound</span>
                      {outboundFlight.origin} to {outboundFlight.destination}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><Plane className="h-4 w-4" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Airline</div>
                          <div className="font-medium">{outboundFlight.airline}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><Plane className="h-4 w-4 transform rotate-45" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Flight Number</div>
                          <div className="font-medium">{outboundFlight.flightNumber}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><Calendar className="h-4 w-4" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Date</div>
                          <div className="font-medium">{outboundFlight.departureDate}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><MapPin className="h-4 w-4" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Departure</div>
                          <div className="font-medium">
                            {outboundFlight.departureTime} • {outboundFlight.origin}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><MapPin className="h-4 w-4" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Arrival</div>
                          <div className="font-medium">
                            {outboundFlight.arrivalTime} • {outboundFlight.destination}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><Timer className="h-4 w-4" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Duration</div>
                          <div className="font-medium">{outboundFlight.duration}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50">
                          {outboundFlight.stops === 0 ? <Ban className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Stops</div>
                          <div className="font-medium">
                            {outboundFlight.stops === 0
                              ? "Direct Flight"
                              : `${outboundFlight.stops} Stop${outboundFlight.stops > 1 ? "s" : ""}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 p-5 bg-green-50 rounded-lg border border-green-100 shadow-sm">
                    <h3 className="font-medium mb-3 text-green-700 flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Return</span>
                      {returnFlight.origin} to {returnFlight.destination}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><Plane className="h-4 w-4" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Airline</div>
                          <div className="font-medium">{returnFlight.airline}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><Plane className="h-4 w-4 transform rotate-45" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Flight Number</div>
                          <div className="font-medium">{returnFlight.flightNumber}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><Calendar className="h-4 w-4" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Date</div>
                          <div className="font-medium">{returnFlight.departureDate}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><MapPin className="h-4 w-4" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Departure</div>
                          <div className="font-medium">
                            {returnFlight.departureTime} • {returnFlight.origin}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><MapPin className="h-4 w-4" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Arrival</div>
                          <div className="font-medium">
                            {returnFlight.arrivalTime} • {returnFlight.destination}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50"><Timer className="h-4 w-4" /></div>
                        <div>
                          <div className="text-sm text-muted-foreground">Duration</div>
                          <div className="font-medium">{returnFlight.duration}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-50">
                          {returnFlight.stops === 0 ? <Ban className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Stops</div>
                          <div className="font-medium">
                            {returnFlight.stops === 0
                              ? "Direct Flight"
                              : `${returnFlight.stops} Stop${returnFlight.stops > 1 ? "s" : ""}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-green-600">Price Details</h2>
                  </div>

                  <div className="mb-8 p-5 bg-green-50 rounded-lg border border-green-100 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="font-medium">Outbound Flight ({outboundFlight.class} Class)</div>
                        <div className="text-sm text-muted-foreground">
                          {outboundFlight.origin} to {outboundFlight.destination}
                        </div>
                      </div>
                      <div className="font-medium">${outboundFlight.price}</div>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="font-medium">Return Flight ({returnFlight.class} Class)</div>
                        <div className="text-sm text-muted-foreground">
                          {returnFlight.origin} to {returnFlight.destination}
                        </div>
                      </div>
                      <div className="font-medium">${returnFlight.price}</div>
                    </div>
                    <div className="h-px bg-green-200 my-3"></div>
                    <div className="flex justify-between items-center font-bold text-lg">
                      <div>Total Price</div>
                      <div className="text-green-600">${outboundFlight.price + returnFlight.price}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Luggage className="h-5 w-5 text-green-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-green-600">Additional Information</h2>
                  </div>

                  <div className="mb-8 p-5 bg-green-50 rounded-lg border border-green-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-100 p-1.5 rounded-full">
                          <Luggage className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Baggage (Outbound)</div>
                          <div className="text-sm text-muted-foreground">{outboundFlight.luggage}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-100 p-1.5 rounded-full">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Refund Policy (Outbound)</div>
                          <div className="text-sm text-muted-foreground">
                            {outboundFlight.refundable ? "Refundable" : "Non-refundable"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-100 p-1.5 rounded-full">
                          <Luggage className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Baggage (Return)</div>
                          <div className="text-sm text-muted-foreground">{returnFlight.luggage}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-1 bg-green-100 p-1.5 rounded-full">
                          <Clock className="h-4 w-4" />
                        </div>
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
                      className="w-full md:w-auto px-8 py-6 text-lg bg-green-500 hover:bg-green-600 shadow-md transition-all"
                      data-track-id="confirm-booking-button"
                    >
                      Confirm Booking
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AirlineLayout>
  )
}
