"use client"

import { useState, useEffect } from "react"
import { useExperimentStore } from "@/lib/experiment-store"

export function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [pageVisits, setPageVisits] = useState<any[]>([])
  const { getPageVisits } = useExperimentStore()

  useEffect(() => {
    // Actualizar los datos cada segundo
    const interval = setInterval(() => {
      const visits = getPageVisits()
      setPageVisits(visits)
    }, 1000)

    return () => clearInterval(interval)
  }, [getPageVisits])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-md z-50"
      >
        Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-1/2 lg:w-1/3 h-1/2 bg-gray-800 text-white p-4 overflow-auto z-50">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Debug Panel</h2>
        <button onClick={() => setIsVisible(false)} className="text-white">
          Close
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Page Visits</h3>
        {pageVisits.length === 0 ? (
          <p>No page visits recorded</p>
        ) : (
          <div className="space-y-2">
            {pageVisits.map((visit, index) => (
              <div key={index} className="border border-gray-600 p-2 rounded">
                <p>
                  <strong>Page:</strong> {visit.pageId}
                </p>
                <p>
                  <strong>Entry:</strong> {visit.entryTime.toISOString()}
                </p>
                <p>
                  <strong>Exit:</strong> {visit.exitTime ? visit.exitTime.toISOString() : "Still active"}
                </p>
                <div>
                  <strong>Search Params:</strong>
                  <pre className="text-xs mt-1 bg-gray-700 p-1 rounded">
                    {JSON.stringify(visit.searchParams, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Selected Options:</strong>
                  <pre className="text-xs mt-1 bg-gray-700 p-1 rounded">
                    {JSON.stringify(visit.selectedOptions, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
