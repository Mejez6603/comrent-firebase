'use client';

import { useMemo } from 'react';
import type { PC } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CircleHelp, Clock, Power, Info } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

type AdminNotificationPanelProps = {
  pcs: PC[];
  previousPcs: PC[];
};

type Notification = {
  id: string;
  icon: React.ElementType;
  iconClass: string;
  message: React.ReactNode;
};

export function AdminNotificationPanel({ pcs, previousPcs }: AdminNotificationPanelProps) {
  const notifications = useMemo(() => {
    const newNotifications: Notification[] = [];

    // 1. Users waiting for approval
    pcs
      .filter((pc) => pc.status === 'pending_approval')
      .forEach((pc) => {
        newNotifications.push({
          id: `approval-${pc.id}`,
          icon: CircleHelp,
          iconClass: 'text-yellow-500',
          message: (
            <span>
              <span className="font-bold">{pc.name}</span> is waiting for session approval.
            </span>
          ),
        });
      });

    // 2. Users whose time is almost up
    pcs
      .filter((pc) => pc.status === 'in_use' && pc.session_start && pc.session_duration)
      .forEach((pc) => {
        const endTime = new Date(pc.session_start!).getTime() + pc.session_duration! * 60 * 1000;
        const minutesRemaining = (endTime - Date.now()) / (1000 * 60);

        if (minutesRemaining > 0 && minutesRemaining <= 5) {
          newNotifications.push({
            id: `time-up-${pc.id}`,
            icon: Clock,
            iconClass: 'text-orange-500',
            message: (
              <span>
                <span className="font-bold">{pc.name}</span> session will end{' '}
                {formatDistanceToNow(endTime, { addSuffix: true })}.
              </span>
            ),
          });
        }
      });
      
    // 3. PC is available now
    const prevPcsMap = new Map(previousPcs.map(p => [p.id, p]));
    pcs.forEach((pc) => {
        const prevPc = prevPcsMap.get(pc.id);
        if (prevPc && prevPc.status !== 'available' && pc.status === 'available') {
            newNotifications.push({
                id: `available-${pc.id}`,
                icon: Power,
                iconClass: 'text-green-500',
                message: (
                  <span>
                    <span className="font-bold">{pc.name}</span> is now available.
                  </span>
                ),
            });
        }
    });

    // 4. Session has ended (pending payment)
    pcs
        .filter((pc) => pc.status === 'pending_payment')
        .forEach((pc) => {
            const prevPc = prevPcsMap.get(pc.id);
            if (prevPc && prevPc.status === 'in_use') {
                newNotifications.push({
                    id: `ended-${pc.id}`,
                    icon: Clock,
                    iconClass: 'text-status-pending',
                    message: (
                    <span>
                        Session for <span className="font-bold">{pc.name}</span> has ended and is pending payment.
                    </span>
                    ),
                });
            }
    });

    return newNotifications;
  }, [pcs, previousPcs]);

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
