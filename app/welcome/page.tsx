"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getAvailableIterations } from "@/lib/iterations"
import { ExperimentTracker } from "@/components/experiment-tracker"
import { useEffect, useState } from "react"
import type { IterationConfig } from "@/lib/types"

export default function WelcomePage() {
  const [availableIterations, setAvailableIterations] = useState<IterationConfig[]>([])

  useEffect(() => {
    // Get available iterations when the component mounts
    const iterations = getAvailableIterations()
    setAvailableIterations(iterations)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ExperimentTracker pageId="welcome" />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl" data-tracking-id="welcome-title">
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
              Your interactions with the interface will be recorded anonymously to help us analyze patterns and improve
              the design. No personal information will be collected.
            </p>
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
                asChild
                data-tracking-id={`iteration-${iteration.id}`}
              >
                <Link href={`/search?iteration=${iteration.id}`}>
                  {iteration.completed ? "Completed" : "Start Iteration"}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
