'use client';

import type { FC } from 'react';
import Link from 'next/link';
import type { PC, PCStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Monitor, Power, Hourglass, Ban, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

type StatusConfig = {
  [key in PCStatus]: {
    label: string;
    icon: FC<{ className?: string }>;
    cardClass: string;
    clickable: boolean;
  };
};

const statusConfig: StatusConfig = {
  offline: {
    label: 'Available',
    icon: Power,
    cardClass: 'bg-status-online text-status-text border-green-400',
    clickable: true,
  },
  active: {
    label: 'In Use',
    icon: Monitor,
    cardClass: 'bg-status-using text-status-text border-blue-400',
    clickable: false,
  },
  warning: {
    label: 'In Use',
    icon: Monitor,
    cardClass: 'bg-status-using text-status-text border-blue-400',
    clickable: false,
  },
  pending_extension: {
    label: 'Pending',
    icon: Hourglass,
    cardClass: 'bg-status-pending text-status-text border-orange-400',
    clickable: false,
  },
  expired: {
    label: 'Not Available',
    icon: Ban,
    cardClass: 'bg-status-unavailable text-status-text border-red-400',
    clickable: false,
  },
};

export function PcCard({ pc, isOnline }: { pc: PC; isOnline: boolean }) {
  const router = useRouter();
  const config = statusConfig[pc.status];
  const Icon = config.icon;
  const Wrapper = config.clickable && isOnline ? 'a' : 'div';

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (config.clickable && isOnline) {
      e.preventDefault();
      router.push(`/payment?pc=${pc.name}`);
    }
  };

  const cardContent = (
    <Card
      className={cn(
        'transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-md hover:shadow-xl relative overflow-hidden',
        config.cardClass,
        config.clickable && isOnline
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

  if (Wrapper === 'a') {
    return (
      <Link href={`/payment?pc=${pc.name}`} passHref legacyBehavior>
        <a className="block no-underline">{cardContent}</a>
      </Link>
    );
  }

  return <div>{cardContent}</div>;
}
