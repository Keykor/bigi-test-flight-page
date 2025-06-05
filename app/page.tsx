"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExperimentTracker } from "@/components/experiment-tracker"
import { useExperimentStore } from "@/lib/experiment-store"

export default function ParticipantIdPage() {
  const [participantId, setParticipantId] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const { setParticipantId: storeParticipantId, participantId: storedId, resetExperiment } = useExperimentStore()

  useEffect(() => {
    // If participant ID is already set, redirect to welcome page
    if (storedId) {
      router.push("/welcome")
    }
  }, [storedId, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!participantId.trim()) {
      setError("Please enter a participant ID")
      return
    }

    // Reset any previous experiment data
    resetExperiment()

    // Store the participant ID
    storeParticipantId(participantId.trim())

    // Navigate to the welcome page
    router.push("/welcome")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <ExperimentTracker pageId="participant-id" />

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Flight Booking Experiment</CardTitle>
          <CardDescription>Please enter your participant ID to begin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="participant-id">Participant ID</Label>
                <Input
                  id="participant-id"
                  placeholder="Enter your assigned ID"
                  value={participantId}
                  onChange={(e) => {
                    setParticipantId(e.target.value)
                    setError("")
                  }}
                  data-tracking-id="participant-id-input"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <Button type="submit" data-tracking-id="participant-id-submit">
                Start Experiment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
