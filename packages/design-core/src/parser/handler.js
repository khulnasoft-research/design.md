import YAML from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import { visit } from 'unist-util-visit';
export class ParserHandler {
    execute(input) {
        try {
            const { content } = input;
            const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']);
            const ast = processor.parse(content);
            const blocks = [];
            const sections = [];
            const headingsWithLines = [];
            let blockIndex = 0;
            visit(ast, (node) => {
                if (node.type === 'yaml') {
                    const yamlNode = node;
                    blocks.push({
                        yaml: yamlNode.value,
                        block: 'frontmatter',
                        startLine: node.position?.start.line ?? 1,
                    });
                }
                if (node.type === 'code') {
                    const codeNode = node;
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
                    const heading = node;
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
            const documentSections = [];
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
                    if (!current)
                        continue;
                    const next = headingsWithLines[i + 1];
                    const startIdx = current.line - 1;
                    const endIdx = next ? next.line - 1 : contentLines.length;
                    documentSections.push({
                        heading: current.text,
                        content: contentLines.slice(startIdx, endIdx).join('\n'),
                    });
                }
            }
            else {
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
                        message: 'No YAML content found. Expected frontmatter (---) or fenced yaml code blocks.',
                        recoverable: true,
                    },
                };
            }
            return this.mergeCodeBlocks(blocks, sections, documentSections);
        }
        catch (error) {
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
    mergeCodeBlocks(blocks, sections, documentSections) {
        const merged = {};
        const sourceMap = new Map();
        const seenSections = new Map();
        for (const block of blocks) {
            let parsed;
            try {
                parsed = YAML.parse(block.yaml);
                if (!parsed || typeof parsed !== 'object')
                    continue;
            }
            catch (error) {
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
                    const prevDesc = previousBlock === 'frontmatter' ? 'frontmatter' : `code block ${previousBlock + 1}`;
                    const currDesc = block.block === 'frontmatter' ? 'frontmatter' : `code block ${block.block + 1}`;
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
    toDesignSystem(raw, sourceMap, sections, documentSections) {
        return {
            version: typeof raw['version'] === 'string' ? raw['version'] : undefined,
            name: typeof raw['name'] === 'string' ? raw['name'] : undefined,
            description: typeof raw['description'] === 'string' ? raw['description'] : undefined,
            colors: raw['colors'],
            typography: raw['typography'],
            rounded: raw['rounded'],
            spacing: raw['spacing'],
            components: raw['components'],
            sourceMap,
            sections,
            documentSections,
            rawValues: raw,
        };
    }
    extractHeadingText(children) {
        return children
            .map((c) => ('value' in c ? c.value : ''))
            .join('')
            .trim();
    }
}
//# sourceMappingURL=handler.js.map