'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export function RoleSwitcher() {
  const [role, setRole] = useState<'user' | 'admin'>('user');

  const toggleRole = () => {
    setRole(current => (current === 'user' ? 'admin' : 'user'));
  };

  return (
    <Button onClick={toggleRole} variant="outline">
      <Users className="mr-2 h-4 w-4" />
      Switch to {role === 'user' ? 'Admin' : 'User'}
    </Button>
  );
}
