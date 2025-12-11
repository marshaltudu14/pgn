/**
 * Retailer Quick View Component
 * Displays a sheet with retailer details and quick actions
 */

'use client';

import { RetailerWithFarmers } from '@pgn/shared';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Edit, Mail, Phone, MapPin, User, Building2, Clock, UserCheck } from 'lucide-react';

interface RetailerQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retailer: RetailerWithFarmers | null;
  onEdit?: (retailer: RetailerWithFarmers) => void;
  hideEditButtons?: boolean;
}

export function RetailerQuickView({
  open,
  onOpenChange,
  retailer,
  onEdit,
  hideEditButtons = false,
}: RetailerQuickViewProps) {
  if (!retailer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto px-4 lg:px-6">
        <SheetHeader>
          <SheetTitle>{retailer.name}</SheetTitle>
          <SheetDescription>
            Complete retailer information and all details
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
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Retailer Name</span>
                <span className="text-gray-900 dark:text-gray-100">{retailer.name}</span>
              </div>
              {retailer.shop_name && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Shop Name</span>
                  <span className="text-gray-900 dark:text-gray-100">{retailer.shop_name}</span>
                </div>
              )}
              {retailer.dealer && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Dealer
                  </span>
                  <div className="text-right">
                    <p className="text-gray-900 dark:text-gray-100">{retailer.dealer.name}</p>
                    {retailer.dealer.shop_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{retailer.dealer.shop_name}</p>
                    )}
                  </div>
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
              {retailer.email && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Email
                  </span>
                  <a
                    href={`mailto:${retailer.email}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-gray-900 dark:text-gray-100"
                  >
                    {retailer.email}
                  </a>
                </div>
              )}
              {retailer.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Phone
                  </span>
                  <a
                    href={`tel:${retailer.phone}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-gray-900 dark:text-gray-100"
                  >
                    {retailer.phone}
                  </a>
                </div>
              )}
              {retailer.address && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 pt-1">
                    <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Address
                  </span>
                  <p className="text-right text-gray-900 dark:text-gray-100 max-w-sm">{retailer.address}</p>
                </div>
              )}
            </div>
          </div>

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
                  {retailer.created_by_employee ? (
                    <div>
                      <p className="text-gray-900 dark:text-gray-100">
                        {retailer.created_by_employee.first_name} {retailer.created_by_employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {retailer.created_by_employee.human_readable_user_id}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(retailer.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })} at {new Date(retailer.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-gray-900 dark:text-gray-100">Admin</span>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(retailer.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })} at {new Date(retailer.created_at).toLocaleTimeString('en-US', {
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
                  {retailer.updated_by_employee ? (
                    <div>
                      <p className="text-gray-900 dark:text-gray-100">
                        {retailer.updated_by_employee.first_name} {retailer.updated_by_employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {retailer.updated_by_employee.human_readable_user_id}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(retailer.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })} at {new Date(retailer.updated_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-gray-900 dark:text-gray-100">Admin</span>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(retailer.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })} at {new Date(retailer.updated_at).toLocaleTimeString('en-US', {
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
              <Button onClick={() => onEdit(retailer)} className="cursor-pointer flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit Retailer
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}