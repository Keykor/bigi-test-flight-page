"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Info, X } from "lucide-react"
import { getExperimentById } from "@/lib/experiments"
import { useEventTracker } from "@/context/EventTrackerProvider"

interface FloatingTaskCardProps {
  experimentId: string | null
}

export function FloatingTaskCard({ experimentId }: FloatingTaskCardProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [description, setDescription] = useState<string>("")
  const { addSelection } = useEventTracker()

  useEffect(() => {
    if (experimentId) {
      const experiment = getExperimentById(experimentId)
      if (experiment) {
        setDescription(experiment.description)
      }
    }
  }, [experimentId])

  if (!experimentId || !description || !isVisible) {
    return null
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    addSelection({
      type: "floating_task_card_toggle",
      action: isOpen ? "collapsed" : "expanded",
      experimentId: experimentId,
    })
  }

  const handleClose = () => {
    setIsVisible(false)
    addSelection({
      type: "floating_task_card_close",
      experimentId: experimentId,
    })
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-2xl border-2 border-blue-500 bg-white">
        <CardHeader
          className="bg-blue-50 border-b py-3 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={handleToggle}
          data-track-id="floating-task-description-header"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-1.5 rounded-full">
                <Info className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm text-blue-700">Task Instructions</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose()
                }}
                className="ml-2 p-1 hover:bg-blue-200 rounded transition-colors"
                data-track-id="floating-task-close-button"
              >
                <X className="h-4 w-4 text-blue-600" />
              </button>
            </div>
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
