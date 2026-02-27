"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parse } from "date-fns"
import { CalendarIcon, ArrowLeft, Calendar, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { AirportAutocomplete } from "@/components/airport-autocomplete"
import { CalendarWrapper } from "@/components/ui/calendar-wrapper"
import { useEventTracker } from "@/context/EventTrackerProvider"
import AirlineLayout from "@/components/airline-layout"
import { FloatingTaskCard } from "@/components/floating-task-card"

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

  // Add state to track if form was submitted
  const [formSubmitted, setFormSubmitted] = useState(false);

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

  // Initialize page data and restore form values from sessionStorage
  useEffect(() => {
    if (!iterationId) {
      router.push("/welcome")
      return
    }

    if (initialRenderRef.current) {
      initialRenderRef.current = false
      console.log(`Search page mounted with iteration: ${iterationId}`)

      // Restore form values from sessionStorage
      const storageKey = `search_form_${iterationId}`
      const savedFormData = sessionStorage.getItem(storageKey)

      if (savedFormData) {
        try {
          const formData = JSON.parse(savedFormData)

          if (formData.departure) {
            setDeparture(formData.departure)
          }

          if (formData.destination) {
            setDestination(formData.destination)
          }

          if (formData.date) {
            // Parse the date string in local timezone to avoid timezone issues
            const parsedDate = parse(formData.date, "yyyy-MM-dd", new Date())
            if (!isNaN(parsedDate.getTime())) {
              setDate(parsedDate)
            }
          }

          if (formData.returnDate) {
            // Parse the date string in local timezone to avoid timezone issues
            const parsedReturnDate = parse(formData.returnDate, "yyyy-MM-dd", new Date())
            if (!isNaN(parsedReturnDate.getTime())) {
              setReturnDate(parsedReturnDate)
            }
          }

          console.log(`Restored form data for iteration ${iterationId}:`, formData)
        } catch (e) {
          console.error("Error parsing saved form data:", e)
        }
      }
    }
  }, [iterationId, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Set form as submitted to display the summary error if needed
    setFormSubmitted(true);

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

    // Save form data to sessionStorage for restoration on back navigation
    const storageKey = `search_form_${iterationId}`
    sessionStorage.setItem(storageKey, JSON.stringify(params))
    console.log(`Saved form data to sessionStorage with key: ${storageKey}`)

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
      <FloatingTaskCard experimentId={iterationId} />
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        {/* Add space between navbar and form */}
        <div className="mt-4 md:mt-6"></div>

        {/* Use container to match width of cards below */}
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8 shadow-md border-t-4 border-t-green-500 overflow-hidden">
            <CardHeader className="bg-gray-100 border-b py-6">
              <CardTitle className="text-2xl text-green-600 font-bold">Find Your Flight</CardTitle>
              <p className="text-muted-foreground">Enter your travel details to search for available flights</p>
            </CardHeader>
            
            <CardContent className="pt-8 pb-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
                    <div className="bg-green-100 p-1.5 rounded-full">
                      <MapPin className="h-4 w-4 text-green-500" />
                    </div>
                    Origin
                  </label>
                  <AirportAutocomplete
                    id="departure"
                    value={departure}
                    onChange={handleDepartureChange}
                    placeholder="Select departure airport"
                    data-track-id="departure-airport-input"
                    className={`w-full bg-white shadow-sm ${errors.departure ? 'border-2 border-red-500' : 'border border-gray-300'}`}
                  />
                  {errors.departure && (
                    <p className="text-red-600 font-medium text-sm mt-1">{errors.departure}</p>
                  )}
                </div>
                
                <div className="col-span-1">
                  <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
                    <div className="bg-green-100 p-1.5 rounded-full">
                      <MapPin className="h-4 w-4 text-green-500" />
                    </div>
                    Destination
                  </label>
                  <AirportAutocomplete
                    id="destination"
                    value={destination}
                    onChange={handleDestinationChange}
                    placeholder="Select destination airport"
                    data-track-id="destination-airport-input"
                    className={`w-full bg-white shadow-sm ${errors.destination ? 'border-2 border-red-500' : 'border border-gray-300'}`}
                  />
                  {errors.destination && (
                    <p className="text-red-600 font-medium text-sm mt-1">{errors.destination}</p>
                  )}
                </div>
                
                <div className="col-span-1">
                  <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
                    <div className="bg-green-100 p-1.5 rounded-full">
                      <Calendar className="h-4 w-4 text-green-500" />
                    </div>
                    Departure Date
                  </label>
                  <Popover open={departureDateOpen} onOpenChange={setDepartureDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full bg-white justify-start text-left font-normal shadow-sm", 
                          !date && "text-muted-foreground",
                          errors.date ? 'border-2 border-red-500' : 'border border-gray-300'
                        )}
                        data-track-id="departure-date-trigger"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "dd/MM/yyyy") : <span>Select date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white min-w-[320px] shadow-lg" align="start">
                      <CalendarWrapper
                        selected={date}
                        onSelect={handleDateSelect}
                        trackingIdPrefix="departure-calendar"
                        className="rounded-md border-0"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && (
                    <p className="text-red-600 font-medium text-sm mt-1">{errors.date}</p>
                  )}
                </div>
                
                <div className="col-span-1">
                  <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
                    <div className="bg-green-100 p-1.5 rounded-full">
                      <Calendar className="h-4 w-4 text-green-500" />
                    </div>
                    Return Date
                  </label>
                  <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="returnDate"
                        variant={"outline"}
                        className={cn(
                          "w-full bg-white justify-start text-left font-normal shadow-sm", 
                          !returnDate && "text-muted-foreground",
                          errors.returnDate ? 'border-2 border-red-500' : 'border border-gray-300'
                        )}
                        data-track-id="return-date-trigger"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "dd/MM/yyyy") : <span>Select date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white min-w-[320px] shadow-lg" align="start">
                      <CalendarWrapper
                        selected={returnDate}
                        onSelect={handleReturnDateSelect}
                        trackingIdPrefix="return-calendar"
                        className="rounded-md border-0"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.returnDate && (
                    <p className="text-red-600 font-medium text-sm mt-1">{errors.returnDate}</p>
                  )}
                </div>
                
                <div className="col-span-1 md:col-span-2 mt-6">
                  <Button 
                    onClick={handleSubmit} 
                    className="w-full py-6 text-lg font-semibold bg-green-500 hover:bg-green-600 text-white shadow-md transition-colors duration-200 rounded-md"
                    data-track-id="search-flights-submit"
                  >
                    Search Flights
                  </Button>
                  {/* Only show summary error if form was submitted and there are errors */}
                  {formSubmitted && Object.keys(errors).length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 font-medium text-sm text-center">
                        Please fill in all required fields to continue
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        
          {/* Discount section - updated for better appearance */}
          <Card className="mb-8 shadow-md overflow-hidden">
            <CardHeader className="bg-gray-100 border-b py-4">
              <CardTitle className="text-xl font-bold">Special Offers</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="w-1/4 hidden md:block">
                  <img 
                    src="/images/plane-sunset.jpg" 
                    alt="Last minute offer" 
                    className="w-full h-28 object-cover rounded-md shadow-sm"
                    onError={e => {
                      // Fallback if image not found
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1496427011580-7f32943ee9d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";
                    }}
                  />
                </div>
                <div className="w-full md:w-3/4 pl-0 md:pl-6">
                  <h3 className="text-lg font-bold mb-2 text-gray-800">Last Minute Offers</h3>
                  <p className="text-gray-600 mb-3">Get 30% off on selected destinations. Limited time offer.</p>
                  <Button className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-not-allowed shadow-sm" disabled>
                    View Offers
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-8 shadow-md overflow-hidden">
            <CardHeader className="bg-gray-100 border-b py-4">
              <CardTitle className="text-xl font-bold">Newsletter</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Subscribe now for the best deals</h3>
              <p className="text-gray-600 mb-4">Never miss an offer!</p>
              
              <ul className="ml-6 mb-5 list-disc text-gray-600">
                <li className="mb-2">Get notified about the latest deals</li>
                <li className="mb-2">Be the first to get promotions</li>
                <li className="mb-2">Discover new destinations</li>
              </ul>
              
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-grow p-2 border rounded cursor-not-allowed bg-gray-50"
                  disabled
                />
                <Button className="bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-not-allowed shadow-sm" disabled>
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Add bottom spacing */}
        <div className="mb-10"></div>
      </div>
    </AirlineLayout>
  )
}
