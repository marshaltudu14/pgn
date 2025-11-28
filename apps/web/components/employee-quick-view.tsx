/**
 * Employee Quick View Component
 * Shows important employee details in a modern, professional dialog
 */

'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Employee, EmploymentStatus } from '@pgn/shared';
import {
  Mail,
  Phone,
  Calendar,
  Edit,
  Building,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Users,
} from 'lucide-react';

interface EmployeeQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onEdit?: (employee: Employee) => void;
}

const EMPLOYMENT_STATUS_COLORS: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
  SUSPENDED: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
  RESIGNED: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  TERMINATED: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
  ON_LEAVE: 'bg-muted text-muted-foreground',
};

const STATUS_ICON_MAP = {
  ACTIVE: CheckCircle,
  SUSPENDED: XCircle,
  RESIGNED: Users,
  TERMINATED: XCircle,
  ON_LEAVE: Clock,
};

export function EmployeeQuickView({ open, onOpenChange, employee, onEdit }: EmployeeQuickViewProps) {
  if (!employee) return null;

  const StatusIcon = STATUS_ICON_MAP[employee.employment_status as EmploymentStatus] || Users;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header Section */}
        <DialogHeader className="pb-4">
          <DialogTitle className="sr-only">
            {employee.first_name} {employee.last_name} - Employee Details
          </DialogTitle>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <StatusIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {employee.human_readable_user_id}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content - Two Column Layout (Mobile Responsive) */}
        <div className="py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="space-y-6">

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <span className="text-sm text-foreground break-all">{employee.email}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-1">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Phone</span>
                    </div>
                    <span className="text-sm text-foreground">{employee.phone || '-'}</span>
                  </div>
                </div>
              </div>

              </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Employment Details */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Employment Details
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-1">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${EMPLOYMENT_STATUS_COLORS[employee.employment_status as EmploymentStatus]} border-current text-xs`}
                    >
                      {employee.employment_status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Login Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {employee.can_login ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm text-foreground">
                        {employee.can_login ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Information */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Created</span>
                    </div>
                    <span className="text-sm text-foreground">{formatDate(employee.created_at!)}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Last Updated</span>
                    </div>
                    <span className="text-sm text-foreground">{formatDate(employee.updated_at!)}</span>
                  </div>

                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Cities - Full Width Section */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Assigned Cities
          </h3>
          <div className="space-y-2">
            {employee.assigned_cities && employee.assigned_cities.length > 0 ? (
              employee.assigned_cities.map((city: any, index: number) => (
                <div key={index} className="text-sm text-foreground py-1 px-2 bg-muted/50 rounded">
                  {typeof city === 'string' ? city : city.city || JSON.stringify(city)}
                </div>
              ))
            ) : (
              <div className="text-sm text-foreground py-1 px-2 bg-muted/50 rounded">
                -
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border">
          <div className="flex justify-end">
            {onEdit && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onEdit(employee);
                  onOpenChange(false);
                }}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Employee
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}