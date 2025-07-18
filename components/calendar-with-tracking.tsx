"use client"

import type * as React from "react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { useEffect, useRef } from "react"

interface CalendarWithTrackingProps extends React.ComponentProps<typeof CalendarComponent> {
  trackingIdPrefix?: string
}

export function Calendar({ trackingIdPrefix = "calendar-day", ...props }: CalendarWithTrackingProps) {
  const calendarRef = useRef<HTMLDivElement>(null)

  // Añadir IDs de tracking a los días después de que el componente se monte
  useEffect(() => {
    if (calendarRef.current) {
      // Buscar todos los botones de día en el calendario
      const dayButtons = calendarRef.current.querySelectorAll('[role="gridcell"] button')

      // Añadir IDs de tracking a cada botón
      dayButtons.forEach((button) => {
        // Obtener el texto del botón (que debería ser el número del día)
        const dayText = button.textContent
        if (dayText) {
          // Obtener la fecha actual para el año y mes
          const now = new Date()
          const year = now.getFullYear()
          const month = now.getMonth() + 1 // Meses son 0-indexed

          // Crear un ID de tracking
          const trackingId = `${trackingIdPrefix}-${year}-${month.toString().padStart(2, "0")}-${dayText.padStart(2, "0")}`

          // Añadir el atributo data-track-id
          button.setAttribute("data-track-id", trackingId)
        }
      })
      
      // También agregar track-id a los botones de navegación del calendario
      const navButtons = calendarRef.current.querySelectorAll('.rdp-nav_button')
      navButtons.forEach((button, index) => {
        const isNext = index === 1 // Normalmente el segundo botón es "next"
        button.setAttribute("data-track-id", `${trackingIdPrefix}-nav-${isNext ? 'next' : 'prev'}`)
      })
      
      // Agregar track-id a otros elementos interactivos del calendario
      const todayButton = calendarRef.current.querySelector('.rdp-day_today')
      if (todayButton) {
        todayButton.setAttribute("data-track-id", `${trackingIdPrefix}-today`)
      }
    }
  }, [trackingIdPrefix])

  return (
    <div ref={calendarRef}>
      <CalendarComponent {...props} />
    </div>
  )
}
