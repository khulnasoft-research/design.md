# Playground Deployment Checklist

## Pre-Deployment (24 hours before)

- [ ] Review all recent commits and changes
- [ ] Ensure all pull requests are merged and reviewed
- [ ] Run full test suite: `bun run test`
- [ ] Run type check: `bun run build` (includes TypeScript check)
- [ ] Run linter: `bun run lint`
- [ ] Run build verification script: `bash scripts/verify-build.sh`
- [ ] Check bundle sizes haven't increased significantly
- [ ] Review performance metrics from last deployment
- [ ] Verify all environment variables are documented
- [ ] Create deployment notes document

## Build Preparation

- [ ] Clear local build artifacts: `bun run clean` (if script exists)
- [ ] Install dependencies fresh: `bun install --production=false`
- [ ] Build all packages: `bun run build`
- [ ] Verify build artifacts exist:
  - [ ] `packages/design-core/dist/`
  - [ ] `packages/playground/dist/`
  - [ ] `packages/mcp-server/dist/`
- [ ] Check for build warnings or errors
- [ ] Verify source maps are generated
- [ ] Test build locally: `bun run packages/playground/dist/index.js` (if applicable)

## Code Quality

- [ ] ESLint passes: `bun run lint`
- [ ] No TypeScript errors: `bun run build`
- [ ] All tests passing: `bun run test`
- [ ] No console errors in development
- [ ] Code follows project standards
- [ ] All imports are correct
- [ ] No hardcoded secrets or API keys
- [ ] Security audit passes: `bun audit`

## Git Preparation

- [ ] All changes committed locally
- [ ] Commit messages are descriptive
- [ ] No uncommitted changes: `git status` (should be clean)
- [ ] Create release notes if major version bump
- [ ] Git history is clean and linear
- [ ] Ready to push to main branch

## Vercel Configuration

- [ ] Verify `vercel.json` is correct
- [ ] Confirm environment variables in Vercel dashboard:
  - [ ] `NODE_ENV=production`
  - [ ] `API_BASE_URL` set correctly
  - [ ] `MCP_SERVER_URL` set correctly
  - [ ] Any other required vars configured
- [ ] Check Vercel project settings:
  - [ ] Build command: `turbo build`
  - [ ] Install command: `bun install`
  - [ ] Output directory: configured correctly
  - [ ] Node version: compatible
- [ ] Verify deployment regions are set
- [ ] Check function configurations (max duration, memory)

## Deployment Execution

### Option 1: Automatic (via GitHub push)

- [ ] Push to main branch:
  ```bash
  git push origin main
  ```
- [ ] GitHub Actions triggers Vercel build
- [ ] Monitor build progress in Vercel dashboard
- [ ] Verify deployment completes successfully

### Option 2: Manual (via Vercel CLI)

- [ ] Install/update Vercel CLI: `bun add -g vercel`
- [ ] Login: `vercel login`
- [ ] Link project: `vercel link` (if not already linked)
- [ ] Deploy to preview: `vercel` (test first)
- [ ] Verify preview works correctly
- [ ] Deploy to production: `vercel --prod`
- [ ] Verify production deployment

### Option 3: Manual (via Vercel Dashboard)

- [ ] Go to Vercel dashboard
- [ ] Navigate to design.md project
- [ ] Click "Deployments" tab
- [ ] Click "Deploy" or select commit to deploy
- [ ] Monitor build progress
- [ ] Verify deployment completes

## Post-Deployment Verification

- [ ] Verify production URL is accessible
- [ ] Check Core Web Vitals in Vercel Analytics
- [ ] Test main functionality:
  - [ ] Load playground
  - [ ] File operations work
  - [ ] Editor renders correctly
  - [ ] Token browser displays tokens
  - [ ] API calls succeed
- [ ] Check error logs for any issues
- [ ] Verify no 404 or 500 errors
- [ ] Test on multiple devices/browsers:
  - [ ] Desktop Chrome
  - [ ] Desktop Firefox
  - [ ] Mobile Safari
  - [ ] Mobile Chrome
- [ ] Performance is acceptable (< 3s LCP)
- [ ] Images and assets load correctly
- [ ] No console errors in browser DevTools

## Monitoring

- [ ] Set up error tracking alerts (Sentry/similar)
- [ ] Enable Vercel Analytics
- [ ] Monitor server logs for errors
- [ ] Watch deployment metrics:
  - [ ] Response times
  - [ ] Error rates
  - [ ] Traffic patterns
- [ ] Check API performance
- [ ] Verify database connections (if applicable)

## Communication

- [ ] Notify team of deployment
- [ ] Update status page (if applicable)
- [ ] Post deployment notes in Slack/Discord
- [ ] Document any issues encountered
- [ ] Share deployment metrics with team

## Post-Deployment (24-48 hours)

- [ ] Monitor error tracking service
- [ ] Review user feedback
- [ ] Check analytics for anomalies
- [ ] Verify performance hasn't degraded
- [ ] Plan next deployment window
- [ ] Archive deployment notes

## Rollback Plan (if needed)

If issues arise:

1. **Immediate actions**:
   - [ ] Assess severity of issue
   - [ ] Notify team
   - [ ] Gather error information

2. **Rollback process**:

   ```bash
   # Via Vercel dashboard:
   # 1. Go to Deployments tab
   # 2. Find previous stable version
   # 3. Click three dots → "Promote to Production"

   # Via git:
   git revert <bad-commit-hash>
   git push origin main
   ```

3. **Post-rollback**:
   - [ ] Verify previous version is live
   - [ ] Document what went wrong
   - [ ] Create issue for investigation
   - [ ] Plan hotfix if needed

## Success Criteria

Deployment is considered successful when:

- ✓ Build completes without errors
- ✓ Production URL is accessible
- ✓ No critical errors in logs
- ✓ Core functionality works
- ✓ Performance metrics are acceptable
- ✓ No increase in error rates
- ✓ User feedback is positive (if available)

## Sign-off

- [ ] QA approval
- [ ] Product approval (if applicable)
- [ ] DevOps/Infrastructure approval
- [ ] Ready for production release

---

**Deployment Date**: ___________
**Deployer**: ___________
**Notes**:

---
