import { readFileSync, writeFileSync } from 'fs';

const kg = JSON.parse(readFileSync('.understand-anything/knowledge-graph.json', 'utf8'));
const scan = JSON.parse(readFileSync('.understand-anything/intermediate/scan-result.json', 'utf8'));

kg.metadata.frameworks = scan.frameworks;

const importMapFixed = {};
for (const [k, v] of Object.entries(scan.importMap)) {
  const fixed = k.replace(/^misafir\//, '');
  importMapFixed[fixed] = v.map(i => i.replace(/^misafir\//, ''));
}

const nodeMap = new Map(kg.nodes.map(n => [n.path, n]));
kg.nodes.forEach(n => { n.imports = []; n.importedBy = []; n.frameworks = []; });
let edgeId = 0;
const importEdges = [];

for (const [filePath, imports] of Object.entries(importMapFixed)) {
  const source = nodeMap.get(filePath);
  if (!source) continue;

  for (const imp of imports) {
    let targetPath = imp;
    if (imp.startsWith('.')) {
      const dir = filePath.substring(0, filePath.lastIndexOf('/'));
      let resolved = dir + '/' + imp;
      // Normalize path
      while (resolved.includes('/./')) resolved = resolved.replace(/\/.\//g, '/');
      while (resolved.match(/\/[^/]+\/\.\.\//)) resolved = resolved.replace(/\/[^/]+\/\.\.\//g, '/');
      targetPath = resolved;
    }

    const target = nodeMap.get(targetPath);
    if (!target) continue;

    importEdges.push({ id: `edge_${edgeId++}`, source: source.id, target: target.id, type: 'imports', label: 'imports', weight: 1 });
    source.imports.push(target.path);
    target.importedBy.push(source.path);

    if (imp.includes('next')) source.frameworks.push('Next.js');
    if (imp.includes('react')) source.frameworks.push('React');
    if (imp.includes('@prisma')) source.frameworks.push('Prisma');
    if (imp.includes('ioredis')) source.frameworks.push('Redis');
    if (imp.includes('openai')) source.frameworks.push('OpenAI');
    if (imp.includes('baileys')) source.frameworks.push('Baileys');
    if (imp.includes('puppeteer')) source.frameworks.push('Puppeteer');
    if (imp.includes('zod')) source.frameworks.push('Zod');
    if (imp.includes('zustand')) source.frameworks.push('Zustand');
    if (imp.includes('minio')) source.frameworks.push('MinIO');
    if (imp.includes('next-auth')) source.frameworks.push('NextAuth');
    if (imp.includes('@/components/ui')) source.frameworks.push('shadcn/ui');
  }
  source.frameworks = [...new Set(source.frameworks)];
}

const domainEdges = kg.edges.filter(e => e.type !== 'imports');
kg.edges = [...importEdges, ...domainEdges];
kg.stats.totalEdges = kg.edges.length;
kg.stats.frameworks = {};
kg.nodes.forEach(n => n.frameworks.forEach(fw => { kg.stats.frameworks[fw] = (kg.stats.frameworks[fw] || 0) + 1; }));

kg.insights.mostConnected = [...kg.nodes]
  .sort((a, b) => b.importedBy.length - a.importedBy.length)
  .slice(0, 10)
  .map(n => ({ path: n.path, importedBy: n.importedBy.length }));

writeFileSync('.understand-anything/knowledge-graph.json', JSON.stringify(kg, null, 2));

console.log('Fixed!');
console.log('Import edges:', importEdges.length);
console.log('Domain edges:', domainEdges.length);
console.log('Total edges:', kg.edges.length);
console.log('Frameworks:', kg.stats.frameworks);
console.log('\nTop connected files:');
kg.insights.mostConnected.forEach(n => console.log(`  ${n.path} (${n.importedBy} incoming)`));
