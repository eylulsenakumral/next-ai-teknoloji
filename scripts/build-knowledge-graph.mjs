#!/usr/bin/env node
/**
 * Understand-Anything Knowledge Graph Builder
 * Merges structural extraction results into GraphNode/GraphEdge format
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TMP = join(ROOT, '.understand-anything', 'tmp');
const OUT = join(ROOT, '.understand-anything');

// Category mappings
const CATEGORY_MAP = {
  'src/app': 'route',
  'src/components': 'component',
  'src/lib': 'library',
  'src/services': 'service',
  'src/workers': 'worker',
  'prisma': 'database',
  'scripts': 'script',
  'public': 'asset',
  'config': 'config',
  'test': 'test',
};

function detectCategory(filePath) {
  for (const [prefix, cat] of Object.entries(CATEGORY_MAP)) {
    if (filePath.startsWith(prefix)) return cat;
  }
  return 'other';
}

function detectLayer(filePath) {
  if (filePath.includes('/app/')) {
    if (filePath.includes('/api/')) return 'api';
    return 'ui';
  }
  if (filePath.includes('/components/')) return 'ui';
  if (filePath.includes('/lib/')) return 'library';
  if (filePath.includes('/services/')) return 'service';
  if (filePath.includes('/workers/')) return 'infrastructure';
  if (filePath.includes('prisma')) return 'data';
  if (filePath.includes('middleware')) return 'infrastructure';
  return 'other';
}

function generateNodeId(filePath) {
  return filePath.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

function cleanLanguage(lang, filePath) {
  if (lang && lang !== 'Unknown') return lang;
  const ext = extname(filePath);
  const map = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.py': 'Python', '.prisma': 'Prisma', '.json': 'JSON', '.css': 'CSS', '.scss': 'SCSS',
    '.md': 'Markdown', '.env': 'Environment', '.sql': 'SQL', '.sh': 'Shell', '.mjs': 'JavaScript',
  };
  return map[ext] || 'Unknown';
}

// Load scan result for import map
let importMap = {};
let scanFrameworks = [];
const scanResultPath = join(TMP, '..', 'intermediate', 'scan-result.json');
if (existsSync(scanResultPath)) {
  try {
    const scan = JSON.parse(readFileSync(scanResultPath, 'utf8'));
    importMap = scan.importMap || {};
    scanFrameworks = scan.frameworks || [];
  } catch {}
}

// Load all batch results
const allFiles = [];
const nodes = [];
const edges = [];
const nodeMap = new Map();

for (let i = 0; i < 23; i++) {
  const p = join(TMP, `ua-file-extract-results-${i}.json`);
  if (!existsSync(p)) continue;
  const batch = JSON.parse(readFileSync(p, 'utf8'));
  for (const file of batch.results || []) {
    allFiles.push(file);
  }
}

console.log(`Loaded ${allFiles.length} file records from 23 batches`);

// Deduplicate by path
const seen = new Set();
const uniqueFiles = allFiles.filter(f => {
  if (seen.has(f.path)) return false;
  seen.add(f.path);
  return true;
});

console.log(`Unique files: ${uniqueFiles.length}`);

// Build nodes
for (const file of uniqueFiles) {
  // Skip __pycache__, .pyc, node_modules
  if (file.path.includes('__pycache__') || file.path.endsWith('.pyc') ||
      file.path.includes('node_modules') || file.path.includes('.next')) continue;

  const id = generateNodeId(file.path);
  const category = file.fileCategory || detectCategory(file.path);
  const layer = detectLayer(file.path);
  const language = cleanLanguage(file.language, file.path);
  const definitions = (file.definitions || []).map(d => ({
    name: d.name,
    kind: d.kind,
    startLine: d.startLine,
    endLine: d.endLine,
    fields: d.fields || [],
  }));

  const node = {
    id,
    type: 'file',
    name: basename(file.path),
    path: file.path,
    language,
    category,
    layer,
    totalLines: file.totalLines || 0,
    nonEmptyLines: file.nonEmptyLines || 0,
    definitions,
    metrics: file.metrics || {},
    frameworks: [],
    imports: [],
    importedBy: [],
    complexity: 0,
  };

  // Calculate complexity
  node.complexity = Math.min(10, Math.floor((definitions.length * 0.5) + (file.nonEmptyLines / 100)));

  nodes.push(node);
  nodeMap.set(file.path, node);
}

console.log(`Created ${nodes.length} nodes`);

// Build edges from import map
let edgeId = 0;
for (const [filePath, imports] of Object.entries(importMap)) {
  const source = nodeMap.get(filePath);
  if (!source) continue;

  for (const imp of imports) {
    // Resolve relative imports
    let targetPath = imp;
    if (imp.startsWith('.')) {
      const dir = dirname(filePath);
      targetPath = join(dir, imp).replace(/\\/g, '/');
      // Try with extensions
      if (!nodeMap.has(targetPath)) {
        for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
          if (nodeMap.has(targetPath + ext)) {
            targetPath = targetPath + ext;
            break;
          }
        }
      }
      // Try index
      if (!nodeMap.has(targetPath)) {
        if (nodeMap.has(targetPath + '/index')) targetPath += '/index';
        if (nodeMap.has(targetPath + '/index.ts')) targetPath += '/index.ts';
        if (nodeMap.has(targetPath + '/index.tsx')) targetPath += '/index.tsx';
      }
    }

    const target = nodeMap.get(targetPath);
    if (!target) continue;

    const edge = {
      id: `edge_${edgeId++}`,
      source: source.id,
      target: target.id,
      type: 'imports',
      label: 'imports',
      weight: 1,
    };
    edges.push(edge);
    source.imports.push(target.path);
    target.importedBy.push(source.path);
  }
}

console.log(`Created ${edges.length} import edges`);

// Build dependency edges from definitions (e.g., Prisma model usage)
const prismaModels = [];
for (const node of nodes) {
  if (node.path === 'prisma/schema.prisma') {
    for (const def of node.definitions) {
      if (def.kind === 'model') {
        prismaModels.push({ name: def.name, nodeId: node.id });
      }
    }
  }
}

// Detect framework usage from imports
for (const node of nodes) {
  const imps = importMap[node.path] || [];
  for (const imp of imps) {
    if (imp.includes('next') || imp.includes('next/')) node.frameworks.push('Next.js');
    if (imp.includes('react')) node.frameworks.push('React');
    if (imp.includes('@prisma')) node.frameworks.push('Prisma');
    if (imp.includes('ioredis')) node.frameworks.push('Redis');
    if (imp.includes('openai')) node.frameworks.push('OpenAI');
    if (imp.includes('@whiskeysockets/baileys')) node.frameworks.push('Baileys');
    if (imp.includes('playwright') || imp.includes('puppeteer')) node.frameworks.push('Playwright');
    if (imp.includes('tailwindcss')) node.frameworks.push('Tailwind');
    if (imp.includes('zod')) node.frameworks.push('Zod');
    if (imp.includes('zustand')) node.frameworks.push('Zustand');
    if (imp.includes('minio')) node.frameworks.push('MinIO');
    if (imp.includes('next-auth')) node.frameworks.push('NextAuth');
    if (imp.includes('shadcn') || imp.includes('@/components/ui')) node.frameworks.push('shadcn/ui');
  }
  node.frameworks = [...new Set(node.frameworks)];
}

// Stats
const stats = {
  totalFiles: nodes.length,
  totalEdges: edges.length,
  totalLines: nodes.reduce((s, n) => s + n.totalLines, 0),
  totalDefinitions: nodes.reduce((s, n) => s + n.definitions.length, 0),
  languages: {},
  categories: {},
  layers: {},
  frameworks: {},
};

for (const node of nodes) {
  stats.languages[node.language] = (stats.languages[node.language] || 0) + 1;
  stats.categories[node.category] = (stats.categories[node.category] || 0) + 1;
  stats.layers[node.layer] = (stats.layers[node.layer] || 0) + 1;
  for (const fw of node.frameworks) {
    stats.frameworks[fw] = (stats.frameworks[fw] || 0) + 1;
  }
}

// Architecture layers
const architecture = [
  {
    name: 'Presentation (UI)',
    description: 'Next.js App Router pages, layouts, and React components',
    nodes: nodes.filter(n => n.layer === 'ui').map(n => n.id),
  },
  {
    name: 'API Layer',
    description: 'Next.js API routes and server actions',
    nodes: nodes.filter(n => n.layer === 'api').map(n => n.id),
  },
  {
    name: 'Services',
    description: 'Business logic services (pricing, scraping, WhatsApp, etc.)',
    nodes: nodes.filter(n => n.layer === 'service').map(n => n.id),
  },
  {
    name: 'Data Layer',
    description: 'Database schema, ORM client, and data access',
    nodes: nodes.filter(n => n.layer === 'data').map(n => n.id),
  },
  {
    name: 'Infrastructure',
    description: 'Workers, middleware, Redis, MinIO, and external integrations',
    nodes: nodes.filter(n => n.layer === 'infrastructure').map(n => n.id),
  },
  {
    name: 'Libraries',
    description: 'Shared utilities, helpers, and configuration',
    nodes: nodes.filter(n => n.layer === 'library').map(n => n.id),
  },
];

// Key relationships (domain-specific)
const domainEdges = [];

// Auth → User models
const authFiles = nodes.filter(n => n.path.includes('auth') || n.path.includes('middleware'));
for (const auth of authFiles) {
  for (const model of ['customer', 'admin', 'user']) {
    const modelNode = nodes.find(n => n.path.includes('schema') && n.definitions.some(d => d.name.toLowerCase() === model));
    if (modelNode) {
      domainEdges.push({
        id: `edge_domain_${domainEdges.length}`,
        source: auth.id,
        target: modelNode.id,
        type: 'uses',
        label: 'authenticates via',
        weight: 3,
      });
    }
  }
}

// Service → Prisma edges
const serviceNodes = nodes.filter(n => n.layer === 'service');
for (const svc of serviceNodes) {
  const db = nodes.find(n => n.path === 'prisma/schema.prisma');
  if (db && svc.imports.some(i => i.includes('prisma'))) {
    domainEdges.push({
      id: `edge_domain_${domainEdges.length}`,
      source: svc.id,
      target: db.id,
      type: 'dataAccess',
      label: 'queries database',
      weight: 3,
    });
  }
}

// API → Service edges
const apiNodes = nodes.filter(n => n.layer === 'api');
for (const api of apiNodes) {
  for (const svc of serviceNodes) {
    if (api.imports.some(i => i.includes(svc.path.replace(/^src\//, '').replace(/\.(ts|tsx)$/, '')))) {
      domainEdges.push({
        id: `edge_domain_${domainEdges.length}`,
        source: api.id,
        target: svc.id,
        type: 'calls',
        label: 'calls service',
        weight: 2,
      });
    }
  }
}

// Component → API edges (data fetching)
const uiNodes = nodes.filter(n => n.layer === 'ui');
for (const ui of uiNodes) {
  for (const api of apiNodes) {
    if (ui.imports.some(i => i.includes(api.path))) {
      domainEdges.push({
        id: `edge_domain_${domainEdges.length}`,
        source: ui.id,
        target: api.id,
        type: 'fetches',
        label: 'fetches from',
        weight: 2,
      });
    }
  }
}

console.log(`Created ${domainEdges.length} domain edges`);

const allEdges = [...edges, ...domainEdges];

// Final knowledge graph
const knowledgeGraph = {
  metadata: {
    name: 'next-ai-teknoloji',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    generator: 'Understand-Anything Knowledge Graph Builder',
    description: 'B2B technology dealer portal (nexadepo.com) - Next.js 16 + Prisma + WhatsApp AI',
  },
  stats,
  architecture,
  nodes,
  edges: allEdges,
  insights: {
    hotPaths: nodes
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10)
      .map(n => ({ path: n.path, complexity: n.complexity, definitions: n.definitions.length })),
    mostConnected: nodes
      .sort((a, b) => b.importedBy.length - a.importedBy.length)
      .slice(0, 10)
      .map(n => ({ path: n.path, importedBy: n.importedBy.length })),
    largestFiles: [...nodes]
      .sort((a, b) => b.totalLines - a.totalLines)
      .slice(0, 10)
      .map(n => ({ path: n.path, lines: n.totalLines })),
  },
};

// Save
const outPath = join(OUT, 'knowledge-graph.json');
writeFileSync(outPath, JSON.stringify(knowledgeGraph, null, 2));
console.log(`\nKnowledge graph saved to ${outPath}`);
console.log(`  Nodes: ${nodes.length}`);
console.log(`  Edges: ${allEdges.length} (${edges.length} imports + ${domainEdges.length} domain)`);
console.log(`  Total lines: ${stats.totalLines.toLocaleString()}`);
console.log(`  Total definitions: ${stats.totalDefinitions}`);
console.log(`  Languages: ${Object.entries(stats.languages).map(([k,v]) => `${k}(${v})`).join(', ')}`);
console.log(`  Frameworks: ${Object.entries(stats.frameworks).map(([k,v]) => `${k}(${v})`).join(', ')}`);
