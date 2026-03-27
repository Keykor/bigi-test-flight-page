"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Info, Move } from "lucide-react"
import { getExperimentById } from "@/lib/experiments"
import { useEventTracker, isDebugMode } from "@/context/EventTrackerProvider"
import type { SolutionFlightTemplate } from "@/lib/types"

interface FloatingTaskCardProps {
  experimentId: string | null
}

const POSITION_KEY = "floating_task_card_position"
const IS_OPEN_KEY = "floating_task_card_is_open"
const SIZE_KEY = "floating_task_card_size"

const MIN_WIDTH = 240
const MIN_HEIGHT = 100
const DEFAULT_WIDTH = 320

export function FloatingTaskCard({ experimentId }: FloatingTaskCardProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [description, setDescription] = useState<string>("")
  const [solutionIteration, setSolutionIteration] = useState<number>(0)

  const [solutionFlight, setSolutionFlight] = useState<{ outbound: SolutionFlightTemplate; return: SolutionFlightTemplate } | null>(null)
  const [debugActive, setDebugActive] = useState(false)
  const { addToSelectionHistory, experimentData } = useEventTracker()

  const searchCache = experimentData?.searchCache ?? []

  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  // Resizable state
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })

  useEffect(() => {
    if (experimentId) {
      const experiment = getExperimentById(experimentId)
      if (experiment) {
        setDescription(experiment.description)
        setSolutionIteration(experiment.solutionIteration)

        setSolutionFlight(experiment.solutionFlight)
      }
    }
    setDebugActive(isDebugMode())
  }, [experimentId])

  // Constrain position to viewport bounds
  const constrainPosition = (x: number, y: number) => {
    const cardWidth = size.width || cardRef.current?.offsetWidth || DEFAULT_WIDTH
    const cardHeight = cardRef.current?.offsetHeight || 100
    const maxX = window.innerWidth - cardWidth
    const maxY = window.innerHeight - cardHeight

    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    }
  }

  // Initialize position and size from localStorage or defaults
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPosition = localStorage.getItem(POSITION_KEY)
        const savedIsOpen = localStorage.getItem(IS_OPEN_KEY)
        const savedSize = localStorage.getItem(SIZE_KEY)

        if (savedSize) {
          const parsed = JSON.parse(savedSize)
          setSize({ width: parsed.width || DEFAULT_WIDTH, height: parsed.height || 0 })
        }

        if (savedPosition) {
          const parsed = JSON.parse(savedPosition)
          const constrained = constrainPosition(parsed.x, parsed.y)
          setPosition(constrained)
        } else {
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
    if ((e.target as HTMLElement).closest('button')) {
      return
    }

    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })

    addToSelectionHistory({
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

  // Save size to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && size.width !== DEFAULT_WIDTH) {
      localStorage.setItem(SIZE_KEY, JSON.stringify(size))
    }
  }, [size])

  // Handle mouse move - update position (drag)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      const constrained = constrainPosition(newX, newY)
      setPosition(constrained)
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        addToSelectionHistory({
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
  }, [isDragging, dragStart, position, experimentId, addToSelectionHistory])

  // Handle resize
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width || cardRef.current?.offsetWidth || DEFAULT_WIDTH,
      height: size.height || cardRef.current?.offsetHeight || MIN_HEIGHT,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const deltaX = e.clientX - resizeStartRef.current.x
      const deltaY = e.clientY - resizeStartRef.current.y

      const maxWidth = window.innerWidth - position.x
      const maxHeight = window.innerHeight - position.y

      const newWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, resizeStartRef.current.width + deltaX))
      const newHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, resizeStartRef.current.height + deltaY))

      setSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
      }
    }

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, position])

  const handleToggle = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)

    if (typeof window !== 'undefined') {
      localStorage.setItem(IS_OPEN_KEY, String(newIsOpen))
    }

    addToSelectionHistory({
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
      className="fixed z-50 max-w-[calc(100vw-2rem)]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <Card className="shadow-2xl border-2 border-blue-500 bg-white relative">
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
          <CardContent
            className="pt-3 pb-3 bg-white overflow-auto"
            style={{
              overscrollBehavior: 'contain',
              ...(size.height > 0 ? { maxHeight: `${size.height - (cardRef.current?.querySelector('[class*="CardHeader"]')?.clientHeight || 48)}px` } : {}),
            }}
            onWheel={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
            {debugActive && (
              <div className="mt-3 pt-2 border-t border-amber-200">
                <p className="text-xs font-mono font-semibold text-amber-700 mb-1">
                  Debug — Iterations
                </p>
                <p className="text-xs font-mono text-amber-600">
                  Solution at attempt: <strong>{solutionIteration}</strong> · out pos: <strong>{searchCache.find(e => e.attemptNumber === solutionIteration)?.resolvedSolutionPosition?.outbound ?? "?"}</strong> · ret pos: <strong>{searchCache.find(e => e.attemptNumber === solutionIteration)?.resolvedSolutionPosition?.return ?? "?"}</strong>
                </p>
                {solutionFlight && (
                  <div className="mt-1 mb-1 space-y-0.5">
                    <p className="text-xs font-mono text-amber-600">
                      Out: {solutionFlight.outbound.flightNumber} {solutionFlight.outbound.airline} ${solutionFlight.outbound.price} {solutionFlight.outbound.duration}
                    </p>
                    <p className="text-xs font-mono text-amber-600">
                      Ret: {solutionFlight.return.flightNumber} {solutionFlight.return.airline} ${solutionFlight.return.price} {solutionFlight.return.duration}
                    </p>
                  </div>
                )}
                <p className="text-xs font-mono text-amber-600">
                  Attempts made: <strong>{searchCache.length}</strong>
                  {searchCache.length >= solutionIteration && solutionIteration > 0 && (
                    <span className="ml-1 text-green-600">Solution reached</span>
                  )}
                </p>
                {searchCache.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {searchCache.map((entry, i) => (
                      <p key={entry.combinationKey} className="text-xs font-mono text-gray-500">
                        {i + 1}. {entry.combinationKey}
                        {i + 1 === solutionIteration && (
                          <span className="ml-1 text-green-600 font-semibold">← TARGET</span>
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
        {/* Resize handle - bottom right corner */}
        {isOpen && (
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #93c5fd 50%)',
              borderBottomRightRadius: 'inherit',
            }}
          />
        )}
      </Card>
    </div>
  )
}
