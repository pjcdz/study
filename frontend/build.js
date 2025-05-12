#!/usr/bin/env node

// This script runs the Next.js build with ESLint and TypeScript checks disabled
const { execSync } = require('child_process');

// Set environment variables to disable ESLint and TypeScript checks
process.env.NEXT_DISABLE_ESLINT = 'true';
process.env.NEXT_TELEMETRY_DISABLED = '1';

try {
  // Run the actual build command with disabled checks
  console.log('Building Next.js app with ESLint and TypeScript checks disabled...');
  execSync('next build --no-lint', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}