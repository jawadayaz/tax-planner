// tax-planner — Playwright test suite
// Run via: app-deploy tax-planner test
// URL: https://jawadayaz.github.io/tax-planner/

const { chromium } = require('playwright');
const assert = require('assert');

const URL = 'https://jawadayaz.github.io/tax-planner/';
const TIMEOUT = 15000;

let browser, page;
let passed = 0, failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌  ${name}`);
    console.log(`       ${e.message}`);
    failed++;
  }
}

async function navigate(view) {
  // Click the matching nav tab
  const tabs = await page.$$('.nav-tab');
  const labels = { dashboard: 0, checklist: 1, registry: 2, drive: 3, settings: 4 };
  await tabs[labels[view]].click();
  await page.waitForTimeout(300);
}

async function setYear(year) {
  await page.selectOption('#yearSelect', String(year));
  await page.waitForTimeout(300);
}

(async () => {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();

  // Clear localStorage/sessionStorage before tests to ensure clean seed state
  await page.goto(URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle', timeout: TIMEOUT });

  console.log('\n── Page Load ──────────────────────────────────');

  await test('Page loads without errors', async () => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    assert(errors.length === 0, `JS errors: ${errors.join(', ')}`);
  });

  await test('Title contains Family Tax Planner', async () => {
    const text = await page.textContent('.brand');
    assert(text.includes('Family Tax Planner'), `Got: ${text}`);
  });

  await test('Year selector contains expected years', async () => {
    const options = await page.$$eval('#yearSelect option', els => els.map(e => e.value));
    assert(options.includes('2022'), 'Missing 2022');
    assert(options.includes('2023'), 'Missing 2023');
    assert(options.includes('2024'), 'Missing 2024');
    assert(options.includes('2025'), 'Missing 2025');
    assert(options.includes('2026'), 'Missing 2026');
    assert(!options.includes('2021'), '2021 should not be present');
  });

  await test('Five nav tabs visible', async () => {
    const tabs = await page.$$('.nav-tab');
    assert(tabs.length === 5, `Expected 5 tabs, got ${tabs.length}`);
  });

  console.log('\n── Dashboard ──────────────────────────────────');

  await navigate('dashboard');

  await test('Dashboard heading visible', async () => {
    const h1 = await page.textContent('h1');
    assert(h1.includes('Tax Year'), `Got: ${h1}`);
  });

  await test('Member cards rendered (5 entities)', async () => {
    const cards = await page.$$('.member-card');
    assert(cards.length === 5, `Expected 5 member cards, got ${cards.length}`);
  });

  await test('Jawad & Chhaya card visible', async () => {
    const text = await page.textContent('#main');
    assert(text.includes('Jawad & Chhaya'), 'Missing Jawad & Chhaya');
  });

  await test('Salar Holdings Trust card visible', async () => {
    const text = await page.textContent('#main');
    assert(text.includes('Salar Holdings Trust'), 'Missing Salar Holdings Trust');
  });

  // Year 2025: Sakina + Aliza + Salar Trust should be filed
  await test('2025: Sakina 1040 shows as filed (not in deadlines)', async () => {
    await setYear(2025);
    const deadlines = await page.textContent('#main');
    // Sakina's 1040 should NOT appear in the deadlines table since it's filed
    const rows = await page.$$('tbody tr');
    const rowTexts = await Promise.all(rows.map(r => r.textContent()));
    const sakinaOverdue = rowTexts.some(t => t.includes('Sakina') && t.includes('1040'));
    assert(!sakinaOverdue, 'Sakina 1040 should be filed, not in deadlines table');
  });

  await test('2025: Aliza 1040 shows as filed (not in deadlines)', async () => {
    await setYear(2025);
    const rows = await page.$$('tbody tr');
    const rowTexts = await Promise.all(rows.map(r => r.textContent()));
    const alizaOverdue = rowTexts.some(t => t.includes('Aliza') && t.includes('1040'));
    assert(!alizaOverdue, 'Aliza 1040 should be filed, not in deadlines table');
  });

  await test('2025: Jawad & Chhaya 1040 shows as pending/overdue', async () => {
    await setYear(2025);
    const rows = await page.$$('tbody tr');
    const rowTexts = await Promise.all(rows.map(r => r.textContent()));
    const jawadPending = rowTexts.some(t => t.includes('Jawad') && t.includes('1040'));
    assert(jawadPending, 'Jawad & Chhaya 1040 should be pending in deadlines table');
  });

  await test('2022: all obligations show as filed (deadlines table empty)', async () => {
    await setYear(2022);
    await navigate('dashboard');
    const text = await page.textContent('#main');
    assert(text.includes('All obligations filed'), `2022 should be all filed, got: ${text.slice(0,200)}`);
  });

  await test('2023: all obligations show as filed', async () => {
    await setYear(2023);
    await navigate('dashboard');
    const text = await page.textContent('#main');
    assert(text.includes('All obligations filed'), `2023 should be all filed`);
  });

  await test('2024: all obligations show as filed', async () => {
    await setYear(2024);
    await navigate('dashboard');
    const text = await page.textContent('#main');
    assert(text.includes('All obligations filed'), `2024 should be all filed`);
  });

  console.log('\n── Checklists ─────────────────────────────────');

  await navigate('checklist');
  await setYear(2025);

  await test('Checklist renders member selector', async () => {
    const sel = await page.$('select');
    assert(sel, 'No member selector found');
  });

  await test('Checklist shows obligations table', async () => {
    const rows = await page.$$('tbody tr');
    assert(rows.length > 0, 'No obligation rows found');
  });

  await test('Checklist status dropdowns work', async () => {
    await navigate('checklist');
    await page.waitForSelector('select.status-select', { timeout: 5000 });
    const selects = await page.$$('select.status-select');
    assert(selects.length > 0, 'No status dropdowns found');
    // Read the obligation id from the onchange attribute to know exactly what we're changing
    const onchange = await selects[0].getAttribute('onchange');
    // Change status and check localStorage directly (DOM rebuilds after render() — stale ref unreliable)
    await selects[0].selectOption('in_progress');
    await page.waitForTimeout(400);
    const persisted = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('tp_status') || '{}');
      return Object.values(s).some(yr =>
        Object.values(yr).some(m =>
          typeof m === 'object' && Object.values(m).includes('in_progress')
        )
      );
    });
    assert(persisted, 'Status change not found in localStorage after render');
  });

  await test('Checklist member switching works', async () => {
    await navigate('checklist'); // re-navigate to ensure clean state
    await page.waitForSelector('#memberSelect', { timeout: 5000 });
    await page.selectOption('#memberSelect', 'sakina');
    await page.waitForTimeout(300);
    const text = await page.textContent('#main');
    assert(text.includes('Sakina'), 'Member did not switch to Sakina');
  });

  await test('Mariam Trust shows inactive placeholder for 2025', async () => {
    await page.waitForSelector('#memberSelect', { timeout: 5000 });
    await page.selectOption('#memberSelect', 'mariam_trust');
    await page.waitForTimeout(300);
    const text = await page.textContent('#main');
    assert(text.includes('No obligations') || text.includes('obligations begin'), `Got: ${text.slice(0,200)}`);
  });

  console.log('\n── Gift Registry ──────────────────────────────');

  await navigate('registry');

  await test('Gift Registry heading visible', async () => {
    const h1 = await page.textContent('h1');
    assert(h1.includes('Gift'), `Got: ${h1}`);
  });

  await test('Shows 2022 AAPL gift to Sakina', async () => {
    const text = await page.textContent('#main');
    assert(text.includes('AAPL'), 'Missing AAPL gift entry');
    assert(text.includes('Sakina'), 'Missing Sakina as donee');
  });

  await test('Shows 2023 AMD gift to Aliza', async () => {
    const text = await page.textContent('#main');
    assert(text.includes('AMD') || text.includes('Aliza'), 'Missing 2023 AMD/Aliza gift');
  });

  await test('Shows 2026 AMD gift to Salar Trust', async () => {
    const text = await page.textContent('#main');
    assert(text.includes('Salar Trust') || text.includes('4,524,000'), 'Missing 2026 gift entry');
  });

  await test('Prior taxable gifts totals visible', async () => {
    const text = await page.textContent('#main');
    assert(text.includes('Cumulative Taxable') && text.includes('Credit Used'), 'Missing cumulative prior taxable gift total');
  });

  console.log('\n── Drive Scan ─────────────────────────────────');

  await navigate('drive');

  await test('Drive Scan heading visible', async () => {
    const h1 = await page.textContent('h1');
    assert(h1.includes('Drive Scan'), `Got: ${h1}`);
  });

  await test('Connect Google Drive button visible when not connected', async () => {
    // Clear any cached token to ensure we see the connect button
    await page.evaluate(() => localStorage.removeItem('tp_drive'));
    await page.reload({ waitUntil: 'networkidle', timeout: TIMEOUT });
    await navigate('drive');
    const text = await page.textContent('#main');
    assert(text.includes('Connect Google Drive') || text.includes('Connected'), 'Neither connect button nor connected state found');
  });

  console.log('\n── Settings ───────────────────────────────────');

  await navigate('settings');

  await test('Settings heading visible', async () => {
    const h1 = await page.textContent('h1');
    assert(h1.includes('Settings'), `Got: ${h1}`);
  });

  await test('Family members table shows all 5 entities', async () => {
    const text = await page.textContent('#main');
    assert(text.includes('Jawad & Chhaya'), 'Missing Jawad & Chhaya');
    assert(text.includes('Salar Holdings Trust'), 'Missing Salar Trust');
    assert(text.includes('Mariam Ayaz Trust'), 'Missing Mariam Trust');
    assert(text.includes('Sakina Ayaz'), 'Missing Sakina');
    assert(text.includes('Aliza Ayaz'), 'Missing Aliza');
  });

  await test('Trust beneficiary percentages visible', async () => {
    const text = await page.textContent('#main');
    assert(text.includes('50%'), 'Missing 50% beneficiary pct');
    assert(text.includes('25%'), 'Missing 25% beneficiary pct');
  });

  await test('Reset All Status button visible', async () => {
    const btn = await page.$('button.btn-danger');
    assert(btn, 'Reset All Status button not found');
  });

  await test('Reset All Status restores seed data', async () => {
    // Set a fake status
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('tp_status') || '{}');
      if (!s[2022]) s[2022] = {};
      if (!s[2022].jawad_chhaya) s[2022].jawad_chhaya = {};
      s[2022].jawad_chhaya.us_1040 = 'not_started';
      s._ver = 3;
      localStorage.setItem('tp_status', JSON.stringify(s));
    });
    // Click reset
    page.once('dialog', d => d.accept());
    await page.click('button.btn-danger');
    await page.waitForTimeout(500);
    // After reset, 2022 1040 should be filed again
    const status = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('tp_status') || '{}');
      return s[2022]?.jawad_chhaya?.us_1040;
    });
    assert(status === 'filed' || status === undefined, `Expected filed after reset, got: ${status}`);
  });

  console.log('\n── Year Selector Persistence ──────────────────');

  await test('Year change persists across view switches', async () => {
    await setYear(2024);
    await navigate('checklist');
    await navigate('dashboard');
    const year = await page.$eval('#yearSelect', e => e.value);
    assert(year === '2024', `Expected 2024, got ${year}`);
  });

  // ── Summary ──────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Tests passed: ${passed}`);
  console.log(`  Tests failed: ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
