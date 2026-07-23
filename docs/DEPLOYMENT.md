# Production Deployment Guide

## Overview

This document covers deploying the design.md monorepo to production environments, specifically focusing on the playground web application.

## Pre-deployment Checklist

- [ ] All tests passing: `bun run test`
- [ ] No TypeScript errors: `bun run type-check`
- [ ] Lint check passed: `bun run lint`
- [ ] Environment variables configured in `.env.production`
- [ ] Database migrations completed (if applicable)
- [ ] Security audit passed: `bun audit`

## Environment Setup

### Production Environment Variables

Create `.env.production` with:

```bash
NODE_ENV=production
VERCEL_ENV=production
API_BASE_URL=https://api.design-md.dev
MCP_SERVER_URL=https://mcp.design-md.dev
```

### Vercel Configuration

The project uses Vercel for hosting with automatic deployments from the main branch.

**Project ID**: Set in `vercel.json` or Vercel dashboard
**Org ID**: Set in environment variables

## Deployment Steps

### Step 1: Pre-Deployment Verification

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run linting
bun run lint

# Run tests (if configured)
bun run test
```

### Step 2: Vercel Deployment (Recommended)

The playground is configured for automatic deployment on Vercel.

**Automatic Deploy**:

1. Push to main branch: `git push origin main`
2. GitHub automatically triggers Vercel build
3. Vercel builds using `turbo build` command
4. Deployment completes in 2-5 minutes

**Manual Deploy via CLI**:

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy to preview (test environment)
vercel

# Deploy to production
vercel --prod
```

**Manual Deploy via Dashboard**:

1. Go to https://vercel.com/dashboard
2. Select "design.md" project
3. Click "Deployments" tab
4. Select a deployment to promote to production

### Step 3: Verify Deployment

After deployment completes:

```bash
# Check deployment status
curl https://design-md.vercel.app/api/health

# View logs
vercel logs

# Open deployed URL
vercel env pull .env.production.local
```

## Deployment Options

### Option 1: Vercel (Recommended - Automatic)

This is the primary deployment method. Vercel automatically:

- Detects code changes via GitHub
- Builds using Turbo with caching
- Deploys to global CDN
- Provides automatic HTTPS
- Handles scaling automatically

### Option 2: Docker Deployment

```bash
# Build Docker image
docker build -t design-md:latest .

# Run container locally
docker run -p 3000:3000 design-md:latest

# Push to registry (e.g., Docker Hub)
docker tag design-md:latest yourusername/design-md:latest
docker push yourusername/design-md:latest
```

### Option 3: Self-Hosted Deployment

```bash
# Build all packages
bun run build

# Install production dependencies
bun install --production

# Start server
NODE_ENV=production bun run packages/playground/dist/index.js
```

## Performance Optimization

The build includes:

- Code splitting with Rollup (vendor, CodeMirror, Lucide)
- Minification with Terser
- Tree-shaking of unused code
- Gzip compression analysis
- Source map generation for debugging

Check bundle size:

```bash
bun run build:analyze
```

## Monitoring and Logging

### Vercel Analytics

Enable Analytics in Vercel Dashboard:

1. Go to Project Settings
2. Enable Analytics
3. View metrics at https://vercel.com/analytics

### Error Tracking

Configure Sentry for error tracking:

```bash
export SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## Rollback Procedures

### Vercel Rollback

1. Go to Vercel Dashboard
2. Select the project
3. Go to Deployments
4. Click the previous stable deployment
5. Click "Promote to Production"

### Manual Rollback

```bash
git revert <commit-hash>
git push origin main
```

## Database Migrations

For schema changes:

```bash
bun run db:migrate:prod
```

## API Rate Limiting

The MCP Server includes rate limiting:

- 100 requests per minute per IP
- Burst: 200 requests per 10 seconds

Configure in environment:

```bash
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=100
```

## Scaling

### Horizontal Scaling

- Playground: Stateless, can scale horizontally
- MCP Server: Requires session affinity if using in-memory cache
- CLI: No scaling needed (client-side)

### Caching Strategy

- CDN: Static assets cached for 1 year (with versioning)
- API: Cache tokens for 5 minutes
- Design system: Cache for 1 hour

## Security Checklist

- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] API keys rotated
- [ ] Secrets not in git
- [ ] Dependencies audited for vulnerabilities
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] OWASP Top 10 assessed

## Performance Targets

- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

Measure with:

```bash
bun run vercel:analytics
```

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
bun run clean
bun install
bun run build
```

### Performance Issues

```bash
# Analyze bundle
bun run build:analyze

# Profile runtime
NODE_OPTIONS=--inspect bun run packages/playground/dist/index.js
```

### Deployment Errors

1. Check build logs: `vercel logs`
2. Verify environment variables set
3. Check git history for recent changes
4. Review error tracking service (Sentry)

## Support

- Documentation: https://design-md.dev/docs
- Issues: https://github.com/khulnasoft-bot/design.md/issues
- Discussions: https://github.com/khulnasoft-bot/design.md/discussions
