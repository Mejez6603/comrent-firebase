'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PC, PricingTier } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { AdminPcTable } from './admin-pc-table';
import { AdminNotificationPanel } from './admin-notification-panel';

type AdminDashboardProps = {
    pcs: PC[];
    setPcs: React.Dispatch<React.SetStateAction<PC[]>>;
    addAuditLog: (log: string) => void;
    pricingTiers: PricingTier[];
}

export function AdminDashboard({ pcs, setPcs, addAuditLog, pricingTiers }: AdminDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [previousPcs, setPreviousPcs] = useState<PC[]>([]);

  const fetchStatuses = useCallback(async (isInitialFetch = false) => {
    try {
      const response = await fetch('/api/pc-status');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: PC[] = await response.json();
      
      // On initial fetch, we don't want to trigger notifications for all PCs
      if (!isInitialFetch) {
        setPreviousPcs(pcs);
      } else {
        setPreviousPcs(data);
      }
      
      setPcs(data);
      if (!isOnline) setIsOnline(true);
    } catch (error) {
      console.error('Failed to fetch PC statuses:', error);
      if (isOnline) setIsOnline(false);
    } finally {
      if(isLoading) setIsLoading(false);
      if(isRefreshing) setIsRefreshing(false);
    }
  }, [isOnline, isLoading, isRefreshing, setPcs, pcs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStatuses();
  }

  useEffect(() => {
    if (pcs.length === 0) {
        fetchStatuses(true);
    }

    const intervalId = setInterval(() => fetchStatuses(false), 5000); 

    return () => clearInterval(intervalId);
  }, [fetchStatuses, pcs.length]);

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-[150px] w-full rounded-lg" />
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
       <div className="mb-6">
          <AdminNotificationPanel 
            pcs={pcs} 
            previousPcs={previousPcs} 
            addAuditLog={addAuditLog} 
          />
        </div>
      <AdminPcTable 
        pcs={pcs} 
        setPcs={setPcs} 
        addAuditLog={addAuditLog}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        pricingTiers={pricingTiers}
      />
    </>
  );
}
