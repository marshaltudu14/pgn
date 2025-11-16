/**
 * Audit Information Form Component
 * Displays employment status history and account information
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, User } from 'lucide-react';
import { Employee } from '@pgn/shared';

interface AuditInfoFormProps {
  employee?: Employee | null;
}

export function AuditInfoForm({ employee }: AuditInfoFormProps) {
  if (!employee) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-black border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Clock className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Audit Information</h2>
      </div>

      <div className="space-y-4">
        {/* Employment Status Change Info */}
        <div>
          <label className="text-sm font-medium mb-3 block">Employment Status History</label>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <div>
                <p className="font-medium text-sm">Current Status: {employee?.employment_status}</p>
                <p className="text-xs text-muted-foreground">Employee ID: {employee?.human_readable_user_id}</p>
              </div>
              <Badge variant="outline">
                Active
              </Badge>
            </div>

            {employee?.employment_status_changed_at && (
              <div className="p-3 bg-muted/30 border rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>Last modified: {new Date(employee.employment_status_changed_at).toLocaleString()}</span>
                </div>
                {employee?.employment_status_changed_by && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <User className="h-3 w-3" />
                    <span>Changed by: {employee.employment_status_changed_by}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Account Creation Info */}
        <div>
          <label className="text-sm font-medium mb-3 block">Account Information</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Created At</div>
              <div className="text-sm">
                {employee?.created_at ? new Date(employee.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
              <div className="text-sm">
                {employee?.updated_at ? new Date(employee.updated_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}