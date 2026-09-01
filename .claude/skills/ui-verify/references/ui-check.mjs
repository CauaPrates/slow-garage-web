// scripts/ui-check.mjs
// Verificação de UI por execução real: screenshots, overflow, axe-core, console.
//
// Uso:
//   node scripts/ui-check.mjs
//   node scripts/ui-check.mjs /v/abc/gastos /v/abc/abastecimentos
//   BASE_URL=http://localhost:5173 node scripts/ui-check.mjs
//
// Requer: npm i -D playwright @axe-core/playwright
//         npx playwright install chromium

import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT_DIR = '.ui-check';

const VIEWPORTS = [
  { name: '320', width: 320, height: 640 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
];

// Viewport extra: 390px de largura com altura reduzida, simulando teclado virtual aberto.
const KEYBOARD_VIEWPORT = { name: '390-teclado', width: 390, height: 380 };

const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];

const slug = (s) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';

async function checkRoute(browser, viewport, route) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  const result = {
    route,
    viewport: viewport.name,
    overflow: null,
    axe: [],
    consoleErrors,
    screenshot: null,
    error: null,
  };

  try {
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'networkidle',
      timeout: 20000,
    });
    if (response && response.status() >= 400) {
      result.error = `HTTP ${response.status()}`;
    }

    // Dá tempo para skeleton virar conteúdo.
    await page.waitForTimeout(600);

    // Overflow horizontal: falha dura.
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const scroll = Math.max(doc.scrollWidth, document.body.scrollWidth);
      const offenders = [];
      if (scroll > window.innerWidth) {
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 1 || r.left < -1) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className || '').toString().slice(0, 80),
              right: Math.round(r.right),
              left: Math.round(r.left),
            });
          }
          if (offenders.length >= 10) break;
        }
      }
      return { scrollWidth: scroll, innerWidth: window.innerWidth, offenders };
    });
    result.overflow = overflow;

    // Acessibilidade.
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    result.axe = axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 160)),
      count: v.nodes.length,
    }));

    const file = `${OUT_DIR}/${viewport.name}-${slug(route)}.png`;
    await page.screenshot({ path: file, fullPage: true });
    result.screenshot = file;
  } catch (err) {
    result.error = err.message;
  } finally {
    await context.close();
  }

  return result;
}

const results = [];
await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();

for (const viewport of [...VIEWPORTS, KEYBOARD_VIEWPORT]) {
  for (const route of routes) {
    const r = await checkRoute(browser, viewport, route);
    results.push(r);

    const flags = [];
    if (r.error) flags.push(`ERRO: ${r.error}`);
    if (r.overflow && r.overflow.scrollWidth > r.overflow.innerWidth) {
      flags.push(`OVERFLOW ${r.overflow.scrollWidth}px > ${r.overflow.innerWidth}px`);
    }
    const serious = r.axe.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    if (serious.length) flags.push(`AXE ${serious.length} serious/critical`);
    if (r.consoleErrors.length) flags.push(`CONSOLE ${r.consoleErrors.length}`);

    console.log(
      `${flags.length ? 'FALHA' : '  ok '} ${viewport.name.padEnd(11)} ${route.padEnd(32)} ${flags.join(' | ')}`,
    );
  }
}

await browser.close();
await writeFile(`${OUT_DIR}/report.json`, JSON.stringify(results, null, 2));

// Detalhe dos problemas, para leitura e para colar no verification.md.
const problems = results.filter(
  (r) =>
    r.error ||
    (r.overflow && r.overflow.scrollWidth > r.overflow.innerWidth) ||
    r.axe.some((v) => v.impact === 'critical' || v.impact === 'serious') ||
    r.consoleErrors.length,
);

if (problems.length) {
  console.log('\n--- DETALHE ---\n');
  for (const p of problems) {
    console.log(`[${p.viewport}] ${p.route}`);
    if (p.error) console.log(`  erro: ${p.error}`);
    if (p.overflow && p.overflow.scrollWidth > p.overflow.innerWidth) {
      console.log(`  overflow: ${p.overflow.scrollWidth} > ${p.overflow.innerWidth}`);
      for (const o of p.overflow.offenders) {
        console.log(`    <${o.tag} class="${o.cls}"> left=${o.left} right=${o.right}`);
      }
    }
    for (const v of p.axe) {
      if (v.impact === 'critical' || v.impact === 'serious') {
        console.log(`  axe [${v.impact}] ${v.id}: ${v.help} (${v.count}x)`);
        for (const n of v.nodes) console.log(`    ${n}`);
      }
    }
    for (const c of p.consoleErrors) console.log(`  console: ${c}`);
    console.log('');
  }
}

console.log(`\nScreenshots em ${OUT_DIR}/ · relatório em ${OUT_DIR}/report.json`);
console.log(problems.length ? `\n${problems.length} rota/viewport com problema.` : '\nNenhum problema automático.');
console.log('Olhe os screenshots — avaliação visual não é automatizável.');

process.exit(problems.length ? 1 : 0);
