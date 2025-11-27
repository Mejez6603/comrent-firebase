'use client';

import { useState } from 'react';
import { PcStatusGrid } from '@/components/pc-status-grid';
import { RoleSwitcher } from '@/components/role-switcher';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default function Home() {
  const [role, setRole] = useState<'user' | 'admin'>('user');

  const toggleRole = () => {
    setRole(current => (current === 'user' ? 'admin' : 'user'));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="absolute top-4 left-4">
            <RoleSwitcher role={role} onToggle={toggleRole} />
          </div>
          <header className="text-center mb-8 md:mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline tracking-tight">ComRent</h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
              {role === 'user'
                ? 'Real-time status of all PCs. Click an available PC to begin your session.'
                : 'Administrator Dashboard'}
            </p>
          </header>
          {role === 'user' ? <PcStatusGrid /> : <AdminDashboard />}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ComRent. All rights reserved.</p>
      </footer>
    </div>
  );
}
