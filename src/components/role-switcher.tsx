'use client';

import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

type RoleSwitcherProps = {
    role: 'user' | 'admin';
    onToggle: () => void;
}

export function RoleSwitcher({ role, onToggle }: RoleSwitcherProps) {
  return (
    <Button onClick={onToggle} variant="outline">
      <Users className="mr-2 h-4 w-4" />
      Switch to {role === 'user' ? 'Admin' : 'User'}
    </Button>
  );
}
