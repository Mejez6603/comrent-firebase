'use client';

import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HelpCircle, Clock, Scan, Send, CheckCircle, ListOrdered } from 'lucide-react';

export function PaymentHelpPopover() {
  const [showHelpHint, setShowHelpHint] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    // Show help hint after 10 seconds
    if (!isPopoverOpen) {
      const timer = setTimeout(() => {
        setShowHelpHint(true);
      }, 10000); 

      return () => clearTimeout(timer);
    }
  }, [isPopoverOpen]);

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setShowHelpHint(false);
    }
  };

  return (
    <div className="relative">
      {showHelpHint && !isPopoverOpen && (
        <div className="absolute bottom-3 right-16 flex animate-bounce items-center justify-center">
            <div className="relative rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-lg">
                <p className="text-sm font-bold">Need Help?</p>
                <div className="absolute right-[-4px] top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-primary"></div>
            </div>
        </div>
      )}
      <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <HelpCircle className="h-7 w-7" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" side="top" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none flex items-center">
                  <ListOrdered className="mr-2 text-primary" />
                  How to Start Your Session
              </h4>
              <p className="text-sm text-muted-foreground">
                Follow these simple steps to get started.
              </p>
            </div>
            <div className="grid gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-1 text-accent flex-shrink-0" />
                <div>
                  <span className="font-semibold">Step 1:</span> Select your desired
                  session duration.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Scan className="h-4 w-4 mt-1 text-accent flex-shrink-0" />
                <div>
                  <span className="font-semibold">Step 2:</span> Choose a
                  payment method and scan the QR code that appears.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Send className="h-4 w-4 mt-1 text-accent flex-shrink-0" />
                <div>
                  <span className="font-semibold">Step 3:</span> After paying,
                  click the &quot;I Have Sent The Payment&quot; button to notify the admin.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 mt-1 text-accent flex-shrink-0" />
                <div>
                  <span className="font-semibold">Step 4:</span> Wait for the admin
                  to approve your session. The page will update automatically!
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
