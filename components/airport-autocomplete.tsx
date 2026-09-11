"use client"

import { useEffect, useState } from "react"
import { Command as CommandPrimitive } from "cmdk"
import { CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { airports } from "@/lib/airports"

interface AirportAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  id: string
  className?: string
  "data-track-id"?: string
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

const labelFor = (code: string) => {
  if (!code) return ""
  const airport = airports.find((a) => a.code === code)
  return airport ? `${airport.city} (${airport.code})` : `${code.toUpperCase()} - Unknown Airport`
}

export function AirportAutocomplete({
  value,
  onChange,
  placeholder,
  id,
  className,
  "data-track-id": trackId,
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState(() => labelFor(value))
  const [open, setOpen] = useState(false)

  // Sync the text when a selection arrives from outside (sessionStorage restore, item select).
  // Skipped when value is cleared so the text the user is typing survives.
  useEffect(() => {
    if (value) setQuery(labelFor(value))
  }, [value])

  // Focusing a field that already shows its selection should not pop a list.
  const q = query === labelFor(value) ? "" : normalize(query.trim())
  const matches = q
    ? airports
        .filter((a) => [a.code, a.name, a.city, a.country].some((f) => normalize(f).includes(q)))
        .sort((a, b) => a.city.localeCompare(b.city))
    : []

  // cmdk owns the input's id, so the caller's id goes on the field wrapper.
  return (
    <CommandPrimitive id={id} shouldFilter={false} className="relative">
      <CommandPrimitive.Input
        data-track-id={trackId}
        placeholder={placeholder}
        value={query}
        onValueChange={(text) => {
          setQuery(text)
          setOpen(true)
          if (value) onChange("")
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
        }}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      />
      {open && q && (
        <CommandList
          // Keep focus on the input so the click on an item lands before onBlur closes the list.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          <CommandEmpty>No airport found.</CommandEmpty>
          <CommandGroup>
            {matches.map((airport) => (
              <CommandItem
                key={airport.code}
                value={airport.code}
                onSelect={() => {
                  onChange(airport.code)
                  setQuery(labelFor(airport.code))
                  setOpen(false)
                }}
                data-track-id={`${trackId}-select-${airport.code}`}
              >
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
      )}
    </CommandPrimitive>
  )
}
