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
import { CalendarWrapper } from "@/components/ui/calendar-wrapper" 
import { useEventTracker } from "@/context/EventTrackerProvider"
import AirlineLayout from "@/components/airline-layout"

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
  
  // Add state to control popover open/close state
  const [departureDateOpen, setDepartureDateOpen] = useState(false)
  const [returnDateOpen, setReturnDateOpen] = useState(false)
  
  // Add validation state
  const [errors, setErrors] = useState<{
    departure?: string;
    destination?: string;
    date?: string;
    returnDate?: string;
  }>({})
  
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

  // Handle departure date selection
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
    // Clear any error for this field
    setErrors(prev => ({ ...prev, date: undefined }));
    // Explicitly close the departure date popover
    setDepartureDateOpen(false);
  }

  // Handle return date selection
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
    // Clear any error for this field
    setErrors(prev => ({ ...prev, returnDate: undefined }));
    // Explicitly close the return date popover
    setReturnDateOpen(false);
  }

  // Initialize page data
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

    // Reset errors
    const newErrors: {
      departure?: string;
      destination?: string;
      date?: string;
      returnDate?: string;
    } = {};
    
    // Validate all fields
    if (!departure) {
      newErrors.departure = "Please select a departure airport";
    }
    
    if (!destination) {
      newErrors.destination = "Please select a destination airport";
    }
    
    if (!date) {
      newErrors.date = "Please select a departure date";
    }
    
    if (!returnDate) {
      newErrors.returnDate = "Please select a return date";
    }
    
    // Update error state
    setErrors(newErrors);
    
    // Check if there are any errors
    if (Object.keys(newErrors).length > 0) {
      // Record validation error event
      addSelection({
        type: "search_validation_error",
        errors: newErrors,
        iterationId: iterationId,
      });
      
      return;
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
  
  // Handle departure airport changes
  const handleDepartureChange = (value: string) => {
    // Always update the input field value
    setDeparture(value);
    
    // Clear any error for this field
    setErrors(prev => ({ ...prev, departure: undefined }));
    
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

  // Handle destination airport changes
  const handleDestinationChange = (value: string) => {
    // Always update the input field value
    setDestination(value);
    
    // Clear any error for this field
    setErrors(prev => ({ ...prev, destination: undefined }));
    
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
    <AirlineLayout activeTab="flights">
      <div className="airline-form">
        <div className="airline-form-content grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <div className="col-span-1">
            <label className="block text-white font-medium mb-2">Origin</label>
            <AirportAutocomplete
              id="departure"
              value={departure}
              onChange={handleDepartureChange}
              placeholder="Select departure airport"
              data-track-id="departure-airport-input"
              className={`w-full bg-white ${errors.departure ? 'border-red-500' : ''}`}
            />
            {errors.departure && (
              <p className="text-red-400 text-sm mt-1">{errors.departure}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label className="block text-white font-medium mb-2">Destination</label>
            <AirportAutocomplete
              id="destination"
              value={destination}
              onChange={handleDestinationChange}
              placeholder="Select destination airport"
              data-track-id="destination-airport-input"
              className={`w-full bg-white ${errors.destination ? 'border-red-500' : ''}`}
            />
            {errors.destination && (
              <p className="text-red-400 text-sm mt-1">{errors.destination}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label className="block text-white font-medium mb-2">Departure Date</label>
            <Popover open={departureDateOpen} onOpenChange={setDepartureDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full bg-white justify-start text-left font-normal", 
                    !date && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                  data-track-id="departure-date-trigger"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white min-w-[320px]" align="start">
                <CalendarWrapper
                  selected={date}
                  onSelect={handleDateSelect}
                  trackingIdPrefix="departure-calendar"
                  className="rounded-md border-0"
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-red-400 text-sm mt-1">{errors.date}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label className="block text-white font-medium mb-2">Return Date</label>
            <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="returnDate"
                  variant={"outline"}
                  className={cn(
                    "w-full bg-white justify-start text-left font-normal", 
                    !returnDate && "text-muted-foreground",
                    errors.returnDate && "border-red-500"
                  )}
                  data-track-id="return-date-trigger"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {returnDate ? format(returnDate, "dd/MM/yyyy") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white min-w-[320px]" align="start">
                <CalendarWrapper
                  selected={returnDate}
                  onSelect={handleReturnDateSelect}
                  trackingIdPrefix="return-calendar"
                  className="rounded-md border-0"
                />
              </PopoverContent>
            </Popover>
            {errors.returnDate && (
              <p className="text-red-400 text-sm mt-1">{errors.returnDate}</p>
            )}
          </div>
          
          <div className="col-span-1 md:col-span-2 mt-4">
            <Button 
              onClick={handleSubmit} 
              className="w-full py-3 text-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              data-track-id="search-flights-submit"
            >
              Search Flights
            </Button>
            {Object.keys(errors).length > 0 && (
              <p className="text-red-400 text-sm text-center mt-2">
                Please fill in all required fields to continue
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Discount section - less prominent */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-gray-100 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="w-1/4 hidden md:block">
              <img 
                src="/images/plane-sunset.jpg" 
                alt="Last minute offer" 
                className="w-full h-28 object-cover rounded"
                onError={e => {
                  // Fallback if image not found
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1496427011580-7f32943ee9d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";
                }}
              />
            </div>
            <div className="w-3/4 pl-4">
              <h3 className="text-lg font-bold mb-1">Last Minute Offers</h3>
              <p className="text-sm mb-2">Get 30% off on selected destinations. Limited time offer.</p>
              <Button className="text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 cursor-not-allowed" disabled>
                View Offers
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Subscribe now for the best deals</h3>
          <p className="mb-4">Never miss an offer!</p>
          
          <ul className="ml-6 mb-4 list-disc">
            <li className="mb-1">Get notified about the latest deals</li>
            <li className="mb-1">Be the first to get promotions</li>
            <li className="mb-1">Discover new destinations</li>
          </ul>
          
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="email"
              placeholder="Email"
              className="flex-grow p-2 border rounded cursor-not-allowed bg-gray-50"
              disabled
            />
            <Button className="bg-gray-300 hover:bg-gray-400 text-gray-800 cursor-not-allowed" disabled>
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </AirlineLayout>
  )
}
