import { useEventTracker } from "@/context/EventTrackerProvider";

/**
 * Custom hook to add selection data to the event tracker
 * @returns A function to add selection data
 */
export function useAddSelection() {
  const { addSelection: addSelectionToTracker } = useEventTracker();
  
  return (selection: any) => {
    addSelectionToTracker(selection);
  };
}

/**
 * Helper function to add selection data without using hooks
 * This requires the EventTrackerContext to be available in the component tree
 * @param selection The selection data to add
 */
export function addSelection(selection: any) {
  // Get the addSelection function from the EventTrackerContext
  const context = useEventTracker();
  
  if (!context || !context.addSelection) {
    console.error("EventTrackerContext not available or missing addSelection function");
    return;
  }
  
  context.addSelection(selection);
}

/**
 * Create a selection handler function bound to a specific component
 * @param type The type of selection (e.g. "search_parameters", "flight_selection")
 * @param addSelectionFn The addSelection function from the EventTrackerContext
 * @returns A function that adds the selection with the specified type
 */
export function createSelectionHandler(type: string, addSelectionFn: (selection: any) => void) {
  return (data: any) => {
    addSelectionFn({
      type,
      ...data,
      timestamp: new Date().toISOString()
    });
  };
}
