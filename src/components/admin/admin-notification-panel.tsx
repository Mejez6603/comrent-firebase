'use client';

import { useMemo } from 'react';
import type { PC, PCStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CircleHelp, Clock, Power, Info, Wrench, Ban, Monitor } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useNotificationSounds } from '@/hooks/use-notification-sounds';

type AdminNotificationPanelProps = {
  pcs: PC[];
  previousPcs: PC[];
};

export type Notification = {
  id: string;
  type: PCStatus | 'ended' | 'session_ending';
  icon: React.ElementType;
  iconClass: string;
  message: React.ReactNode;
};

const iconMap: Record<PCStatus, { icon: React.ElementType; iconClass: string }> = {
    available: { icon: Power, iconClass: 'text-green-500' },
    in_use: { icon: Monitor, iconClass: 'text-blue-500' },
    pending_payment: { icon: Clock, iconClass: 'text-orange-500' },
    pending_approval: { icon: CircleHelp, iconClass: 'text-yellow-500' },
    maintenance: { icon: Wrench, iconClass: 'text-gray-500' },
    unavailable: { icon: Ban, iconClass: 'text-red-500' },
    time_up: { icon: Clock, iconClass: 'text-destructive' },
};


export function AdminNotificationPanel({ pcs, previousPcs }: AdminNotificationPanelProps) {
  const notifications = useMemo(() => {
    const newNotifications: Notification[] = [];
    const prevPcsMap = new Map(previousPcs.map(p => [p.id, p]));

    pcs.forEach((pc) => {
        const prevPc = prevPcsMap.get(pc.id);

        // 1. Detect any status change
        if (prevPc && prevPc.status !== pc.status) {
            const config = iconMap[pc.status];
            newNotifications.push({
                id: `${pc.status}-${pc.id}-${Date.now()}`, // Make ID more unique
                type: pc.status,
                icon: config.icon,
                iconClass: config.iconClass,
                message: (
                    <span>
                        <span className="font-bold">{pc.name}</span> status changed to <span className="font-semibold">{pc.status.replace(/_/g, ' ')}</span>.
                    </span>
                ),
            });
        }

        // 2. Add specific, more descriptive notifications for important states
        // These can exist alongside the generic status change notification.
        if (pc.status === 'pending_approval') {
            newNotifications.push({
                id: `approval-${pc.id}`,
                type: 'pending_approval',
                icon: CircleHelp,
                iconClass: 'text-yellow-500',
                message: (
                    <span>
                    <span className="font-bold">{pc.name}</span> is waiting for session approval.
                    </span>
                ),
            });
        }
        
        if (pc.status === 'time_up') {
             newNotifications.push({
                id: `ended-${pc.id}`,
                type: 'ended',
                icon: Clock,
                iconClass: 'text-destructive',
                message: (
                <span>
                    Session for <span className="font-bold">{pc.name}</span> has ended. Awaiting action.
                </span>
                ),
            });
        }
    });

    // Remove duplicates that might arise from the logic above, favoring the specific message.
    const finalNotifications = Array.from(new Map(newNotifications.map(n => [n.id.split('-').slice(0, 2).join('-'), n])).values());


    return finalNotifications;
  }, [pcs, previousPcs]);

  useNotificationSounds(notifications);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold flex items-center">
            <Bell className="mr-2 h-5 w-5"/>
            Notifications
        </CardTitle>
        <span className="text-sm font-bold text-primary">{notifications.length}</span>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-32 w-full">
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div key={notification.id} className="flex items-start">
                    <Icon className={`mr-3 mt-1 h-4 w-4 shrink-0 ${notification.iconClass}`} />
                    <div className="text-sm text-muted-foreground">{notification.message}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Info className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No new notifications.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
