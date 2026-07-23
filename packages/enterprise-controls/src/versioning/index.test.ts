import { describe, it, expect } from 'vitest'
import { VersionComparator, DefaultVersionManager } from './index.js'
import type { ChangeEntry } from './index.js'

describe('VersionComparator', () => {
  describe('parseVersion', () => {
    it('parses a three-part version', () => {
      const v = VersionComparator.parseVersion('1.2.3')
      expect(v).toEqual({ major: 1, minor: 2, patch: 3 })
    })

    it('handles missing parts as 0', () => {
      const v = VersionComparator.parseVersion('1')
      expect(v).toEqual({ major: 1, minor: 0, patch: 0 })
    })

    it('handles empty string', () => {
      const v = VersionComparator.parseVersion('')
      expect(v).toEqual({ major: 0, minor: 0, patch: 0 })
    })
  })

  describe('formatVersion', () => {
    it('formats a semantic version to string', () => {
      expect(VersionComparator.formatVersion({ major: 2, minor: 1, patch: 0 })).toBe('2.1.0')
    })
  })

  describe('compareVersions', () => {
    it('returns positive when v1 > v2', () => {
      expect(VersionComparator.compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0)
    })

    it('returns negative when v1 < v2', () => {
      expect(VersionComparator.compareVersions('1.0.0', '2.0.0')).toBeLessThan(0)
    })

    it('returns 0 when equal', () => {
      expect(VersionComparator.compareVersions('1.2.3', '1.2.3')).toBe(0)
    })

    it('compares minor versions', () => {
      expect(VersionComparator.compareVersions('1.2.0', '1.1.9')).toBeGreaterThan(0)
    })

    it('compares patch versions', () => {
      expect(VersionComparator.compareVersions('1.0.1', '1.0.0')).toBeGreaterThan(0)
    })
  })

  describe('isGreater', () => {
    it('returns true when v1 > v2', () => {
      expect(VersionComparator.isGreater('2.0.0', '1.0.0')).toBe(true)
    })

    it('returns false when equal', () => {
      expect(VersionComparator.isGreater('1.0.0', '1.0.0')).toBe(false)
    })
  })

  describe('isEqual', () => {
    it('returns true for equal versions', () => {
      expect(VersionComparator.isEqual('1.0.0', '1.0.0')).toBe(true)
    })

    it('returns false for different versions', () => {
      expect(VersionComparator.isEqual('1.0.0', '1.0.1')).toBe(false)
    })
  })

  describe('incrementVersion', () => {
    it('increments major version and resets minor/patch', () => {
      expect(VersionComparator.incrementVersion('1.2.3', 'major')).toBe('2.0.0')
    })

    it('increments minor version and resets patch', () => {
      expect(VersionComparator.incrementVersion('1.2.3', 'minor')).toBe('1.3.0')
    })

    it('increments patch version', () => {
      expect(VersionComparator.incrementVersion('1.2.3', 'patch')).toBe('1.2.4')
    })
  })
})

describe('DefaultVersionManager', () => {
  const snapshot = { colors: { primary: '#ff0000' } }
  const releaseMeta = { releaseDate: '2026-07-23', releaseNotes: 'Initial release', releasedBy: 'user-1' }

  it('creates first version as 1.0.0', async () => {
    const vm = new DefaultVersionManager()
    const version = await vm.createVersion('ds-1', snapshot, releaseMeta)
    expect(version.metadata.version).toBe('1.0.0')
  })

  it('auto-increments patch version', async () => {
    const vm = new DefaultVersionManager()
    await vm.createVersion('ds-1', snapshot, releaseMeta)
    await new Promise((r) => setTimeout(r, 2))
    const v2 = await vm.createVersion('ds-1', snapshot, {
      releaseDate: '2026-07-24', releaseNotes: 'Fix', releasedBy: 'user-1',
    })
    expect(v2.metadata.version).toBe('1.0.1')
  })

  it('retrieves a specific version', async () => {
    const vm = new DefaultVersionManager()
    await vm.createVersion('ds-1', snapshot, releaseMeta)
    const v = await vm.getVersion('ds-1', '1.0.0')
    expect(v).not.toBeNull()
    expect(v!.metadata.version).toBe('1.0.0')
  })

  it('returns null for non-existent version', async () => {
    const vm = new DefaultVersionManager()
    const v = await vm.getVersion('ds-1', '99.0.0')
    expect(v).toBeNull()
  })

  it('lists all versions of a design system', async () => {
    const vm = new DefaultVersionManager()
    await vm.createVersion('ds-1', snapshot, releaseMeta)
    await new Promise((r) => setTimeout(r, 2))
    await vm.createVersion('ds-1', snapshot, {
      releaseDate: '2026-07-24', releaseNotes: 'v2', releasedBy: 'user-1',
    })
    const versions = await vm.listVersions('ds-1')
    expect(versions.length).toBe(2)
  })

  it('returns empty list for unknown design system', async () => {
    const vm = new DefaultVersionManager()
    const versions = await vm.listVersions('unknown')
    expect(versions).toEqual([])
  })

  it('gets the latest version', async () => {
    const vm = new DefaultVersionManager()
    await vm.createVersion('ds-1', snapshot, releaseMeta)
    await new Promise((r) => setTimeout(r, 2))
    await vm.createVersion('ds-1', snapshot, {
      releaseDate: '2026-07-24', releaseNotes: 'v2', releasedBy: 'user-1',
    })
    const latest = await vm.getLatestVersion('ds-1')
    expect(latest!.metadata.version).toBe('1.0.1')
  })

  it('returns null for latest version on unknown design system', async () => {
    const vm = new DefaultVersionManager()
    const latest = await vm.getLatestVersion('unknown')
    expect(latest).toBeNull()
  })

  it('tags a version', async () => {
    const vm = new DefaultVersionManager()
    await vm.createVersion('ds-1', snapshot, releaseMeta)
    await vm.tagVersion('ds-1', '1.0.0', 'production')
    const v = await vm.getVersion('ds-1', '1.0.0')
    expect(v!.tags).toContain('production')
  })

  it('does not duplicate tags', async () => {
    const vm = new DefaultVersionManager()
    await vm.createVersion('ds-1', snapshot, releaseMeta)
    await vm.tagVersion('ds-1', '1.0.0', 'production')
    await vm.tagVersion('ds-1', '1.0.0', 'production')
    const v = await vm.getVersion('ds-1', '1.0.0')
    const productionTags = v!.tags.filter((t) => t === 'production')
    expect(productionTags.length).toBe(1)
  })

  it('generates diff between two versions with changes', async () => {
    const vm = new DefaultVersionManager()
    const changes: ChangeEntry[] = [
      { type: 'added', category: 'color', description: 'Added secondary color', breaking: false },
    ]
    await vm.createVersion('ds-1', snapshot, releaseMeta)
    await new Promise((r) => setTimeout(r, 2))
    await vm.createVersion('ds-1', snapshot, {
      releaseDate: '2026-07-24', releaseNotes: 'v2', releasedBy: 'user-1',
    }, changes)
    const diff = await vm.getDiff('ds-1', '1.0.0', '1.0.1')
    expect(diff.fromVersion).toBe('1.0.0')
    expect(diff.toVersion).toBe('1.0.1')
    expect(diff.changes).toEqual(changes)
  })

  it('diff throws for non-existent versions', async () => {
    const vm = new DefaultVersionManager()
    await expect(vm.getDiff('ds-1', '1.0.0', '2.0.0')).rejects.toThrow('Version not found')
  })

  it('deletes a version', async () => {
    const vm = new DefaultVersionManager()
    await vm.createVersion('ds-1', snapshot, releaseMeta)
    await vm.deleteVersion('ds-1', '1.0.0')
    const v = await vm.getVersion('ds-1', '1.0.0')
    expect(v).toBeNull()
  })

  it('generates a changelog from all versions', async () => {
    const vm = new DefaultVersionManager()
    await vm.createVersion('ds-1', snapshot, releaseMeta, [
      { type: 'added', category: 'color', description: 'Primary color', breaking: true },
    ])
    await new Promise((r) => setTimeout(r, 2))
    await vm.createVersion('ds-1', snapshot, {
      releaseDate: '2026-07-24', releaseNotes: 'Minor fixes', releasedBy: 'user-1',
    }, [
      { type: 'modified', category: 'color', description: 'Adjusted blue shade', breaking: false },
    ])
    const changelog = await vm.generateChangelog('ds-1')
    expect(changelog).toContain('# Changelog')
    expect(changelog).toContain('1.0.0')
    expect(changelog).toContain('1.0.1')
    expect(changelog).toContain('Primary color')
    expect(changelog).toContain('Adjusted blue shade')
  })

  it('generates changelog for version range', async () => {
    const vm = new DefaultVersionManager()
    await vm.createVersion('ds-1', snapshot, releaseMeta)
    await new Promise((r) => setTimeout(r, 2))
    await vm.createVersion('ds-1', snapshot, {
      releaseDate: '2026-07-24', releaseNotes: 'v2', releasedBy: 'user-1',
    })
    await new Promise((r) => setTimeout(r, 2))
    await vm.createVersion('ds-1', snapshot, {
      releaseDate: '2026-07-25', releaseNotes: 'v3', releasedBy: 'user-1',
    })
    const changelog = await vm.generateChangelog('ds-1', '1.0.0', '1.0.1')
    expect(changelog).toContain('1.0.0')
    expect(changelog).toContain('1.0.1')
    expect(changelog).not.toContain('1.0.2')
  })
})
