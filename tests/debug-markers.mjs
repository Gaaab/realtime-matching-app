import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  geolocation: { latitude: -33.8568, longitude: 151.2153 },
  permissions: ['geolocation'],
});
const page = await context.newPage();

// Collect ALL console logs
const logs = [];
page.on('console', msg => {
  logs.push(`[${msg.type()}] ${msg.text()}`);
});

page.on('pageerror', err => {
  logs.push(`[PAGE ERROR] ${err.message}`);
});

// Login via API directly
console.log('Logging in via API...');
const API_BASE = 'http://127.0.0.1:9991/api/v1';

// Step 1: Check username
await fetch(`${API_BASE}/auth/check-username`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: '+6397785695773' }),
});

// Step 2: Generate OTP
await fetch(`${API_BASE}/auth/otp/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone_number: '+6397785695773' }),
});

// Step 3: Login with bypass OTP
const loginRes = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: '+6397785695773', otp: '00000' }),
});
const loginData = await loginRes.json();
const authData = loginData.data || loginData;
console.log('Login result:', loginRes.status, authData.access_token ? 'got token' : 'no token');

if (!authData.access_token) {
  console.error('Login failed:', JSON.stringify(loginData));
  await browser.close();
  process.exit(1);
}

// Inject auth into localStorage before navigating
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.evaluate((data) => {
  localStorage.setItem('auth_token', data.access_token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
}, authData);

console.log('Navigating to explore...');
await page.goto('http://localhost:3000/explore', { waitUntil: 'networkidle' });
await page.waitForTimeout(12000);

// Also check for error overlays on the page
const errorText = await page.evaluate(() => {
  const el = document.querySelector('[class*="error"], [class*="Error"]');
  return el ? el.textContent : null;
});
if (errorText) console.log('Error element found:', errorText);

// Check if map container exists and has content
const mapInfo = await page.evaluate(() => {
  const container = document.querySelector('.map-container');
  if (!container) return 'No .map-container found';
  const rect = container.getBoundingClientRect();
  return `map-container: ${rect.width}x${rect.height}, children: ${container.children.length}, innerHTML length: ${container.innerHTML.length}`;
});
console.log('Map container:', mapInfo);

// Check for gmp-advanced-marker elements
const markerCount = await page.evaluate(() => {
  return document.querySelectorAll('gmp-advanced-marker').length;
});

// Check for old google marker images (red pins)
const oldMarkerCount = await page.evaluate(() => {
  return document.querySelectorAll('img[src*="maps.gstatic.com/mapfiles/markers"]').length;
});

// Check gmp-advanced-marker visibility
const markerDetails = await page.evaluate(() => {
  const markers = document.querySelectorAll('gmp-advanced-marker');
  return Array.from(markers).slice(0, 5).map(m => {
    const rect = m.getBoundingClientRect();
    const style = window.getComputedStyle(m);
    return {
      title: m.getAttribute('title'),
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
    };
  });
});

// Take screenshot
await page.screenshot({ path: '/tmp/explore-markers.png', fullPage: false });

console.log('\n=== RESULTS ===');
console.log(`Advanced markers in DOM: ${markerCount}`);
console.log(`Old red markers in DOM: ${oldMarkerCount}`);
console.log('\nMarker details (first 5):');
markerDetails.forEach((m, i) => {
  console.log(`  ${i}: ${m.title} | display=${m.display} visibility=${m.visibility} opacity=${m.opacity} size=${m.width}x${m.height} pos=(${m.left},${m.top})`);
});
console.log('\nAll console logs:');
logs.forEach(l => console.log(`  ${l}`));

// Check current URL
console.log(`\nCurrent URL: ${page.url()}`);

await page.waitForTimeout(2000);
await browser.close();
