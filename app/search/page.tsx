"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useExperimentStore } from "@/lib/experiment-store"
import { AirportAutocomplete } from "@/components/airport-autocomplete"
import type { SearchParameters } from "@/lib/types"
import { Calendar } from "@/components/ui/calendar"
import { DebugPanel } from "@/components/debug-panel"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const iterationId = searchParams.get("iteration")
  const [date, setDate] = useState<Date>()
  const [returnDate, setReturnDate] = useState<Date>()
  const [departure, setDeparture] = useState("")
  const [destination, setDestination] = useState("")
  const pageExitRecordedRef = useRef(false)
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParameters>({
    departure: "",
    destination: "",
    date: "",
    returnDate: "",
  })
  const searchParamsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialRenderRef = useRef(true)
  const pageEntryRecordedRef = useRef(false)

  const { setCurrentIteration, participantId, recordPageExit, recordPageEntry, updatePageSearchParams } =
    useExperimentStore()

  // Función para manejar la selección de fecha de ida
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)

    if (selectedDate) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      console.log(`Departure date selected: ${formattedDate}`)
      updateSearchParamsImmediate(departure, destination, selectedDate, returnDate)
    }
  }

  // Función para manejar la selección de fecha de vuelta
  const handleReturnDateSelect = (selectedDate: Date | undefined) => {
    setReturnDate(selectedDate)

    if (selectedDate) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      console.log(`Return date selected: ${formattedDate}`)
      updateSearchParamsImmediate(departure, destination, date, selectedDate)
    }
  }

  // Actualizar los parámetros de búsqueda inmediatamente
  const updateSearchParamsImmediate = useCallback(
    (dep: string, dest: string, selectedDate: Date | undefined, selectedReturnDate: Date | undefined) => {
      const params: SearchParameters = {
        departure: dep || "",
        destination: dest || "",
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
        returnDate: selectedReturnDate ? format(selectedReturnDate, "yyyy-MM-dd") : "",
      }

      setCurrentSearchParams(params)

      // También actualizar en el store
      updatePageSearchParams("search", params)
    },
    [updatePageSearchParams],
  )

  // Actualizar los parámetros de búsqueda con debounce
  const updateSearchParams = useCallback(() => {
    if (searchParamsUpdateTimeoutRef.current) {
      clearTimeout(searchParamsUpdateTimeoutRef.current)
    }

    searchParamsUpdateTimeoutRef.current = setTimeout(() => {
      updateSearchParamsImmediate(departure, destination, date, returnDate)
    }, 300) // 300ms debounce
  }, [departure, destination, date, returnDate, updateSearchParamsImmediate])

  // Forzar el registro de la entrada a la página
  const forcePageEntryRecord = useCallback(() => {
    if (!pageEntryRecordedRef.current) {
      const entryTime = new Date()
      console.log(`FORCE Page entry: search at ${entryTime.toISOString()}`, {
        searchParams: currentSearchParams,
      })
      recordPageEntry("search", entryTime, currentSearchParams)
      pageEntryRecordedRef.current = true
    }
  }, [currentSearchParams, recordPageEntry])

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

    // Establecer la iteración actual
    setCurrentIteration(iterationId)

    // Inicializar los parámetros de búsqueda incluso si están vacíos
    // para asegurar que la primera entrada a search aparezca en pageVisits
    if (initialRenderRef.current) {
      initialRenderRef.current = false

      // Forzar el registro de la entrada a la página después de un breve retraso
      // para asegurar que los estados se hayan actualizado
      setTimeout(() => {
        forcePageEntryRecord()
      }, 100)

      console.log(`Search page mounted with iteration: ${iterationId}`)
    }

    // Función de limpieza para asegurar que se registre la salida de la página
    return () => {
      if (!pageExitRecordedRef.current) {
        // Asegurarse de que los parámetros de búsqueda finales se guarden
        const finalParams: SearchParameters = {
          departure: departure || "",
          destination: destination || "",
          date: date ? format(date, "yyyy-MM-dd") : "",
          returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : "",
        }

        console.log(`Manual page exit: search at ${new Date().toISOString()} with final params:`, finalParams)

        // Actualizar los parámetros de búsqueda finales antes de registrar la salida
        updatePageSearchParams("search", finalParams)

        // Registrar la salida con los parámetros finales
        recordPageExit("search", new Date())
        pageExitRecordedRef.current = true
      }

      // Limpiar cualquier timeout pendiente
      if (searchParamsUpdateTimeoutRef.current) {
        clearTimeout(searchParamsUpdateTimeoutRef.current)
      }
    }
  }, [
    iterationId,
    router,
    setCurrentIteration,
    participantId,
    recordPageExit,
    updateSearchParamsImmediate,
    forcePageEntryRecord,
    departure,
    destination,
    date,
    returnDate,
    updatePageSearchParams,
  ])

  // Actualizar los parámetros de búsqueda cuando cambian las entradas
  useEffect(() => {
    updateSearchParams()
  }, [updateSearchParams])

  // Set up event tracking for the search page
  useEffect(() => {
    const { recordInteraction, startExperiment } = useExperimentStore.getState()

    // Start the experiment if it's not already started
    startExperiment()

    // Mouse move tracking (throttled to every 100ms)
    let lastMoveTime = 0
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastMoveTime > 100) {
        lastMoveTime = now

        // Get the element under the cursor
        const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
        const trackingId = element?.closest("[data-tracking-id]")?.getAttribute("data-tracking-id") || null

        recordInteraction({
          type: "mousemove",
          pageId: "search",
          x: e.clientX,
          y: e.clientY,
          timestamp: new Date(),
          elementId: trackingId,
        })
      }
    }

    // Click tracking
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const trackingElement = target.closest("[data-tracking-id]") as HTMLElement
      const trackingId = trackingElement?.getAttribute("data-tracking-id") || null

      // Determine element type
      let elementType = null
      if (target.tagName) {
        elementType = target.tagName.toLowerCase()

        // Add more specific type if available
        if (target.getAttribute("type")) {
          elementType += `-${target.getAttribute("type")}`
        }

        // Check if it's inside a label
        if (target.closest("label")) {
          elementType = "label-" + elementType
        }
      }

      const interaction = {
        type: "click" as const,
        pageId: "search",
        x: e.clientX,
        y: e.clientY,
        timestamp: new Date(),
        elementId: trackingId,
        elementType,
      }

      console.log("Search page click interaction:", interaction)
      recordInteraction(interaction)
    }

    // Scroll tracking (throttled to every 100ms)
    let lastScrollTime = 0
    const handleScroll = () => {
      const now = Date.now()
      if (now - lastScrollTime > 100) {
        lastScrollTime = now
        recordInteraction({
          type: "scroll",
          pageId: "search",
          x: window.scrollX,
          y: window.scrollY,
          timestamp: new Date(),
        })
      }
    }

    // Keypress tracking
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inputId =
        target.getAttribute("id") ||
        target.getAttribute("name") ||
        target.closest("[data-tracking-id]")?.getAttribute("data-tracking-id") ||
        null

      // Only track keypresses in input elements
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true"
      ) {
        console.log("Search page keypress interaction:", { key: e.key, inputId })
        recordInteraction({
          type: "keypress",
          pageId: "search",
          key: e.key,
          timestamp: new Date(),
          inputId,
        })
      }
    }

    // Add event listeners
    console.log("Setting up event listeners for search page")
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    window.addEventListener("click", handleClick)
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("keydown", handleKeyPress)

    // Cleanup function
    return () => {
      console.log("Cleaning up event listeners for search page")
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, []) // Empty dependency array so this only runs once

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!departure || !destination || !date || !returnDate) {
      return
    }

    // Asegurar que se registre la salida de la página antes de la navegación
    if (!pageExitRecordedRef.current) {
      // Guardar los parámetros de búsqueda finales
      const finalParams: SearchParameters = {
        departure,
        destination,
        date: date ? format(date, "yyyy-MM-dd") : "",
        returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : "",
      }

      console.log(`Page exit (submit): search at ${new Date().toISOString()} with final params:`, finalParams)

      // Actualizar los parámetros de búsqueda finales antes de registrar la salida
      updatePageSearchParams("search", finalParams)

      // Registrar la salida con los parámetros finales
      recordPageExit("search", new Date())
      pageExitRecordedRef.current = true
    }

    const params = {
      departure,
      destination,
      date: date ? format(date, "yyyy-MM-dd") : "",
      returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : "",
    }

    const searchParamsString = new URLSearchParams({
      ...params,
      iteration: iterationId || "",
    }).toString()

    router.push(`/results/outbound?${searchParamsString}`)
  }

  const handleBackToWelcome = () => {
    // Asegurar que se registre la salida de la página antes de la navegación
    if (!pageExitRecordedRef.current) {
      // Guardar los parámetros de búsqueda finales
      const finalParams: SearchParameters = {
        departure: departure || "",
        destination: destination || "",
        date: date ? format(date, "yyyy-MM-dd") : "",
        returnDate: returnDate ? format(returnDate, "yyyy-MM-dd") : "",
      }

      console.log(`Page exit (back): search at ${new Date().toISOString()} with final params:`, finalParams)

      // Actualizar los parámetros de búsqueda finales antes de registrar la salida
      updatePageSearchParams("search", finalParams)

      // Registrar la salida con los parámetros finales
      recordPageExit("search", new Date())
      pageExitRecordedRef.current = true
    }
    router.push("/welcome")
  }

  // Manejar cambios en el aeropuerto de salida
  const handleDepartureChange = (value: string) => {
    setDeparture(value)
    updateSearchParamsImmediate(value, destination, date, returnDate)
  }

  // Manejar cambios en el aeropuerto de destino
  const handleDestinationChange = (value: string) => {
    setDestination(value)
    updateSearchParamsImmediate(departure, value, date, returnDate)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={handleBackToWelcome}
          data-tracking-id="back-to-welcome"
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
                  trackingId="departure-input"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="destination">Destination Airport</Label>
                <AirportAutocomplete
                  id="destination"
                  value={destination}
                  onChange={handleDestinationChange}
                  placeholder="Select destination airport"
                  trackingId="destination-input"
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
                        data-tracking-id="departure-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick departure date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" data-tracking-id="departure-calendar-container">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                        data-tracking-id="departure-calendar"
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
                        data-tracking-id="return-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "PPP") : <span>Pick return date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" data-tracking-id="return-calendar-container">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={handleReturnDateSelect}
                        initialFocus
                        data-tracking-id="return-calendar"
                        disabled={(date) => date < new Date() || (date && date < new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" data-tracking-id="search-submit">
              Search Flights
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Panel de depuración */}
      <DebugPanel />
    </div>
  )
}
