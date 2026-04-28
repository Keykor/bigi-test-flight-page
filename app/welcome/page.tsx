"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DebugButton } from "@/components/debug-button"
import { loadExperiments } from "@/lib/experiments"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventTracker, isExperimentCompleted, isDebugMode, setDebugMode } from "@/context/EventTrackerProvider"
import type { ExperimentConfig } from "@/lib/types"
import { CheckCircle2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getAirportByCode } from "@/lib/airports"

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function WelcomePage() {
  const [availableExperiments, setAvailableExperiments] = useState<ExperimentConfig[]>([])
  const [completedExperiments, setCompletedExperiments] = useState<string[]>([])
  const [isNavigating, setIsNavigating] = useState(false)
  const [debugEnabled, setDebugEnabled] = useState(false)
  const { startExperiment, abandonExperiment, isTracking } = useEventTracker()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const participantId = localStorage.getItem("participant_id")
      if (!participantId) {
        router.push("/")
        return
      }
    }

    if (isTracking) {
      abandonExperiment()
    }

    setDebugEnabled(isDebugMode())

    const experiments = loadExperiments()
    setAvailableExperiments(experiments)

    const completed = experiments.filter((exp) => isExperimentCompleted(exp.id)).map((exp) => exp.id)
    setCompletedExperiments(completed)
  }, [router])

  const handleDebugToggle = (checked: boolean) => {
    setDebugMode(checked)
    setDebugEnabled(checked)
  }

  const handleStartIteration = (iterationId: string) => {
    if (isNavigating) return
    if (completedExperiments.includes(iterationId)) return

    setIsNavigating(true)

    try {
      startExperiment(iterationId)
      setTimeout(() => {
        router.push(`/search?iteration=${iterationId}`)
      }, 0)
    } catch (error) {
      console.error("Error starting iteration:", error)
      setIsNavigating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Thanks for joining!</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Please read carefully.</p>
            </div>
            {debugEnabled && <DebugButton />}
          </div>
        </CardHeader>
        <CardContent className="text-sm text-gray-900 space-y-3">
          <p>
            For this study we want you to book flights using this interface. For each task, you should find and select <strong>one outbound flight and one return flight</strong> that meet the specified criteria: route, dates, and budget.
          </p>
          <p>
            Each task has <strong>different travel conditions</strong>. Some tasks specify a <strong>maximum total budget</strong> for the outbound and return flights combined. In those cases, find the first pair of flights that fits within that budget.
          </p>
          <p>
            <strong>Important:</strong> The instructions for each task (route, dates, budget) will always be <strong>visible on the right-hand side of the screen</strong> once you start.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableExperiments.map((experiment) => {
          const isCompleted = completedExperiments.includes(experiment.id)

          const departureCode = experiment.searchCombinations[0]?.departure ?? ""
          const departureCity = getAirportByCode(departureCode)?.city ?? departureCode

          const destinations = [...new Set(experiment.searchCombinations.map((c) => c.destination))]
          const departureDate = experiment.searchCombinations[0]?.departureDate ?? ""
          const returnDate = experiment.searchCombinations[0]?.returnDate ?? ""

          return (
            <Card
              key={experiment.id}
              className={`transition-all ${isCompleted ? "bg-gray-50 border-green-200" : "hover:shadow-md"}`}
            >
              <CardContent className="p-5 flex flex-col gap-4 h-full">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">{experiment.name}</span>
                  {isCompleted && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </Badge>
                  )}
                </div>

                <ul className="space-y-1.5 text-sm text-gray-700 flex-1">
                  <li className="flex gap-2">
                    <span className="font-semibold text-gray-500 w-20 shrink-0">From</span>
                    <span>{departureCity} ({departureCode})</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-gray-500 w-20 shrink-0">To</span>
                    <span className="flex flex-col gap-0.5">
                      {destinations.map((code) => {
                        const city = getAirportByCode(code)?.city ?? code
                        return <span key={code}>{city} ({code})</span>
                      })}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-gray-500 w-20 shrink-0">Outbound</span>
                    <span>{formatDate(departureDate)}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-gray-500 w-20 shrink-0">Return</span>
                    <span>{formatDate(returnDate)}</span>
                  </li>
                  {experiment.priceThreshold > 0 && (
                    <li className="flex gap-2">
                      <span className="font-semibold text-gray-500 w-20 shrink-0">Budget</span>
                      <span>Under ${experiment.priceThreshold.toLocaleString()} total</span>
                    </li>
                  )}
                </ul>

                {debugEnabled && (
                  <p className="text-xs font-mono text-amber-600">
                    Solution at iteration: {experiment.solutionIteration}
                  </p>
                )}

                {isCompleted ? (
                  <Button disabled className="w-full bg-gray-300 cursor-not-allowed" data-track-id={`start-experiment-${experiment.id}`}>
                    Completed
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStartIteration(experiment.id)}
                    data-track-id={`start-experiment-${experiment.id}`}
                  >
                    Start
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center gap-2 mt-6 justify-end">
        <Switch id="debug-mode" checked={debugEnabled} onCheckedChange={handleDebugToggle} />
        <Label htmlFor="debug-mode" className="text-sm text-muted-foreground cursor-pointer">
          Debug Mode
        </Label>
      </div>
    </div>
  )
}
