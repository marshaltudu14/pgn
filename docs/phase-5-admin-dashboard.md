# Phase 5: Advanced Admin Dashboard & Management

**Duration:** 1 Week (5-7 working days)
**Team Size:** 2-3 Developers (1 web/frontend, 1 backend, 1 UI/UX)
**Focus:** Comprehensive admin interface with real-time monitoring, analytics, and management capabilities
**Success Criteria:** Fully functional admin dashboard with live map, employee management, analytics, and security monitoring

---

## Phase Overview

Phase 5 creates the comprehensive administrative interface that transforms the PGN system into a complete enterprise management solution. This phase builds upon all previous phases to deliver a sophisticated dashboard that provides real-time monitoring, advanced analytics, employee management, and security oversight capabilities.

## Current State Assessment

### What's Already Completed ✅
- **Authentication System:** Complete JWT authentication with employee management
- **Mobile Attendance App:** Full check-in/out with face recognition and GPS
- **Location Tracking:** Real-time background tracking with path visualization
- **Face Recognition:** Advanced verification with confidence scoring
- **Database Schema:** Complete with rich data for analytics and reporting
- **Basic Admin Interface:** Foundation components and verification queue

### What Needs to be Built 🚧
- **Comprehensive Dashboard Home:** Executive overview with key metrics
- **Enhanced Employee Management:** Advanced CRUD with status management
- **Real-time Analytics:** Attendance, location, and performance analytics
- **Security Monitoring:** Threat detection and incident management
- **Advanced Map Interface:** Enhanced visualization with filtering
- **Reporting System:** Automated reports and data export capabilities

## Detailed Feature Breakdown

### 1. Executive Dashboard Home

#### 1.1 Comprehensive Dashboard Overview
**Requirements:**
- Real-time key performance indicators (KPIs)
- Employee status summary with visual indicators
- Today's attendance statistics and trends
- Security monitoring overview
- Quick access to critical admin functions
- Customizable dashboard widgets and layouts

**Dashboard Home Implementation:**
```javascript
const ExecutiveDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await Promise.all([
          api.dashboard.getKPIs(),
          api.dashboard.getEmployeeStatus(),
          api.dashboard.getTodayAttendance(),
          api.dashboard.getSecurityOverview(),
          api.dashboard.getLocationSummary(),
        ]);

        setDashboardData({
          kpis: data[0],
          employeeStatus: data[1],
          attendance: data[2],
          security: data[3],
          locations: data[4],
        });
      } catch (error) {
        console.error('Dashboard data fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // 30-second refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="executive-dashboard">
      {/* Header with date and quick actions */}
      <DashboardHeader
        title="PGN Executive Dashboard"
        date={new Date()}
        quickActions={[
          { label: 'Add Employee', action: () => navigate('/employees/new') },
          { label: 'View Map', action: () => navigate('/map') },
          { label: 'Security Alerts', action: () => navigate('/security') },
        ]}
      />

      {/* KPI Cards */}
      <div className="kpi-section">
        <KPICards data={dashboardData.kpis} />
      </div>

      {/* Main dashboard grid */}
      <div className="dashboard-grid">
        {/* Employee Status Overview */}
        <div className="grid-item wide">
          <EmployeeStatusOverview data={dashboardData.employeeStatus} />
        </div>

        {/* Today's Attendance */}
        <div className="grid-item">
          <TodayAttendanceWidget data={dashboardData.attendance} />
        </div>

        {/* Security Overview */}
        <div className="grid-item">
          <SecurityOverviewWidget data={dashboardData.security} />
        </div>

        {/* Location Summary */}
        <div className="grid-item">
          <LocationSummaryWidget data={dashboardData.locations} />
        </div>

        {/* Recent Activities */}
        <div className="grid-item full">
          <RecentActivitiesFeed />
        </div>
      </div>
    </div>
  );
};

// KPI Cards Component
const KPICards = ({ data }) => {
  const kpis = [
    {
      title: 'Total Employees',
      value: data.totalEmployees,
      change: data.employeeChange,
      changeType: data.employeeChange > 0 ? 'positive' : 'negative',
      icon: 'users',
      color: '#3b82f6',
    },
    {
      title: 'Currently Checked In',
      value: data.checkedInCount,
      change: data.checkedInChange,
      changeType: data.checkedInChange > 0 ? 'positive' : 'negative',
      icon: 'user-check',
      color: '#10b981',
    },
    {
      title: 'Today\'s Attendance Rate',
      value: `${data.attendanceRate}%`,
      change: data.attendanceRateChange,
      changeType: data.attendanceRateChange > 0 ? 'positive' : 'negative',
      icon: 'calendar-check',
      color: '#f59e0b',
    },
    {
      title: 'Pending Verifications',
      value: data.pendingVerifications,
      change: data.verificationChange,
      changeType: data.verificationChange < 0 ? 'positive' : 'negative',
      icon: 'shield-check',
      color: '#ef4444',
    },
  ];

  return (
    <div className="kpi-cards">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
};
```

#### 1.2 Real-time Data Updates
**Requirements:**
- WebSocket or polling-based real-time updates
- Live employee status changes
- Real-time attendance updates
- Live security alerts
- Performance optimized data fetching

**Real-time Data Service:**
```javascript
class RealTimeDataService {
  constructor() {
    this.subscribers = new Map();
    this.updateInterval = 30000; // 30 seconds
    this.intervalId = null;
  }

  // Subscribe to real-time updates
  subscribe(componentId, callback, dataType) {
    this.subscribers.set(componentId, { callback, dataType });

    if (!this.intervalId) {
      this.startRealTimeUpdates();
    }
  }

  // Unsubscribe from updates
  unsubscribe(componentId) {
    this.subscribers.delete(componentId);

    if (this.subscribers.size === 0 && this.intervalId) {
      this.stopRealTimeUpdates();
    }
  }

  // Start real-time updates
  startRealTimeUpdates() {
    this.intervalId = setInterval(async () => {
      try {
        const updates = await this.fetchRealTimeUpdates();
        this.notifySubscribers(updates);
      } catch (error) {
        console.error('Real-time update failed:', error);
      }
    }, this.updateInterval);
  }

  // Fetch real-time updates
  async fetchRealTimeUpdates() {
    const [employeeStatus, attendanceData, securityAlerts, locationData] = await Promise.all([
      api.dashboard.getRealTimeEmployeeStatus(),
      api.dashboard.getRealTimeAttendance(),
      api.security.getRealTimeAlerts(),
      api.locations.getRealTimeLocations(),
    ]);

    return {
      employeeStatus,
      attendanceData,
      securityAlerts,
      locationData,
      timestamp: new Date().toISOString(),
    };
  }

  // Notify all subscribers
  notifySubscribers(updates) {
    this.subscribers.forEach(({ callback, dataType }) => {
      try {
        callback(updates[dataType] || updates);
      } catch (error) {
        console.error('Subscriber notification failed:', error);
      }
    });
  }
}

// React Hook for Real-time Data
const useRealTimeData = (dataType, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const componentId = `component-${Math.random().toString(36).substr(2, 9)}`;

    const handleUpdate = (updateData) => {
      setData(updateData);
      setLoading(false);
    };

    realTimeService.subscribe(componentId, handleUpdate, dataType);

    return () => {
      realTimeService.unsubscribe(componentId);
    };
  }, dependencies);

  return { data, loading };
};
```

### 2. Advanced Employee Management

#### 2.1 Enhanced Employee CRUD Operations
**Requirements:**
- Advanced employee creation with validation
- Bulk employee operations (import, status updates)
- Employee search and filtering with multiple criteria
- Employment status management workflow
- Photo and reference photo management
- Device and session monitoring

**Employee Management Interface:**
```javascript
const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [filters, setFilters] = useState({
    status: 'ALL',
    department: 'ALL',
    region: 'ALL',
    searchTerm: '',
  });
  const [viewMode, setViewMode] = useState('TABLE'); // TABLE, CARDS

  return (
    <div className="employee-management">
      {/* Header with actions */}
      <div className="management-header">
        <h2>Employee Management</h2>
        <div className="header-actions">
          <Button onClick={() => navigate('/employees/new')}>
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
          <Button variant="outline" onClick={() => navigate('/employees/import')}>
            <Upload className="w-4 h-4" />
            Bulk Import
          </Button>
          <Button variant="outline" onClick={() => exportSelectedEmployees()}>
            <Download className="w-4 h-4" />
            Export Selected
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <EmployeeFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={(term) => setFilters(prev => ({ ...prev, searchTerm: term }))}
      />

      {/* View mode toggle */}
      <div className="view-controls">
        <ViewToggle
          mode={viewMode}
          onModeChange={setViewMode}
        />
        <div className="bulk-actions" style={{ display: selectedEmployees.length > 0 ? 'block' : 'none' }}>
          <span>{selectedEmployees.length} selected</span>
          <Button size="sm" onClick={() => bulkStatusUpdate('ACTIVE')}>
            Activate Selected
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkStatusUpdate('SUSPENDED')}>
            Suspend Selected
          </Button>
        </div>
      </div>

      {/* Employee list */}
      {viewMode === 'TABLE' ? (
        <EmployeeTable
          employees={employees}
          selectedEmployees={selectedEmployees}
          onSelectionChange={setSelectedEmployees}
          onEmployeeEdit={(id) => navigate(`/employees/${id}/edit`)}
          onEmployeeView={(id) => navigate(`/employees/${id}`)}
        />
      ) : (
        <EmployeeCards
          employees={employees}
          selectedEmployees={selectedEmployees}
          onSelectionChange={setSelectedEmployees}
          onEmployeeEdit={(id) => navigate(`/employees/${id}/edit`)}
          onEmployeeView={(id) => navigate(`/employees/${id}`)}
        />
      )}
    </div>
  );
};

// Enhanced Employee Form
const EmployeeForm = ({ employeeId, mode }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employmentStatus: 'ACTIVE',
    primaryRegion: '',
    assignedRegions: [],
    referencePhoto: null,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      const validation = await validateEmployeeForm(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Submit form
      if (mode === 'CREATE') {
        await api.employees.create(formData);
      } else {
        await api.employees.update(employeeId, formData);
      }

      // Navigate back to list
      navigate('/employees');

    } catch (error) {
      console.error('Employee form submission failed:', error);
      showError('Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="employee-form">
      {/* Personal Information */}
      <Section title="Personal Information">
        <div className="form-grid">
          <FormField
            label="First Name"
            value={formData.firstName}
            onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
            error={validationErrors.firstName}
            required
          />
          <FormField
            label="Last Name"
            value={formData.lastName}
            onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
            error={validationErrors.lastName}
            required
          />
          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
            error={validationErrors.email}
          />
          <FormField
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
            error={validationErrors.phone}
          />
        </div>
      </Section>

      {/* Employment Information */}
      <Section title="Employment Information">
        <div className="form-grid">
          <SelectField
            label="Employment Status"
            value={formData.employmentStatus}
            onChange={(value) => setFormData(prev => ({ ...prev, employmentStatus: value }))}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'ON_LEAVE', label: 'On Leave' },
              { value: 'RESIGNED', label: 'Resigned' },
              { value: 'TERMINATED', label: 'Terminated' },
            ]}
          />
          <SelectField
            label="Primary Region"
            value={formData.primaryRegion}
            onChange={(value) => setFormData(prev => ({ ...prev, primaryRegion: value }))}
            options={availableRegions}
          />
        </div>

        <MultiSelectField
          label="Assigned Regions"
          value={formData.assignedRegions}
          onChange={(values) => setFormData(prev => ({ ...prev, assignedRegions: values }))}
          options={availableRegions}
        />
      </Section>

      {/* Reference Photo */}
      <Section title="Reference Photo">
        <PhotoUpload
          value={formData.referencePhoto}
          onChange={(photo) => setFormData(prev => ({ ...prev, referencePhoto: photo }))}
          onQualityCheck={handlePhotoQualityCheck}
          required
        />
      </Section>

      {/* Form Actions */}
      <div className="form-actions">
        <Button type="button" variant="outline" onClick={() => navigate('/employees')}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (mode === 'CREATE' ? 'Create Employee' : 'Update Employee')}
        </Button>
      </div>
    </form>
  );
};
```

### 3. Advanced Analytics and Reporting

#### 3.1 Attendance Analytics Dashboard
**Requirements:**
- Daily, weekly, monthly attendance trends
- Face recognition accuracy metrics
- Check-in/check-out time distribution analysis
- Late arrival and early departure reporting
- Individual employee performance analytics

**Attendance Analytics Implementation:**
```javascript
const AttendanceAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedDepartment, selectedRegion]);

  const fetchAnalyticsData = async () => {
    const data = await api.analytics.getAttendanceAnalytics({
      dateRange,
      department: selectedDepartment,
      region: selectedRegion,
    });

    setAnalyticsData(data);
  };

  if (!analyticsData) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="attendance-analytics">
      {/* Analytics Header */}
      <AnalyticsHeader
        title="Attendance Analytics"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        filters={
          <>
            <DepartmentFilter
              value={selectedDepartment}
              onChange={setSelectedDepartment}
            />
            <RegionFilter
              value={selectedRegion}
              onChange={setSelectedRegion}
            />
          </>
        }
      />

      {/* Analytics Grid */}
      <div className="analytics-grid">
        {/* Attendance Trends Chart */}
        <div className="analytics-item full">
          <AttendanceTrendsChart
            data={analyticsData.trends}
            title="Attendance Trends"
            subtitle={`From ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}`}
          />
        </div>

        {/* Face Recognition Accuracy */}
        <div className="analytics-item half">
          <FaceRecognitionAccuracyChart
            data={analyticsData.faceRecognition}
            title="Face Recognition Performance"
          />
        </div>

        {/* Check-in/Check-out Distribution */}
        <div className="analytics-item half">
          <TimeDistributionChart
            data={analyticsData.timeDistribution}
            title="Check-in/Check-out Distribution"
          />
        </div>

        {/* Employee Performance Table */}
        <div className="analytics-item full">
          <EmployeePerformanceTable
            data={analyticsData.employeePerformance}
            title="Individual Employee Performance"
          />
        </div>

        {/* Regional Analytics */}
        <div className="analytics-item half">
          <RegionalAnalyticsChart
            data={analyticsData.regional}
            title="Regional Attendance Analytics"
          />
        </div>

        {/* Compliance Metrics */}
        <div className="analytics-item half">
          <ComplianceMetricsCard
            data={analyticsData.compliance}
            title="Compliance Metrics"
          />
        </div>
      </div>
    </div>
  );
};

// Custom Chart Components
const AttendanceTrendsChart = ({ data, title, subtitle }) => {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Expected Attendance',
        data: data.map(item => item.expected),
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        fill: true,
      },
      {
        label: 'Actual Attendance',
        data: data.map(item => item.actual),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
      },
      {
        label: 'Late Arrivals',
        data: data.map(item => item.late),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Employees',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>{title}</h3>
        <p className="chart-subtitle">{subtitle}</p>
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
};
```

#### 3.2 Automated Reporting System
**Requirements:**
- Scheduled report generation and distribution
- Custom report builder with drag-and-drop interface
- Multiple export formats (PDF, Excel, CSV)
- Report template management
- Email distribution and notification system

**Reporting System Implementation:**
```javascript
const ReportingSystem = () => {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  return (
    <div className="reporting-system">
      {/* Header */}
      <div className="reporting-header">
        <h2>Reporting & Analytics</h2>
        <div className="header-actions">
          <Button onClick={() => setShowReportBuilder(true)}>
            <Plus className="w-4 h-4" />
            Create Report
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports/scheduled')}>
            <Calendar className="w-4 h-4" />
            Scheduled Reports
          </Button>
        </div>
      </div>

      {/* Quick Reports */}
      <QuickReportsSection />

      {/* Report Templates */}
      <ReportTemplatesSection templates={templates} />

      {/* Recent Reports */}
      <RecentReportsSection reports={reports} />

      {/* Report Builder Modal */}
      {showReportBuilder && (
        <ReportBuilder
          onClose={() => setShowReportBuilder(false)}
          onSave={handleSaveReport}
        />
      )}
    </div>
  );
};

// Report Builder Component
const ReportBuilder = ({ onClose, onSave }) => {
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    template: '',
    dateRange: 'THIS_MONTH',
    filters: {},
    columns: [],
    groupBy: [],
    orderBy: [],
    format: 'PDF',
    recipients: [],
    schedule: null,
  });

  const [availableColumns] = useState([
    { field: 'employee_name', label: 'Employee Name', type: 'text' },
    { field: 'check_in_time', label: 'Check In Time', type: 'datetime' },
    { field: 'check_out_time', label: 'Check Out Time', type: 'datetime' },
    { field: 'work_hours', label: 'Work Hours', type: 'number' },
    { field: 'location_name', label: 'Location', type: 'text' },
    { field: 'face_confidence', label: 'Face Confidence', type: 'percentage' },
    { field: 'battery_level', label: 'Battery Level', type: 'number' },
  ]);

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <div className="report-builder">
        <div className="builder-header">
          <h3>Create Custom Report</h3>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="builder-content">
          {/* Basic Information */}
          <Section title="Report Information">
            <div className="form-grid">
              <FormField
                label="Report Name"
                value={reportConfig.name}
                onChange={(value) => setReportConfig(prev => ({ ...prev, name: value }))}
                required
              />
              <FormField
                label="Description"
                value={reportConfig.description}
                onChange={(value) => setReportConfig(prev => ({ ...prev, description: value }))}
              />
            </div>
          </Section>

          {/* Data Selection */}
          <Section title="Data Selection">
            <SelectField
              label="Report Template"
              value={reportConfig.template}
              onChange={(value) => setReportConfig(prev => ({ ...prev, template: value }))}
              options={[
                { value: 'attendance_summary', label: 'Attendance Summary' },
                { value: 'face_recognition_analytics', label: 'Face Recognition Analytics' },
                { value: 'location_tracking_report', label: 'Location Tracking Report' },
                { value: 'employee_performance', label: 'Employee Performance' },
              ]}
            />

            <DateRangePicker
              label="Date Range"
              value={reportConfig.dateRange}
              onChange={(value) => setReportConfig(prev => ({ ...prev, dateRange: value }))}
            />
          </Section>

          {/* Column Selection */}
          <Section title="Column Selection">
            <DragDropList
              items={availableColumns}
              selectedItems={reportConfig.columns}
              onSelectionChange={(columns) => setReportConfig(prev => ({ ...prev, columns }))}
            />
          </Section>

          {/* Filters and Grouping */}
          <Section title="Filters and Grouping">
            <FilterBuilder
              filters={reportConfig.filters}
              onChange={(filters) => setReportConfig(prev => ({ ...prev, filters }))}
            />

            <GroupByBuilder
              groupBy={reportConfig.groupBy}
              availableFields={availableColumns}
              onChange={(groupBy) => setReportConfig(prev => ({ ...prev, groupBy }))}
            />
          </Section>

          {/* Output and Distribution */}
          <Section title="Output and Distribution">
            <div className="form-grid">
              <SelectField
                label="Export Format"
                value={reportConfig.format}
                onChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
                options={[
                  { value: 'PDF', label: 'PDF' },
                  { value: 'EXCEL', label: 'Excel' },
                  { value: 'CSV', label: 'CSV' },
                ]}
              />

              <EmailRecipientsField
                label="Email Recipients"
                value={reportConfig.recipients}
                onChange={(recipients) => setReportConfig(prev => ({ ...prev, recipients }))}
              />
            </div>

            <ScheduleField
              label="Schedule (Optional)"
              value={reportConfig.schedule}
              onChange={(schedule) => setReportConfig(prev => ({ ...prev, schedule }))}
            />
          </Section>
        </div>

        {/* Actions */}
        <div className="builder-actions">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => handlePreview(reportConfig)}>
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button onClick={() => onSave(reportConfig)}>
            <Save className="w-4 h-4" />
            Save Report
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

### 4. Enhanced Security Monitoring

#### 4.1 Security Dashboard
**Requirements:**
- Real-time security event monitoring
- Threat level indicators and alerting
- Failed authentication tracking
- Geographic anomaly detection
- Device monitoring and access control
- Security incident response workflow

**Security Monitoring Implementation:**
```javascript
const SecurityDashboard = () => {
  const [securityData, setSecurityData] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    const fetchSecurityData = async () => {
      const [overview, alerts, incidents] = await Promise.all([
        api.security.getOverview(),
        api.security.getActiveAlerts(),
        api.security.getRecentIncidents(),
      ]);

      setSecurityData({ overview, incidents });
      setActiveAlerts(alerts);
    };

    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 10000); // 10-second refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="security-dashboard">
      {/* Security Overview */}
      <SecurityOverview data={securityData?.overview} />

      {/* Active Security Alerts */}
      <div className="security-section">
        <div className="section-header">
          <h3>Active Security Alerts</h3>
          <Badge count={activeAlerts.length} />
        </div>
        <SecurityAlertsList
          alerts={activeAlerts}
          onSelect={setSelectedAlert}
          onResolve={handleResolveAlert}
        />
      </div>

      {/* Security Metrics */}
      <div className="security-metrics">
        <div className="metrics-grid">
          <SecurityMetricCard
            title="Failed Logins (24h)"
            value={securityData?.overview.failedLogins || 0}
            trend={securityData?.overview.failedLoginsTrend}
            icon="shield-x"
            color="#ef4444"
          />
          <SecurityMetricCard
            title="Suspicious Activities"
            value={securityData?.overview.suspiciousActivities || 0}
            trend={securityData?.overview.suspiciousActivitiesTrend}
            icon="alert-triangle"
            color="#f59e0b"
          />
          <SecurityMetricCard
            title="Active Sessions"
            value={securityData?.overview.activeSessions || 0}
            trend={securityData?.overview.activeSessionsTrend}
            icon="users"
            color="#10b981"
          />
          <SecurityMetricCard
            title="Blocked Attempts"
            value={securityData?.overview.blockedAttempts || 0}
            trend={securityData?.overview.blockedAttemptsTrend}
            icon="ban"
            color="#6b7280"
          />
        </div>
      </div>

      {/* Security Timeline */}
      <div className="security-section">
        <h3>Security Event Timeline</h3>
        <SecurityTimeline events={securityData?.incidents} />
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <SecurityAlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={handleResolveAlert}
          onEscalate={handleEscalateAlert}
        />
      )}
    </div>
  );
};

// Threat Detection Service
class ThreatDetectionService {
  // Analyze patterns for suspicious activities
  async analyzePatterns(employeeId, timeWindow = '24h') {
    try {
      const data = await Promise.all([
        this.getAuthenticationAttempts(employeeId, timeWindow),
        this.getLocationData(employeeId, timeWindow),
        this.getDeviceUsage(employeeId, timeWindow),
        this.getFaceRecognitionAttempts(employeeId, timeWindow),
      ]);

      const threats = await this.detectThreats({
        authAttempts: data[0],
        locationData: data[1],
        deviceUsage: data[2],
        faceRecAttempts: data[3],
      });

      return {
        employeeId,
        threats,
        riskScore: this.calculateRiskScore(threats),
        recommendations: this.generateRecommendations(threats),
      };

    } catch (error) {
      console.error('Threat analysis failed:', error);
      throw error;
    }
  }

  // Detect specific threat patterns
  async detectThreats(data) {
    const threats = [];

    // Authentication threat detection
    if (data.authAttempts.failed > data.authAttempts.successful * 0.3) {
      threats.push({
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'HIGH',
        description: 'Multiple failed login attempts detected',
        evidence: {
          failedAttempts: data.authAttempts.failed,
          successfulAttempts: data.authAttempts.successful,
          timeWindow: data.authAttempts.timeWindow,
        },
      });
    }

    // Geographic anomaly detection
    if (data.locationData.anomalousJumps) {
      threats.push({
        type: 'IMPOSSIBLE_LOCATION',
        severity: 'CRITICAL',
        description: 'Impossible location changes detected',
        evidence: data.locationData.anomalousJumps,
      });
    }

    // Device fingerprinting threats
    if (data.deviceUsage.unusualDevices) {
      threats.push({
        type: 'UNAUTHORIZED_DEVICE',
        severity: 'MEDIUM',
        description: 'Access from unrecognized devices',
        evidence: data.deviceUsage.unusualDevices,
      });
    }

    // Face recognition threats
    if (data.faceRecAttempts.lowConfidenceRate > 0.5) {
      threats.push({
        type: 'FACE_RECOGNITION_ANOMALY',
        severity: 'MEDIUM',
        description: 'Unusual face recognition confidence pattern',
        evidence: {
          lowConfidenceRate: data.faceRecAttempts.lowConfidenceRate,
          totalAttempts: data.faceRecAttempts.totalAttempts,
        },
      });
    }

    return threats;
  }

  // Calculate overall risk score
  calculateRiskScore(threats) {
    const severityWeights = {
      'LOW': 1,
      'MEDIUM': 3,
      'HIGH': 7,
      'CRITICAL': 10,
    };

    const totalScore = threats.reduce((sum, threat) => {
      return sum + severityWeights[threat.severity];
    }, 0);

    return Math.min(100, totalScore * 2); // Cap at 100
  }
}
```

## Technical Implementation Details

### Dashboard Architecture

#### Component Structure
```
Admin Dashboard/
├── Layout/
│   ├── SidebarNavigation
│   ├── Header
│   └── Footer
├── Dashboard/
│   ├── ExecutiveDashboard
│   ├── KPICards
│   └── RealTimeUpdates
├── EmployeeManagement/
│   ├── EmployeeList
│   ├── EmployeeForm
│   └── BulkOperations
├── Analytics/
│   ├── AttendanceAnalytics
│   ├── LocationAnalytics
│   └── PerformanceReports
├── Security/
│   ├── SecurityDashboard
│   ├── ThreatDetection
│   └── IncidentResponse
└── Settings/
    ├── SystemConfiguration
    └── UserPreferences
```

### State Management

#### Redux Store Structure
```javascript
const adminDashboardStore = {
  dashboard: {
    kpis: {},
    realTimeData: {},
    loading: false,
  },
  employees: {
    list: [],
    selected: [],
    filters: {},
    pagination: {},
  },
  analytics: {
    data: {},
    dateRange: {},
    filters: {},
  },
  security: {
    alerts: [],
    threats: [],
    incidents: [],
  },
  ui: {
    sidebarCollapsed: false,
    theme: 'light',
    notifications: [],
  },
};
```

## Success Criteria

### Functional Requirements
✅ Comprehensive executive dashboard with real-time KPIs
✅ Advanced employee management with bulk operations
✅ Detailed analytics and reporting capabilities
✅ Real-time security monitoring and threat detection
✅ Custom report builder with scheduling
✅ Mobile-responsive design for tablet access

### Performance Requirements
- Dashboard loading time under 3 seconds
- Real-time data updates within 30 seconds
- Analytics report generation under 10 seconds
- Employee search and filtering under 1 second
- Map rendering with 100+ employees under 2 seconds

### User Experience Requirements
- Intuitive navigation with clear information hierarchy
- Customizable dashboard layouts and widgets
- Responsive design for desktop and tablet access
- Keyboard shortcuts for power users
- Contextual help and documentation

## Testing Strategy

### Dashboard Testing
- Cross-browser compatibility testing
- Mobile and tablet responsiveness testing
- Performance testing with large datasets
- Real-time data update reliability
- User interaction and usability testing

### Analytics Testing
- Data accuracy validation across all reports
- Chart rendering and interaction testing
- Export functionality testing (PDF, Excel, CSV)
- Scheduled report generation testing
- Custom report builder functionality

### Security Testing
- Access control and permission testing
- Data visualization security
- Security alert accuracy testing
- Incident response workflow testing
- Audit trail completeness verification

## Risk Mitigation

### Technical Risks
1. **Performance Issues:** Implement data pagination, lazy loading, and caching
2. **Real-time Updates:** Use efficient polling strategies and data optimization
3. **Data Accuracy:** Implement comprehensive validation and testing procedures
4. **Cross-browser Issues:** Thorough testing across target browsers

### Business Risks
1. **User Adoption:** Comprehensive training and intuitive interface design
2. **Data Overload:** Customizable dashboards with relevant KPIs
3. **Security Concerns:** Robust access control and audit logging
4. **Maintenance Burden:** Automated testing and monitoring systems

## Dependencies & Prerequisites

### Phase Dependencies
- **Phase 4 Complete:** Face recognition system with accuracy data
- **Phase 3 Complete:** Location tracking with path data
- **Phase 2 Complete:** Attendance data and verification status
- **Phase 1 Complete:** Employee management and authentication

### External Dependencies
- Chart libraries for data visualization
- Export libraries for report generation
- Email service for report distribution
- Monitoring and analytics tools

## Handoff to Phase 6

### Deliverables for Next Phase
1. **Complete Admin Dashboard:** Full management interface with all features
2. **Analytics System:** Comprehensive reporting and data visualization
3. **Security Monitoring:** Real-time threat detection and incident management
4. **Employee Management:** Advanced CRUD with bulk operations
5. **Custom Reporting:** Flexible report builder with scheduling

### Preparation Checklist
- [ ] All dashboard features fully functional
- [ ] Analytics data accuracy validated
- [ ] Security monitoring operational
- [ ] Mobile responsive design tested
- [ ] User acceptance testing completed
- [ ] Phase 6 security enhancement requirements understood

---

## Phase Review Process

### Review Criteria
1. **Dashboard Functionality:** All features working as specified
2. **User Experience:** Intuitive interface with smooth interactions
3. **Data Accuracy:** Analytics and reporting data validation
4. **Performance:** Loading times and responsiveness within limits
5. **Security:** Access control and monitoring properly implemented

### Review Deliverables
1. **Dashboard Performance Report:** Load times, responsiveness metrics
2. **User Testing Results:** Feedback and usability assessment
3. **Data Validation Report:** Analytics accuracy verification
4. **Security Assessment:** Access control and monitoring effectiveness
5. **Phase 6 Readiness Assessment:** Preparation for security enhancements

### Approval Requirements
- All dashboard features tested and approved
- User acceptance testing completed successfully
- Performance benchmarks met or exceeded
- Security measures validated and approved
- Stakeholder approval of interface and functionality