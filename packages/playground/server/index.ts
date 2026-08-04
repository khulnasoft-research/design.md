import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  createDefaultLanguageModel,
  detectAvailableProvider,
  listConfiguredProviders,
} from '@scalify/ai-orchestration/providers';
import { analyzePrompt } from '@scalify/ai-orchestration/analyzer';
import { createAIGenerationService } from '@scalify/ai-orchestration/generation';
import { createFeedbackProcessor } from '@scalify/ai-orchestration/feedback';
import { OrchestrationService } from '@scalify/orchestration/service';
import { InMemoryWorkflowStore } from '@scalify/orchestration/storage';
import { DefaultValidationService } from '@scalify/orchestration/validation';

const STITCH_API_URL = process.env.STITCH_API_URL || 'https://stitch.withgoogle.com/api/mcp';
const STITCH_API_KEY = process.env.STITCH_API_KEY || '';
const PORT = parseInt(process.env.PORT || '3030');
const TENANT_ID = process.env.DEFAULT_TENANT_ID || 'playground';

interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

// ── Stitch MCP Client ───────────────────────────────────────────────────────

let client: Client | null = null;
let transport: StreamableHTTPClientTransport | null = null;

async function getClient() {
  if (client) return client;
  transport = new StreamableHTTPClientTransport(new URL(STITCH_API_URL), {
    headers: {
      'Content-Type': 'application/json',
      ...(STITCH_API_KEY ? { 'X-Goog-Api-Key' } : {}),
    },
  });
  client = new Client({ name: 'stitch-playground', version: '0.1.0' });
  await client.connect(transport);
  return client;
}

// ── Orchestration Service Singleton ──────────────────────────────────────────

let orchestration: OrchestrationService | null = null;

async function getOrchestration(): Promise<OrchestrationService> {
  if (orchestration) return orchestration;

  const store = new InMemoryWorkflowStore();
  const validation = new DefaultValidationService();

  const options: ConstructorParameters<typeof OrchestrationService>[0] = {
    store,
    validation,
  };

  // Wire up AI generation if a provider is available
  const provider = detectAvailableProvider();
  if (provider) {
    try {
      const model = await createDefaultLanguageModel();
      options.aiGeneration = createAIGenerationService({ model, temperature: 0.7 });
      options.feedbackProcessor = createFeedbackProcessor({ languageModel: model });
      console.log(`AI provider configured: ${provider}`);
    } catch (e) {
      console.warn(`Failed to initialize AI provider: ${(e as Error).message}`);
    }
  } else {
    console.warn('No AI provider configured. Generation will return queued status.');
  }

  orchestration = new OrchestrationService(options);
  return orchestration;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

function error(message: string, status = 500): Response {
  return Response.json({ error: message }, { status, headers: CORS_HEADERS });
}

function serializeDesignSystem(ds: {
  name?: string;
  description?: string;
  colors: Map<string, unknown>;
  typography: Map<string, unknown>;
  rounded: Map<string, unknown>;
  spacing: Map<string, unknown>;
  components: Map<string, unknown>;
}) {
  const colors: Record<string, unknown> = {};
  for (const [k, v] of ds.colors) colors[k] = v;
  const typography: Record<string, unknown> = {};
  for (const [k, v] of ds.typography) typography[k] = v;
  const rounded: Record<string, unknown> = {};
  for (const [k, v] of ds.rounded) rounded[k] = v;
  const spacing: Record<string, unknown> = {};
  for (const [k, v] of ds.spacing) spacing[k] = v;
  const components: Record<string, unknown> = {};
  for (const [k, v] of ds.components) components[k] = v;
  return { name: ds.name, description: ds.description, colors, typography, rounded, spacing, components };
}

// ── Route Handler ────────────────────────────────────────────────────────────

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ── Health & Config ──────────────────────────────────────────────────────

  if (url.pathname === '/api/health') {
    const providers = listConfiguredProviders();
    return json({
      ok: true,
      stitchUrl: STITCH_API_URL,
      hasStitchKey: !!STITCH_API_KEY,
      aiProviders: providers,
      defaultTenant: TENANT_ID,
    });
  }

  // ── Stitch MCP Proxy ─────────────────────────────────────────────────────

  if (url.pathname === '/api/tools') {
    try {
      const c = await getClient();
      const result = await c.listTools();
      return json(result);
    } catch (e) {
      return error((e as Error).message);
    }
  }

  if (url.pathname === '/api/call' && req.method === 'POST') {
    try {
      const body: MCPRequest = await req.json();
      const c = await getClient();
      const result = await c.request(
        { method: 'tools/call', params: { name: body.method, arguments: body.params } },
        { onprogress: () => {} }
      );
      return json(result);
    } catch (e) {
      return error((e as Error).message);
    }
  }

  // ── Workflow: Generate Design System ──────────────────────────────────────

  if (url.pathname === '/api/workflow/generate' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        prompt: string;
        tenantId?: string;
        title?: string;
        model?: string;
      };

      if (!body.prompt?.trim()) {
        return error('Prompt is required', 400);
      }

      const svc = await getOrchestration();
      const result = await svc.submitPrompt({
        prompt: body.prompt,
        tenantId: body.tenantId || TENANT_ID,
        metadata: {
          title: body.title || 'Design System from Prompt',
          createdBy: 'playground-user',
        },
      });

      // If draft was generated inline, fetch it
      let draft = null;
      if (result.status === 'draft_ready') {
        const draftId = (result as Record<string, unknown>).draftId as string | undefined;
        if (draftId) {
          try {
            const d = await svc.getDraft(draftId, result.tenantId);
            draft = {
              id: d.id,
              promptId: d.promptId,
              version: d.version,
              createdAt: d.createdAt,
              designSystem: serializeDesignSystem(d.designSystem),
              validationReport: d.validationReport,
              generationMetadata: d.generationMetadata,
            };
          } catch {
            // Draft not available yet
          }
        }
      }

      return json({ acknowledgment: result, draft });
    } catch (e) {
      return error(`Generation failed: ${(e as Error).message}`);
    }
  }

  // ── Workflow: Get Draft ───────────────────────────────────────────────────

  if (url.pathname.startsWith('/api/workflow/draft/') && req.method === 'GET') {
    try {
      const draftId = url.pathname.split('/api/workflow/draft/')[1];
      const tenantId = url.searchParams.get('tenantId') || TENANT_ID;
      const svc = await getOrchestration();
      const draft = await svc.getDraft(draftId, tenantId);
      return json({
        id: draft.id,
        promptId: draft.promptId,
        version: draft.version,
        createdAt: draft.createdAt,
        designSystem: serializeDesignSystem(draft.designSystem),
        validationReport: draft.validationReport,
        generationMetadata: draft.generationMetadata,
      });
    } catch (e) {
      return error((e as Error).message, 404);
    }
  }

  // ── Workflow: List Drafts ─────────────────────────────────────────────────

  if (url.pathname === '/api/workflow/drafts' && req.method === 'GET') {
    try {
      const tenantId = url.searchParams.get('tenantId') || TENANT_ID;
      const svc = await getOrchestration();
      const drafts = await svc.listDrafts(tenantId);
      return json({
        drafts: drafts.map((d) => ({
          id: d.id,
          promptId: d.promptId,
          version: d.version,
          createdAt: d.createdAt,
          name: d.designSystem.name,
          validationReport: d.validationReport,
        })),
      });
    } catch (e) {
      return error((e as Error).message);
    }
  }

  // ── Workflow: Submit Feedback ─────────────────────────────────────────────

  if (url.pathname === '/api/workflow/feedback' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        draftId: string;
        message: string;
        type?: 'refine' | 'regenerate' | 'reject';
        targetArea?: string;
        proposedChanges?: Record<string, unknown>;
        tenantId?: string;
      };

      if (!body.draftId || !body.message?.trim()) {
        return error('draftId and message are required', 400);
      }

      const svc = await getOrchestration();
      const result = await svc.submitFeedback({
        draftId: body.draftId,
        tenantId: body.tenantId || TENANT_ID,
        feedback: {
          type: body.type || 'refine',
          message: body.message,
          targetArea: body.targetArea,
        },
        proposedChanges: body.proposedChanges as Record<string, string>,
      });

      return json({
        iterationNumber: result.iterationNumber,
        designSystem: serializeDesignSystem(result.designSystem),
        validationReport: result.validationReport,
        changesSummary: result.changesSummary,
      });
    } catch (e) {
      return error(`Feedback failed: ${(e as Error).message}`);
    }
  }

  // ── Workflow: Approve Draft ───────────────────────────────────────────────

  if (url.pathname === '/api/workflow/approve' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        draftId: string;
        action?: 'approve' | 'reject';
        notes?: string;
        tenantId?: string;
      };

      if (!body.draftId) {
        return error('draftId is required', 400);
      }

      const svc = await getOrchestration();
      const result = await svc.submitApproval({
        draftId: body.draftId,
        tenantId: body.tenantId || TENANT_ID,
        action: body.action || 'approve',
        approverNotes: body.notes,
        metadata: { approvedBy: 'playground-user' },
      });

      return json({
        designSystemId: result.designSystemId,
        status: result.status,
        timestamp: result.timestamp,
        exportFormats: result.exportFormats,
      });
    } catch (e) {
      return error(`Approval failed: ${(e as Error).message}`);
    }
  }

  // ── Workflow: Export Design System ────────────────────────────────────────

  if (url.pathname === '/api/workflow/export' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        designSystemId: string;
        format: 'tailwind-v4' | 'tailwind-v3' | 'dtcg' | 'css';
        tenantId?: string;
      };

      if (!body.designSystemId || !body.format) {
        return error('designSystemId and format are required', 400);
      }

      const svc = await getOrchestration();
      const result = await svc.exportDesignSystem({
        designSystemId: body.designSystemId,
        tenantId: body.tenantId || TENANT_ID,
        format: body.format,
        metadata: { exportedBy: 'playground-user' },
      });

      return json({
        exportId: result.exportId,
        format: result.format,
        content: result.content,
        auditTrail: result.auditTrail,
      });
    } catch (e) {
      return error(`Export failed: ${(e as Error).message}`);
    }
  }

  // ── Workflow: Get Iteration History ───────────────────────────────────────

  if (url.pathname.startsWith('/api/workflow/history/') && req.method === 'GET') {
    try {
      const draftId = url.pathname.split('/api/workflow/history/')[1];
      const svc = await getOrchestration();
      const history = await svc.getIterationHistory(draftId);
      return json({ iterations: history });
    } catch (e) {
      return error((e as Error).message);
    }
  }

  // ── 404 ───────────────────────────────────────────────────────────────────

  return error('Not found', 404);
}

// ── Start Server ─────────────────────────────────────────────────────────────

Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`Scalify Playground API running on http://localhost:${PORT}`);
console.log(`Stitch API: ${STITCH_API_URL}`);

const providers = listConfiguredProviders();
if (providers.length > 0) {
  console.log(`AI providers: ${providers.map((p) => `${p.provider} (${p.modelId})`).join(', ')}`);
} else {
  console.warn('No AI provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY');
}
