/**
 * Dealer Quick View Component
 * Displays a sheet with dealer details and quick actions
 */

'use client';

import { DealerWithRetailers } from '@pgn/shared';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Edit, Mail, Phone, MapPin, User, Clock, UserCheck, Briefcase } from 'lucide-react';

interface DealerQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealer: DealerWithRetailers | null;
  onEdit?: (dealer: DealerWithRetailers) => void;
  hideEditButtons?: boolean;
}

export function DealerQuickView({
  open,
  onOpenChange,
  dealer,
  onEdit,
  hideEditButtons = false,
}: DealerQuickViewProps) {
  if (!dealer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto px-4 lg:px-6">
        <SheetHeader>
          <SheetTitle>{dealer.name}</SheetTitle>
          <SheetDescription>
            Complete dealer information and all details
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <User className="h-5 w-5" />
              Basic Information
            </h3>
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Dealer Name</span>
                <span className="text-gray-900 dark:text-gray-100">{dealer.name}</span>
              </div>
              {dealer.shop_name && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    Shop Name
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">{dealer.shop_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Mail className="h-5 w-5" />
              Contact Information
            </h3>
            <div className="space-y-3 p-4 border rounded-lg">
              {dealer.email && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Email
                  </span>
                  <a
                    href={`mailto:${dealer.email}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-gray-900 dark:text-gray-100"
                  >
                    {dealer.email}
                  </a>
                </div>
              )}
              {dealer.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Phone
                  </span>
                  <a
                    href={`tel:${dealer.phone}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-gray-900 dark:text-gray-100"
                  >
                    {dealer.phone}
                  </a>
                </div>
              )}
              {dealer.address && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 pt-1">
                    <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Address
                  </span>
                  <p className="text-right text-gray-900 dark:text-gray-100 max-w-sm">{dealer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Region Information */}
          {dealer.region && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <MapPin className="h-5 w-5" />
                Region
              </h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {dealer.region.city}, {dealer.region.state}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Clock className="h-5 w-5" />
              System Information
            </h3>
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  Created By
                </span>
                <div className="text-right">
                  {dealer.created_by_employee ? (
                    <div>
                      <p className="text-gray-900 dark:text-gray-100">
                        {dealer.created_by_employee.first_name} {dealer.created_by_employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {dealer.created_by_employee.human_readable_user_id}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(dealer.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })} at {new Date(dealer.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-gray-900 dark:text-gray-100">Admin</span>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(dealer.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })} at {new Date(dealer.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <UserCheck className="h-4 w-4" />
                  Last Updated By
                </span>
                <div className="text-right">
                  {dealer.updated_by_employee ? (
                    <div>
                      <p className="text-gray-900 dark:text-gray-100">
                        {dealer.updated_by_employee.first_name} {dealer.updated_by_employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {dealer.updated_by_employee.human_readable_user_id}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(dealer.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })} at {new Date(dealer.updated_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-gray-900 dark:text-gray-100">Admin</span>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(dealer.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })} at {new Date(dealer.updated_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer flex-1">
              Close
            </Button>
            {!hideEditButtons && onEdit && (
              <Button onClick={() => onEdit(dealer)} className="cursor-pointer flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit Dealer
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}