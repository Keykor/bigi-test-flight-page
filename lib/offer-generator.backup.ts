/**
 * BACKUP: Dynamic Offer Flight Generator
 *
 * This file contains the dynamic offer generation logic from the previous iteration system.
 * Saved for potential future use.
 *
 * Original location: lib/iterations.ts
 * Backed up: 2025-02-27
 */

import type { Flight, OfferConfig } from "./types"
import { addDays, format, parseISO } from "date-fns"

/**
 * Helper function to generate offer flights for adjacent days with discounts
 * @param baseFlights - Base flights to create offers from
 * @param originalDate - The original search date
 * @param offerConfig - Configuration for offer generation
 * @returns Array of generated offer flights
 */
export function generateOfferFlights(baseFlights: Flight[], originalDate: string, offerConfig: OfferConfig): Flight[] {
  if (!offerConfig.enabled) return []

  const offerFlights: Flight[] = []
  const originalDateObj = parseISO(originalDate)

  // Generate earlier day offers
  if (offerConfig.earlierDayOffers) {
    const earlierDate = addDays(originalDateObj, -1)
    const earlierDateStr = format(earlierDate, "yyyy-MM-dd")

    const earlierOffers = baseFlights.slice(0, offerConfig.maxOffersPerType).map((flight, index) => {
      const discountPercentage = Math.floor(
        Math.random() * (offerConfig.discountRange[1] - offerConfig.discountRange[0] + 1) +
          offerConfig.discountRange[0],
      )
      const discountedPrice = Math.round(flight.price * (1 - discountPercentage / 100))

      return {
        ...flight,
        id: `${flight.id}-earlier-${index}`,
        departureDate: earlierDateStr,
        originalDate: originalDate,
        dateOffset: -1,
        isOffer: true,
        offerType: "earlier" as const,
        price: discountedPrice,
        discountPercentage,
        flightNumber: `${flight.flightNumber}E`, // Add suffix to distinguish
      }
    })

    offerFlights.push(...earlierOffers)
  }

  // Generate later day offers
  if (offerConfig.laterDayOffers) {
    const laterDate = addDays(originalDateObj, 1)
    const laterDateStr = format(laterDate, "yyyy-MM-dd")

    const laterOffers = baseFlights.slice(0, offerConfig.maxOffersPerType).map((flight, index) => {
      const discountPercentage = Math.floor(
        Math.random() * (offerConfig.discountRange[1] - offerConfig.discountRange[0] + 1) +
          offerConfig.discountRange[0],
      )
      const discountedPrice = Math.round(flight.price * (1 - discountPercentage / 100))

      return {
        ...flight,
        id: `${flight.id}-later-${index}`,
        departureDate: laterDateStr,
        originalDate: originalDate,
        dateOffset: 1,
        isOffer: true,
        offerType: "later" as const,
        price: discountedPrice,
        discountPercentage,
        flightNumber: `${flight.flightNumber}L`, // Add suffix to distinguish
      }
    })

    offerFlights.push(...laterOffers)
  }

  return offerFlights
}
