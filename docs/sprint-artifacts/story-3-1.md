# Story 3.1: Real-time Employee Location Map

Status: Ready for Review

## Story

As an operations manager,
I want to see all field employees' real-time locations on a map,
so that I can monitor team coverage and respond quickly to any issues.

## Acceptance Criteria

1. Given I am logged in as admin/operations manager, when I open the dashboard, then I see a map view with all active employees displayed
2. And each employee is shown as a colored dot on the map
3. And dots refresh every 30 seconds (per performance requirements)
4. And hovering over a dot shows employee name and last update time
5. Given the map is displayed, when I click on an employee dot, then an info panel shows: employee name, check-in time, last location
6. And the employee's path history is highlighted on the map
7. And emergency indicators are shown if applicable
8. Given no employees are currently active, when I view the map, then the map shows appropriate "No active tracking" message
9. And I can still view historical data from previous shifts

## Tasks / Subtasks

- [ ] Task 1: Implement Real-time Employee Location Fetching (AC: 1, 2, 3)
  - [ ] Subtask 1.1: Create getActiveEmployees() method in attendance.service.ts
  - [ ] Subtask 1.2: Query daily_attendance table for records with status = 'CHECKED_IN'
  - [ ] Subtask 1.3: Return employee data with last known location and check-in time
  - [ ] Subtask 1.4: Set up 30-second polling interval in TrackingView component
- [ ] Task 2: Enhance TrackingView Component with Map Display (AC: 1, 2, 4, 8)
  - [ ] Subtask 2.1: Integrate map library (check what's already in use)
  - [ ] Subtask 2.2: Display active employees as colored dots on map
  - [ ] Subtask 2.3: Implement hover tooltips with employee info
  - [ ] Subtask 2.4: Show "No active tracking" message when no employees
- [ ] Task 3: Add Employee Interaction Features (AC: 5, 6, 7)
  - [ ] Subtask 3.1: Handle click events on employee dots
  - [ ] Subtask 3.2: Create employee info panel component
  - [ ] Subtask 3.3: Highlight selected employee's path on map
  - [ ] Subtask 3.4: Show emergency indicators for emergency check-outs
- [ ] Task 4: Implement Location Path Visualization (AC: 6)
  - [ ] Subtask 4.1: Fetch location path data for selected employee
  - [ ] Subtask 4.2: Draw path lines on map connecting location points
  - [ ] Subtask 4.3: Add time markers along the path
  - [ ] Subtask 4.4: Use unique colors per employee for path visualization
- [ ] Task 5: Add Emergency Scenario Indicators (AC: 7)
  - [ ] Subtask 5.1: Identify employees with emergency check-outs
  - [ ] Subtask 5.2: Show special icons or markers for emergency locations
  - [ ] Subtask 5.3: Display emergency reason in info panel
  - [ ] Subtask 5.4: Differentiate between normal and emergency check-outs
- [ ] Task 6: Write Tests for Real-time Map Features
  - [ ] Subtask 6.1: Unit tests for getActiveEmployees() service method
  - [ ] Subtask 6.2: Component tests for TrackingView map display
  - [ ] Subtask 6.3: Integration tests for real-time updates

## Dev Notes

- Use existing location_path JSONB data from daily_attendance table
- Each employee should have a unique color for their path
- Map should center on employee locations or show all in view
- Performance critical: only fetch data that changed since last update
- Emergency check-outs have method field in attendance record

### Project Structure Notes

- apps/web/app/(dashboard)/dashboard/components/TrackingView.tsx (main component)
- apps/web/services/attendance.service.ts (add getActiveEmployees method)
- apps/web/app/api/attendance/ (possibly enhance existing endpoints)
- Use existing shadcn/ui components for info panel
- Check existing map implementation in project

### References

- [Source: docs/architecture.md#Admin Dashboard] - Real-time monitoring requirements
- [Source: docs/epics.md#Epic 3] - Story 3.1 detailed requirements
- [Source: apps/web/app/(dashboard)/dashboard/components/TrackingView.tsx] - Existing component to enhance
- [Source: packages/shared/src/types/attendance.ts] - DailyAttendanceRecord interface

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- apps/web/app/(dashboard)/dashboard/components/TrackingView.tsx (enhance with map)
- apps/web/services/attendance.service.ts (add getActiveEmployees method)
- apps/web/app/(dashboard)/dashboard/components/EmployeeInfoPanel.tsx (new component)
- apps/web/app/(dashboard)/dashboard/components/__tests__/TrackingView.test.tsx (tests)