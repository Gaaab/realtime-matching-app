import { chromium } from 'playwright';

const SCREENSHOTS = '.screenshots';
const API_BASE = 'http://127.0.0.1:9991/api/v1';
const APP_URL = 'http://localhost:3000';

let step = 0;
const screenshot = async (page, name) => {
  step++;
  const file = `${SCREENSHOTS}/${String(step).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  [screenshot] ${file}`);
};

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  geolocation: { latitude: -33.8568, longitude: 151.2153 },
  permissions: ['geolocation'],
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();

// Collect errors
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push(msg.text());
  }
});
page.on('pageerror', err => {
  errors.push(`PAGE ERROR: ${err.message}`);
});

try {
  // ── Step 1: Login via API ──
  console.log('Step 1: Authenticating via API...');
  const checkRes = await fetch(`${API_BASE}/auth/check-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '+6397785695773' }),
  });
  console.log(`  check-username: ${checkRes.status}`);

  const otpRes = await fetch(`${API_BASE}/auth/otp/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: '+6397785695773' }),
  });
  console.log(`  otp/generate: ${otpRes.status}`);

  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '+6397785695773', otp: '00000' }),
  });
  const loginData = await loginRes.json();
  const authData = loginData.data || loginData;

  if (!authData.access_token) {
    console.error('Login failed:', JSON.stringify(loginData));
    await browser.close();
    process.exit(1);
  }
  console.log(`  login: ${loginRes.status} - token acquired`);

  // ── Step 2: Inject auth token ──
  console.log('Step 2: Injecting auth into app...');
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.evaluate((data) => {
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  }, authData);
  await screenshot(page, 'auth-injected');

  // ── Step 3: Navigate to explore ──
  console.log('Step 3: Navigating to /explore...');
  await page.goto(`${APP_URL}/explore`, { waitUntil: 'networkidle' });
  await screenshot(page, 'explore-loading');

  // ── Step 4: Wait for map to initialize ──
  console.log('Step 4: Waiting for map to render...');
  await page.waitForSelector('.map-container', { timeout: 10000 }).catch(() => {
    console.log('  WARNING: .map-container not found');
  });
  await page.waitForTimeout(5000);
  await screenshot(page, 'map-initialized');

  // ── Step 5: Wait for markers to load ──
  console.log('Step 5: Waiting for venue markers...');
  await page.waitForTimeout(8000);
  await screenshot(page, 'markers-loaded');

  // ── Step 6: Inspect marker DOM ──
  console.log('Step 6: Inspecting marker DOM...');
  const markerInfo = await page.evaluate(() => {
    // Check for gmp-advanced-marker in main DOM
    const mainDom = document.querySelectorAll('gmp-advanced-marker').length;

    // Check inside shadow roots of map container
    const mapDiv = document.querySelector('.map-container > div');
    let shadowMarkers = 0;
    let markerDetails = [];

    const searchShadow = (el, depth = 0) => {
      if (depth > 10) return;
      if (el.shadowRoot) {
        const found = el.shadowRoot.querySelectorAll('gmp-advanced-marker');
        shadowMarkers += found.length;
        found.forEach(m => {
          const rect = m.getBoundingClientRect();
          markerDetails.push({
            title: m.getAttribute('title'),
            width: rect.width,
            height: rect.height,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            hasContent: m.children.length > 0,
            contentTag: m.children[0]?.tagName || 'none',
            visible: rect.width > 0 && rect.height > 0,
          });
        });
        el.shadowRoot.querySelectorAll('*').forEach(child => searchShadow(child, depth + 1));
      }
      el.querySelectorAll('*').forEach(child => searchShadow(child, depth + 1));
    };

    if (mapDiv) searchShadow(mapDiv);

    // Also check for venue-pin class elements
    const venuePins = document.querySelectorAll('.venue-pin').length;

    // Check for any SVG pins in the page
    const svgPins = document.querySelectorAll('svg[viewBox="0 0 40 52"]').length;

    return {
      mainDom,
      shadowMarkers,
      venuePins,
      svgPins,
      markerDetails: markerDetails.slice(0, 5),
      mapContainerExists: !!document.querySelector('.map-container'),
      mapHasContent: document.querySelector('.map-container')?.innerHTML.length || 0,
    };
  });

  console.log('  Marker inspection results:');
  console.log(`    gmp-advanced-marker in main DOM: ${markerInfo.mainDom}`);
  console.log(`    gmp-advanced-marker in shadow DOM: ${markerInfo.shadowMarkers}`);
  console.log(`    .venue-pin elements: ${markerInfo.venuePins}`);
  console.log(`    SVG pin elements: ${markerInfo.svgPins}`);
  console.log(`    Map container exists: ${markerInfo.mapContainerExists}`);
  console.log(`    Map container innerHTML size: ${markerInfo.mapHasContent}`);
  if (markerInfo.markerDetails.length > 0) {
    console.log('    First 5 markers:');
    markerInfo.markerDetails.forEach((m, i) => {
      console.log(`      ${i}: "${m.title}" ${m.width}x${m.height} @ (${m.x},${m.y}) content=${m.contentTag} visible=${m.visible}`);
    });
  }

  // ── Step 7: Zoom in to see markers better ──
  console.log('Step 7: Zooming into map...');
  await page.evaluate(() => {
    const mapEl = document.querySelector('.map-container > div');
    if (mapEl && mapEl.__gm) {
      // Try to zoom in
    }
  });
  // Use keyboard zoom
  await page.click('.map-container');
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('+');
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);
  await screenshot(page, 'zoomed-in');

  // ── Step 8: Check for Google default POI icons ──
  console.log('Step 8: Checking for default Google POI icons...');
  const poiInfo = await page.evaluate(() => {
    // Google default markers use img tags with specific src patterns
    const markerImgs = document.querySelectorAll('img[src*="maps.gstatic"]');
    const allImgs = document.querySelectorAll('.map-container img');
    return {
      gstaticImgs: markerImgs.length,
      allMapImgs: allImgs.length,
      imgSrcs: Array.from(allImgs).slice(0, 5).map(img => img.src),
    };
  });
  console.log(`  Google static images: ${poiInfo.gstaticImgs}`);
  console.log(`  All map images: ${poiInfo.allMapImgs}`);
  if (poiInfo.imgSrcs.length) {
    poiInfo.imgSrcs.forEach(s => console.log(`    src: ${s.substring(0, 100)}`));
  }
  await screenshot(page, 'final-state');

  // ── Summary ──
  console.log('\n=== SUMMARY ===');
  console.log(`Screenshots saved to ${SCREENSHOTS}/`);
  console.log(`Total errors captured: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(e => console.log(`  ${e.substring(0, 200)}`));
  }

} catch (err) {
  console.error('Script error:', err.message);
  await screenshot(page, 'error-state');
} finally {
  await page.waitForTimeout(2000);
  await browser.close();
}
