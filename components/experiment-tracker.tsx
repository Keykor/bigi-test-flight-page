"use client"

import { useEffect, useRef, useCallback } from "react"
import { useExperimentStore } from "@/lib/experiment-store"
import type { SearchParameters } from "@/lib/types"

interface ExperimentTrackerProps {
  pageId: string
  searchParams?: SearchParameters
  selectedOptions?: Record<string, any>
}

export function ExperimentTracker({ pageId, searchParams, selectedOptions }: ExperimentTrackerProps) {
  const {
    recordPageEntry,
    recordPageExit,
    recordInteraction,
    startExperiment,
    updatePageSearchParams,
    updatePageOptions,
    setCurrentPageId,
  } = useExperimentStore()

  const trackerRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)
  const pageExitRecordedRef = useRef(false)
  const initialRenderRef = useRef(true)
  const prevSearchParamsRef = useRef(searchParams)
  const prevSelectedOptionsRef = useRef(selectedOptions)
  const pageEntryRecordedRef = useRef(false)

  // Use a callback for page entry to avoid recreating it on every render
  const handlePageEntry = useCallback(() => {
    if (!pageEntryRecordedRef.current) {
      const entryTime = new Date()
      console.log(`Page entry: ${pageId} at ${entryTime.toISOString()}`, { searchParams, selectedOptions })
      recordPageEntry(pageId, entryTime, searchParams, selectedOptions)
      setCurrentPageId(pageId)
      pageEntryRecordedRef.current = true
    }
  }, [pageId, recordPageEntry, searchParams, selectedOptions, setCurrentPageId])

  // Main effect for tracking setup
  useEffect(() => {
    // Start the experiment if it's not already started
    startExperiment()

    // Record page entry immediately
    handlePageEntry()

    // Set up event listeners for tracking

    // Mouse move tracking (throttled to every 100ms)
    let lastMoveTime = 0
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastMoveTime > 100) {
        // Throttle to 100ms
        lastMoveTime = now

        // Get the element under the cursor
        const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
        const trackingId = element?.closest("[data-tracking-id]")?.getAttribute("data-tracking-id") || null

        recordInteraction({
          type: "mousemove",
          pageId,
          x: e.clientX,
          y: e.clientY,
          timestamp: new Date(),
          elementId: trackingId,
        })
      }
    }

    // Click tracking
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const trackingElement = target.closest("[data-tracking-id]") as HTMLElement
      const trackingId = trackingElement?.getAttribute("data-tracking-id") || null

      // Determine element type
      let elementType = null
      if (target.tagName) {
        elementType = target.tagName.toLowerCase()

        // Add more specific type if available
        if (target.getAttribute("type")) {
          elementType += `-${target.getAttribute("type")}`
        }

        // Check if it's inside a label
        if (target.closest("label")) {
          elementType = "label-" + elementType
        }
      }

      const interaction = {
        type: "click" as const,
        pageId,
        x: e.clientX,
        y: e.clientY,
        timestamp: new Date(),
        elementId: trackingId,
        elementType,
      }

      recordInteraction(interaction)
    }

    // Scroll tracking (throttled to every 100ms)
    let lastScrollTime = 0
    const handleScroll = () => {
      const now = Date.now()
      if (now - lastScrollTime > 100) {
        // Throttle to 100ms
        lastScrollTime = now
        recordInteraction({
          type: "scroll",
          pageId,
          x: window.scrollX,
          y: window.scrollY,
          timestamp: new Date(),
        })
      }
    }

    // Keypress tracking
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inputId =
        target.getAttribute("id") ||
        target.getAttribute("name") ||
        target.closest("[data-tracking-id]")?.getAttribute("data-tracking-id") ||
        null

      // Only track keypresses in input elements
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true"
      ) {
        recordInteraction({
          type: "keypress",
          pageId,
          key: e.key,
          timestamp: new Date(),
          inputId,
        })
      }
    }

    // Handle beforeunload to ensure we capture exit time even on page refresh/close
    const handleBeforeUnload = () => {
      if (!pageExitRecordedRef.current) {
        const exitTime = new Date()
        console.log(`Page exit (beforeunload): ${pageId} at ${exitTime.toISOString()}`)
        recordPageExit(pageId, exitTime)
        pageExitRecordedRef.current = true
      }
    }

    // Add event listeners
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    window.addEventListener("click", handleClick)
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("keydown", handleKeyPress)
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Clean up and record page exit
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("keydown", handleKeyPress)
      window.removeEventListener("beforeunload", handleBeforeUnload)

      // Only record page exit if the component is still mounted
      // This prevents duplicate exit records
      if (isMountedRef.current && !pageExitRecordedRef.current) {
        const exitTime = new Date()
        console.log(`Page exit (cleanup): ${pageId} at ${exitTime.toISOString()}`)
        recordPageExit(pageId, exitTime)
        pageExitRecordedRef.current = true
      }

      isMountedRef.current = false
    }
  }, [pageId, recordPageExit, recordInteraction, startExperiment, handlePageEntry])

  // Separate effect for updating search params
  useEffect(() => {
    // Only update if searchParams actually changed
    if (searchParams && JSON.stringify(prevSearchParamsRef.current) !== JSON.stringify(searchParams)) {
      console.log(`Updating search params for ${pageId}:`, searchParams)
      updatePageSearchParams(pageId, searchParams)
      prevSearchParamsRef.current = searchParams
    }
  }, [searchParams, pageId, updatePageSearchParams])

  // Separate effect for updating selected options
  useEffect(() => {
    // Only update if selectedOptions actually changed
    if (selectedOptions && JSON.stringify(prevSelectedOptionsRef.current) !== JSON.stringify(selectedOptions)) {
      console.log(`Updating selected options for ${pageId}:`, selectedOptions)
      updatePageOptions(pageId, selectedOptions)
      prevSelectedOptionsRef.current = selectedOptions
    }
  }, [selectedOptions, pageId, updatePageOptions])

  return <div ref={trackerRef} className="sr-only" aria-hidden="true" />
}
