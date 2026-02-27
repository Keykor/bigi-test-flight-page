"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { loadExperiments } from "@/lib/experiments"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventTracker, isExperimentCompleted } from "@/context/EventTrackerProvider"
import type { ExperimentConfig } from "@/lib/types"
import { CheckCircle2 } from "lucide-react"

export default function WelcomePage() {
  const [availableExperiments, setAvailableExperiments] = useState<ExperimentConfig[]>([])
  const [completedExperiments, setCompletedExperiments] = useState<string[]>([])
  const [isNavigating, setIsNavigating] = useState(false)
  const { startExperiment } = useEventTracker()
  const router = useRouter()

  useEffect(() => {
    // Get available experiments when the component mounts
    const experiments = loadExperiments()
    setAvailableExperiments(experiments)

    // Load completed experiments from localStorage
    const completed = experiments.filter(exp => isExperimentCompleted(exp.id)).map(exp => exp.id)
    setCompletedExperiments(completed)
  }, [])

  // Handle starting an iteration with tracking
  const handleStartIteration = (iterationId: string) => {
    // Prevent multiple clicks/executions
    if (isNavigating) return;

    // Prevent starting completed experiments
    if (completedExperiments.includes(iterationId)) {
      return;
    }

    // Set navigating state to prevent multiple executions
    setIsNavigating(true);

    try {
      // Start tracking this iteration
      startExperiment(iterationId)

      // Navigate to the search page (use a timeout to ensure state updates complete)
      setTimeout(() => {
        router.push(`/search?iteration=${iterationId}`)
      }, 0);
    } catch (error) {
      console.error("Error starting iteration:", error);
      setIsNavigating(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            Flight Booking Research Study
          </CardTitle>
          <CardDescription>Help us improve the flight booking experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p>
              Thank you for participating in this user experience study. Your interaction with our flight booking interface
              will help us understand how people search for and select flights, enabling us to create better booking experiences.
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">What to expect:</h3>
            <ol className="space-y-2">
              <li><strong>Search for flights</strong> — Enter travel details based on the task description</li>
              <li><strong>Choose your flights</strong> — Select flights that best meet the specified criteria</li>
              <li><strong>Confirm your booking</strong> — Review your selection and complete the task</li>
            </ol>

            <p className="mt-4">
              <strong>To begin:</strong> Select an experiment below. Each has specific requirements—read the task description carefully before starting.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {availableExperiments.map((experiment) => {
          const isCompleted = completedExperiments.includes(experiment.id);

          return (
            <Card
              key={experiment.id}
              className={`transition-all ${isCompleted ? 'bg-gray-50 border-green-200' : 'hover:shadow-md'}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{experiment.name}</CardTitle>
                      {isCompleted && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {experiment.description}
                    </CardDescription>
                  </div>

                  <div className="flex-shrink-0 md:ml-6">
                    {isCompleted ? (
                      <Button
                        disabled
                        className="w-full md:w-auto bg-gray-300 cursor-not-allowed"
                        data-track-id={`start-experiment-${experiment.id}`}
                      >
                        Completed
                      </Button>
                    ) : (
                      <Button
                        className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                        onClick={() => handleStartIteration(experiment.id)}
                        data-track-id={`start-experiment-${experiment.id}`}
                      >
                        Start Experiment
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  )
}
