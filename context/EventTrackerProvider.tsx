"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { throttle } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

interface ExperimentData {
  subject?: string;
  version?: string;
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
    selection?: any; // Cambiamos a un único objeto de selección opcional
  }>;
  experimentStartTime: string;
  experimentEndTime?: string;
  uuid: string;
  sampleCounter?: number;
}

interface EventTrackerContextType {
  isTracking: boolean;
  experimentData: ExperimentData | null;
  startExperiment: (iterationId: string) => void;
  stopExperiment: () => void;
  addSelection: (selection: any) => void;
}

const EventTrackerContext = createContext<EventTrackerContextType | undefined>(undefined);

export const EventTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [experimentData, setExperimentData] = useState<ExperimentData | null>(null);
  const [uuid] = useState(uuidv4()); 
  const [sampleCounter, setSampleCounter] = useState(0);
  const router = useRouter();
  
  // Add ref to track current page URL
  const currentPageRef = useRef<string | null>(null);
  // Add ref to track experiment data to avoid dependency issues
  const experimentDataRef = useRef<ExperimentData | null>(null);

  // Update the ref whenever experimentData changes
  useEffect(() => {
    experimentDataRef.current = experimentData;
  }, [experimentData]);

  // Memoize startExperiment to avoid recreating on every render
  const startExperiment = useCallback((iterationId: string) => {
    // Prevent duplicate experiment creation
    if (experimentDataRef.current?.iterationId === iterationId) {
      console.log("Experiment already started for this iteration");
      return;
    }
    
    // Create new experiment but don't initialize pages yet
    // Pages will be initialized when user navigates to search page
    const newExperiment = {
      iterationId,
      pages: [],
      experimentStartTime: new Date().toISOString(),
      uuid: uuid,
    };
    
    setExperimentData(newExperiment);
    setIsTracking(true);
    console.log(`Experiment started for iteration: ${iterationId}`);
  }, [uuid]);

  const stopExperiment = () => {
    if (!experimentData) {
      console.error("No experiment in progress!");
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

      const updatedExperimentData = {
        ...prev,
        sampleCounter: sampleCounter + 1,
        experimentEndTime,
        pages: updatedPages,
      };  
      
      downloadExperimentData(updatedExperimentData); 
      console.log("Experiment data:", updatedExperimentData);
      setSampleCounter((prev) => prev + 1); 
      return updatedExperimentData;
    });
  
    console.log("Experiment completed.");
    resetExperiment();
  };
  
  const downloadExperimentData = (data: ExperimentData) => {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
  
      // Open the Blob in a new tab
      window.open(url, "_blank");
  
      console.log("Blob opened in a new tab for verification.");
    } catch (error) {
      console.error("Error during Blob creation or opening:", error);
    }
  };

  const resetExperiment = () => {
    setExperimentData(null);
    setIsTracking(false);
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
    }, 100);

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
    }, 100);

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

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("click", handleClick);

    return () => {
      console.log("Removing event listeners.");
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);
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
            // No inicializamos selection ya que es opcional
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
        
        // Add new page
        updatedPages.push({
          page: newUrl,
          visitStartTime,
          visitEndTime: null,
          mouseMovements: [],
          scrollPositions: [],
          clicks: [],
          // No inicializamos selection ya que es opcional
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
  
  // Enhanced selection tracking for different page types
  const addSelection = useCallback((selection: any) => {
    const currentPage = currentPageRef.current;
    
    // Create enhanced selection with timestamp
    let enhancedSelection = {
      timestamp: new Date().toISOString(),
      ...selection // Keep all the original selection data
    };
    
    console.log(`Recording selection for ${currentPage}:`, enhancedSelection);
    
    setExperimentData((prev) => {
      if (!prev) return null;
      
      // Actualizamos solo la selección de la página actual
      const updatedPages = [...prev.pages];
      if (updatedPages.length > 0) {
        const lastPageIndex = updatedPages.length - 1;
        
        // Make sure this is the right page (safety check)
        if (updatedPages[lastPageIndex].page === currentPage) {
          // Set the selection for this page
          updatedPages[lastPageIndex] = {
            ...updatedPages[lastPageIndex],
            selection: enhancedSelection
          };
        }
      }
      
      return {
        ...prev,
        pages: updatedPages,
      };
    });
    
    console.log(`Selection recorded for ${currentPage}:`, enhancedSelection);
  }, []);

  return (
    <EventTrackerContext.Provider
      value={{
        isTracking,
        experimentData,
        startExperiment,
        stopExperiment,
        addSelection
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
