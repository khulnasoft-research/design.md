/**
 * Design System Versioning
 *
 * Manages versions, releases, and change tracking for design systems.
 * Supports semantic versioning and changelog generation.
 */

/**
 * Semantic version
 */
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Version metadata
 */
export interface VersionMetadata {
  /** Version string (e.g., "1.0.0") */
  version: string;
  /** Release date */
  releaseDate: string;
  /** Release notes/changelog */
  releaseNotes: string;
  /** Author of this version */
  releasedBy: string;
  /** Is this a prerelease? */
  prerelease?: boolean;
  /** Build metadata */
  build?: string;
}

/**
 * Design system version record
 */
export interface DesignSystemVersion {
  /** Design system ID */
  designSystemId: string;
  /** Version metadata */
  metadata: VersionMetadata;
  /** When this version was created */
  createdAt: string;
  /** Snapshot of the design system at this version */
  snapshot: Record<string, unknown>;
  /** Previous version ID (for diffs) */
  previousVersionId?: string;
  /** Tags for this version (e.g., "production", "staging") */
  tags: string[];
}

/**
 * Change entry in version history
 */
export interface ChangeEntry {
  /** Type of change */
  type: 'added' | 'modified' | 'removed' | 'fixed' | 'deprecated';
  /** What was changed */
  category: 'color' | 'typography' | 'spacing' | 'component' | 'token' | 'other';
  /** Description */
  description: string;
  /** Breaking change? */
  breaking: boolean;
}

/**
 * Version diff
 */
export interface VersionDiff {
  /** From version */
  fromVersion: string;
  /** To version */
  toVersion: string;
  /** Changes */
  changes: ChangeEntry[];
  /** Summary */
  summary: {
    added: number;
    modified: number;
    removed: number;
    breaking: number;
  };
}

/**
 * Version management interface
 */
export interface VersionManager {
  /** Create a new version */
  createVersion(
    designSystemId: string,
    designSystem: Record<string, unknown>,
    metadata: Omit<VersionMetadata, 'version'>,
    changes?: ChangeEntry[]
  ): Promise<DesignSystemVersion>;

  /** Get a specific version */
  getVersion(designSystemId: string, version: string): Promise<DesignSystemVersion | null>;

  /** Get all versions of a design system */
  listVersions(designSystemId: string): Promise<DesignSystemVersion[]>;

  /** Get the latest version */
  getLatestVersion(designSystemId: string): Promise<DesignSystemVersion | null>;

  /** Tag a version */
  tagVersion(designSystemId: string, version: string, tag: string): Promise<void>;

  /** Get diff between two versions */
  getDiff(designSystemId: string, fromVersion: string, toVersion: string): Promise<VersionDiff>;

  /** Delete a version */
  deleteVersion(designSystemId: string, version: string): Promise<void>;

  /** Generate changelog */
  generateChangelog(
    designSystemId: string,
    fromVersion?: string,
    toVersion?: string
  ): Promise<string>;
}

/**
 * Version comparison utilities
 */
export class VersionComparator {
  static parseVersion(versionString: string): SemanticVersion {
    const parts = versionString.split('.');
    return {
      major: parseInt(parts[0], 10) || 0,
      minor: parseInt(parts[1], 10) || 0,
      patch: parseInt(parts[2], 10) || 0,
    };
  }

  static formatVersion(version: SemanticVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
  }

  static compareVersions(v1: string, v2: string): number {
    const ver1 = this.parseVersion(v1);
    const ver2 = this.parseVersion(v2);

    if (ver1.major !== ver2.major) {
      return ver1.major - ver2.major;
    }
    if (ver1.minor !== ver2.minor) {
      return ver1.minor - ver2.minor;
    }
    return ver1.patch - ver2.patch;
  }

  static isGreater(v1: string, v2: string): boolean {
    return this.compareVersions(v1, v2) > 0;
  }

  static isEqual(v1: string, v2: string): boolean {
    return this.compareVersions(v1, v2) === 0;
  }

  static incrementVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
    const parsed = this.parseVersion(version);

    switch (type) {
      case 'major':
        parsed.major += 1;
        parsed.minor = 0;
        parsed.patch = 0;
        break;
      case 'minor':
        parsed.minor += 1;
        parsed.patch = 0;
        break;
      case 'patch':
        parsed.patch += 1;
        break;
    }

    return this.formatVersion(parsed);
  }
}

/**
 * Default in-memory version manager implementation
 */
export class DefaultVersionManager implements VersionManager {
  private versions: Map<string, DesignSystemVersion[]> = new Map();
  private versionChangeLog: Map<string, ChangeEntry[]> = new Map();

  async createVersion(
    designSystemId: string,
    designSystem: Record<string, unknown>,
    metadata: Omit<VersionMetadata, 'version'>,
    changes?: ChangeEntry[]
  ): Promise<DesignSystemVersion> {
    // Get existing versions to determine next version number
    const existing = this.versions.get(designSystemId) || [];
    const latestVersion = existing.length > 0 ? existing[existing.length - 1] : null;

    // Determine next version
    let nextVersion = '1.0.0';
    if (latestVersion) {
      // Auto-increment patch version
      nextVersion = VersionComparator.incrementVersion(latestVersion.metadata.version, 'patch');
    }

    const version: DesignSystemVersion = {
      designSystemId,
      metadata: {
        ...metadata,
        version: nextVersion,
      },
      createdAt: new Date().toISOString(),
      snapshot: JSON.parse(JSON.stringify(designSystem)),
      previousVersionId: latestVersion?.metadata.version,
      tags: [],
    };

    existing.push(version);
    this.versions.set(designSystemId, existing);

    // Store changelog
    if (changes) {
      this.versionChangeLog.set(nextVersion, changes);
    }

    return version;
  }

  async getVersion(designSystemId: string, version: string): Promise<DesignSystemVersion | null> {
    const versions = this.versions.get(designSystemId) || [];
    return versions.find((v) => v.metadata.version === version) || null;
  }

  async listVersions(designSystemId: string): Promise<DesignSystemVersion[]> {
    return this.versions.get(designSystemId) || [];
  }

  async getLatestVersion(designSystemId: string): Promise<DesignSystemVersion | null> {
    const versions = this.versions.get(designSystemId) || [];
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }

  async tagVersion(designSystemId: string, version: string, tag: string): Promise<void> {
    const versions = this.versions.get(designSystemId) || [];
    const targetVersion = versions.find((v) => v.metadata.version === version);

    if (targetVersion && !targetVersion.tags.includes(tag)) {
      targetVersion.tags.push(tag);
    }
  }

  async getDiff(
    designSystemId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<VersionDiff> {
    const from = await this.getVersion(designSystemId, fromVersion);
    const to = await this.getVersion(designSystemId, toVersion);

    if (!from || !to) {
      throw new Error('Version not found');
    }

    const changes = this.versionChangeLog.get(toVersion) || [];

    return {
      fromVersion,
      toVersion,
      changes,
      summary: {
        added: changes.filter((c) => c.type === 'added').length,
        modified: changes.filter((c) => c.type === 'modified').length,
        removed: changes.filter((c) => c.type === 'removed').length,
        breaking: changes.filter((c) => c.breaking).length,
      },
    };
  }

  async deleteVersion(designSystemId: string, version: string): Promise<void> {
    const versions = this.versions.get(designSystemId) || [];
    this.versions.set(
      designSystemId,
      versions.filter((v) => v.metadata.version !== version)
    );
    this.versionChangeLog.delete(version);
  }

  async generateChangelog(
    designSystemId: string,
    fromVersion?: string,
    toVersion?: string
  ): Promise<string> {
    const versions = await this.listVersions(designSystemId);

    let relevantVersions = versions;
    if (fromVersion) {
      const fromIdx = versions.findIndex((v) => v.metadata.version === fromVersion);
      if (fromIdx >= 0) {
        relevantVersions = versions.slice(fromIdx);
      }
    }
    if (toVersion) {
      const toIdx = versions.findIndex((v) => v.metadata.version === toVersion);
      if (toIdx >= 0) {
        relevantVersions = versions.slice(0, toIdx + 1);
      }
    }

    const lines: string[] = ['# Changelog\n'];

    for (const version of relevantVersions.reverse()) {
      lines.push(`## ${version.metadata.version} - ${version.metadata.releaseDate}`);
      lines.push(`Released by: ${version.metadata.releasedBy}\n`);
      lines.push(version.metadata.releaseNotes);
      lines.push('');

      const changes = this.versionChangeLog.get(version.metadata.version);
      if (changes && changes.length > 0) {
        lines.push('### Changes');
        for (const change of changes) {
          const icon = change.breaking ? '‼️' : '•';
          lines.push(`${icon} [${change.category}] ${change.description}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}
