#!/usr/bin/env node

import { startServer } from './server.js';

startServer().catch((e) => {
  process.stderr.write(`Fatal error: ${e.message}\n`);
  process.exit(1);
});
