"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ParticipantIdPage() {
  const [participantId, setParticipantId] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!participantId.trim()) {
      setError("Please enter a participant ID")
      return
    }

    // Navigate to the welcome page
    router.push("/welcome")
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
