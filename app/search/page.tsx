"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { AirportAutocomplete } from "@/components/airport-autocomplete"
import { Calendar } from "@/components/ui/calendar"
import { useEventTracker } from "@/context/EventTrackerProvider"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const iterationId = searchParams.get("iteration")
  const [date, setDate] = useState<Date>()
  const [returnDate, setReturnDate] = useState<Date>()
  const [departure, setDeparture] = useState("")
  const [destination, setDestination] = useState("")
  const initialRenderRef = useRef(true)
  const { addSelection } = useEventTracker()
  
  // Add state to track all form field changes
  const [formChanges, setFormChanges] = useState<Array<{
    type: string;
    field: string;
    value: string;
    previousValue?: string;
    timestamp: string;
  }>>([]);

  // Function to record a change to the form changes array
  const recordChange = useCallback((field: string, value: string, previousValue?: string) => {
    setFormChanges(prev => [
      ...prev,
      {
        type: 'field_change',
        field,
        value,
        previousValue,
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  // Función para manejar la selección de fecha de ida
  const handleDateSelect = (selectedDate: Date | undefined) => {
    // Only record changes if there was a previous date or a new date is selected
    if (date || selectedDate) {
      const prevDateString = date ? format(date, "yyyy-MM-dd") : undefined;
      const newDateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
      
      // Don't record if the same date was selected
      if (prevDateString !== newDateString) {
        recordChange('departure_date', newDateString || '', prevDateString);
      }
    }
    
    setDate(selectedDate);
  }

  // Función para manejar la selección de fecha de vuelta
  const handleReturnDateSelect = (selectedDate: Date | undefined) => {
    // Only record changes if there was a previous date or a new date is selected
    if (returnDate || selectedDate) {
      const prevDateString = returnDate ? format(returnDate, "yyyy-MM-dd") : undefined;
      const newDateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
      
      // Don't record if the same date was selected
      if (prevDateString !== newDateString) {
        recordChange('return_date', newDateString || '', prevDateString);
      }
    }
    
    setReturnDate(selectedDate);
  }

  // Inicializar datos de la página
  useEffect(() => {
    if (!iterationId) {
      router.push("/welcome")
      return
    }

    if (initialRenderRef.current) {
      initialRenderRef.current = false
      console.log(`Search page mounted with iteration: ${iterationId}`)
    }
  }, [iterationId, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!departure || !destination || !date || !returnDate) {
      return
    }

    const params = {
      departure,
      destination,
      date: date ? format(date, "yyyy-MM-dd") : "",
      returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : "",
    }

    // Add selection to track search parameters along with only the form changes array
    addSelection({
      type: "search_parameters",
      ...params,
      iterationId: iterationId,
      formChanges: formChanges, // Include only the history of changes
    });

    const searchParamsString = new URLSearchParams({
      ...params,
      iteration: iterationId || "",
    }).toString()

    router.push(`/results/outbound?${searchParamsString}`)
  }

  const handleBackToWelcome = () => {
    router.push("/welcome")
  }

  // Modified airport change handlers with more reliable tracking
  
  // Manejar cambios en el aeropuerto de salida
  const handleDepartureChange = (value: string) => {
    // Always update the input field value
    setDeparture(value);
    
    // Parse the airport code if this is a valid selection
    const match = value.match(/^([A-Z]{3})/);
    if (match && match[1]) {
      const airportCode = match[1];
      
      // Extract departure code from params or use empty string
      const departureParam = searchParams.get("departure") || "";
      
      // Only record if different from the URL parameter
      if (departureParam !== airportCode) {
        recordChange('departure_airport', airportCode, departureParam || undefined);
      }
    }
  }

  // Manejar cambios en el aeropuerto de destino
  const handleDestinationChange = (value: string) => {
    // Always update the input field value
    setDestination(value);
    
    // Parse the airport code if this is a valid selection
    const match = value.match(/^([A-Z]{3})/);
    if (match && match[1]) {
      const airportCode = match[1];
      
      // Extract destination code from params or use empty string
      const destinationParam = searchParams.get("destination") || "";
      
      // Only record if different from the URL parameter
      if (destinationParam !== airportCode) {
        recordChange('destination_airport', airportCode, destinationParam || undefined);
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={handleBackToWelcome}
          data-track-id="back-to-welcome"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Welcome
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Search for Round-Trip Flights</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Flight Information</h3>

              <div className="grid gap-2">
                <Label htmlFor="departure">Departure Airport</Label>
                <AirportAutocomplete
                  id="departure"
                  value={departure}
                  onChange={handleDepartureChange}
                  placeholder="Select departure airport"
                  data-track-id="departure-airport-input"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="destination">Destination Airport</Label>
                <AirportAutocomplete
                  id="destination"
                  value={destination}
                  onChange={handleDestinationChange}
                  placeholder="Select destination airport"
                  data-track-id="destination-airport-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Departure Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                        data-track-id="departure-date-trigger"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick departure date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                        trackingIdPrefix="departure-calendar"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="returnDate">Return Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="returnDate"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !returnDate && "text-muted-foreground",
                        )}
                        data-track-id="return-date-trigger"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "PPP") : <span>Pick return date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={handleReturnDateSelect}
                        initialFocus
                        disabled={(date) => date < new Date() || (date && date < new Date())}
                        trackingIdPrefix="return-calendar"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" data-track-id="search-flights-submit">
              Search Flights
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
