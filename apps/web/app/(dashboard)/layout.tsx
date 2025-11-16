'use client';

import React from 'react';
import { useAuthStore } from '@/app/lib/stores/authStore';
import ErrorBoundary from './dashboard/components/ui/error-boundary';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Home, Users, Calendar, Settings, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useSidebarSwipe } from '@/hooks/use-sidebar-swipe';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'Employees',
    url: '/dashboard/employees',
    icon: Users,
  },
  {
    title: 'Attendance',
    url: '/dashboard/attendance',
    icon: Calendar,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
];

// Wrapper component to enable swipe gestures inside SidebarProvider
function SidebarSwipeWrapper({ children }: { children: React.ReactNode }) {
  // Enable swipe gesture for opening sidebar on mobile/tablet with real-time animation
  useSidebarSwipe();

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <ErrorBoundary>
        <SidebarSwipeWrapper>
          <Sidebar className="bg-white dark:bg-black border-r border-border">
            <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="font-semibold">
                  <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-full">
                    <Image
                      src="/pgn-logo.jpg"
                      alt="PGN System Logo"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">PGN System</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                      >
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <User />
                  <span>{user?.fullName || user?.email || 'User'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout}>
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">
                {navigationItems.find(item => item.url === pathname)?.title || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm font-medium text-foreground">
                {user?.fullName || user?.email}
              </span>
            </div>
          </header>

          <main className="flex-1 bg-white dark:bg-black p-6" suppressHydrationWarning>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </SidebarInset>
        </SidebarSwipeWrapper>
      </ErrorBoundary>
    </SidebarProvider>
  );
}