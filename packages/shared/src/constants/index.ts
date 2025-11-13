// Application constants for PGN applications

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',

  // Employee endpoints
  EMPLOYEES: '/api/employees',
  EMPLOYEE_PROFILE: '/api/employees/profile',

  // Attendance endpoints
  CHECK_IN: '/api/attendance/check-in',
  CHECK_OUT: '/api/attendance/check-out',
  ATTENDANCE_RECORDS: '/api/attendance',

  // Location endpoints
  LOCATION_UPDATES: '/api/location/updates',
  PATH_SEGMENTS: '/api/location/path-segments',
} as const;

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const LOCATION_CONFIG = {
  // Movement thresholds in meters
  MOVEMENT_THRESHOLD: 10,
  LOCATION_ACCURACY_THRESHOLD: 50,

  // Update intervals in milliseconds
  LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds
  BACKGROUND_LOCATION_INTERVAL: 300000, // 5 minutes

  // Maximum distance for location validation (in km)
  MAX_LOCATION_DISTANCE: 100,
} as const;

export const APP_CONFIG = {
  APP_NAME: 'PGN Location Tracking',
  APP_VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@pgn.com',

  // Timeouts in milliseconds
  API_TIMEOUT: 10000,
  TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutes before expiry
} as const;