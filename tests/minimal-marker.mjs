import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();

// Load a blank page and inject Google Maps directly
await page.setContent(`
  <div id="map" style="width:100%;height:100vh;"></div>
  <script>
    (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries","marker");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src="https://maps.googleapis.com/maps/api/js?"+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
      key: "AIzaSyBwiF2NXzLfObgqznd2rpwBVdPD7JCaGz8",
      v: "weekly",
      mapId: "5471159665d493276086c9ff"
    });

    async function init() {
      try {
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

        const map = new Map(document.getElementById("map"), {
          center: { lat: -33.8568, lng: 151.2153 },
          zoom: 15,
          mapId: "5471159665d493276086c9ff",
        });

        // Test 1: Default marker (no custom content)
        const m1 = new AdvancedMarkerElement({
          map,
          position: { lat: -33.8568, lng: 151.2153 },
          title: "Default marker",
        });
        console.log("[TEST] Default marker created:", !!m1, "element:", !!m1.element);

        // Test 2: PinElement marker
        const pin = new PinElement({
          background: "#0050FF",
          borderColor: "#003DB3",
          glyphColor: "#00D9FF",
        });
        const m2 = new AdvancedMarkerElement({
          map,
          position: { lat: -33.857, lng: 151.216 },
          title: "Pin marker",
          content: pin.element,
        });
        console.log("[TEST] PinElement marker created:", !!m2, "element:", !!m2.element);

        // Test 3: Custom HTML content (same pattern as VenueMap)
        const div = document.createElement("div");
        div.innerHTML = '<svg width="40" height="52" viewBox="0 0 40 52"><path d="M20 0C11.7 0 5 6.7 5 15c0 10 15 35 15 35s15-25 15-35C35 6.7 28.3 0 20 0z" fill="#0050FF" stroke="white" stroke-width="2"/><circle cx="20" cy="15" r="6" fill="white"/><circle cx="20" cy="15" r="3.5" fill="#00D9FF"/></svg>';
        div.style.width = "40px";
        div.style.height = "52px";
        div.style.cursor = "pointer";
        const m3 = new AdvancedMarkerElement({
          map,
          position: { lat: -33.858, lng: 151.214 },
          title: "Custom SVG marker",
          content: div,
        });
        console.log("[TEST] Custom content marker created:", !!m3, "element:", !!m3.element);

        // Check DOM after a short delay
        setTimeout(() => {
          const markers = document.querySelectorAll('gmp-advanced-marker');
          console.log("[TEST] gmp-advanced-marker in DOM:", markers.length);

          // Search shadow DOMs
          let shadowCount = 0;
          const search = (root) => {
            root.querySelectorAll('*').forEach(el => {
              if (el.shadowRoot) {
                shadowCount += el.shadowRoot.querySelectorAll('gmp-advanced-marker').length;
                search(el.shadowRoot);
              }
            });
          };
          search(document);
          console.log("[TEST] gmp-advanced-marker in shadow DOM:", shadowCount);
          console.log("[TEST] DONE");
        }, 3000);

      } catch(err) {
        console.error("[TEST] Error:", err.message);
      }
    }
    init();
  </script>
`);

// Collect console logs
const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

await page.waitForTimeout(15000);
await page.screenshot({ path: '.screenshots/minimal-marker.png', fullPage: false });

console.log('\n=== MINIMAL MARKER TEST ===');
logs.forEach(l => console.log(' ', l));

await browser.close();
