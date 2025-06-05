"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getAvailableIterations } from "@/lib/iterations"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventTracker } from "@/context/EventTrackerProvider"
import type { IterationConfig } from "@/lib/types"

export default function WelcomePage() {
  const [availableIterations, setAvailableIterations] = useState<IterationConfig[]>([])
  const [isNavigating, setIsNavigating] = useState(false)
  const { startExperiment } = useEventTracker()
  const router = useRouter()

  useEffect(() => {
    // Get available iterations when the component mounts
    const iterations = getAvailableIterations()
    setAvailableIterations(iterations)
  }, [])

  // Handle starting an iteration with tracking
  const handleStartIteration = (iterationId: string) => {
    // Prevent multiple clicks/executions
    if (isNavigating) return;
    
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            Flight Booking Experiment
          </CardTitle>
          <CardDescription>Welcome to our user experience research study</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p>
              Thank you for participating in our flight booking interface experiment. This study aims to understand how
              users interact with flight booking systems and identify ways to improve the user experience.
            </p>
            <p>During this experiment, you will be asked to complete several flight booking tasks. For each task:</p>
            <ol>
              <li>You will search for flights based on specific criteria</li>
              <li>You will select a flight that meets your requirements</li>
              <li>You will review and confirm your selection</li>
            </ol>
            <p>
              Please select one of the iterations below to begin the experiment. Each iteration represents a slightly
              different version of the booking interface.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableIterations.map((iteration) => (
          <Card key={iteration.id} className={iteration.completed ? "opacity-50" : ""}>
            <CardHeader>
              <CardTitle>Iteration {iteration.id}</CardTitle>
              <CardDescription>{iteration.completed ? "Completed" : "Not completed"}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="w-full"
                disabled={iteration.completed}
                onClick={() => handleStartIteration(iteration.id)}
              >
                {iteration.completed ? "Completed" : "Start Iteration"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
