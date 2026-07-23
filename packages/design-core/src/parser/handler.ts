import YAML from 'yaml';
import type {
  ParserSpec,
  ParserInput,
  ParserResult,
  ParsedDesignSystem,
  SourceLocation,
} from './spec.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';
import type { Root, Code, Yaml, Heading, PhrasingContent } from 'mdast';

export class ParserHandler implements ParserSpec {
  execute(input: ParserInput): ParserResult {
    try {
      const { content } = input;
      const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']);

      const ast = processor.parse(content) as Root;
      const blocks: Array<{ yaml: string; block: 'frontmatter' | number; startLine: number }> = [];
      const sections: string[] = [];
      const headingsWithLines: Array<{ text: string; line: number }> = [];
      let blockIndex = 0;

      visit(ast, (node) => {
        if (node.type === 'yaml') {
          const yamlNode = node as Yaml;
          blocks.push({
            yaml: yamlNode.value,
            block: 'frontmatter',
            startLine: node.position?.start.line ?? 1,
          });
        }

        if (node.type === 'code') {
          const codeNode = node as Code;
          if (codeNode.lang === 'yaml' || codeNode.lang === 'yml') {
            blocks.push({
              yaml: codeNode.value,
              block: blockIndex,
              startLine: node.position?.start.line ?? 1,
            });
            blockIndex++;
          }
        }

        if (node.type === 'heading') {
          const heading = node as Heading;
          if (heading.depth === 2) {
            const text = this.extractHeadingText(heading.children);
            if (text) {
              sections.push(text);
              headingsWithLines.push({ text, line: node.position?.start.line ?? 1 });
            }
          }
        }
      });

      const contentLines = content.split('\n');
      const documentSections: Array<{ heading: string; content: string }> = [];

      const firstHeading = headingsWithLines[0];
      if (firstHeading) {
        const firstHeadingLine = firstHeading.line;
        if (firstHeadingLine > 1) {
          documentSections.push({
            heading: '',
            content: contentLines.slice(0, firstHeadingLine - 1).join('\n'),
          });
        }

        for (let i = 0; i < headingsWithLines.length; i++) {
          const current = headingsWithLines[i];
          if (!current) continue;

          const next = headingsWithLines[i + 1];
          const startIdx = current.line - 1;
          const endIdx = next ? next.line - 1 : contentLines.length;

          documentSections.push({
            heading: current.text,
            content: contentLines.slice(startIdx, endIdx).join('\n'),
          });
        }
      } else {
        documentSections.push({
          heading: '',
          content: content,
        });
      }

      if (blocks.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_YAML_FOUND',
            message:
              'No YAML content found. Expected frontmatter (---) or fenced yaml code blocks.',
            recoverable: true,
          },
        };
      }

      return this.mergeCodeBlocks(blocks, sections, documentSections);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : String(error),
          recoverable: false,
        },
      };
    }
  }

  private mergeCodeBlocks(
    blocks: Array<{ yaml: string; block: 'frontmatter' | number; startLine: number }>,
    sections: string[],
    documentSections: Array<{ heading: string; content: string }>
  ): ParserResult {
    const merged: Record<string, unknown> = {};
    const sourceMap = new Map<string, SourceLocation>();
    const seenSections = new Map<string, 'frontmatter' | number>();

    for (const block of blocks) {
      let parsed: Record<string, unknown>;
      try {
        parsed = YAML.parse(block.yaml) as Record<string, unknown>;
        if (!parsed || typeof parsed !== 'object') continue;
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'YAML_PARSE_ERROR',
            message: error instanceof Error ? error.message : String(error),
            recoverable: true,
          },
        };
      }

      for (const key of Object.keys(parsed)) {
        const previousBlock = seenSections.get(key);
        if (previousBlock !== undefined) {
          const prevDesc =
            previousBlock === 'frontmatter' ? 'frontmatter' : `code block ${previousBlock + 1}`;
          const currDesc =
            block.block === 'frontmatter' ? 'frontmatter' : `code block ${block.block + 1}`;
          return {
            success: false,
            error: {
              code: 'DUPLICATE_SECTION',
              message: `Section '${key}' is defined in both ${prevDesc} and ${currDesc}.`,
              recoverable: true,
            },
          };
        }
        seenSections.set(key, block.block);
        sourceMap.set(key, { line: block.startLine, column: 0, block: block.block });
      }

      Object.assign(merged, parsed);
    }

    return {
      success: true,
      data: this.toDesignSystem(merged, sourceMap, sections, documentSections),
    };
  }

  private toDesignSystem(
    raw: Record<string, unknown>,
    sourceMap: Map<string, SourceLocation>,
    sections: string[],
    documentSections: Array<{ heading: string; content: string }>
  ): ParsedDesignSystem {
    return {
      version: typeof raw['version'] === 'string' ? raw['version'] : undefined,
      name: typeof raw['name'] === 'string' ? raw['name'] : undefined,
      description: typeof raw['description'] === 'string' ? raw['description'] : undefined,
      colors: raw['colors'] as Record<string, string> | undefined,
      typography: raw['typography'] as Record<string, Record<string, string | number>> | undefined,
      rounded: raw['rounded'] as Record<string, string> | undefined,
      spacing: raw['spacing'] as Record<string, string> | undefined,
      components: raw['components'] as Record<string, Record<string, string>> | undefined,
      sourceMap,
      sections,
      documentSections,
      rawValues: raw,
    };
  }

  private extractHeadingText(children: PhrasingContent[]): string {
    return children
      .map((c) => ('value' in c ? c.value : ''))
      .join('')
      .trim();
  }
}
