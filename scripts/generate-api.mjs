import { mkdir, writeFile } from 'node:fs/promises';
import openapiTS, { astToString } from 'openapi-typescript';

const url = new URL('/docs-json', process.env.API_SCHEMA_BASE_URL ?? 'http://localhost:3100');
const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`OpenAPI request failed: ${response.status}`);
const document = await response.json();
await mkdir('src/api', { recursive: true });
await mkdir('docs', { recursive: true });
await writeFile('docs/openapi.json', JSON.stringify(document, null, 2) + '\n');
await writeFile('src/api/generated.ts', astToString(await openapiTS(document)));
console.log(`Generated API types from ${url}`);
