"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { throttle } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { getExperimentById } from "@/lib/experiments";

// Helper functions for localStorage
const COMPLETED_EXPERIMENTS_KEY = "completed_experiments";
const PARTICIPANT_ID_KEY = "participant_id";
const SAMPLE_COUNTER_KEY = "sample_counter";

export const getCompletedExperiments = (): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(COMPLETED_EXPERIMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error reading completed experiments from localStorage:", e);
    return [];
  }
};

export const markExperimentAsCompleted = (experimentId: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const completed = getCompletedExperiments();
    if (!completed.includes(experimentId)) {
      completed.push(experimentId);
      localStorage.setItem(COMPLETED_EXPERIMENTS_KEY, JSON.stringify(completed));
      console.log(`Experiment ${experimentId} marked as completed`);
    }
  } catch (e) {
    console.error("Error saving completed experiment to localStorage:", e);
  }
};

export const isExperimentCompleted = (experimentId: string): boolean => {
  return getCompletedExperiments().includes(experimentId);
};

export const getParticipantId = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(PARTICIPANT_ID_KEY);
  } catch (e) {
    console.error("Error reading participant ID from localStorage:", e);
    return null;
  }
};

const getSampleCounter = (): number => {
  if (typeof window === 'undefined') return 0;

  try {
    const stored = localStorage.getItem(SAMPLE_COUNTER_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch (e) {
    console.error("Error reading sample counter from localStorage:", e);
    return 0;
  }
};

const incrementSampleCounter = (): number => {
  const next = getSampleCounter() + 1;
  try {
    localStorage.setItem(SAMPLE_COUNTER_KEY, String(next));
  } catch (e) {
    console.error("Error saving sample counter to localStorage:", e);
  }
  return next;
};

interface ExperimentData {
  participantId?: string;
  experimentId?: string;
  experimentName?: string;
  experimentDescription?: string;
  iterationId?: string;
  pages: Array<{
    page: string;
    visitStartTime: string;
    visitEndTime: string | null;
    pageTransitionDuration?: number;
    mouseMovements: Array<{
      x: number;
      y: number;
      time: number;
    }>;
    scrollPositions: Array<{
      scrollY: number;
      time: number;
    }>;
    clicks: Array<{
      x: number;
      y: number;
      element: string;
      trackId: string | null;
      time: number;
    }>;
    keyPresses: Array<{
      key: string;
      inputId: string | null;
      time: number;
    }>;
    selectionHistory: any[];
    experimentState: {
      searchParams: any;
      outboundFlight: any;
      returnFlight: any;
    };
  }>;
  experimentStartTime: string;
  experimentEndTime?: string;
  uuid: string;
  sampleCounter?: number;
}

interface EventTrackerContextType {
  isTracking: boolean;
  experimentData: ExperimentData | null;
  startExperiment: (experimentId: string) => void;
  stopExperiment: () => void;
  abandonExperiment: () => void;
  addToSelectionHistory: (entry: any) => void;
  updateExperimentState: (updates: any) => void;
}

const EventTrackerContext = createContext<EventTrackerContextType | undefined>(undefined);

export const EventTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [experimentData, setExperimentData] = useState<ExperimentData | null>(null);
  const [uuid] = useState(uuidv4());
  const router = useRouter();

  // Add ref to track current page URL
  const currentPageRef = useRef<string | null>(null);
  // Add ref to track experiment data to avoid dependency issues
  const experimentDataRef = useRef<ExperimentData | null>(null);

  // Update the ref whenever experimentData changes
  useEffect(() => {
    experimentDataRef.current = experimentData;
  }, [experimentData]);

  // Persist experimentData to sessionStorage whenever it changes
  useEffect(() => {
    if (experimentData && experimentData.iterationId) {
      try {
        sessionStorage.setItem(`experiment_data_${experimentData.iterationId}`, JSON.stringify(experimentData));
      } catch (e) {
        console.error("Error saving experiment data to sessionStorage:", e);
      }
    }
  }, [experimentData]);

  // Restore experimentData from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !experimentData) {
      try {
        // Try to find any experiment data in sessionStorage
        const keys = Object.keys(sessionStorage).filter(key => key.startsWith('experiment_data_'));
        if (keys.length > 0) {
          const savedData = sessionStorage.getItem(keys[0]);
          if (savedData) {
            const parsed = JSON.parse(savedData);
            setExperimentData(parsed);
            setIsTracking(true);
            console.log("Restored experiment data from sessionStorage:", parsed.iterationId);
          }
        }
      } catch (e) {
        console.error("Error restoring experiment data from sessionStorage:", e);
      }
    }
  }, []);

  // Memoize startExperiment to avoid recreating on every render
  const startExperiment = useCallback((experimentId: string) => {
    // Prevent duplicate experiment creation
    if (experimentDataRef.current?.experimentId === experimentId) {
      console.log("Experiment already started");
      return;
    }

    // Load experiment metadata
    const experiment = getExperimentById(experimentId);
    if (!experiment) {
      console.error(`Experiment ${experimentId} not found`);
      return;
    }

    // Get participant ID from localStorage
    const participantId = getParticipantId();

    // Create new experiment but don't initialize pages yet
    // Pages will be initialized when user navigates to search page
    const newExperiment = {
      participantId: participantId || undefined,
      experimentId: experiment.id,
      experimentName: experiment.name,
      experimentDescription: experiment.description,
      iterationId: experimentId,
      pages: [],
      experimentStartTime: new Date().toISOString(),
      uuid: uuid,
    };

    setExperimentData(newExperiment);
    setIsTracking(true);
    console.log(`Experiment started: ${experiment.name}, participant: ${participantId}`);
  }, [uuid]);

  const stopExperiment = () => {
    if (!experimentData) {
      console.warn("No experiment in progress! Experiment may have already been stopped or page was reloaded.");
      return;
    }

    // Capture current time as experiment end time
    const experimentEndTime = new Date().toISOString();

    // Update the last active page with visitEndTime
    setExperimentData((prev) => {
      if (!prev) return null;

      const updatedPages = [...prev.pages];

      // If there are registered pages, update the last one with its visitEndTime
      if (updatedPages.length > 0) {
        const lastPageIndex = updatedPages.length - 1;
        updatedPages[lastPageIndex] = {
          ...updatedPages[lastPageIndex],
          visitEndTime: experimentEndTime,
        };
      }

      const newSampleCounter = incrementSampleCounter();

      const updatedExperimentData = {
        ...prev,
        sampleCounter: newSampleCounter,
        experimentEndTime,
        pages: updatedPages,
      };

      downloadExperimentData(updatedExperimentData);
      console.log("Experiment data:", updatedExperimentData);

      // Mark experiment as completed in localStorage
      if (prev.iterationId) {
        markExperimentAsCompleted(prev.iterationId);
        // Clean up sessionStorage for this experiment
        try {
          sessionStorage.removeItem(`experiment_data_${prev.iterationId}`);
          sessionStorage.removeItem(`search_form_${prev.iterationId}`);
          console.log(`Cleaned up sessionStorage for experiment ${prev.iterationId}`);
        } catch (e) {
          console.error("Error cleaning up sessionStorage:", e);
        }
      }

      return updatedExperimentData;
    });

    console.log("Experiment completed.");
    resetExperiment();
  };
  
  const downloadExperimentData = async (data: ExperimentData) => {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });

      // Build a descriptive filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const participant = data.participantId || "unknown";
      const experiment = data.experimentId || "unknown";
      const filename = `${participant}_${experiment}_${timestamp}.json`;

      // Upload to Vercel Blob Storage via API route
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        body: blob,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const { url } = await response.json();
      console.log("Experiment data uploaded to Vercel Blob:", url);
    } catch (error) {
      console.error("Error uploading experiment data, opening in new tab as fallback:", error);

      // Fallback: open JSON in new tab
      try {
        const jsonData = JSON.stringify(data, null, 2);
        const fallbackBlob = new Blob([jsonData], { type: "application/json" });
        const fallbackUrl = URL.createObjectURL(fallbackBlob);
        window.open(fallbackUrl, "_blank");
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
      }
    }
  };

  const resetExperiment = () => {
    setExperimentData(null);
    setIsTracking(false);
  };

  const abandonExperiment = () => {
    if (!experimentData) return;

    console.log("Abandoning experiment:", experimentData.iterationId);

    // Clean up sessionStorage for this experiment
    if (experimentData.iterationId) {
      try {
        sessionStorage.removeItem(`experiment_data_${experimentData.iterationId}`);
        sessionStorage.removeItem(`search_form_${experimentData.iterationId}`);
        console.log(`Cleaned up sessionStorage for abandoned experiment ${experimentData.iterationId}`);
      } catch (e) {
        console.error("Error cleaning up sessionStorage:", e);
      }
    }

    resetExperiment();
  };

  // Event tracking listeners
  useEffect(() => {
    if (!isTracking) return;

    console.log("Adding event listeners for tracking.");

    const handleMouseMove = throttle((event: MouseEvent) => {
      setExperimentData((prev) => {
        if (!prev || prev.pages.length === 0) return prev;

        const updatedPages = [...prev.pages];
        const lastPageIndex = updatedPages.length - 1;

        updatedPages[lastPageIndex].mouseMovements.push({
          x: event.clientX,
          y: event.clientY,
          time: Date.now(),
        });

        return { ...prev, pages: updatedPages };
      });
    }, 100, { leading: true, trailing: false });

    const handleScroll = throttle(() => {
      setExperimentData((prev) => {
        if (!prev) return null;

        const updatedPages = [...prev.pages];
        const lastPageIndex = updatedPages.length - 1;

        if (lastPageIndex >= 0) {
          updatedPages[lastPageIndex].scrollPositions.push({
            scrollY: window.scrollY,
            time: Date.now(),
          });
        }

        return { ...prev, pages: updatedPages };
      });
    }, 100, { leading: true, trailing: false });

    const handleClick = (event: MouseEvent) => {
      setExperimentData((prev) => {
        if (!prev) return null;

        const updatedPages = [...prev.pages];
        const lastPageIndex = updatedPages.length - 1;

        const target = event.target as HTMLElement;
        const trackedElement = target.closest('[data-track-id]');
        const trackId = trackedElement ? (trackedElement as HTMLElement).dataset.trackId || null : null;
        console.log("Click on element with track ID:", trackId);

        if (lastPageIndex >= 0) {
          updatedPages[lastPageIndex].clicks.push({
            x: event.clientX,
            y: event.clientY,
            element: target.tagName,
            trackId: trackId,
            time: Date.now(),
          });
        }

        return { ...prev, pages: updatedPages };
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      setExperimentData((prev) => {
        if (!prev || prev.pages.length === 0) return prev;

        const updatedPages = [...prev.pages];
        const lastPageIndex = updatedPages.length - 1;

        // Find the active element and bubble up to find data-track-id
        const activeElement = document.activeElement as HTMLElement;
        const trackedElement = activeElement?.closest('[data-track-id]');
        const inputId = trackedElement
          ? (trackedElement as HTMLElement).dataset.trackId || null
          : activeElement?.id || null;

        updatedPages[lastPageIndex].keyPresses.push({
          key: event.key,
          inputId: inputId,
          time: Date.now(),
        });

        return { ...prev, pages: updatedPages };
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      console.log("Removing event listeners.");
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
      handleMouseMove.cancel();
      handleScroll.cancel();
    };
  }, [isTracking]);

  // Handle initial page load - separated from navigation tracking
  useEffect(() => {
    if (!isTracking || typeof window === 'undefined') return;
    
    // Only initialize tracking on search page or other relevant pages, not on welcome page
    const currentUrl = window.location.pathname;
    
    // Skip tracking for welcome page
    if (currentUrl === '/' || currentUrl === '/welcome') {
      currentPageRef.current = currentUrl;
      return;
    }
    
    // Initialize tracking for other pages
    currentPageRef.current = currentUrl;
    
    // Record initial page visit (only if not welcome page)
    setExperimentData(prev => {
      if (!prev) return null;
      
      // If pages array is empty, initialize with first page
      if (prev.pages.length === 0) {
        return {
          ...prev,
          pages: [{
            page: currentUrl,
            visitStartTime: new Date().toISOString(),
            visitEndTime: null,
            mouseMovements: [],
            scrollPositions: [],
            clicks: [],
            keyPresses: [],
            selectionHistory: [],
            experimentState: {
              searchParams: null,
              outboundFlight: null,
              returnFlight: null,
            }
          }]
        };
      }
      
      return prev;
    });
  }, [isTracking]);
  
  // Handle page navigation with Next.js router - separate from initial page load
  useEffect(() => {
    if (!isTracking || typeof window === 'undefined') return;
    
    // Function to handle route changes
    const handleRouteChange = () => {
      const newUrl = window.location.pathname;
      
      // Skip if URL hasn't changed
      if (currentPageRef.current === newUrl) return;
      
      const visitStartTime = new Date().toISOString();
      
      setExperimentData(prev => {
        if (!prev) return null;
        
        const updatedPages = [...prev.pages];
        
        // Update previous page with end time if it exists
        if (updatedPages.length > 0) {
          const lastPageIndex = updatedPages.length - 1;
          updatedPages[lastPageIndex] = {
            ...updatedPages[lastPageIndex],
            visitEndTime: visitStartTime,
          };
        }

        // Copy experimentState from previous page
        const previousState = updatedPages.length > 0
          ? updatedPages[updatedPages.length - 1].experimentState
          : {
              searchParams: null,
              outboundFlight: null,
              returnFlight: null,
            };

        // Add new page
        updatedPages.push({
          page: newUrl,
          visitStartTime,
          visitEndTime: null,
          mouseMovements: [],
          scrollPositions: [],
          clicks: [],
          keyPresses: [],
          selectionHistory: [],
          experimentState: { ...previousState }
        });
        
        return {
          ...prev,
          pages: updatedPages,
        };
      });
      
      // Update current page reference
      currentPageRef.current = newUrl;
    };
    
    // Listen for pathname changes
    const handlePopState = () => {
      handleRouteChange();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Use a MutationObserver with debouncing to detect SPA navigation
    const observer = new MutationObserver(throttle(() => {
      const newUrl = window.location.pathname;
      if (currentPageRef.current !== newUrl) {
        handleRouteChange();
      }
    }, 300));
    
    observer.observe(document, { subtree: true, childList: true });
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      observer.disconnect();
    };
  }, [isTracking]); // Only depend on isTracking
  
  // Add entry to selection history for current page
  const addToSelectionHistory = useCallback((entry: any) => {
    setExperimentData((prev) => {
      if (!prev) return null;

      const updatedPages = [...prev.pages];
      if (updatedPages.length === 0) return prev;

      const lastPageIndex = updatedPages.length - 1;

      const currentPageData = updatedPages[lastPageIndex];
      const enhancedEntry = {
        timestamp: new Date().toISOString(),
        ...entry
      };

      // Calculate isCorrection if this is a field_change
      if (entry.type === "field_change") {
        // Try to get the real previous value from experimentState
        let realPreviousValue = entry.previousValue;

        // If no previousValue was provided or it's empty, check experimentState
        if (!realPreviousValue && currentPageData.experimentState?.searchParams) {
          const fieldMapping: Record<string, string> = {
            'departure_airport': 'departure',
            'destination_airport': 'destination',
            'departure_date': 'date',
            'return_date': 'returnDate'
          };

          const stateKey = fieldMapping[entry.field] || entry.field;
          realPreviousValue = currentPageData.experimentState.searchParams[stateKey] || "";
        }

        enhancedEntry.previousValue = realPreviousValue;
        enhancedEntry.isCorrection =
          realPreviousValue !== "" &&
          realPreviousValue !== null &&
          realPreviousValue !== undefined;
      }

      console.log(`Adding to selection history for ${currentPageData.page}:`, enhancedEntry);

      updatedPages[lastPageIndex] = {
        ...currentPageData,
        selectionHistory: [
          ...currentPageData.selectionHistory,
          enhancedEntry
        ]
      };

      return {
        ...prev,
        pages: updatedPages,
      };
    });
  }, []);

  // Update experiment state for current page
  const updateExperimentState = useCallback((updates: any) => {
    console.log('Updating experiment state:', updates);

    setExperimentData((prev) => {
      if (!prev) return null;

      const updatedPages = [...prev.pages];
      if (updatedPages.length > 0) {
        const lastPageIndex = updatedPages.length - 1;

        updatedPages[lastPageIndex] = {
          ...updatedPages[lastPageIndex],
          experimentState: {
            ...updatedPages[lastPageIndex].experimentState,
            ...updates
          }
        };
      }

      return {
        ...prev,
        pages: updatedPages,
      };
    });
  }, []);

  return (
    <EventTrackerContext.Provider
      value={{
        isTracking,
        experimentData,
        startExperiment,
        stopExperiment,
        abandonExperiment,
        addToSelectionHistory,
        updateExperimentState
      }}
    >
      {children}
    </EventTrackerContext.Provider>
  );
};

export const useEventTracker = (): EventTrackerContextType => {
  const context = useContext(EventTrackerContext);
  if (context === undefined) {
    throw new Error('useEventTracker must be used within an EventTrackerProvider');
  }
  return context;
};
