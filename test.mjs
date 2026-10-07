import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const UPSTREAM = ['oxbshw', 'ozmaki', 'harikp2002'];
const TEXT_EXTS = new Set(['.md', '.json', '.html', '.sh', '.yml', '.yaml', '.txt', '.css', '.js', '.mjs', '.ts', '.tsx', '.rs', '.toml', '.cff']);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules' || entry === 'test.mjs' || entry === 'target' || entry === 'Cargo.lock') continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) results.push(...walk(full));
    else if (TEXT_EXTS.has(extname(full))) results.push(full);
  }
  return results;
}

console.log('\n🔍 AgentSpan — Verification Suite\n');

// 1. No upstream references
console.log('📝 Upstream cleanliness');
const files = walk(ROOT);
for (const f of files) {
  const content = readFileSync(f, 'utf8');
  const rel = f.replace(ROOT + '/', '');
  for (const term of UPSTREAM) {
    test(`${rel} has no "${term}"`, () => {
      assert(!content.toLowerCase().includes(term.toLowerCase()),
        `Found "${term}" in ${rel}`);
    });
  }
}

// 2. Required files exist
console.log('\n📦 Required files');
const required = ['LICENSE', 'README.md', 'CITATION.cff', 'MAINTAINERS.md', 'Cargo.toml', 'CONTRIBUTORS.md'];
for (const f of required) {
  test(`${f} exists`, () => {
    assert(statSync(join(ROOT, f)).isFile(), `Missing ${f}`);
  });
}

// 3. LICENSE contains Abdullah Formuli
console.log('\n🔐 License check');
const license = readFileSync(join(ROOT, 'LICENSE'), 'utf8');
test('LICENSE mentions Abdullah Formuli', () => {
  assert(license.includes('Abdullah Formuli'), 'Missing Abdullah Formuli in LICENSE');
});

// 4. Cargo config points to correct repo
console.log('\n📦 Cargo.toml check');
const cargo = readFileSync(join(ROOT, 'Cargo.toml'), 'utf8');
test('Cargo.toml author is Abdullah Formuli', () => {
  assert(cargo.includes('Abdullah Formuli'), 'Missing Abdullah Formuli in Cargo.toml');
});
test('Cargo.toml repository points to authrain-cloud-abdullahformuli', () => {
  assert(cargo.includes('authrain-cloud-abdullahformuli'), 'Missing authrain-cloud-abdullahformuli in Cargo.toml');
});

// 5. Crates check
console.log('\n🦀 Crates check');
const expectedCrates = [
  'agentspan-api',
  'agentspan-auth',
  'agentspan-cache',
  'agentspan-channels',
  'agentspan-cli',
  'agentspan-core',
  'agentspan-mcp',
  'agentspan-probe',
  'agentspan-router'
];
for (const c of expectedCrates) {
  test(`crates/${c}/Cargo.toml exists`, () => {
    assert(statSync(join(ROOT, 'crates', c, 'Cargo.toml')).isFile(), `Missing crates/${c}/Cargo.toml`);
  });
}

// 6. SDKs check
console.log('\n📚 SDKs check');
const expectedSdks = ['csharp', 'go', 'java', 'js', 'php', 'python', 'ruby', 'rust', 'swift'];
for (const s of expectedSdks) {
  test(`sdk/${s} exists`, () => {
    assert(statSync(join(ROOT, 'sdk', s)).isDirectory(), `Missing sdk/${s}`);
  });
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
