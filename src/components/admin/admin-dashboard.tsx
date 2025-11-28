'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PC, PricingTier, PCStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CircleHelp, Clock, Power, Info, Wrench, Ban, Monitor } from "lucide-react";
import { AdminPcTable } from './admin-pc-table';
import { AdminNotificationPanel, type Notification } from './admin-notification-panel';

type AdminDashboardProps = {
    pcs: PC[];
    setPcs: React.Dispatch<React.SetStateAction<PC[]>>;
    addAuditLog: (log: string) => void;
    pricingTiers: PricingTier[];
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    dismissNotification: (id: string) => void;
}

const iconMap: Record<PCStatus, { icon: React.ElementType; iconClass: string }> = {
    available: { icon: Power, iconClass: 'text-green-500' },
    in_use: { icon: Monitor, iconClass: 'text-blue-500' },
    pending_payment: { icon: Clock, iconClass: 'text-orange-500' },
    pending_approval: { icon: CircleHelp, iconClass: 'text-yellow-500' },
    maintenance: { icon: Wrench, iconClass: 'text-gray-500' },
    unavailable: { icon: Ban, iconClass: 'text-red-500' },
    time_up: { icon: Clock, iconClass: 'text-destructive' },
};

export function AdminDashboard({ pcs, setPcs, addAuditLog, pricingTiers, notifications, addNotification, dismissNotification }: AdminDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const previousPcsRef = useRef<Map<string, PC>>(new Map());

  const fetchStatuses = useCallback(async (isInitialFetch = false) => {
    try {
      const response = await fetch('/api/pc-status');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: PC[] = await response.json();
      
      if (isInitialFetch) {
        previousPcsRef.current = new Map(data.map(pc => [pc.id, pc]));
      } else {
        data.forEach(pc => {
          const prevPc = previousPcsRef.current.get(pc.id);
          if (prevPc && prevPc.status !== pc.status) {
            const config = iconMap[pc.status];
            const rawMessage = `PC "${pc.name}" status changed from "${prevPc.status.replace(/_/g, ' ')}" to "${pc.status.replace(/_/g, ' ')}".`;
            addNotification({
                pc,
                type: pc.status,
                icon: config.icon,
                iconClass: config.iconClass,
                message: (
                    <span>
                        <span className="font-bold">{pc.name}</span> status changed to <span className="font-semibold">{pc.status.replace(/_/g, ' ')}</span>.
                    </span>
                ),
                rawMessage: rawMessage
            });
          }
        });
        previousPcsRef.current = new Map(data.map(pc => [pc.id, pc]));
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
  }, [isOnline, isLoading, isRefreshing, setPcs, addNotification]);

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
            notifications={notifications} 
            dismissNotification={dismissNotification}
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
