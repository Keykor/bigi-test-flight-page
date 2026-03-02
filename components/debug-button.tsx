'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function DebugButton() {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClearCache = () => {
    // Clear all localStorage
    localStorage.clear()

    // Clear all sessionStorage
    sessionStorage.clear()

    // Redirect to home page and reload
    // Using window.location.href ensures a clean navigation without tracking issues
    window.location.href = '/'
  }

  return (
    <>
      <Button
        data-track-id="debug-clear-cache"
        onClick={() => setShowConfirm(true)}
        variant="outline"
        size="sm"
        className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
        title="Clear all cache and reset application"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Clear Cache
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Cache?</DialogTitle>
            <DialogDescription asChild>
              <div>
                <p className="text-sm text-muted-foreground">
                  This will clear all application data including:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Participant ID</li>
                  <li>Completed experiments history</li>
                  <li>Current experiment session data</li>
                  <li>Search form data</li>
                </ul>
                <p className="mt-2 font-semibold text-red-600 text-sm">
                  This action cannot be undone.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              data-track-id="debug-cancel-clear"
              variant="outline"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              data-track-id="debug-confirm-clear"
              variant="destructive"
              onClick={handleClearCache}
            >
              Clear All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
