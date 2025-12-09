'use client';

import { useAuthStore } from '@/app/lib/stores/authStore';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
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
import { useSidebarSwipe } from '@/hooks/use-sidebar-swipe';
import { cn } from '@/lib/utils';
import { Building2, Calendar, CheckSquare, Home, LogOut, Map, Settings, Store, Tractor, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';
import ErrorBoundary from './dashboard/components/ui/error-boundary';

const navigationSections = [
  {
    title: 'Main',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Home,
      },
      {
        title: 'Tasks',
        url: '/dashboard/tasks',
        icon: CheckSquare,
      },
    ],
  },
  {
    title: 'People Management',
    items: [
      {
        title: 'Employees',
        url: '/dashboard/employees',
        icon: Users,
      },
      {
        title: 'Dealers',
        url: '/dashboard/dealers',
        icon: Building2,
      },
      {
        title: 'Retailers',
        url: '/dashboard/retailers',
        icon: Store,
      },
      {
        title: 'Farmers',
        url: '/dashboard/farmers',
        icon: Tractor,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Regions',
        url: '/dashboard/regions',
        icon: Map,
      },
      {
        title: 'Attendance',
        url: '/dashboard/attendance',
        icon: Calendar,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: Settings,
      },
    ],
  },
];

const navigationItems = navigationSections.flatMap(section => section.items);

// Wrapper component to enable swipe gestures inside SidebarProvider
function SidebarSwipeWrapper({ children }: { children: React.ReactNode }) {
  // Enable swipe gesture for opening sidebar on mobile/tablet with real-time animation
  useSidebarSwipe();

  return <>{children}</>;
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
    const { logout, isLoading } = useAuthStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';
  const router = useRouter();

  // Create logout handler - redirect is handled by authStore
  const handleLogout = () => {
    logout();
  };

  const handleTabChange = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <SidebarProvider>
      <ErrorBoundary>
        <SidebarSwipeWrapper>
          <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" className="font-semibold">
                    <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-full group-data-[collapsible=icon]:size-6">
                      <Image
                        src="/pgn-logo.jpg"
                        alt="PGN System Logo"
                        width={32}
                        height={32}
                        className="object-cover group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6"
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
              {navigationSections.map((section) => (
                <SidebarGroup key={section.title}>
                  <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map(item => (
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
              ))}
            </SidebarContent>

            </Sidebar>

          <SidebarInset className="md:rounded-xl md:shadow-sm ml-0 md:ml-2 border border-transparent md:border md:border-sidebar-border">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-2 lg:px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1 overflow-x-auto">
                {pathname === '/dashboard' ? (
                   <div className="flex items-center gap-6">
                      <button 
                        onClick={() => handleTabChange('overview')}
                        className={cn(
                          "relative text-sm font-medium transition-colors hover:text-primary py-2 cursor-pointer",
                          currentView === 'overview' 
                            ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" 
                            : "text-muted-foreground"
                        )}
                      >
                        Overview
                      </button>
                      <button 
                         onClick={() => handleTabChange('tracking')}
                         className={cn(
                            "relative text-sm font-medium transition-colors hover:text-primary py-2 cursor-pointer",
                            currentView === 'tracking' 
                              ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" 
                              : "text-muted-foreground"
                         )}
                      >
                        Real-time Tracking
                      </button>
                   </div>
                ) : (
                  <h1 className="text-lg font-semibold text-foreground">
                    {pathname === '/dashboard' ? '' : (navigationItems.find(item => item.url === pathname)?.title || 'Dashboard')}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Logout"
                  className="cursor-pointer"
                  disabled={isLoading}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </div>
            </header>

            <main
              className="flex-1 bg-white dark:bg-black px-2 py-3 lg:p-6"
              suppressHydrationWarning
            >
              <ErrorBoundary key={typeof window !== 'undefined' ? window.location.pathname : 'server'}>{children}</ErrorBoundary>
            </main>
          </SidebarInset>
        </SidebarSwipeWrapper>
      </ErrorBoundary>
    </SidebarProvider>
  );
}

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </Suspense>
    );
}