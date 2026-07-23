const BASE = '';

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function health() {
  return api('/api/health');
}

export async function listTools(): Promise<{
  tools: Array<{ name: string; description: string }>;
}> {
  const data = await api('/api/tools');
  return {
    tools: (data as Record<string, unknown>).tools as Array<{ name: string; description: string }>,
  };
}

export async function callTool<T = unknown>(
  method: string,
  params?: Record<string, unknown>
): Promise<T> {
  const data = await api('/api/call', {
    method: 'POST',
    body: JSON.stringify({ id: crypto.randomUUID(), method, params }),
  });
  // MCP response: { content: [{ type: "text", text: "..." }], isError: false }
  const content = (data as Record<string, unknown>).content as
    Array<{ type: string; text: string }> | undefined;
  if (content && content.length > 0) {
    try {
      return JSON.parse(content[0].text) as T;
    } catch {
      return content[0].text as unknown as T;
    }
  }
  return data as unknown as T;
}

export async function listProjects(filter?: string) {
  return callTool<{ projects: Array<Record<string, unknown>> }>(
    'list_projects',
    filter ? { filter } : undefined
  );
}

export async function getProject(name: string) {
  return callTool<Record<string, unknown>>('get_project', { name });
}

export async function listScreens(projectId: string) {
  return callTool<{ screens: Array<Record<string, unknown>> }>('list_screens', { projectId });
}

export async function getScreen(name: string) {
  return callTool<Record<string, unknown>>('get_screen', { name });
}

export async function generateScreen(
  projectId: string,
  prompt: string,
  deviceType?: string,
  designSystem?: string
) {
  return callTool<Record<string, unknown>>('generate_screen_from_text', {
    projectId,
    prompt,
    ...(deviceType ? { deviceType } : {}),
    ...(designSystem ? { designSystem } : {}),
  });
}

export async function editScreens(projectId: string, screenIds: string[], prompt: string) {
  return callTool<Record<string, unknown>>('edit_screens', {
    projectId,
    selectedScreenIds: screenIds,
    prompt,
  });
}

export async function generateVariants(
  projectId: string,
  screenIds: string[],
  prompt: string,
  variantOptions?: { variantCount?: number; creativeRange?: string; aspects?: string[] }
) {
  return callTool<Record<string, unknown>>('generate_variants', {
    projectId,
    selectedScreenIds: screenIds,
    prompt,
    variantOptions: variantOptions || { variantCount: 3, creativeRange: 'EXPLORE' },
  });
}

// New MCP tools for DESIGN.md
export async function lintDesignMd(path: string) {
  return callTool<Record<string, unknown>>('lint_design_md', { path });
}

export async function exportDesignMd(
  path: string,
  format: 'json-tailwind' | 'css-tailwind' | 'dtcg'
) {
  return callTool<Record<string, unknown>>('export_design_md', { path, format });
}

export async function diffDesignMd(before: string, after: string) {
  return callTool<Record<string, unknown>>('diff_design_md', { before, after });
}

export async function readDesignMd(path: string) {
  return callTool<Record<string, unknown>>('read_design_md', { path });
}

export async function writeDesignMd(
  path: string,
  body: string,
  frontmatter?: Record<string, unknown>
) {
  return callTool<Record<string, unknown>>('write_design_md', {
    path,
    body,
    ...(frontmatter ? { frontmatter } : {}),
  });
}

export async function extractTokenReference(path: string, tokenPath: string) {
  return callTool<Record<string, unknown>>('extract_token_reference', { path, tokenPath });
}

export async function validateComponentTokens(path: string, component: string) {
  return callTool<Record<string, unknown>>('validate_component_tokens', { path, component });
}

export async function mergeDesignTokens(paths: string[], strategy?: 'override' | 'combine') {
  return callTool<Record<string, unknown>>('merge_design_tokens', { paths, strategy });
}
