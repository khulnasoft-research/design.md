import { describe, it, expect } from 'vitest'
import { DefaultPolicyEngine, STANDARD_POLICIES } from './index.js'

function makePolicy(config?: Partial<PolicyConfig>) {
  return {
    ...STANDARD_POLICIES.COLOR_PALETTE_LIMIT,
    enabled: true,
    severity: 'error' as const,
    isOrganizationPolicy: false,
    ...config,
  }
}

import type { Policy } from './index.js'
import type { DesignSystemState } from '@scalify/design-core'

interface PolicyConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  severity: 'error' | 'warning' | 'info'
  type: 'color' | 'typography' | 'spacing' | 'component' | 'naming' | 'custom'
  config: Record<string, unknown>
  isOrganizationPolicy: boolean
}

function emptyDs(): DesignSystemState {
  return {
    name: 'test',
    description: 'test ds',
    colors: new Map(),
    typography: new Map(),
    rounded: new Map(),
    spacing: new Map(),
    components: new Map(),
    symbolTable: new Map(),
  }
}

describe('DefaultPolicyEngine', () => {
  it('returns compliant for empty design system with no policies', async () => {
    const engine = new DefaultPolicyEngine()
    const result = await engine.enforce(emptyDs())
    expect(result.compliant).toBe(true)
    expect(result.violations).toEqual([])
  })

  it('returns compliant when no policies are violated', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy({ ...STANDARD_POLICIES.COMPONENT_REQUIRED, enabled: true, severity: 'error', isOrganizationPolicy: false })
    const ds = emptyDs()
    ds.components.set('Button', { properties: new Map(), unresolvedRefs: [] })
    ds.components.set('Card', { properties: new Map(), unresolvedRefs: [] })
    ds.components.set('Input', { properties: new Map(), unresolvedRefs: [] })
    ds.components.set('Typography', { properties: new Map(), unresolvedRefs: [] })
    const result = await engine.enforce(ds)
    expect(result.compliant).toBe(true)
  })

  it('flags missing required components', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy({ ...STANDARD_POLICIES.COMPONENT_REQUIRED, enabled: true, severity: 'error', isOrganizationPolicy: false })
    const result = await engine.enforce(emptyDs())
    expect(result.compliant).toBe(false)
    expect(result.violations.some(v => v.policyId === 'component_required')).toBe(true)
  })

  it('flags color palette exceeding limit', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy(makePolicy({
      id: 'color_palette_limit',
      type: 'color',
      config: { maxColors: 2 },
    }))
    const ds = emptyDs()
    ds.colors.set('red', { type: 'color', hex: '#ff0000', rgba: { r: 1, g: 0, b: 0, a: 1 } })
    ds.colors.set('green', { type: 'color', hex: '#00ff00', rgba: { r: 0, g: 1, b: 0, a: 1 } })
    ds.colors.set('blue', { type: 'color', hex: '#0000ff', rgba: { r: 0, g: 0, b: 1, a: 1 } })
    const result = await engine.enforce(ds)
    expect(result.violations.some(v => v.policyId === 'color_palette_limit')).toBe(true)
    expect(result.summary.errors).toBe(1)
  })

  it('flags typography exceeding scale limit', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy(makePolicy({
      id: 'typography_scale_limit',
      type: 'typography',
      config: { maxScales: 2 },
    }))
    const ds = emptyDs()
    ds.typography.set('h1', { type: 'typography', fontSize: { type: 'dimension', value: 32, unit: 'px' } })
    ds.typography.set('h2', { type: 'typography', fontSize: { type: 'dimension', value: 24, unit: 'px' } })
    ds.typography.set('body', { type: 'typography', fontSize: { type: 'dimension', value: 16, unit: 'px' } })
    const result = await engine.enforce(ds)
    expect(result.violations.some(v => v.policyId === 'typography_scale_limit')).toBe(true)
  })

  it('flags spacing exceeding scale limit', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy(makePolicy({
      id: 'spacing_scale_consistency',
      type: 'spacing',
      config: { baseUnit: '4px', maxScales: 2 },
    }))
    const ds = emptyDs()
    ds.spacing.set('xs', { type: 'dimension', value: 4, unit: 'px' })
    ds.spacing.set('sm', { type: 'dimension', value: 8, unit: 'px' })
    ds.spacing.set('md', { type: 'dimension', value: 16, unit: 'px' })
    const result = await engine.enforce(ds)
    expect(result.violations.some(v => v.policyId === 'spacing_scale_consistency')).toBe(true)
  })

  it('flags naming convention violations', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy(makePolicy({
      id: 'color_naming_convention',
      type: 'naming',
      config: { pattern: '^color-' },
    }))
    const ds = emptyDs()
    ds.colors.set('primary', { type: 'color', hex: '#ff0000', rgba: { r: 1, g: 0, b: 0, a: 1 } })
    ds.colors.set('color-secondary', { type: 'color', hex: '#00ff00', rgba: { r: 0, g: 1, b: 0, a: 1 } })
    const result = await engine.enforce(ds)
    const violations = result.violations.filter(v => v.policyId === 'color_naming_convention')
    expect(violations.length).toBe(1)
    expect(violations[0].affectedItems).toContain('color:primary')
  })

  it('includes disabled policies does not enforce them', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy({ ...STANDARD_POLICIES.COMPONENT_REQUIRED, enabled: false, severity: 'error', isOrganizationPolicy: false })
    const result = await engine.enforce(emptyDs())
    // No components exist but policy is disabled
    expect(result.compliant).toBe(true)
  })

  it('enables a previously disabled policy', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy({ ...STANDARD_POLICIES.COMPONENT_REQUIRED, enabled: false, severity: 'error', isOrganizationPolicy: false })
    await engine.setPolicy('component_required', true)
    const result = await engine.enforce(emptyDs())
    expect(result.compliant).toBe(false)
  })

  it('lists all policies', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy({ ...STANDARD_POLICIES.COMPONENT_REQUIRED, enabled: true, severity: 'error', isOrganizationPolicy: false })
    const policies = await engine.getPolicies()
    expect(policies.length).toBe(1)
    expect(policies[0].id).toBe('component_required')
  })

  it('supports adding and removing policies', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy({ ...STANDARD_POLICIES.COMPONENT_REQUIRED, enabled: true, severity: 'error', isOrganizationPolicy: false })
    await engine.removePolicy('component_required')
    const policies = await engine.getPolicies()
    expect(policies.length).toBe(0)
  })

  it('sorts violations by severity (errors first)', async () => {
    const engine = new DefaultPolicyEngine()
    await engine.addPolicy({ ...STANDARD_POLICIES.COMPONENT_REQUIRED, enabled: true, severity: 'error', isOrganizationPolicy: false })
    await engine.addPolicy(makePolicy({
      id: 'color_palette_limit',
      type: 'color',
      severity: 'warning',
      config: { maxColors: 1 },
    }))
    const ds = emptyDs()
    ds.colors.set('red', { type: 'color', hex: '#ff0000', rgba: { r: 1, g: 0, b: 0, a: 1 } })
    ds.colors.set('blue', { type: 'color', hex: '#0000ff', rgba: { r: 0, g: 0, b: 1, a: 1 } })
    const result = await engine.enforce(ds)
    expect(result.violations[0].severity).toBe('error')
    expect(result.violations[1].severity).toBe('warning')
  })

  it('initializes with default policies', async () => {
    const policies: Policy[] = [
      { ...STANDARD_POLICIES.COMPONENT_REQUIRED, enabled: true, severity: 'error', isOrganizationPolicy: false },
    ]
    const engine = new DefaultPolicyEngine(policies)
    const result = await engine.enforce(emptyDs())
    expect(result.compliant).toBe(false)
  })
})
