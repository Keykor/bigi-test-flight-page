"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Interaction, PageVisit, SearchParameters, ExperimentData, CentralExperimentData } from "./types"

interface ExperimentState {
  participantId: string | null
  currentIteration: string | null
  completedIterations: string[]
  interactions: Interaction[]
  pageVisits: PageVisit[]
  experimentStartTime: Date | null
  experimentEndTime: Date | null
  iterationBlobs: { iterationId: string; blobUrl: string }[]
  currentPageId: string | null

  // Actions
  setParticipantId: (id: string) => void
  setCurrentIteration: (iterationId: string) => void
  completeIteration: (iterationId: string, blobUrl?: string) => void
  recordInteraction: (interaction: Interaction) => void
  recordPageEntry: (
    pageId: string,
    timestamp: Date,
    searchParams?: SearchParameters,
    selectedOptions?: Record<string, any>,
  ) => void
  recordPageExit: (pageId: string, timestamp: Date) => void
  updatePageOptions: (pageId: string, selectedOptions: Record<string, any>) => void
  updatePageSearchParams: (pageId: string, searchParams: SearchParameters) => void
  startExperiment: () => void
  endExperiment: () => void
  getExperimentData: () => ExperimentData
  getCentralExperimentData: () => CentralExperimentData
  resetExperiment: () => void
  addIterationBlob: (iterationId: string, blobUrl: string) => void
  areAllIterationsCompleted: () => boolean
  setCurrentPageId: (pageId: string) => void
  getPageVisits: () => PageVisit[]
}

export const useExperimentStore = create<ExperimentState>()(
  persist(
    (set, get) => ({
      participantId: null,
      currentIteration: null,
      completedIterations: [],
      interactions: [],
      pageVisits: [],
      experimentStartTime: null,
      experimentEndTime: null,
      iterationBlobs: [],
      currentPageId: null,

      setParticipantId: (id) => set({ participantId: id }),

      setCurrentIteration: (iterationId) =>
        set((state) => {
          // If this is a new iteration, reset the data
          if (state.currentIteration !== iterationId) {
            return {
              currentIteration: iterationId,
              interactions: [],
              pageVisits: [],
              experimentStartTime: state.experimentStartTime || new Date(),
              experimentEndTime: null,
            }
          }
          return { currentIteration: iterationId }
        }),

      completeIteration: (iterationId, blobUrl) =>
        set((state) => {
          // Don't add if already completed
          if (state.completedIterations.includes(iterationId)) {
            return state
          }

          // Add blob URL if provided
          let updatedBlobs = [...state.iterationBlobs]
          if (blobUrl) {
            updatedBlobs = [...updatedBlobs, { iterationId, blobUrl }]
          }

          return {
            completedIterations: [...state.completedIterations, iterationId],
            experimentEndTime: new Date(),
            iterationBlobs: updatedBlobs,
          }
        }),

      recordInteraction: (interaction) =>
        set((state) => ({
          interactions: [...state.interactions, interaction],
        })),

      recordPageEntry: (pageId, timestamp, searchParams, selectedOptions) => {
        console.log(`STORE: Recording page entry for ${pageId} with searchParams:`, searchParams)
        console.log(`STORE: Recording page entry for ${pageId} with selectedOptions:`, selectedOptions)

        // Asegurar que searchParams sea un objeto válido
        const validSearchParams = searchParams || { departure: "", destination: "", date: "" }
        const validSelectedOptions = selectedOptions || {}

        set((state) => {
          // Verificar si ya existe una entrada para esta página sin salida
          const existingOpenVisit = state.pageVisits.find((visit) => visit.pageId === pageId && visit.exitTime === null)

          // Si ya existe una entrada abierta, no crear una nueva
          if (existingOpenVisit) {
            console.log(`STORE: Page entry for ${pageId} already exists, updating params`)
            return {
              pageVisits: state.pageVisits.map((visit) => {
                if (visit === existingOpenVisit) {
                  return {
                    ...visit,
                    searchParams: validSearchParams,
                    selectedOptions: validSelectedOptions,
                  }
                }
                return visit
              }),
              currentPageId: pageId,
            }
          }

          // Si no existe, crear una nueva entrada
          console.log(`STORE: Creating new page entry for ${pageId}`)
          return {
            pageVisits: [
              ...state.pageVisits,
              {
                pageId,
                entryTime: timestamp,
                exitTime: null,
                searchParams: validSearchParams,
                selectedOptions: validSelectedOptions,
              },
            ],
            currentPageId: pageId,
          }
        })
      },

      recordPageExit: (pageId, timestamp) =>
        set((state) => {
          // Buscar la última visita a esta página que no tenga tiempo de salida
          const pageVisitIndex = state.pageVisits.findIndex(
            (visit) => visit.pageId === pageId && visit.exitTime === null,
          )

          if (pageVisitIndex === -1) {
            console.log(`STORE: No open page visit found for ${pageId}`)
            return state
          }

          console.log(`STORE: Recording page exit for ${pageId} at ${timestamp.toISOString()}`)

          return {
            pageVisits: state.pageVisits.map((visit, index) => {
              if (index === pageVisitIndex) {
                const duration = timestamp.getTime() - visit.entryTime.getTime()
                return { ...visit, exitTime: timestamp, duration }
              }
              return visit
            }),
            currentPageId: null,
          }
        }),

      updatePageSearchParams: (pageId, searchParams) =>
        set((state) => {
          // Find the current active page visit for this pageId
          const currentPageVisit = state.pageVisits.find((visit) => visit.pageId === pageId && visit.exitTime === null)

          // Si no hay visita activa, buscar la última visita a esta página
          const lastPageVisit =
            currentPageVisit || [...state.pageVisits].reverse().find((visit) => visit.pageId === pageId)

          // Si no hay visita, no hacer nada
          if (!lastPageVisit) {
            console.log(`STORE: No page visit found for ${pageId} to update search params`)
            return state
          }

          console.log(`STORE: Updating search params for ${pageId}:`, searchParams)

          return {
            pageVisits: state.pageVisits.map((visit) => {
              if (visit === lastPageVisit) {
                return { ...visit, searchParams }
              }
              return visit
            }),
          }
        }),

      updatePageOptions: (pageId, selectedOptions) =>
        set((state) => {
          // Find the current active page visit for this pageId
          const currentPageVisit = state.pageVisits.find((visit) => visit.pageId === pageId && visit.exitTime === null)

          // Si no hay visita activa, buscar la última visita a esta página
          const lastPageVisit =
            currentPageVisit || [...state.pageVisits].reverse().find((visit) => visit.pageId === pageId)

          // Si no hay visita, no hacer nada
          if (!lastPageVisit) {
            console.log(`STORE: No page visit found for ${pageId} to update options`)
            return state
          }

          console.log(`STORE: Updating selected options for ${pageId}:`, selectedOptions)

          return {
            pageVisits: state.pageVisits.map((visit) => {
              if (visit === lastPageVisit) {
                return {
                  ...visit,
                  selectedOptions: { ...visit.selectedOptions, ...selectedOptions },
                }
              }
              return visit
            }),
          }
        }),

      startExperiment: () =>
        set((state) => ({
          experimentStartTime: state.experimentStartTime || new Date(),
        })),

      endExperiment: () =>
        set({
          experimentEndTime: new Date(),
        }),

      resetExperiment: () =>
        set({
          currentIteration: null,
          completedIterations: [],
          interactions: [],
          pageVisits: [],
          experimentStartTime: null,
          experimentEndTime: null,
          iterationBlobs: [],
          currentPageId: null,
        }),

      addIterationBlob: (iterationId, blobUrl) =>
        set((state) => {
          // Check if we already have a blob for this iteration
          const existingIndex = state.iterationBlobs.findIndex((blob) => blob.iterationId === iterationId)

          if (existingIndex >= 0) {
            // Update existing blob
            const updatedBlobs = [...state.iterationBlobs]
            updatedBlobs[existingIndex] = { iterationId, blobUrl }
            return { iterationBlobs: updatedBlobs }
          } else {
            // Add new blob
            return {
              iterationBlobs: [...state.iterationBlobs, { iterationId, blobUrl }],
            }
          }
        }),

      areAllIterationsCompleted: () => {
        const { completedIterations } = get()
        // This assumes we have 3 iterations (1, 2, 3)
        return (
          completedIterations.includes("1") && completedIterations.includes("2") && completedIterations.includes("3")
        )
      },

      setCurrentPageId: (pageId) => set({ currentPageId: pageId }),

      getPageVisits: () => {
        return get().pageVisits
      },

      getExperimentData: () => {
        const state = get()
        const experimentDuration =
          state.experimentStartTime && state.experimentEndTime
            ? state.experimentEndTime.getTime() - state.experimentStartTime.getTime()
            : undefined

        // Find the blob URL for the current iteration
        const blobInfo = state.iterationBlobs.find((blob) => blob.iterationId === state.currentIteration)
        const blobUrl = blobInfo?.blobUrl

        return {
          participantId: state.participantId,
          iterationId: state.currentIteration,
          interactions: state.interactions,
          pageVisits: state.pageVisits,
          experimentStartTime: state.experimentStartTime,
          experimentEndTime: state.experimentEndTime,
          experimentDuration,
          completedAt: state.currentIteration ? new Date() : null,
          blobUrl,
        }
      },

      getCentralExperimentData: () => {
        const state = get()

        return {
          participantId: state.participantId,
          iterationOrder: state.completedIterations,
          iterationBlobs: state.iterationBlobs,
          experimentStartTime: state.experimentStartTime,
          experimentEndTime: state.experimentEndTime,
          completedAt: new Date(),
        }
      },
    }),
    {
      name: "flight-experiment-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        participantId: state.participantId,
        currentIteration: state.currentIteration,
        completedIterations: state.completedIterations,
        interactions: state.interactions.map((interaction) => ({
          ...interaction,
          timestamp: interaction.timestamp.toISOString(),
        })),
        pageVisits: state.pageVisits.map((visit) => ({
          ...visit,
          entryTime: visit.entryTime.toISOString(),
          exitTime: visit.exitTime?.toISOString(),
        })),
        experimentStartTime: state.experimentStartTime?.toISOString(),
        experimentEndTime: state.experimentEndTime?.toISOString(),
        iterationBlobs: state.iterationBlobs,
        currentPageId: state.currentPageId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert ISO strings back to Date objects
          if (state.interactions) {
            state.interactions = state.interactions.map((interaction: any) => ({
              ...interaction,
              timestamp: new Date(interaction.timestamp),
            }))
          }

          if (state.pageVisits) {
            state.pageVisits = state.pageVisits.map((visit: any) => ({
              ...visit,
              entryTime: new Date(visit.entryTime),
              exitTime: visit.exitTime ? new Date(visit.exitTime) : null,
            }))
          }

          if (state.experimentStartTime) {
            state.experimentStartTime = new Date(state.experimentStartTime)
          }

          if (state.experimentEndTime) {
            state.experimentEndTime = new Date(state.experimentEndTime)
          }
        }
      },
    },
  ),
)
