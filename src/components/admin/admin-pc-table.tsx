'use client';
import type { PC, PCStatus } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Monitor,
    Power,
    Hourglass,
    Ban,
    Wrench,
  } from 'lucide-react';
import type { FC } from 'react';
import { formatDistanceToNow } from 'date-fns';

type StatusConfig = {
    [key in PCStatus]: {
      label: string;
      icon: FC<{ className?: string }>;
      badgeClass: string;
    };
  };
  
const statusConfig: StatusConfig = {
    available: {
        label: 'Available',
        icon: Power,
        badgeClass: 'bg-status-online text-status-text border-green-400',
    },
    in_use: {
        label: 'In Use',
        icon: Monitor,
        badgeClass: 'bg-status-using text-status-text border-blue-400',
    },
    pending_payment: {
        label: 'Pending',
        icon: Hourglass,
        badgeClass: 'bg-status-pending text-status-text border-orange-400',
    },
    maintenance: {
      label: 'Maintenance',
      icon: Wrench,
      badgeClass: 'bg-gray-500 text-status-text border-gray-400',
    },
    unavailable: {
        label: 'Unavailable',
        icon: Ban,
        badgeClass: 'bg-status-unavailable text-status-text border-red-400',
    },
};

export function AdminPcTable({ pcs }: { pcs: PC[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PC Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PC Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Time Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pcs.map((pc) => {
              const config = statusConfig[pc.status];
              const Icon = config.icon;
              
              let timeRemaining = '-';
              if (pc.status === 'in_use' && pc.session_start && pc.session_duration) {
                const endTime = new Date(pc.session_start).getTime() + pc.session_duration * 60 * 1000;
                timeRemaining = formatDistanceToNow(endTime, { addSuffix: true });
              }

              return (
                <TableRow key={pc.id}>
                  <TableCell className="font-medium">{pc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-2', config.badgeClass)}>
                      <Icon className="mr-2 h-4 w-4" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{pc.user || '-'}</TableCell>
                  <TableCell>{timeRemaining}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
