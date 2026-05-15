#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: copilot-skill <map|summary|analyze> [--out <path>] [--depth N] [--commit]');
  process.exit(1);
}

const argv = process.argv.slice(2);
if (argv.length === 0) usage();

let cmd = argv[0];
let outPath = 'docs';
let maxDepth = Infinity;
let doCommit = false;
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if ((a === '-o' || a === '--out') && argv[i + 1]) outPath = argv[++i];
  else if (a === '--depth' && argv[i + 1]) maxDepth = Number(argv[++i]);
  else if (a === '--commit') doCommit = true;
  else { console.warn('Unknown arg', a); usage(); }
}

const root = process.cwd();
const ignore = new Set(['.git', 'node_modules', '.vs', 'dist', 'build', 'docs']);
function ensureOut(dir) { fs.mkdirSync(dir, { recursive: true }); }

function scanRepo(depthLimit = Infinity) {
  const nodes = [];
  const edges = [];
  let id = 0;
  function addNode(label, meta) {
    const nid = 'n' + (++id);
    nodes.push({ id: nid, label, meta });
    return nid;
  }
  function walk(dir, parentId, depth) {
    if (depth > depthLimit) return;
    const label = path.basename(dir) || dir;
    const nodeId = addNode(label, { type: 'dir', path: path.relative(root, dir) || '.' });
    if (parentId) edges.push({ from: parentId, to: nodeId });
    let items;
    try { items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)); }
    catch { return; }
    for (const it of items) {
      if (ignore.has(it.name)) continue;
      const full = path.join(dir, it.name);
      if (it.isDirectory()) walk(full, nodeId, depth + 1);
      else {
        const fid = addNode(it.name, { type: 'file', path: path.relative(root, full) });
        edges.push({ from: nodeId, to: fid });
      }
    }
  }
  walk(root, null, 0);
  return { nodes, edges };
}

function escapeLabel(s) {
  return String(s).replace(/"/g, '\\"').replace(/&/g, '&amp;');
}

function generateMermaidHtml(map, title) {
  const mermaidLines = ['graph TB'];
  for (const n of map.nodes) {
    const label = escapeLabel(n.label + (n.meta && n.meta.path ? `\\n${n.meta.path}` : ''));
    mermaidLines.push(`${n.id}["${label}"]`);
  }
  for (const e of map.edges) mermaidLines.push(`${e.from} --> ${e.to}`);
  const mermaidText = mermaidLines.join('\n');
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeLabel(title)}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;margin:1rem}.mermaid{max-width:100%;overflow:auto}</style>
</head>
<body>
  <h1>${escapeLabel(title)}</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <div class="mermaid">
${mermaidText.split('\n').map(l => '    ' + l).join('\n')}
  </div>
  <script src="https://unpkg.com/mermaid@10/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad:true, theme:'default' });</script>
</body>
</html>`;
}

function generateSummary() {
  const counts = {};
  const dirCounts = {};
  function walk(dir) {
    let items;
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const it of items) {
      if (ignore.has(it.name)) continue;
      const full = path.join(dir, it.name);
      if (it.isDirectory()) {
        dirCounts[path.relative(root, full) || '.'] = (dirCounts[path.relative(root, full) || '.'] || 0);
        walk(full);
      } else {
        const ext = path.extname(it.name).toLowerCase() || '<noext>';
        counts[ext] = (counts[ext] || 0) + 1;
        const d = path.dirname(path.relative(root, full)) || '.';
        dirCounts[d] = (dirCounts[d] || 0) + 1;
      }
    }
  }
  walk(root);
  return { counts, dirCounts, generated: new Date().toISOString(), repo: path.basename(root) || root };
}

function writeFileSafely(p, content) {
  ensureOut(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
  console.log('Wrote', p);
}

function maybeCommit(files) {
  if (!doCommit) return;
  try {
    const execSync = require('child_process').execSync;
    execSync('git add ' + files.map(f => `"${f}"`).join(' '), { stdio: 'inherit' });
    execSync('git commit -m "chore: update copilot-skill outputs [ci skip]" || true', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('Committed and pushed outputs.');
  } catch (e) {
    console.warn('Auto-commit failed:', e.message);
  }
}

(async function main() {
  try {
    if (cmd === 'map' || cmd === 'analyze') {
      const map = scanRepo(maxDepth);
      const html = generateMermaidHtml(map, `Project Map - ${path.basename(root) || root}`);
      const outFile = path.join(outPath, 'project-map.html');
      writeFileSafely(outFile, html);
      if (doCommit) maybeCommit([outFile]);
    }
    if (cmd === 'summary' || cmd === 'analyze') {
      const summary = generateSummary();
      const jsonOut = path.join(outPath, 'project-summary.json');
      const mdOut = path.join(outPath, 'project-summary.md');
      writeFileSafely(jsonOut, JSON.stringify(summary, null, 2));
      const md = `# Project Summary: ${escapeLabel(summary.repo)}

Generated: ${summary.generated}

## File counts by extension
${Object.entries(summary.counts).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `- ${k}: ${v}`).join('\n')}

## Top directories by file count
${Object.entries(summary.dirCounts).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([k,v]) => `- ${k}: ${v}`).join('\n')}
`;
      writeFileSafely(mdOut, md);
      if (doCommit) maybeCommit([jsonOut, mdOut]);
    }
    if (!['map','summary','analyze'].includes(cmd)) usage();
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
