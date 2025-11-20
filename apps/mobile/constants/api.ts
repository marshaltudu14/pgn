// ============================================================================
// API CONSTANTS
// ============================================================================

/**
 * Base URL for the PGN mobile app API
 * Uses local IP address during development for mobile connectivity, production URL otherwise
 * For physical device testing, ensure both device and dev machine are on the same WiFi network
 */
function getApiBaseUrl(): string {
  if (__DEV__) {
    // For development, use local IP address for mobile connectivity
    // You may need to update this IP address to match your development machine
    return 'http://192.168.31.23:3000';
  } else {
    // Production URL
    return 'https://pgnwork.com';
  }
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * API endpoints for all application features
 * Only includes routes that exist in the PGN API and are currently implemented
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  LOGIN: "/auth/login",
  REFRESH_TOKEN: "/auth/refresh",
  LOGOUT: "/auth/logout",
  GET_USER: "/employees/me",

  // Employee endpoints
  EMPLOYEES: "/employees",
  EMPLOYEE_BY_ID: "/employees", // Base for /employees/[id]

  // Attendance endpoints
  ATTENDANCE_CHECKIN: "/attendance/checkin",
  ATTENDANCE_CHECKOUT: "/attendance/checkout",
  ATTENDANCE_STATUS: "/attendance/status",

  // Note: Face recognition endpoints will be added in Phase 4
  // GENERATE_FACE_EMBEDDING: "/face-recognition/generate-embedding", // TODO: Add in Phase 4
} as const;

/**
 * Build full API URL
 */
export function buildApiUrl(endpoint: string): string {
  return `${API_BASE_URL}/api${endpoint}`;
}

/**
 * Common request headers for API calls
 */
export const API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;

/**
 * Get API headers for mobile requests
 */
export function getApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    ...API_HEADERS,
    // Add mobile app identification header
    "x-client-info": "pgn-mobile-client",
    // Add user agent for debugging
    "User-Agent": "PGN-Mobile/1.0",
  };

  return headers;
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl,
  API_HEADERS,
  getApiHeaders,
};