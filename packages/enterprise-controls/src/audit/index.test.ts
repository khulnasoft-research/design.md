import { describe, it, expect } from 'vitest'
import { InMemoryAuditLogStore, DefaultAuditLogger } from './index.js'
import type { AuditLogEntry } from './index.js'

function sampleEntry(overrides?: Partial<Omit<AuditLogEntry, 'id' | 'timestamp'>>) {
  return {
    tenantId: 'acme-corp',
    userId: 'user-1',
    action: 'design_system.created',
    resource: 'design_system',
    resourceId: 'ds-1',
    outcome: 'success' as const,
    changes: { before: {}, after: { name: 'New DS' } },
    ...overrides,
  }
}

describe('InMemoryAuditLogStore', () => {
  it('logs an entry and returns it with id and timestamp', async () => {
    const store = new InMemoryAuditLogStore()
    const entry = await store.log(sampleEntry())
    expect(entry.id).toBeDefined()
    expect(entry.timestamp).toBeDefined()
    expect(entry.tenantId).toBe('acme-corp')
  })

  it('queries entries by tenant', async () => {
    const store = new InMemoryAuditLogStore()
    await store.log(sampleEntry({ tenantId: 'acme-corp' }))
    await store.log(sampleEntry({ tenantId: 'other-corp' }))
    const results = await store.query({ tenantId: 'acme-corp' })
    expect(results.length).toBe(1)
  })

  it('queries entries by user', async () => {
    const store = new InMemoryAuditLogStore()
    await store.log(sampleEntry({ userId: 'user-1' }))
    await store.log(sampleEntry({ userId: 'user-2' }))
    const results = await store.query({ userId: 'user-1' })
    expect(results.length).toBe(1)
  })

  it('queries entries by action', async () => {
    const store = new InMemoryAuditLogStore()
    await store.log(sampleEntry({ action: 'design_system.created' }))
    await store.log(sampleEntry({ action: 'design_system.deleted' }))
    const results = await store.query({ action: 'design_system.created' })
    expect(results.length).toBe(1)
  })

  it('queries entries by outcome', async () => {
    const store = new InMemoryAuditLogStore()
    await store.log(sampleEntry({ outcome: 'success' }))
    await store.log(sampleEntry({ outcome: 'failure', failureReason: 'nope' }))
    const results = await store.query({ outcome: 'failure' })
    expect(results.length).toBe(1)
  })

  it('queries entries by date range', async () => {
    const store = new InMemoryAuditLogStore()
    await store.log(sampleEntry({ action: 'old' }))
    await new Promise((r) => setTimeout(r, 5))
    const entry2 = await store.log(sampleEntry({ action: 'recent' }))
    const results = await store.query({
      startDate: entry2.timestamp,
    })
    expect(results.length).toBe(1)
    expect(results[0].action).toBe('recent')
  })

  it('gets specific entry by id', async () => {
    const store = new InMemoryAuditLogStore()
    const logged = await store.log(sampleEntry())
    const found = await store.getEntry(logged.id)
    expect(found).not.toBeNull()
    expect(found!.id).toBe(logged.id)
  })

  it('returns null for non-existent entry', async () => {
    const store = new InMemoryAuditLogStore()
    const found = await store.getEntry('nonexistent')
    expect(found).toBeNull()
  })

  it('counts entries matching query', async () => {
    const store = new InMemoryAuditLogStore()
    await store.log(sampleEntry({ tenantId: 'acme-corp' }))
    await store.log(sampleEntry({ tenantId: 'acme-corp' }))
    await store.log(sampleEntry({ tenantId: 'other-corp' }))
    const count = await store.count({ tenantId: 'acme-corp' })
    expect(count).toBe(2)
  })

  it('archives old entries', async () => {
    const store = new InMemoryAuditLogStore()
    await store.log(sampleEntry())
    await store.log(sampleEntry())
    const archived = await store.archiveLogs(new Date(Date.now() + 100000).toISOString())
    expect(archived).toBe(2)
    const remaining = await store.count({})
    expect(remaining).toBe(0)
  })

  it('paginates query results', async () => {
    const store = new InMemoryAuditLogStore()
    for (let i = 0; i < 10; i++) {
      await store.log(sampleEntry({ action: `action-${i}` }))
    }
    const page1 = await store.query({ limit: 3, offset: 0 })
    expect(page1.length).toBe(3)
    const page2 = await store.query({ limit: 3, offset: 3 })
    expect(page2.length).toBe(3)
    expect(page2[0].action).not.toBe(page1[0].action)
  })

  it('sorts results by timestamp descending', async () => {
    const store = new InMemoryAuditLogStore()
    await store.log(sampleEntry({ action: 'first' }))
    await new Promise((r) => setTimeout(r, 5))
    await store.log(sampleEntry({ action: 'second' }))
    const results = await store.query({})
    expect(results[0].action).toBe('second')
    expect(results[1].action).toBe('first')
  })
})

describe('DefaultAuditLogger', () => {
  it('logs success without explicit outcome', async () => {
    const store = new InMemoryAuditLogStore()
    const logger = new DefaultAuditLogger(store)
    await logger.logSuccess({
      tenantId: 'acme',
      userId: 'u1',
      action: 'test',
      resource: 'design_system',
      resourceId: 'ds-1',
      changes: { before: {}, after: {} },
    })
    const results = await store.query({ outcome: 'success' })
    expect(results.length).toBe(1)
  })

  it('logs failure with reason', async () => {
    const store = new InMemoryAuditLogStore()
    const logger = new DefaultAuditLogger(store)
    await logger.logFailure({
      tenantId: 'acme',
      userId: 'u1',
      action: 'test',
      resource: 'design_system',
      resourceId: 'ds-1',
      failureReason: 'permission denied',
      changes: { before: {}, after: {} },
    })
    const results = await store.query({ outcome: 'failure' })
    expect(results.length).toBe(1)
    expect(results[0].failureReason).toBe('permission denied')
  })

  it('logs generic entry with explicit outcome', async () => {
    const store = new InMemoryAuditLogStore()
    const logger = new DefaultAuditLogger(store)
    await logger.log({
      tenantId: 'acme',
      userId: 'u1',
      action: 'test',
      resource: 'design_system',
      resourceId: 'ds-1',
      outcome: 'partial',
      changes: { before: {}, after: {} },
    })
    const results = await store.query({ outcome: 'partial' })
    expect(results.length).toBe(1)
  })

  it('counts logs matching query', async () => {
    const store = new InMemoryAuditLogStore()
    const logger = new DefaultAuditLogger(store)
    await logger.logSuccess({
      tenantId: 'acme', userId: 'u1', action: 'a', resource: 'r', resourceId: '1',
      changes: { before: {}, after: {} },
    })
    await logger.logSuccess({
      tenantId: 'acme', userId: 'u1', action: 'b', resource: 'r', resourceId: '2',
      changes: { before: {}, after: {} },
    })
    const count = await logger.countLogs({ tenantId: 'acme' })
    expect(count).toBe(2)
  })

  it('generates audit report', async () => {
    const store = new InMemoryAuditLogStore()
    const logger = new DefaultAuditLogger(store)
    await logger.logSuccess({
      tenantId: 'acme', userId: 'u1', action: 'create', resource: 'design_system', resourceId: '1',
      changes: { before: {}, after: {} },
    })
    await logger.logFailure({
      tenantId: 'acme', userId: 'u1', action: 'delete', resource: 'design_system', resourceId: '2',
      failureReason: 'not authorized', changes: { before: {}, after: {} },
    })
    const report = await logger.generateReport({
      tenantId: 'acme',
      startDate: new Date(0).toISOString(),
      endDate: new Date(Date.now() + 100000).toISOString(),
      groupBy: 'action',
    })
    expect(report.totalEntries).toBe(2)
    expect(report.successRate).toBe(50)
    expect(report.breakdown.create).toBe(1)
    expect(report.breakdown.delete).toBe(1)
    expect(report.notableEvents.length).toBeGreaterThanOrEqual(1)
  })

  it('creates its own InMemoryAuditLogStore by default', async () => {
    const logger = new DefaultAuditLogger()
    await logger.logSuccess({
      tenantId: 'acme', userId: 'u1', action: 'test', resource: 'r', resourceId: '1',
      changes: { before: {}, after: {} },
    })
    const count = await logger.countLogs({})
    expect(count).toBe(1)
  })
})
