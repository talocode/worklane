import { chmod, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['packages/cli/src/cli.ts'],
  outfile: 'dist/worklane.js',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  sourcemap: false,
});
await chmod('dist/worklane.js', 0o755);
