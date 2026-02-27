"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PARTICIPANT_ID_KEY = "participant_id"

export default function ParticipantIdPage() {
  const [participantId, setParticipantId] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if participant ID is already saved
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(PARTICIPANT_ID_KEY)
      if (savedId) {
        console.log("Participant ID already saved, redirecting to welcome page")
        router.push("/welcome")
      } else {
        setIsLoading(false)
      }
    }
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!participantId.trim()) {
      setError("Please enter a participant ID")
      return
    }

    // Save participant ID to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(PARTICIPANT_ID_KEY, participantId.trim())
      console.log("Participant ID saved:", participantId.trim())
    }

    // Navigate to the welcome page
    router.push("/welcome")
  }

  // Show loading state while checking for saved ID
  if (isLoading) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
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
                  data-track-id="participant-id-input"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              <Button type="submit" data-track-id="start-experiment">
                Start Experiment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
