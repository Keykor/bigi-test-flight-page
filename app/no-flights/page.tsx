"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { useEventTracker } from "@/context/EventTrackerProvider"
import AirlineLayout from "@/components/airline-layout"

export default function NoFlightsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const iterationId = searchParams.get("iteration")
  const { addSelection } = useEventTracker()

  useEffect(() => {
    // Track that user landed on no-flights page
    addSelection({
      type: "no_flights_found",
      iterationId: iterationId,
      searchParams: {
        departure: searchParams.get("departure") || "",
        destination: searchParams.get("destination") || "",
        date: searchParams.get("date") || "",
        returnDate: searchParams.get("returnDate") || "",
      },
    })
  }, [iterationId, searchParams, addSelection])

  const handleBackToSearch = () => {
    if (iterationId) {
      router.push(`/search?iteration=${iterationId}`)
    } else {
      router.push("/welcome")
    }
  }

  return (
    <AirlineLayout activeTab="flights">
      <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto mt-12">
          <Card className="border-t-4 border-t-red-500">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-4 rounded-full">
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-3xl text-red-600">No Flights Found</CardTitle>
              <CardDescription className="text-lg mt-2">
                We couldn't find any flights for these dates and airports
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Unfortunately, there are no available flights matching your search. This could be due to limited
                availability on the selected dates or route. Please try different dates or airports.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Suggestion:</strong> Try adjusting your departure or return dates, or consider alternative
                  airports in the same region.
                </p>
              </div>
              <Button
                onClick={handleBackToSearch}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg"
                data-track-id="back-to-search-button"
              >
                Back to Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AirlineLayout>
  )
}
