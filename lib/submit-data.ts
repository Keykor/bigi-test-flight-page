"use client"

import type { ExperimentData, CentralExperimentData } from "./types"

// Function to submit experiment data to Vercel Blob
export async function submitExperimentData(data: ExperimentData): Promise<string | null> {
  // Format the data for better readability
  const formattedData = {
    ...data,
    // Convert dates to ISO strings for better serialization
    experimentStartTime: data.experimentStartTime?.toISOString(),
    experimentEndTime: data.experimentEndTime?.toISOString(),
    completedAt: data.completedAt?.toISOString(),
    // Format page visits
    pageVisits: data.pageVisits.map((visit) => ({
      ...visit,
      entryTime: visit.entryTime.toISOString(),
      exitTime: visit.exitTime?.toISOString(),
    })),
    // Format interactions
    interactions: data.interactions.map((interaction) => ({
      ...interaction,
      timestamp: interaction.timestamp.toISOString(),
    })),
  }

  try {
    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const participantId = data.participantId || "unknown"
    const iterationId = data.iterationId || "unknown"
    const filename = `experiment-data-${participantId}-iteration-${iterationId}-${timestamp}.json`

    // Convert the data to a JSON string
    const jsonData = JSON.stringify(formattedData, null, 2)

    // Create a blob from the JSON data
    const blob = new Blob([jsonData], { type: "application/json" })

    // Upload to Vercel Blob via API route
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
      method: "POST",
      body: blob,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // Also download the file as a backup
    downloadFile(blob, filename)

    return result.url
  } catch (error) {
    // Fallback to just downloading the file
    // Convert the data to a blob
    const jsonData = JSON.stringify(formattedData, null, 2)
    const blob = new Blob([jsonData], { type: "application/json" })

    downloadFile(blob, `experiment-data-${data.participantId}-iteration-${data.iterationId}-${Date.now()}.json`)

    // Return null to indicate failure to upload to Blob storage
    return null
  }
}

// Function to submit central experiment data to Vercel Blob
export async function submitCentralData(data: CentralExperimentData): Promise<string | null> {
  // Format the data for better readability
  const formattedData = {
    ...data,
    // Convert dates to ISO strings for better serialization
    experimentStartTime: data.experimentStartTime?.toISOString(),
    experimentEndTime: data.experimentEndTime?.toISOString(),
    completedAt: data.completedAt.toISOString(),
  }

  try {
    // Generate a unique filename
    const participantId = data.participantId || "unknown"
    const filename = `experiment-data-${participantId}-central.json`

    // Convert the data to a JSON string
    const jsonData = JSON.stringify(formattedData, null, 2)

    // Create a blob from the JSON data
    const blob = new Blob([jsonData], { type: "application/json" })

    // Upload to Vercel Blob via API route
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
      method: "POST",
      body: blob,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // Also download the file as a backup
    downloadFile(blob, filename)

    return result.url
  } catch (error) {
    // Fallback to just downloading the file
    // Convert the data to a blob
    const jsonData = JSON.stringify(formattedData, null, 2)
    const blob = new Blob([jsonData], { type: "application/json" })

    downloadFile(blob, `experiment-data-${data.participantId}-central-${Date.now()}.json`)

    // Return null to indicate failure to upload to Blob storage
    return null
  }
}

// Helper function to download a file
function downloadFile(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    // Silent error handling
  }
}
