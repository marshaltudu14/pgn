/**
 * Employee Form Types
 */

import { EmploymentStatus, CityAssignment } from '@pgn/shared';

export type EmployeeFormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employment_status: EmploymentStatus;
  can_login: boolean;
  assigned_cities: CityAssignment[];
  password?: string;
  confirm_password?: string;
};