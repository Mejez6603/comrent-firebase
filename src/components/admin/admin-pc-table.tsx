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
    Pencil,
    Save,
    X,
    Trash2,
  } from 'lucide-react';
import type { FC } from 'react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";

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

const ALL_STATUSES = Object.keys(statusConfig) as PCStatus[];

export function AdminPcTable({ pcs, setPcs }: { pcs: PC[], setPcs: React.Dispatch<React.SetStateAction<PC[]>> }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PC | null>(null);
  const { toast } = useToast();

  const handleEdit = (pc: PC) => {
    setEditingId(pc.id);
    setEditingName(pc.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveName = async (id: string) => {
    try {
      const response = await fetch('/api/pc-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, newName: editingName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update PC name');
      }

      const updatedPc: PC = await response.json();
      
      setPcs(prevPcs => prevPcs.map(p => (p.id === updatedPc.id ? updatedPc : p)));
      
      toast({
        title: 'Success',
        description: `PC name updated to "${updatedPc.name}"`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update PC name.',
      });
    } finally {
      handleCancelEdit();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch('/api/pc-status', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete PC');
      }

      const { deletedPcId } = await response.json();
      
      setPcs(prevPcs => prevPcs.filter(p => p.id !== deletedPcId));
      
      toast({
        title: 'Success',
        description: `PC "${deleteTarget.name}" has been deleted.`,
      });
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete PC.',
        });
    } finally {
        setDeleteTarget(null);
    }
  };

  const handleStatusChange = async (pcId: string, newStatus: PCStatus) => {
    try {
        const response = await fetch('/api/pc-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: pcId, newStatus }),
        });
  
        if (!response.ok) {
          throw new Error('Failed to update PC status');
        }
  
        const updatedPc: PC = await response.json();
        
        setPcs(prevPcs => prevPcs.map(p => (p.id === updatedPc.id ? updatedPc : p)));
        
        toast({
          title: 'Status Updated',
          description: `PC "${updatedPc.name}" is now ${statusConfig[newStatus].label}.`,
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not update PC status.',
        });
      }
  };

  return (
    <>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pcs.map((pc) => {
                const config = statusConfig[pc.status];
                const Icon = config.icon;
                const isEditing = editingId === pc.id;
                
                let timeRemaining = '-';
                if (pc.status === 'in_use' && pc.session_start && pc.session_duration) {
                  const endTime = new Date(pc.session_start).getTime() + pc.session_duration * 60 * 1000;
                  timeRemaining = formatDistanceToNow(endTime, { addSuffix: true });
                }

                return (
                  <TableRow key={pc.id}>
                    <TableCell className="font-medium">
                      {isEditing ? (
                        <Input 
                          value={editingName} 
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        pc.name
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Badge variant="outline" className={cn('border-2 cursor-pointer', config.badgeClass)}>
                                <Icon className="mr-2 h-4 w-4" />
                                {config.label}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {ALL_STATUSES.map(status => {
                                const statusConf = statusConfig[status];
                                const StatusIcon = statusConf.icon;
                                return (
                                    <DropdownMenuItem key={status} onClick={() => handleStatusChange(pc.id, status)} disabled={pc.status === status}>
                                        <StatusIcon className="mr-2 h-4 w-4" />
                                        <span>{statusConf.label}</span>
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>{pc.user || '-'}</TableCell>
                    <TableCell>{timeRemaining}</TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSaveName(pc.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(pc)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(pc)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the PC named
              <span className="font-bold"> "{deleteTarget?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
