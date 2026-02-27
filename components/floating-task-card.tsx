"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Info, Move } from "lucide-react"
import { getExperimentById } from "@/lib/experiments"
import { useEventTracker } from "@/context/EventTrackerProvider"

interface FloatingTaskCardProps {
  experimentId: string | null
}

const POSITION_KEY = "floating_task_card_position"
const IS_OPEN_KEY = "floating_task_card_is_open"

export function FloatingTaskCard({ experimentId }: FloatingTaskCardProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [description, setDescription] = useState<string>("")
  const { addSelection } = useEventTracker()

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (experimentId) {
      const experiment = getExperimentById(experimentId)
      if (experiment) {
        setDescription(experiment.description)
      }
    }
  }, [experimentId])

  // Constrain position to viewport bounds
  const constrainPosition = (x: number, y: number) => {
    const maxX = window.innerWidth - (cardRef.current?.offsetWidth || 320)
    const maxY = window.innerHeight - (cardRef.current?.offsetHeight || 100)

    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    }
  }

  // Initialize position from localStorage or default to top-right corner
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPosition = localStorage.getItem(POSITION_KEY)
        const savedIsOpen = localStorage.getItem(IS_OPEN_KEY)

        if (savedPosition) {
          const parsed = JSON.parse(savedPosition)
          const constrained = constrainPosition(parsed.x, parsed.y)
          setPosition(constrained)
        } else {
          // Default position: top-right corner
          setPosition({ x: window.innerWidth - 336, y: 80 })
        }

        if (savedIsOpen !== null) {
          setIsOpen(savedIsOpen === 'true')
        }
      } catch (e) {
        console.error("Error loading floating card state:", e)
        setPosition({ x: window.innerWidth - 336, y: 80 })
      }
    }
  }, [])

  // Handle window resize - keep card within bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => constrainPosition(prev.x, prev.y))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle mouse down - start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the header, not from the chevron button area
    if ((e.target as HTMLElement).closest('button')) {
      return
    }

    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })

    addSelection({
      type: "floating_task_card_drag_start",
      experimentId: experimentId,
      position: position,
    })
  }

  // Save position to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && position.x !== 0 && position.y !== 0) {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position))
    }
  }, [position])

  // Handle mouse move - update position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Keep card within viewport bounds
      const constrained = constrainPosition(newX, newY)
      setPosition(constrained)
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        addSelection({
          type: "floating_task_card_drag_end",
          experimentId: experimentId,
          position: position,
        })
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, position, experimentId, addSelection])

  const handleToggle = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(IS_OPEN_KEY, String(newIsOpen))
    }

    addSelection({
      type: "floating_task_card_toggle",
      action: isOpen ? "collapsed" : "expanded",
      experimentId: experimentId,
    })
  }

  if (!experimentId || !description) {
    return null
  }

  return (
    <div
      ref={cardRef}
      className="fixed z-50 w-80 max-w-[calc(100vw-2rem)]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <Card className="shadow-2xl border-2 border-blue-500 bg-white">
        <CardHeader
          className="bg-blue-50 border-b py-3 cursor-move hover:bg-blue-100 transition-colors"
          onMouseDown={handleMouseDown}
          data-track-id="floating-task-description-header"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-1.5 rounded-full">
                <Info className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm text-blue-700">Task Instructions</CardTitle>
              <Move className="h-3 w-3 text-blue-400 opacity-60" />
            </div>
            <button
              onClick={handleToggle}
              className="p-1 hover:bg-blue-200 rounded transition-colors"
              data-track-id="floating-task-toggle-button"
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              )}
            </button>
          </div>
        </CardHeader>
        {isOpen && (
          <CardContent className="pt-3 pb-3 bg-white">
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
