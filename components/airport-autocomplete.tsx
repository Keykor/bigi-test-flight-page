"use client"

import { useState, useRef, useEffect } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Plane } from "lucide-react"
import { cn } from "@/lib/utils"
import { airports } from "@/lib/airports"

interface AirportAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  id: string
  "data-track-id"?: string
}

export function AirportAutocomplete({ value, onChange, placeholder, id, "data-track-id": trackId }: AirportAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // This function filters airports by code, name, city, and country
  const filteredAirports = airports.filter((airport) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      airport.code.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query) ||
      airport.country.toLowerCase().includes(query)
    )
  })

  const selectedAirport = airports.find((airport) => airport.code === value)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          id={id}
          data-track-id={trackId}
        >
          {value ? (
            <div className="flex items-center">
              <Plane className="mr-2 h-4 w-4" />
              <span>
                {selectedAirport
                  ? `${selectedAirport.city} (${selectedAirport.code})`
                  : `${value.toUpperCase()} - Unknown Airport`}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        sideOffset={5}
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command>
          <CommandInput
            placeholder="Search airports..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            ref={inputRef}
            className="h-9"
            data-track-id={`${trackId}-search`}
          />
          <CommandList>
            <CommandEmpty>No airport found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredAirports.map((airport) => (
                <CommandItem
                  key={airport.code}
                  value={`${airport.code} ${airport.name} ${airport.city} ${airport.country}`}
                  onSelect={() => {
                    onChange(airport.code)
                    setOpen(false)
                    setSearchQuery("")
                  }}
                  className="flex items-center"
                  data-track-id={`${trackId}-select-${airport.code}`}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === airport.code ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span>
                      {airport.city} ({airport.code})
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{airport.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
