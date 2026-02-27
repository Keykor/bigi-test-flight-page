"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Info, Move } from "lucide-react"
import { getExperimentById } from "@/lib/experiments"
import { useEventTracker } from "@/context/EventTrackerProvider"

interface FloatingTaskCardProps {
  experimentId: string | null
}

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

  // Initialize position to top-right corner
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 336, y: 80 }) // 336 = 320px width + 16px padding
    }
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

  // Handle mouse move - update position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Keep card within viewport bounds
      const maxX = window.innerWidth - (cardRef.current?.offsetWidth || 320)
      const maxY = window.innerHeight - (cardRef.current?.offsetHeight || 100)

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
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
    setIsOpen(!isOpen)
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
