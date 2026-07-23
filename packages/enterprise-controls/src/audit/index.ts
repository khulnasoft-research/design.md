/**
 * Audit Logging System
 *
 * Records all significant actions in the system for compliance and debugging.
 * Maintains immutable audit trail with full context.
 */

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  /** Unique log entry ID */
  id: string;
  /** Tenant ID */
  tenantId: string;
  /** User who performed the action */
  userId: string;
  /** Type of action */
  action: string;
  /** Resource being acted upon */
  resource: string;
  /** Resource ID */
  resourceId: string;
  /** Action outcome */
  outcome: 'success' | 'failure' | 'partial';
  /** Reason for failure (if applicable) */
  failureReason?: string;
  /** Detailed changes made */
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  /** Context information */
  context?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
  /** Timestamp */
  timestamp: string;
  /** How long the operation took (milliseconds) */
  duration?: number;
}

/**
 * Audit log query parameters
 */
export interface AuditLogQuery {
  /** Filter by tenant */
  tenantId?: string;
  /** Filter by user */
  userId?: string;
  /** Filter by action */
  action?: string;
  /** Filter by resource */
  resource?: string;
  /** Filter by resource ID */
  resourceId?: string;
  /** Filter by outcome */
  outcome?: 'success' | 'failure' | 'partial';
  /** Start date */
  startDate?: string;
  /** End date */
  endDate?: string;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * Audit log storage interface
 */
export interface AuditLogStore {
  /** Record an audit log entry */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry>;

  /** Query audit logs */
  query(params: AuditLogQuery): Promise<AuditLogEntry[]>;

  /** Get a specific log entry by ID */
  getEntry(id: string): Promise<AuditLogEntry | null>;

  /** Count matching audit logs */
  count(params: AuditLogQuery): Promise<number>;

  /** Archive old logs (for compliance/retention) */
  archiveLogs(beforeDate: string): Promise<number>;
}

/**
 * Audit logger interface
 */
export interface AuditLogger {
  /** Log a successful action */
  logSuccess(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'outcome'>): Promise<void>;

  /** Log a failed action */
  logFailure(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'outcome'> & { failureReason: string }
  ): Promise<void>;

  /** Log any action with explicit outcome */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void>;

  /** Query logs */
  query(params: AuditLogQuery): Promise<AuditLogEntry[]>;

  /** Get total count of logs matching query */
  countLogs(params: AuditLogQuery): Promise<number>;

  /** Generate audit report */
  generateReport(params: {
    tenantId: string;
    startDate: string;
    endDate: string;
    groupBy?: 'action' | 'user' | 'resource';
  }): Promise<AuditReport>;
}

/**
 * Audit report for compliance/analysis
 */
export interface AuditReport {
  /** Report period */
  period: {
    start: string;
    end: string;
  };
  /** Total entries in period */
  totalEntries: number;
  /** Success rate */
  successRate: number;
  /** Breakdown by category */
  breakdown: Record<string, number>;
  /** Notable events */
  notableEvents: AuditLogEntry[];
}

/**
 * Default in-memory audit log store implementation
 */
export class InMemoryAuditLogStore implements AuditLogStore {
  private logs: Map<string, AuditLogEntry> = new Map();
  private logsByTenant: Map<string, string[]> = new Map();

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logEntry: AuditLogEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString(),
    };

    this.logs.set(id, logEntry);

    // Index by tenant for faster queries
    const tenantLogs = this.logsByTenant.get(entry.tenantId) || [];
    tenantLogs.push(id);
    this.logsByTenant.set(entry.tenantId, tenantLogs);

    return logEntry;
  }

  async query(params: AuditLogQuery): Promise<AuditLogEntry[]> {
    let results = Array.from(this.logs.values());

    // Apply filters
    if (params.tenantId) {
      results = results.filter((log) => log.tenantId === params.tenantId);
    }
    if (params.userId) {
      results = results.filter((log) => log.userId === params.userId);
    }
    if (params.action) {
      results = results.filter((log) => log.action === params.action);
    }
    if (params.resource) {
      results = results.filter((log) => log.resource === params.resource);
    }
    if (params.resourceId) {
      results = results.filter((log) => log.resourceId === params.resourceId);
    }
    if (params.outcome) {
      results = results.filter((log) => log.outcome === params.outcome);
    }
    if (params.startDate) {
      results = results.filter((log) => log.timestamp >= params.startDate!);
    }
    if (params.endDate) {
      results = results.filter((log) => log.timestamp <= params.endDate!);
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const offset = params.offset || 0;
    const limit = params.limit || 100;
    return results.slice(offset, offset + limit);
  }

  async getEntry(id: string): Promise<AuditLogEntry | null> {
    return this.logs.get(id) || null;
  }

  async count(params: AuditLogQuery): Promise<number> {
    const results = await this.query(params);
    return results.length;
  }

  async archiveLogs(beforeDate: string): Promise<number> {
    let archived = 0;
    for (const [id, log] of this.logs) {
      if (log.timestamp < beforeDate) {
        this.logs.delete(id);
        archived++;
      }
    }
    return archived;
  }
}

/**
 * Default audit logger implementation
 */
export class DefaultAuditLogger implements AuditLogger {
  private store: AuditLogStore;

  constructor(store: AuditLogStore = new InMemoryAuditLogStore()) {
    this.store = store;
  }

  async logSuccess(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'outcome'>): Promise<void> {
    await this.store.log({
      ...entry,
      outcome: 'success',
    });
  }

  async logFailure(
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'outcome'> & {
      failureReason: string;
    }
  ): Promise<void> {
    await this.store.log({
      ...entry,
      outcome: 'failure',
    });
  }

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    await this.store.log(entry);
  }

  async query(params: AuditLogQuery): Promise<AuditLogEntry[]> {
    return this.store.query(params);
  }

  async countLogs(params: AuditLogQuery): Promise<number> {
    return this.store.count(params);
  }

  async generateReport(params: {
    tenantId: string;
    startDate: string;
    endDate: string;
    groupBy?: 'action' | 'user' | 'resource';
  }): Promise<AuditReport> {
    const logs = await this.store.query({
      tenantId: params.tenantId,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: 10000,
    });

    const breakdown: Record<string, number> = {};
    const groupKey = params.groupBy || 'action';

    for (const log of logs) {
      const key =
        groupKey === 'action' ? log.action : groupKey === 'user' ? log.userId : log.resource;
      breakdown[key] = (breakdown[key] || 0) + 1;
    }

    const successCount = logs.filter((l) => l.outcome === 'success').length;
    const successRate = logs.length > 0 ? (successCount / logs.length) * 100 : 0;

    // Get notable events (failures)
    const notableEvents = logs.filter((l) => l.outcome === 'failure').slice(0, 10);

    return {
      period: {
        start: params.startDate,
        end: params.endDate,
      },
      totalEntries: logs.length,
      successRate,
      breakdown,
      notableEvents,
    };
  }
}
