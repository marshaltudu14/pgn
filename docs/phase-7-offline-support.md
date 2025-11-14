# Phase 7: Offline Support & Data Synchronization

**Duration:** 1 Week (5-7 working days)
**Team Size:** 2-3 Developers (1 mobile specialist, 1 backend, 1 sync specialist)
**Focus:** Offline-first capabilities with robust data synchronization and offline face recognition
**Success Criteria:** Complete offline functionality with automatic data sync and offline face recognition

---

## Phase Overview

Phase 7 transforms the PGN system into a truly offline-first application that can function seamlessly without internet connectivity. This phase implements local data storage, offline face recognition capabilities, automatic synchronization when connectivity is restored, and robust conflict resolution mechanisms to ensure data integrity and reliability.

## Current State Assessment

### What's Already Completed ✅
- **Complete Mobile App:** Full attendance functionality with face recognition
- **Location Tracking:** Real-time background tracking with path visualization
- **Security Framework:** Comprehensive audit logging and threat detection
- **Database Schema:** Complete with offline-ready structure
- **SQLite Foundation:** Local database configured in Phase 0
- **Basic Offline Handling:** Simple offline queue for some operations

### What Needs to be Built 🚧
- **Comprehensive Local Storage:** Encrypted SQLite with complete data schemas
- **Offline Face Recognition:** On-device processing with local embeddings
- **Robust Sync Engine:** Automatic synchronization with conflict resolution
- **Offline User Experience:** Clear offline status indicators and guidance
- **Emergency Handling:** Offline emergency check-out scenarios
- **Data Integrity:** Validation and reconciliation mechanisms

## Detailed Feature Breakdown

### 1. Comprehensive Local Data Storage

#### 1.1 Encrypted SQLite Database Implementation
**Requirements:**
- Complete local database schema mirroring server structure
- Encrypted storage for sensitive data (photos, biometrics)
- Efficient data compression for storage optimization
- Database migration and versioning support
- Data integrity validation and corruption detection

**Local Database Implementation:**
```javascript
class LocalDatabaseService {
  constructor() {
    this.db = null;
    this.dbName = 'pgn_offline.db';
    this.encryptionKey = null;
    this.isInitialized = false;
  }

  // Initialize local database
  async initialize() {
    try {
      // Get or create encryption key
      this.encryptionKey = await this.getOrCreateEncryptionKey();

      // Open encrypted database
      this.db = await this.openEncryptedDatabase();

      // Enable foreign key constraints
      await this.db.execute(`
        PRAGMA foreign_keys = ON;
      `);

      // Enable WAL mode for better performance
      await this.db.execute(`
        PRAGMA journal_mode = WAL;
      `);

      // Create tables
      await this.createTables();

      // Create indexes
      await this.createIndexes();

      // Validate database integrity
      await this.validateDatabaseIntegrity();

      this.isInitialized = true;
      console.log('Local database initialized successfully');

    } catch (error) {
      console.error('Local database initialization failed:', error);
      throw error;
    }
  }

  // Open encrypted database
  async openEncryptedDatabase() {
    const db = await SQLite.openDatabase(this.dbName);

    // Set up encryption pragma
    await db.execute(`
      PRAGMA cipher_compatibility = 4;
      PRAGMA cipher_page_size = 4096;
      PRAGMA kdf_iter = 256000;
      PRAGMA cipher_hmac_algorithm = HMAC_SHA512;
      PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512;
    `);

    // Set encryption key
    const keyHex = Buffer.from(this.encryptionKey, 'base64').toString('hex');
    await db.execute(`
      PRAGMA key = '${keyHex}';
    `);

    return db;
  }

  // Create local tables
  async createTables() {
    const tables = [
      // Employees table (synced from server)
      `
        CREATE TABLE IF NOT EXISTS employees (
          id TEXT PRIMARY KEY,
          human_readable_user_id TEXT UNIQUE,
          first_name TEXT,
          last_name TEXT,
          email TEXT,
          phone TEXT,
          employment_status TEXT,
          face_embedding BLOB,
          reference_photo_data BLOB,
          embedding_version TEXT,
          assigned_regions TEXT,
          primary_region TEXT,
          is_active BOOLEAN DEFAULT 1,
          last_sync_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,

      // Daily attendance table (created locally, synced to server)
      `
        CREATE TABLE IF NOT EXISTS daily_attendance (
          id TEXT PRIMARY KEY,
          employee_id TEXT,
          attendance_date DATE,
          check_in_timestamp DATETIME,
          check_in_latitude REAL,
          check_in_longitude REAL,
          check_in_location_name TEXT,
          check_in_selfie_data BLOB,
          check_in_face_confidence REAL,
          check_in_liveness_score REAL,
          check_out_timestamp DATETIME,
          check_out_latitude REAL,
          check_out_longitude REAL,
          check_out_location_name TEXT,
          check_out_selfie_data BLOB,
          check_out_face_confidence REAL,
          check_out_liveness_score REAL,
          check_out_method TEXT,
          check_out_reason TEXT,
          total_work_hours REAL,
          total_distance_meters REAL,
          verification_status TEXT DEFAULT 'PENDING',
          verified_by TEXT,
          verified_at DATETIME,
          verification_notes TEXT,
          sync_status TEXT DEFAULT 'PENDING',
          sync_error TEXT,
          last_sync_attempt DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
      `,

      // Location points table (for offline tracking)
      `
        CREATE TABLE IF NOT EXISTS location_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          attendance_id TEXT,
          timestamp DATETIME,
          latitude REAL,
          longitude REAL,
          accuracy REAL,
          battery_level INTEGER,
          speed REAL,
          sync_status TEXT DEFAULT 'PENDING',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (attendance_id) REFERENCES daily_attendance(id)
        )
      `,

      // Sync queue table
      `
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          operation_type TEXT,
          table_name TEXT,
          record_id TEXT,
          data BLOB,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          retry_count INTEGER DEFAULT 0,
          last_retry_at DATETIME,
          sync_status TEXT DEFAULT 'PENDING',
          sync_error TEXT,
          priority INTEGER DEFAULT 1
        )
      `,

      // Offline audit log
      `
        CREATE TABLE IF NOT EXISTS audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          event_type TEXT,
          user_id TEXT,
          action TEXT,
          details TEXT,
          sync_status TEXT DEFAULT 'PENDING'
        )
      `,
    ];

    for (const tableSQL of tables) {
      await this.db.execute(tableSQL);
    }
  }

  // Store encrypted data
  async storeEncryptedData(table, recordId, data, sensitiveFields = []) {
    try {
      const encryptedRecord = { ...data };

      // Encrypt sensitive fields
      for (const field of sensitiveFields) {
        if (data[field]) {
          encryptedRecord[field] = await this.encryptField(data[field]);
          encryptedRecord[`${field}_encrypted`] = true;
        }
      }

      const columns = Object.keys(encryptedRecord).join(', ');
      const placeholders = Object.keys(encryptedRecord).map(() => '?').join(', ');
      const values = Object.values(encryptedRecord);

      await this.db.execute(`
        INSERT OR REPLACE INTO ${table} (${columns})
        VALUES (${placeholders})
      `, values);

    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      throw error;
    }
  }

  // Retrieve and decrypt data
  async retrieveDecryptedData(table, recordId, sensitiveFields = []) {
    try {
      const result = await this.db.execute(`
        SELECT * FROM ${table} WHERE id = ?
      `, [recordId]);

      if (result.rows.length === 0) {
        return null;
      }

      const record = result.rows.item(0);
      const decryptedRecord = { ...record };

      // Decrypt sensitive fields
      for (const field of sensitiveFields) {
        if (record[`${field}_encrypted`] && record[field]) {
          decryptedRecord[field] = await this.decryptField(record[field]);
          delete decryptedRecord[`${field}_encrypted`];
        }
      }

      return decryptedRecord;

    } catch (error) {
      console.error('Failed to retrieve decrypted data:', error);
      throw error;
    }
  }
}
```

#### 1.2 Local Data Validation and Integrity
**Requirements:**
- Data consistency validation
- Corruption detection and recovery
- Referential integrity enforcement
- Data compression and optimization
- Storage usage monitoring and cleanup

**Data Validation Service:**
```javascript
class DataValidationService {
  // Validate local database integrity
  async validateDatabaseIntegrity() {
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {},
    };

    try {
      // Check referential integrity
      await this.checkReferentialIntegrity(validationResults);

      // Check data consistency
      await this.checkDataConsistency(validationResults);

      // Check for data corruption
      await this.checkDataCorruption(validationResults);

      // Generate statistics
      validationResults.statistics = await this.generateDatabaseStatistics();

    } catch (error) {
      console.error('Database integrity validation failed:', error);
      validationResults.isValid = false;
      validationResults.errors.push({
        type: 'VALIDATION_ERROR',
        message: error.message,
      });
    }

    return validationResults;
  }

  // Check referential integrity
  async checkReferentialIntegrity(results) {
    // Check attendance records have valid employee IDs
    const orphanedAttendance = await this.db.execute(`
      SELECT COUNT(*) as count FROM daily_attendance d
      LEFT JOIN employees e ON d.employee_id = e.id
      WHERE e.id IS NULL
    `);

    if (orphanedAttendance.rows.item(0).count > 0) {
      results.errors.push({
        type: 'REFERENTIAL_INTEGRITY_VIOLATION',
        table: 'daily_attendance',
        count: orphanedAttendance.rows.item(0).count,
        message: 'Found attendance records with invalid employee IDs',
      });
      results.isValid = false;
    }

    // Check location points have valid attendance IDs
    const orphanedLocations = await this.db.execute(`
      SELECT COUNT(*) as count FROM location_points l
      LEFT JOIN daily_attendance d ON l.attendance_id = d.id
      WHERE d.id IS NULL
    `);

    if (orphanedLocations.rows.item(0).count > 0) {
      results.errors.push({
        type: 'REFERENTIAL_INTEGRITY_VIOLATION',
        table: 'location_points',
        count: orphanedLocations.rows.item(0).count,
        message: 'Found location points with invalid attendance IDs',
      });
      results.isValid = false;
    }
  }

  // Repair database integrity issues
  async repairDatabaseIntegrity(issues) {
    const repairResults = [];

    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'REFERENTIAL_INTEGRITY_VIOLATION':
            await this.repairReferentialIntegrity(issue);
            repairResults.push({
              type: issue.type,
              status: 'REPAIRED',
              details: `Removed ${issue.count} orphaned records from ${issue.table}`,
            });
            break;

          case 'DATA_CORRUPTION':
            await this.repairDataCorruption(issue);
            repairResults.push({
              type: issue.type,
              status: 'REPAIRED',
              details: `Repaired corrupted data in ${issue.table}`,
            });
            break;

          default:
            repairResults.push({
              type: issue.type,
              status: 'SKIPPED',
              details: 'Unknown issue type, cannot repair automatically',
            });
        }
      } catch (error) {
        repairResults.push({
          type: issue.type,
          status: 'FAILED',
          error: error.message,
        });
      }
    }

    return repairResults;
  }
}
```

### 2. Offline Face Recognition System

#### 2.1 On-Device Face Recognition
**Requirements:**
- Local face embedding storage and synchronization
- Offline confidence scoring with server validation
- Local photo processing and analysis
- Anti-spoofing protection without network
- Embedding version control and validation
- Performance optimization for on-device processing

**Offline Face Recognition Implementation:**
```javascript
class OfflineFaceRecognitionService {
  constructor() {
    this.model = null;
    this.localEmbeddings = new Map();
    this.isInitialized = false;
  }

  // Initialize offline face recognition
  async initialize() {
    try {
      // Initialize TensorFlow Lite model
      await this.initializeModel();

      // Load local face embeddings
      await this.loadLocalEmbeddings();

      // Sync embeddings from server if online
      if (await this.isOnline()) {
        await this.syncEmbeddingsFromServer();
      }

      this.isInitialized = true;
      console.log('Offline face recognition initialized');

    } catch (error) {
      console.error('Offline face recognition initialization failed:', error);
      throw error;
    }
  }

  // Load local face embeddings
  async loadLocalEmbeddings() {
    try {
      const result = await this.localDB.execute(`
        SELECT id, face_embedding, embedding_version, embedding_updated_at
        FROM employees
        WHERE face_embedding IS NOT NULL
        AND is_active = 1
      `);

      for (let i = 0; i < result.rows.length; i++) {
        const employee = result.rows.item(i);
        this.localEmbeddings.set(employee.id, {
          embedding: new Float32Array(employee.face_embedding),
          version: employee.embedding_version,
          updatedAt: employee.embedding_updated_at,
        });
      }

      console.log(`Loaded ${result.rows.length} local face embeddings`);

    } catch (error) {
      console.error('Failed to load local embeddings:', error);
      throw error;
    }
  }

  // Perform offline face recognition
  async recognizeFace(employeeId, imageUri) {
    try {
      if (!this.isInitialized) {
        throw new Error('Face recognition not initialized');
      }

      // Get reference embedding for employee
      const referenceEmbedding = this.localEmbeddings.get(employeeId);
      if (!referenceEmbedding) {
        throw new Error('No reference embedding found for employee');
      }

      // Generate embedding from captured photo
      const capturedEmbedding = await this.generateEmbedding(imageUri);

      // Calculate similarity score
      const similarity = this.calculateSimilarity(
        referenceEmbedding.embedding,
        capturedEmbedding
      );

      const confidence = Math.max(0, Math.min(100, similarity * 100));

      // Create recognition result
      const result = {
        success: confidence > 70, // Minimum threshold for offline processing
        confidence: confidence,
        requiresValidation: confidence < 90,
        needsServerValidation: true, // Always need server validation when online
        processingTime: Date.now(),
        localProcessing: true,
        embeddingGenerated: true,
      };

      // Store recognition attempt for sync
      await this.storeRecognitionAttempt({
        employeeId: employeeId,
        imageUri: imageUri,
        confidence: confidence,
        result: result,
        timestamp: new Date().toISOString(),
        offlineMode: true,
      });

      return result;

    } catch (error) {
      console.error('Offline face recognition failed:', error);
      return {
        success: false,
        requiresManualVerification: true,
        error: error.message,
        offlineMode: true,
        needsServerValidation: false,
      };
    }
  }

  // Validate embeddings with server when online
  async validateWithServer(employeeId, offlineResult) {
    try {
      if (!await this.isOnline()) {
        return {
          validated: false,
          reason: 'Offline - cannot validate with server',
        };
      }

      const validationResult = await api.faceRecognition.validateOfflineResult({
        employeeId: employeeId,
        offlineConfidence: offlineResult.confidence,
        imageUri: offlineResult.imageUri,
        timestamp: offlineResult.timestamp,
        deviceInfo: await this.getDeviceInfo(),
      });

      // Update local result with server validation
      offlineResult.serverValidation = validationResult;
      offlineResult.validated = true;

      // Update local embeddings if server has newer version
      if (validationResult.newEmbeddingAvailable) {
        await this.updateLocalEmbedding(employeeId, validationResult.newEmbedding);
      }

      return validationResult;

    } catch (error) {
      console.error('Server validation failed:', error);
      return {
        validated: false,
        reason: 'Server validation error: ' + error.message,
        error: error.message,
      };
    }
  }

  // Sync embeddings from server
  async syncEmbeddingsFromServer() {
    try {
      const serverEmbeddings = await api.faceRecognition.getAllEmbeddings({
        lastSync: this.getLastEmbeddingSyncTime(),
      });

      let updatedCount = 0;

      for (const embedding of serverEmbeddings) {
        const localVersion = this.localEmbeddings.get(embedding.employeeId);

        // Update if server version is newer
        if (!localVersion || embedding.version > localVersion.version) {
          this.localEmbeddings.set(embedding.employeeId, {
            embedding: new Float32Array(embedding.embedding),
            version: embedding.version,
            updatedAt: embedding.updatedAt,
          });

          // Update local database
          await this.updateLocalDatabaseEmbedding(embedding);
          updatedCount++;
        }
      }

      // Update last sync time
      this.setLastEmbeddingSyncTime(new Date().toISOString());

      console.log(`Synced ${updatedCount} embeddings from server`);

      return {
        success: true,
        updatedCount: updatedCount,
        totalEmbeddings: serverEmbeddings.length,
      };

    } catch (error) {
      console.error('Embedding sync failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate face embedding locally
  async generateEmbedding(imageUri) {
    try {
      // Preprocess image
      const preprocessedImage = await this.preprocessImage(imageUri);

      // Generate embedding using TensorFlow Lite
      const embedding = await this.model.predict(preprocessedImage);

      // Convert to Float32Array
      const embeddingArray = await embedding.data();
      const float32Array = new Float32Array(embeddingArray);

      // Clean up tensors
      preprocessedImage.dispose();
      embedding.dispose();

      return float32Array;

    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  // Calculate similarity between embeddings
  calculateSimilarity(embedding1, embedding2) {
    // Cosine similarity calculation
    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const norm1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (norm1 * norm2);
  }
}
```

### 3. Robust Synchronization Engine

#### 3.1 Intelligent Sync Service
**Requirements:**
- Automatic sync on connection restoration
- Conflict detection and resolution
- Batch processing for efficiency
- Retry mechanisms with exponential backoff
- Priority-based sync queue management
- Comprehensive sync status tracking

**Synchronization Engine Implementation:**
```javascript
class SynchronizationEngine {
  constructor() {
    this.syncQueue = [];
    this.isOnline = false;
    this.isSyncing = false;
    this.retryIntervals = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff
    this.maxRetries = 5;
    this.syncStats = {
      totalOperations: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsResolved: 0,
    };
  }

  // Initialize sync engine
  async initialize() {
    try {
      // Load pending sync operations
      await this.loadPendingOperations();

      // Start connectivity monitoring
      this.startConnectivityMonitoring();

      // Process sync queue if online
      if (await this.checkConnectivity()) {
        await this.processSyncQueue();
      }

      console.log('Synchronization engine initialized');

    } catch (error) {
      console.error('Sync engine initialization failed:', error);
      throw error;
    }
  }

  // Add operation to sync queue
  async addToSyncQueue(operation, priority = 1) {
    const syncOperation = {
      id: generateUUID(),
      operation: operation,
      priority: priority,
      created_at: new Date().toISOString(),
      retry_count: 0,
      last_retry: null,
      sync_status: 'PENDING',
      sync_error: null,
    };

    // Insert into local database
    await this.localDB.execute(`
      INSERT INTO sync_queue (operation_type, table_name, record_id, data, priority, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      operation.type,
      operation.table,
      operation.recordId,
      JSON.stringify(operation.data),
      priority,
      syncOperation.created_at,
    ]);

    // Try immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      await this.processSyncQueue();
    }

    return syncOperation.id;
  }

  // Process sync queue
  async processSyncQueue() {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;

    try {
      // Get pending operations by priority
      const pendingOperations = await this.localDB.execute(`
        SELECT * FROM sync_queue
        WHERE sync_status = 'PENDING'
        OR (sync_status = 'FAILED' AND retry_count < ?)
        ORDER BY priority DESC, created_at ASC
        LIMIT 50
      `, [this.maxRetries]);

      console.log(`Processing ${pendingOperations.rows.length} sync operations`);

      // Process operations in batches
      for (let i = 0; i < pendingOperations.rows.length; i++) {
        const operation = pendingOperations.rows.item(i);
        await this.processSyncOperation(operation);
      }

      this.syncStats.totalOperations += pendingOperations.rows.length;

    } catch (error) {
      console.error('Sync queue processing failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Process individual sync operation
  async processSyncOperation(syncOperation) {
    try {
      const operation = JSON.parse(syncOperation.data);

      let result;
      switch (operation.type) {
        case 'CREATE':
        case 'UPDATE':
          result = await this.syncCreateUpdateOperation(operation);
          break;
        case 'DELETE':
          result = await this.syncDeleteOperation(operation);
          break;
        case 'ATTENDANCE':
          result = await this.syncAttendanceOperation(operation);
          break;
        case 'LOCATION':
          result = await this.syncLocationOperation(operation);
          break;
        default:
          throw new Error(`Unknown sync operation type: ${operation.type}`);
      }

      // Mark as successful
      await this.markSyncSuccess(syncOperation.id, result);

      this.syncStats.successfulSyncs++;

    } catch (error) {
      console.error(`Sync operation failed (${syncOperation.id}):`, error);

      // Handle sync failure
      await this.handleSyncFailure(syncOperation, error);

      this.syncStats.failedSyncs++;
    }
  }

  // Sync attendance operation with conflict resolution
  async syncAttendanceOperation(operation) {
    try {
      const localAttendance = operation.data;

      // Check if record exists on server
      const serverResponse = await api.attendance.getAttendanceRecord(
        operation.recordId
      );

      if (serverResponse.exists) {
        // Conflict detected - resolve conflict
        const resolvedData = await this.resolveAttendanceConflict(
          localAttendance,
          serverResponse.data
        );

        if (resolvedData.useServerData) {
          // Server data takes precedence, update local
          await this.updateLocalAttendance(
            operation.recordId,
            serverResponse.data
          );
        } else {
          // Local data takes precedence, update server
          await api.attendance.updateAttendance(
            operation.recordId,
            resolvedData.data
          );
        }

        this.syncStats.conflictsResolved++;
        return { conflict: true, resolution: resolvedData.resolution };

      } else {
        // No conflict, create on server
        const result = await api.attendance.createAttendance(localAttendance);
        return { created: true, serverId: result.id };
      }

    } catch (error) {
      // Check if this is a network error
      if (this.isNetworkError(error)) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw error;
    }
  }

  // Resolve attendance conflicts
  async resolveAttendanceConflict(localData, serverData) {
    const resolution = {
      conflict: true,
      useServerData: false,
      resolution: '',
      mergedData: {},
    };

    // Conflict resolution strategies
    const conflicts = this.detectAttendanceConflicts(localData, serverData);

    if (conflicts.length === 0) {
      // No actual conflicts, merge data
      resolution.useServerData = false;
      resolution.resolution = 'MERGED';
      resolution.mergedData = this.mergeAttendanceData(localData, serverData);
    } else if (conflicts.includes('TIMESTAMP_CONFLICT')) {
      // Timestamp conflict - use most recent
      const localTime = new Date(localData.timestamp);
      const serverTime = new Date(serverData.timestamp);

      if (serverTime > localTime) {
        resolution.useServerData = true;
        resolution.resolution = 'SERVER_TIMESTAMP_NEWER';
      } else {
        resolution.useServerData = false;
        resolution.resolution = 'LOCAL_TIMESTAMP_NEWER';
      }
    } else if (conflicts.includes('PHOTO_CONFLICT')) {
      // Photo conflict - prefer higher confidence score
      if (serverData.face_confidence > localData.face_confidence) {
        resolution.useServerData = true;
        resolution.resolution = 'SERVER_CONFIDENCE_HIGHER';
      } else {
        resolution.useServerData = false;
        resolution.resolution = 'LOCAL_CONFIDENCE_HIGHER';
      }
    } else {
      // Default to server data for safety
      resolution.useServerData = true;
      resolution.resolution = 'DEFAULT_TO_SERVER';
    }

    return resolution;
  }

  // Handle sync failure with retry logic
  async handleSyncFailure(syncOperation, error) {
    const retryCount = syncOperation.retry_count + 1;

    if (retryCount >= this.maxRetries) {
      // Max retries reached, mark as permanently failed
      await this.markSyncFailed(syncOperation.id, error);
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = this.retryIntervals[Math.min(retryCount - 1, this.retryIntervals.length - 1)];
      const nextRetry = new Date(Date.now() + retryDelay).toISOString();

      await this.localDB.execute(`
        UPDATE sync_queue
        SET retry_count = ?, last_retry = ?, sync_status = 'FAILED', sync_error = ?
        WHERE id = ?
      `, [retryCount, nextRetry, error.message, syncOperation.id]);

      // Schedule retry
      setTimeout(() => {
        this.processSyncQueue();
      }, retryDelay);
    }
  }

  // Monitor connectivity
  startConnectivityMonitoring() {
    // Check connectivity every 30 seconds
    setInterval(async () => {
      const isCurrentlyOnline = await this.checkConnectivity();

      if (isCurrentlyOnline !== this.isOnline) {
        this.isOnline = isCurrentlyOnline;
        this.handleConnectivityChange(isCurrentlyOnline);
      }
    }, 30000);
  }

  // Handle connectivity change
  async handleConnectivityChange(isOnline) {
    if (isOnline) {
      console.log('Connection restored, starting sync');
      // Process sync queue when connection is restored
      setTimeout(() => {
        this.processSyncQueue();
      }, 1000);
    } else {
      console.log('Connection lost, entering offline mode');
      // Notify user of offline mode
      this.notifyOfflineStatus();
    }
  }
}
```

### 4. Offline User Experience

#### 4.1 Offline Status Indicators
**Requirements:**
- Clear visual indicators of online/offline status
- Sync queue status display
- Offline capability explanations
- Progress indicators for sync operations
- Guidance for offline usage scenarios

**Offline UI Components:**
```javascript
const OfflineStatusIndicator = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [syncQueue, setSyncQueue] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      const isOnline = await syncService.isOnline();
      setConnectionStatus(isOnline ? 'online' : 'offline');

      if (isOnline) {
        setLastSyncTime(new Date());
      }

      // Get sync queue size
      const queueSize = await syncService.getSyncQueueSize();
      setSyncQueue(queueSize);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'checking': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'checking': return '🟡';
      default: return '⚪';
    }
  };

  return (
    <View className="offline-status-indicator">
      <View className="status-row">
        <Text className="status-icon">{getStatusIcon()}</Text>
        <Text className={`status-text ${getStatusColor()}`}>
          {connectionStatus === 'online' ? 'Online' : 'Offline'}
        </Text>
      </View>

      {connectionStatus === 'offline' && (
        <View className="offline-info">
          <Text className="offline-message">
            Working offline. Data will sync when connection is restored.
          </Text>
          {syncQueue > 0 && (
            <Text className="queue-info">
              {syncQueue} items pending sync
            </Text>
          )}
        </View>
      )}

      {lastSyncTime && connectionStatus === 'online' && (
        <Text className="last-sync">
          Last sync: {lastSyncTime.toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};

// Offline Mode Guide Component
const OfflineModeGuide = () => {
  const [showGuide, setShowGuide] = useState(false);

  const offlineCapabilities = [
    {
      icon: '✅',
      title: 'Face Recognition',
      description: 'Full face recognition with local embeddings',
      available: true,
    },
    {
      icon: '✅',
      title: 'Location Tracking',
      description: 'Background location tracking with local storage',
      available: true,
    },
    {
      icon: '✅',
      title: 'Attendance Recording',
      description: 'Complete check-in/out functionality',
      available: true,
    },
    {
      icon: '⚠️',
      title: 'Reference Photo Updates',
      description: 'Requires connection for admin updates',
      available: false,
    },
    {
      icon: '⚠️',
      title: 'Real-time Admin Verification',
      description: 'Photos will be queued for verification',
      available: false,
    },
  ];

  return (
    <View className="offline-mode-guide">
      <TouchableOpacity
        className="guide-toggle"
        onPress={() => setShowGuide(!showGuide)}
      >
        <Text className="guide-title">
          Offline Mode Information {showGuide ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {showGuide && (
        <View className="guide-content">
          <Text className="guide-description">
            The app continues to work without internet. Here's what you can do:
          </Text>

          {offlineCapabilities.map((capability, index) => (
            <View key={index} className="capability-row">
              <Text className="capability-icon">{capability.icon}</Text>
              <View className="capability-info">
                <Text className="capability-title">{capability.title}</Text>
                <Text className="capability-description">
                  {capability.description}
                </Text>
              </View>
            </View>
          ))}

          <View className="offline-tips">
            <Text className="tips-title">Offline Tips:</Text>
            <Text className="tip">• All your data is securely stored locally</Text>
            <Text className="tip">• Data will automatically sync when connection returns</Text>
            <Text className="tip">• Battery usage is optimized for offline mode</Text>
            <Text className="tip">• Face recognition works completely offline</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Sync Progress Indicator
const SyncProgressIndicator = () => {
  const [syncProgress, setSyncProgress] = useState({
    isActive: false,
    current: 0,
    total: 0,
    operation: '',
  });

  useEffect(() => {
    const unsubscribe = syncService.onSyncProgress((progress) => {
      setSyncProgress(progress);
    });

    return unsubscribe;
  }, []);

  if (!syncProgress.isActive) {
    return null;
  }

  const progressPercentage = syncProgress.total > 0
    ? (syncProgress.current / syncProgress.total) * 100
    : 0;

  return (
    <View className="sync-progress">
      <View className="progress-header">
        <Text className="progress-title">Syncing Data</Text>
        <Text className="progress-details">
          {syncProgress.current} / {syncProgress.total}
        </Text>
      </View>

      <View className="progress-bar">
        <View
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </View>

      <Text className="progress-operation">{syncProgress.operation}</Text>
    </View>
  );
};
```

### 5. Emergency Check-out Handling

#### 5.1 Offline Emergency Scenarios
**Requirements:**
- Emergency check-out handling when offline
- Local emergency data capture and storage
- Automatic sync when connection restored
- Admin notification for emergency scenarios
- Battery level monitoring during emergencies

**Emergency Handling Implementation:**
```javascript
class EmergencyCheckOutService {
  // Handle emergency check-out in offline mode
  async handleOfflineEmergencyCheckOut(attendanceId, reason, lastLocationData) {
    try {
      // Capture emergency data
      const emergencyData = {
        attendanceId: attendanceId,
        checkOutReason: reason,
        checkOutTimestamp: new Date().toISOString(),
        checkOutLatitude: lastLocationData?.latitude,
        checkOutLongitude: lastLocationData?.longitude,
        checkOutLocationName: lastLocationData?.locationName,
        batteryLevel: lastLocationData?.batteryLevel,
        deviceInfo: await this.getDeviceInfo(),
        isEmergency: true,
        offlineMode: true,
      };

      // Create emergency record locally
      await this.createEmergencyRecord(emergencyData);

      // Update attendance record locally
      await this.updateAttendanceForEmergency(emergencyData);

      // Stop location tracking
      await this.stopLocationTracking(attendanceId);

      // Add to sync queue for server update
      await this.addToSyncQueue({
        type: 'EMERGENCY_CHECKOUT',
        table: 'daily_attendance',
        recordId: attendanceId,
        data: emergencyData,
        priority: 5, // High priority for emergencies
      });

      // Create local audit log
      await this.createAuditLog({
        eventType: 'EMERGENCY_CHECKOUT_OFFLINE',
        attendanceId: attendanceId,
        reason: reason,
        timestamp: new Date().toISOString(),
        location: lastLocationData,
      });

      return {
        success: true,
        emergencyData: emergencyData,
        message: 'Emergency check-out completed. Will sync with server when online.',
      };

    } catch (error) {
      console.error('Offline emergency check-out failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Sync emergency data when online
  async syncEmergencyData(emergencyData) {
    try {
      // Send emergency data to server
      const serverResponse = await api.emergency.processEmergencyCheckout({
        attendanceId: emergencyData.attendanceId,
        reason: emergencyData.checkOutReason,
        timestamp: emergencyData.checkOutTimestamp,
        location: {
          latitude: emergencyData.checkOutLatitude,
          longitude: emergencyData.checkOutLongitude,
          locationName: emergencyData.checkOutLocationName,
        },
        batteryLevel: emergencyData.batteryLevel,
        deviceInfo: emergencyData.deviceInfo,
      });

      // Create security event on server
      await api.security.createSecurityEvent({
        eventType: 'EMERGENCY_CHECKOUT_OFFLINE_SYNC',
        attendanceId: emergencyData.attendanceId,
        details: emergencyData,
        severity: 'MEDIUM',
      });

      // Update local record with server sync status
      await this.updateEmergencySyncStatus(
        emergencyData.attendanceId,
        serverResponse.id
      );

      return {
        success: true,
        serverId: serverResponse.id,
        syncedAt: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Emergency data sync failed:', error);
      throw error;
    }
  }

  // Battery level monitoring for emergencies
  startBatteryMonitoring() {
    // Monitor battery level every minute
    setInterval(async () => {
      try {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const isCharging = await Battery.isChargingAsync();

        // Store battery data for current active attendance
        const activeAttendance = await this.getActiveAttendance();
        if (activeAttendance) {
          await this.storeBatteryData(activeAttendance.id, {
            level: Math.round(batteryLevel * 100),
            isCharging: isCharging,
            timestamp: new Date().toISOString(),
          });

          // Check for critical battery level
          if (batteryLevel < 0.05 && !isCharging) {
            // Battery is critical (<5%)
            await this.handleCriticalBattery(activeAttendance.id);
          }
        }

      } catch (error) {
        console.error('Battery monitoring failed:', error);
      }
    }, 60000); // Every minute
  }

  // Handle critical battery scenarios
  async handleCriticalBattery(attendanceId) {
    try {
      // Perform emergency check-out due to critical battery
      await this.handleOfflineEmergencyCheckOut(
        attendanceId,
        'CRITICAL_BATTERY_LEVEL',
        await this.getCurrentLocation()
      );

      // Show critical battery notification
      this.showCriticalBatteryAlert();

      // Log critical battery event
      await this.createAuditLog({
        eventType: 'CRITICAL_BATTERY_EMERGENCY',
        attendanceId: attendanceId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Critical battery handling failed:', error);
    }
  }
}
```

## Technical Implementation Details

### Offline Data Architecture

#### Data Sync Strategy
```javascript
const OfflineDataArchitecture = {
  // Local storage structure
  localDatabase: {
    employees: 'Master data synced from server',
    attendance: 'Created locally, synced to server',
    locations: 'Created locally, batch synced to server',
    syncQueue: 'Queue for pending sync operations',
    auditLog: 'Local audit log synced when online',
    embeddings: 'Face embeddings synced from server',
  },

  // Sync priorities
  syncPriorities: {
    CRITICAL: 5,    // Emergency check-outs, security events
    HIGH: 4,        // Attendance records, location data
    NORMAL: 3,      // Employee updates, reference photos
    LOW: 2,         // Analytics data, reports
    BACKGROUND: 1,  // Usage statistics, performance metrics
  },

  // Conflict resolution strategies
  conflictResolution: {
    TIMESTAMP: 'USE_MOST_RECENT',
    PHOTO_CONFIDENCE: 'USE_HIGHEST_CONFIDENCE',
    LOCATION: 'USE_SERVER_DATA',
    EMPLOYEE_DATA: 'MERGE_NON_EMPTY',
  },
};
```

### Performance Optimization

#### Offline Performance Strategies
```javascript
// Performance optimization for offline operations
const OfflineOptimizations = {
  // Data compression
  compression: {
    photos: 'JPEG quality 80%',
    locations: 'Delta compression for GPS coordinates',
    embeddings: 'Compressed float32 arrays',
    auditLogs: 'JSON compression with gzip',
  },

  // Storage management
  storage: {
    maxDatabaseSize: '500MB',
    retentionPeriod: '30 days for logs, 7 days for temp data',
    cleanupThreshold: '80% of max size',
    compressionRatio: 'Target 60% reduction',
  },

  // Memory management
  memory: {
    embeddingCacheSize: '50 embeddings max',
    photoCacheSize: '10 photos max',
    batchSize: '50 operations per batch',
    gcThreshold: 'Memory usage > 150MB',
  },

  // Battery optimization
  battery: {
    locationInterval: '5 minutes when checked in',
    compressionInterval: 'Every 100 records',
    syncInterval: '30 seconds when online, 5 minutes when offline',
    sleepMode: 'Enable after 1 hour of inactivity',
  },
};
```

## Success Criteria

### Functional Requirements
✅ Complete offline functionality with full attendance capabilities
✅ Offline face recognition with local embeddings and server validation
✅ Robust sync engine with conflict resolution and retry mechanisms
✅ Emergency check-out handling with local data capture
✅ Clear offline status indicators and user guidance
✅ Battery-optimized performance for extended offline usage

### Performance Requirements
- App startup time under 5 seconds offline
- Offline face recognition processing under 3 seconds
- Local database operations under 100ms
- Sync processing under 10 seconds for 50 operations
- Battery usage impact under 20% for full day offline

### Reliability Requirements
- Data integrity maintained during offline/online transitions
- Conflict resolution accuracy >95%
- Sync success rate >99% for normal operations
- Emergency data capture success rate 100%
- Zero data loss during connectivity interruptions

## Testing Strategy

### Offline Functionality Testing
- Complete offline workflow testing
- Data sync validation across multiple scenarios
- Conflict resolution accuracy testing
- Emergency scenario simulation
- Battery usage measurement and optimization

### Performance Testing
- Memory usage monitoring during offline operations
- Database performance with large datasets
- Sync performance under various network conditions
- Face recognition performance offline vs online
- Battery impact analysis across usage patterns

### Reliability Testing
- Data integrity validation after offline/online cycles
- Conflict resolution edge case testing
- Emergency scenario reliability testing
- Long-term offline usage simulation
- Multiple device synchronization testing

## Risk Mitigation

### Technical Risks
1. **Data Corruption:** Regular integrity checks and automatic recovery
2. **Storage Limitations:** Intelligent data compression and cleanup
3. **Performance Degradation:** Optimization algorithms and monitoring
4. **Sync Failures:** Robust retry mechanisms and conflict resolution

### Business Risks
1. **User Confusion:** Clear offline status indicators and guidance
2. **Data Loss:** Multiple backup strategies and validation
3. **Battery Drain:** Adaptive performance based on battery level
4. **Sync Conflicts:** Sophisticated conflict resolution algorithms

## Dependencies & Prerequisites

### Phase Dependencies
- **Phase 2 Complete:** Basic attendance flow with photo capture
- **Phase 4 Complete:** Face recognition with embedding management
- **Phase 6 Complete:** Security framework and data protection
- **SQLite Integration:** Local database properly configured

### External Dependencies
- TensorFlow Lite for on-device face recognition
- SQLite database for local storage
- Network connectivity monitoring tools
- Battery optimization libraries

## Handoff to Phase 8

### Deliverables for Next Phase
1. **Complete Offline System:** Full offline functionality with data sync
2. **Robust Sync Engine:** Conflict resolution and retry mechanisms
3. **Offline Face Recognition:** Complete on-device processing
4. **Emergency Handling:** Comprehensive emergency scenario management
5. **Performance Optimization:** Battery-efficient offline operations

### Preparation Checklist
- [ ] All offline functionality working reliably
- [ ] Sync engine handling all scenarios correctly
- [ ] Face recognition working completely offline
- [ ] Emergency scenarios tested and validated
- [ ] Performance optimization within targets
- [ ] Phase 8 production requirements understood

---

## Phase Review Process

### Review Criteria
1. **Offline Functionality:** Complete capabilities without network connectivity
2. **Data Synchronization:** Reliable sync with conflict resolution
3. **User Experience:** Clear offline status and guidance
4. **Performance:** Battery usage and memory optimization
5. **Emergency Handling:** Robust emergency scenario management

### Review Deliverables
1. **Offline Testing Report:** Comprehensive offline functionality validation
2. **Sync Performance Report:** Sync efficiency and reliability metrics
3. **Battery Analysis Report:** Power consumption optimization results
4. **Data Integrity Report:** Offline/online data consistency validation
5. **Phase 8 Readiness Assessment:** Preparation for production optimization

### Approval Requirements
- Offline functionality tested and approved
- Sync system performance meets requirements
- Battery usage within acceptable limits
- Emergency scenarios handled correctly
- User experience testing completed successfully