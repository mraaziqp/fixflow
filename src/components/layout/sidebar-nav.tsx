'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LayoutDashboard, ScanLine, PlusSquare, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { href: '/scanner', icon: <ScanLine />, label: 'Scanner' },
    { href: '/jobs/new', icon: <PlusSquare />, label: 'New Job' },
  ];

  return (
    <>
      <SidebarHeader className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-9 bg-primary text-primary-foreground hover:bg-primary/90">
            <Workflow className="size-5" />
          </Button>
          <span className="text-lg font-semibold text-primary">FixFlow</span>
        </Link>
        <SidebarTrigger className="hidden md:flex" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
