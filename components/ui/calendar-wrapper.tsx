"use client"

import * as React from "react"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns"

export type CalendarWrapperProps = {
  className?: string
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  onClose?: () => void // Add onClose prop
  trackingIdPrefix?: string
  initialFocus?: boolean
}

export function CalendarWrapper({
  className,
  selected,
  onSelect,
  onClose, // Add the onClose parameter
  trackingIdPrefix = "calendar-day",
  initialFocus,
  ...props
}: CalendarWrapperProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Go to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }
  
  // Go to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  // Calculate days for the current month view
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const startDay = getDay(monthStart)
  
  // Handle day selection
  const handleDayClick = (day: Date) => {
    if (onSelect) {
      onSelect(day)
    }
    
    // Close the popover after selection
    if (onClose) {
      onClose()
    }
  }
  
  // Create calendar rows
  const rows = []
  let days = []
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < startDay; i++) {
    days.push(<td key={`empty-${i}`} className="empty-cell"></td>)
  }
  
  // Add cells for each day of the month
  for (const day of monthDays) {
    const isSelected = selected ? isSameDay(day, selected) : false
    
    days.push(
      <td key={day.toString()} className="calendar-cell">
        <Button
          variant="ghost"
          className={cn(
            "calendar-day h-9 w-9 p-0 font-normal rounded-full",
            isSelected && "bg-primary text-primary-foreground"
          )}
          onClick={() => handleDayClick(day)}
          data-track-id={`${trackingIdPrefix}-${format(day, "dd")}`}
        >
          {format(day, "d")}
        </Button>
      </td>
    )
    
    // If we've reached the end of a week, start a new row
    if (days.length === 7) {
      rows.push(<tr key={`row-${rows.length}`}>{days}</tr>)
      days = []
    }
  }
  
  // Add remaining empty cells for days after the end of the month
  if (days.length > 0) {
    while (days.length < 7) {
      days.push(<td key={`empty-end-${days.length}`} className="empty-cell"></td>)
    }
    rows.push(<tr key={`row-${rows.length}`}>{days}</tr>)
  }
  
  return (
    <div className={cn("calendar-custom", className)}>
      <style jsx global>{`
        .calendar-custom {
          width: 320px; /* Increased from 280px */
          background: white;
          border-radius: 8px;
          padding: 12px;
        }
        
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .calendar-title {
          font-weight: 500;
          font-size: 16px;
        }
        
        .calendar-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 2px; /* Reduced from 4px to save space */
          table-layout: fixed; /* Ensures columns have equal width */
        }
        
        .calendar-table th {
          height: 32px;
          font-weight: 500;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
          padding: 0;
          width: 40px; /* Fixed width for each cell */
        }
        
        .calendar-cell {
          text-align: center;
          padding: 0;
          height: 40px;
          width: 40px; /* Fixed width for each cell */
        }
        
        .empty-cell {
          height: 40px;
          width: 40px; /* Fixed width for each cell */
        }
        
        .calendar-day {
          margin: 0 auto;
          width: 36px; /* Make sure button fits properly */
          height: 36px;
        }
        
        /* Fix PopoverContent to be wide enough */
        .rdp-popover {
          width: 340px !important;
        }
      `}</style>
      
      <div className="calendar-header">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-transparent p-0 opacity-75 hover:opacity-100 border-0"
          onClick={prevMonth}
          data-track-id={`${trackingIdPrefix}-prev-month`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="calendar-title">
          {format(currentMonth, "MMMM yyyy")}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-transparent p-0 opacity-75 hover:opacity-100 border-0"
          onClick={nextMonth}
          data-track-id={`${trackingIdPrefix}-next-month`}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <table className="calendar-table">
        <thead>
          <tr>
            <th>Su</th>
            <th>Mo</th>
            <th>Tu</th>
            <th>We</th>
            <th>Th</th>
            <th>Fr</th>
            <th>Sa</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  )
}
