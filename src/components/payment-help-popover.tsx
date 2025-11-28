'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HelpCircle, Clock, Scan, Send, CheckCircle, ListOrdered } from 'lucide-react';

export function PaymentHelpPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
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
  );
}
