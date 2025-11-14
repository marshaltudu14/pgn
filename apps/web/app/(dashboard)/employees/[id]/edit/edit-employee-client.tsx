'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useEmployeeStore } from '@/app/lib/stores/employeeStore';
import { useAuthStore } from '@/app/lib/stores/authStore';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Employee, EmploymentStatus } from '@pgn/shared';

const EditEmployeeForm = () => {
  const { updateEmployee } = useEmployeeStore();
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employmentStatus: 'ACTIVE' as EmploymentStatus,
    canLogin: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployeeData = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call to fetch employee by ID
      // const response = await fetch(`/api/employees/${employeeId}`);
      // const data = await response.json();

      // Mock data for now
      const mockEmployee: Employee = {
        id: employeeId,
        humanReadableUserId: 'PGN-2024-0001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '9876543210',
        employmentStatus: 'ACTIVE',
        canLogin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setEmployee(mockEmployee);
      setFormData({
        firstName: mockEmployee.firstName,
        lastName: mockEmployee.lastName,
        email: mockEmployee.email,
        phone: mockEmployee.phone || '',
        employmentStatus: mockEmployee.employmentStatus,
        canLogin: mockEmployee.canLogin,
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      // Handle error - redirect back to employees list
      router.push('/dashboard/employees');
    } finally {
      setLoading(false);
    }
  }, [employeeId, router]);

  // Redirect non-admin users or fetch employee data
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard/employees');
      return;
    }

    // For now, we'll simulate fetching an employee
    // In a real implementation, you would fetch this from the API
    fetchEmployeeData();
  }, [isAdmin, router, employeeId, fetchEmployeeData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (formData.firstName.trim().length > 50) {
      newErrors.firstName = 'First name must be less than 50 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    } else if (formData.lastName.trim().length > 50) {
      newErrors.lastName = 'Last name must be less than 50 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation (optional but validated if provided)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Invalid Indian mobile number format (10 digits starting with 6,7,8,9)';
    }

    // Employment status validation
    if (!formData.employmentStatus) {
      newErrors.employmentStatus = 'Employment status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!employee) return;

    setIsSubmitting(true);

    try {
      const result = await updateEmployee(employeeId, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone || undefined,
        employmentStatus: formData.employmentStatus,
        canLogin: formData.canLogin,
      });

      if (result.success) {
        // Redirect to employees list
        router.push('/dashboard/employees');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/employees');
  };

  if (!isAdmin || loading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="ml-4 text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="text-center">
          <p className="text-gray-600">Employee not found</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-4 py-6 max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Employee</h1>
        <p className="text-gray-600">
          Update employee information for {employee.firstName} {employee.lastName}
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Employee ID: {employee.humanReadableUserId}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name Field */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter employee's first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name Field */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter employee's last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="employee@company.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="9876543210 (Indian mobile number)"
              maxLength={10}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              10-digit Indian mobile number starting with 6, 7, 8, or 9
            </p>
          </div>

          {/* Employment Status Field */}
          <div>
            <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700 mb-2">
              Employment Status *
            </label>
            <select
              id="employmentStatus"
              value={formData.employmentStatus}
              onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.employmentStatus ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="RESIGNED">Resigned</option>
              <option value="TERMINATED">Terminated</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
            {errors.employmentStatus && (
              <p className="mt-1 text-sm text-red-600">{errors.employmentStatus}</p>
            )}
          </div>

          {/* Can Login Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Can Login
            </label>
            <div className="flex items-center">
              <input
                id="canLogin"
                type="checkbox"
                checked={formData.canLogin}
                onChange={(e) => handleInputChange('canLogin', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="canLogin" className="ml-2 text-sm text-gray-900">
                Employee can login to the system
              </label>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Information
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>• Employee User ID: {employee.humanReadableUserId} (cannot be changed)</p>
                  <p>• Data preservation policy: Employee records are never deleted</p>
                  <p>• Changes to employment status will be logged for audit purposes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-white rounded-md transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Employee...
                </span>
              ) : (
                'Update Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default EditEmployeeForm;