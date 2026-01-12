#!/usr/bin/env -S deno run --allow-read

import { cat } from './src/cat.js';

const exitCode = await cat(
  Deno.args,
  Deno.open,
  Deno.stdin.readable,
  Deno.stdout.writable,
  Deno.stderr.writable
);

Deno.exit(exitCode);
