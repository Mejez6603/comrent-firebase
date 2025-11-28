'use client';

import type { PC, PCStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Info, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useNotificationSounds } from '@/hooks/use-notification-sounds';

export type Notification = {
  id: string;
  pc: PC;
  type: PCStatus | 'ended' | 'session_ending';
  icon: React.ElementType;
  iconClass: string;
  message: React.ReactNode;
  rawMessage: string;
};

type AdminNotificationPanelProps = {
  notifications: Notification[];
  dismissNotification: (id: string) => void;
};


export function AdminNotificationPanel({ notifications, dismissNotification }: AdminNotificationPanelProps) {
  
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
                  <div key={notification.id} className="flex items-start justify-between group">
                    <div className="flex items-start">
                        <Icon className={`mr-3 mt-1 h-4 w-4 shrink-0 ${notification.iconClass}`} />
                        <div className="text-sm text-muted-foreground">{notification.message}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => dismissNotification(notification.id)}
                    >
                        <X className="h-4 w-4"/>
                    </Button>
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
