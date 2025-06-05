"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  trackingIdPrefix?: string
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  trackingIdPrefix = "calendar-day",
  ...props
}: CalendarProps) {
  // Add tracking to day buttons
  const handleDayClick = React.useCallback(
    (day: Date, modifiers: any, e: React.MouseEvent<HTMLButtonElement>) => {
      // Add data attribute for tracking
      if (e.currentTarget) {
        e.currentTarget.setAttribute(
          "data-track-id",
          `${trackingIdPrefix}-${day.getDate()}`
        )
      }

      // Call the original onDayClick if it exists
      if (props.onDayClick) {
        props.onDayClick(day, modifiers, e)
      }
    },
    [props.onDayClick, trackingIdPrefix]
  )

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      onDayClick={handleDayClick}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-sm font-medium",
        nav: "flex items-center justify-between px-1 space-x-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-75 hover:opacity-100 border-0"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "", // Let the global styles handle this
        head_cell: "text-muted-foreground font-normal text-[0.8rem]",
        row: "", // Let the global styles handle this
        cell: "text-center p-0 relative [&:has([aria-selected])]:bg-accent",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-full"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <ChevronLeft className="h-4 w-4" data-track-id={`${trackingIdPrefix}-prev-month`} />
        ),
        IconRight: ({ ...props }) => (
          <ChevronRight className="h-4 w-4" data-track-id={`${trackingIdPrefix}-next-month`} />
        ),
      }}
      modifiersClassNames={{
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-full",
        today: "bg-accent text-accent-foreground rounded-full border border-primary",
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
