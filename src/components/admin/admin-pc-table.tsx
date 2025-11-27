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
    AlertCircle,
  } from 'lucide-react';
import type { FC } from 'react';

type StatusConfig = {
    [key in PCStatus]: {
      label: string;
      icon: FC<{ className?: string }>;
      badgeClass: string;
    };
  };
  
const statusConfig: StatusConfig = {
    offline: {
        label: 'Available',
        icon: Power,
        badgeClass: 'bg-status-online text-status-text border-green-400',
    },
    active: {
        label: 'In Use',
        icon: Monitor,
        badgeClass: 'bg-status-using text-status-text border-blue-400',
    },
    warning: {
        label: 'Warning',
        icon: AlertCircle,
        badgeClass: 'bg-yellow-500 text-status-text border-yellow-400',
    },
    pending_extension: {
        label: 'Pending',
        icon: Hourglass,
        badgeClass: 'bg-status-pending text-status-text border-orange-400',
    },
    expired: {
        label: 'Expired',
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
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pcs.map((pc) => {
              const config = statusConfig[pc.status];
              const Icon = config.icon;
              return (
                <TableRow key={pc.id}>
                  <TableCell className="font-medium">{pc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-2', config.badgeClass)}>
                      <Icon className="mr-2 h-4 w-4" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{pc.id}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
