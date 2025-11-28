'use client';

import type { FC } from 'react';
import type { PC, PCStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Monitor, Power, Hourglass, Ban, Wifi, WifiOff, Wrench, CircleHelp } from 'lucide-react';
import { WelcomeDialog } from './welcome-dialog';
import { useState } from 'react';

type StatusConfig = {
  [key in PCStatus]: {
    label: string;
    icon: FC<{ className?: string }>;
    cardClass: string;
    clickable: boolean;
  };
};

const statusConfig: StatusConfig = {
  available: {
    label: 'Available',
    icon: Power,
    cardClass: 'bg-status-online text-status-text border-green-400',
    clickable: true,
  },
  in_use: {
    label: 'In Use',
    icon: Monitor,
    cardClass: 'bg-status-using text-status-text border-blue-400',
    clickable: false,
  },
  pending_payment: {
    label: 'Pending Payment',
    icon: Hourglass,
    cardClass: 'bg-status-pending text-status-text border-orange-400',
    clickable: false,
  },
  pending_approval: {
    label: 'Pending Approval',
    icon: CircleHelp,
    cardClass: 'bg-yellow-500 text-status-text border-yellow-400',
    clickable: false,
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    cardClass: 'bg-gray-500 text-status-text border-gray-400',
    clickable: false,
  },
  unavailable: {
    label: 'Not Available',
    icon: Ban,
    cardClass: 'bg-status-unavailable text-status-text border-red-400',
    clickable: false,
  },
};

export function PcCard({ pc, isOnline }: { pc: PC; isOnline: boolean }) {
  const [isWelcomeDialogOpen, setIsWelcomeDialogOpen] = useState(false);
  const config = statusConfig[pc.status];
  const Icon = config.icon;

  const canClick = config.clickable && isOnline;

  const handleCardClick = () => {
    if (canClick) {
      setIsWelcomeDialogOpen(true);
    }
  };

  const cardElement = (
    <Card
      onClick={handleCardClick}
      className={cn(
        'transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-md hover:shadow-xl relative overflow-hidden',
        config.cardClass,
        canClick
          ? 'cursor-pointer'
          : 'cursor-not-allowed opacity-80',
        !isOnline && 'bg-gray-700 border-gray-600 opacity-60'
      )}
    >
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">{pc.name}</CardTitle>
        <Icon className="h-6 w-6" />
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium">
          {isOnline ? config.label : 'Offline'}
        </p>
      </CardContent>
      <div className="absolute bottom-2 right-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-white/50" />
        ) : (
          <WifiOff className="h-4 w-4 text-white/50" />
        )}
      </div>
    </Card>
  );

  return (
    <>
      {cardElement}
      <WelcomeDialog 
        isOpen={isWelcomeDialogOpen}
        onOpenChange={setIsWelcomeDialogOpen}
        pcName={pc.name}
      />
    </>
  );
}
