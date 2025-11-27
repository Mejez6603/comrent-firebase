'use client';

import { useState, useEffect } from 'react';
import type { PC } from '@/lib/types';
import { PcCard } from '@/components/pc-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function PcStatusGrid() {
  const [pcs, setPcs] = useState<PC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/pc-status');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: PC[] = await response.json();
        setPcs(data);
        if (!isOnline) setIsOnline(true);
      } catch (error) {
        console.error('Failed to fetch PC statuses:', error);
        if (isOnline) setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();
    const intervalId = setInterval(fetchStatuses, 2000);

    return () => clearInterval(intervalId);
  }, [isOnline]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-[120px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      {!isOnline && (
         <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
                Could not connect to the server. Displaying last known statuses.
            </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {pcs.map((pc) => (
          <PcCard key={pc.id} pc={pc} isOnline={isOnline} />
        ))}
      </div>
    </>
  );
}
