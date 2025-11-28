'use client';

import { useState, useEffect } from 'react';
import type { PC } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { AdminPcTable } from './admin-pc-table';

type AdminDashboardProps = {
    pcs: PC[];
    setPcs: React.Dispatch<React.SetStateAction<PC[]>>;
    addAuditLog: (log: string) => void;
}

export function AdminDashboard({ pcs, setPcs, addAuditLog }: AdminDashboardProps) {
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
        if(isLoading) setIsLoading(false);
      }
    };

    if (pcs.length === 0) {
        fetchStatuses();
    } else {
        setIsLoading(false);
    }

    const intervalId = setInterval(fetchStatuses, 5000); 

    return () => clearInterval(intervalId);
  }, [isOnline, isLoading, setPcs, pcs.length]);

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-[40px] w-full rounded-lg" />
            <Skeleton className="h-[450px] w-full rounded-lg" />
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
      <AdminPcTable pcs={pcs} setPcs={setPcs} addAuditLog={addAuditLog} />
    </>
  );
}
