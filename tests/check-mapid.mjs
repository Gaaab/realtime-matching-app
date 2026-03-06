import { chromium } from 'playwright';

const API = 'http://127.0.0.1:9991/api/v1';
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  geolocation: { latitude: -33.8568, longitude: 151.2153 },
  permissions: ['geolocation'],
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();

// Collect ALL console logs from the app
const appLogs = [];
page.on('console', msg => {
  appLogs.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => {
  appLogs.push(`[PAGE ERROR] ${err.message}`);
});

// Login
await fetch(`${API}/auth/check-username`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: '+6397785695773' }) });
await fetch(`${API}/auth/otp/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone_number: '+6397785695773' }) });
const lr = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: '+6397785695773', otp: '00000' }) });
const ld = await lr.json();
const auth = ld.data || ld;

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.evaluate((d) => {
  localStorage.setItem('auth_token', d.access_token);
  localStorage.setItem('auth_user', JSON.stringify(d.user));
}, auth);

await page.goto('http://localhost:3000/explore', { waitUntil: 'networkidle' });
await page.waitForTimeout(12000);

// Check vector map and markers
const info = await page.evaluate(() => {
  const canvasEls = document.querySelectorAll('.map-container canvas');

  // Search for gmp-advanced-marker everywhere including shadow DOM
  let advancedMarkers = 0;
  const searchAll = (root) => {
    const found = root.querySelectorAll('gmp-advanced-marker');
    advancedMarkers += found.length;
    root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) searchAll(el.shadowRoot);
    });
  };
  searchAll(document);

  // Check for .venue-pin elements
  const venuePins = document.querySelectorAll('.venue-pin').length;

  // Check for user-location-marker
  const userMarkers = document.querySelectorAll('.user-location-marker').length;

  return {
    canvasCount: canvasEls.length,
    isVector: canvasEls.length > 0,
    advancedMarkers,
    venuePins,
    userMarkers,
  };
});

console.log('\n=== VECTOR MAP + MARKER DIAGNOSTIC ===');
console.log('Canvas elements:', info.canvasCount);
console.log('Is Vector:', info.isVector);
console.log('AdvancedMarkerElement count:', info.advancedMarkers);
console.log('.venue-pin count:', info.venuePins);
console.log('.user-location-marker count:', info.userMarkers);

console.log('\n=== APP CONSOLE LOGS ===');
// Filter for relevant logs
const relevant = appLogs.filter(l =>
  l.includes('VenueMap') ||
  l.includes('useGoogleMaps') ||
  l.includes('marker') ||
  l.includes('Marker') ||
  l.includes('venues') ||
  l.includes('AdvancedMarker') ||
  l.includes('geolocation') ||
  l.includes('error') ||
  l.includes('Error') ||
  l.includes('Failed')
);
relevant.forEach(l => console.log(' ', l));

console.log(`\n(${appLogs.length} total logs, ${relevant.length} shown)`);

await page.screenshot({ path: '.screenshots/diagnostic.png', fullPage: false });
await browser.close();
