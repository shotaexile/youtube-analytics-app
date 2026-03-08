/**
 * post-build-fix.mjs
 *
 * Runs after `expo export --platform web` to:
 * 1. Copy MaterialIcons.ttf to /dist/fonts/MaterialIcons.ttf (simple path, no @ symbols)
 * 2. Patch the JS bundle to reference the new font path
 * 3. Fix index.html icon paths (apple-touch-icon, favicon)
 * 4. Update manifest.json with correct icon paths
 *
 * This is needed because Vercel cannot serve files whose paths contain @ symbols.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const DIST = path.resolve("dist");
const FONTS_DIR = path.join(DIST, "fonts");

// ── 1. Find the MaterialIcons font in dist/assets ────────────────────────────
function findFont() {
  const search = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = search(full);
        if (found) return found;
      } else if (entry.name.startsWith("MaterialIcons") && entry.name.endsWith(".ttf")) {
        return full;
      }
    }
    return null;
  };
  return search(path.join(DIST, "assets"));
}

// ── 2. Copy font to simple path ──────────────────────────────────────────────
fs.mkdirSync(FONTS_DIR, { recursive: true });
const fontSrc = findFont();
if (!fontSrc) {
  console.error("❌ MaterialIcons.ttf not found in dist/assets");
  process.exit(1);
}
const fontDest = path.join(FONTS_DIR, "MaterialIcons.ttf");
fs.copyFileSync(fontSrc, fontDest);
console.log(`✅ Copied font: ${fontSrc} → ${fontDest}`);

// ── 3. Patch JS bundle ───────────────────────────────────────────────────────
const jsDir = path.join(DIST, "_expo", "static", "js", "web");
const bundles = fs.readdirSync(jsDir).filter((f) => f.endsWith(".js"));
if (bundles.length === 0) {
  console.error("❌ No JS bundle found in dist/_expo/static/js/web");
  process.exit(1);
}
for (const bundle of bundles) {
  const bundlePath = path.join(jsDir, bundle);
  let content = fs.readFileSync(bundlePath, "utf8");

  // Replace any path containing MaterialIcons*.ttf with /fonts/MaterialIcons.ttf
  let patched = content.replace(
    /"[^"]*MaterialIcons[^"]*\.ttf"/g,
    '"/fonts/MaterialIcons.ttf"'
  );
  if (patched !== content) {
    console.log(`✅ Patched font path in ${bundle}`);
  } else {
    console.log(`ℹ️  No font path found in ${bundle} (may already be patched)`);
  }

  // Replace Manus sandbox API base URL with empty string for Vercel production
  // This ensures the frontend uses relative URLs (/api/trpc/...) on Vercel
  const manusUrlPattern = /https:\/\/3000-[a-z0-9]+-[0-9]+\.sg[0-9]+\.manus\.computer/g;
  const patchedNoManus = patched.replace(manusUrlPattern, "");
  if (patchedNoManus !== patched) {
    console.log(`✅ Removed Manus sandbox API URL from ${bundle} (Vercel production fix)`);
    patched = patchedNoManus;
  }

  if (patched !== content) {
    fs.writeFileSync(bundlePath, patched, "utf8");
  }
}

// ── 4. Fix index.html icon paths + viewport-fit=cover ───────────────────────
const indexPath = path.join(DIST, "index.html");
let indexHtml = fs.readFileSync(indexPath, "utf8");
indexHtml = indexHtml
  .replace(/href="\/assets\/\.\/assets\/images\/apple-touch-icon\.png"/g, 'href="/apple-touch-icon.png"')
  .replace(/href="\/assets\/\.\/assets\/images\/favicon\.png"/g, 'href="/favicon.png"')
  .replace(/href="\/favicon\.ico"/g, 'href="/favicon.png"');

// Ensure viewport meta has viewport-fit=cover for PWA safe area support
if (indexHtml.includes('name="viewport"')) {
  // Replace existing viewport meta to add viewport-fit=cover
  indexHtml = indexHtml.replace(
    /<meta\s+name="viewport"[^>]*>/g,
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  );
  console.log("✅ Patched viewport meta with viewport-fit=cover");
} else {
  // Insert viewport meta before </head>
  indexHtml = indexHtml.replace(
    '</head>',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head>'
  );
  console.log("✅ Inserted viewport meta with viewport-fit=cover");
}

// Also patch all other HTML files
const htmlFiles = [];
const walkHtml = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full);
    else if (entry.name.endsWith('.html') && full !== indexPath) htmlFiles.push(full);
  }
};
walkHtml(DIST);
for (const htmlFile of htmlFiles) {
  let html = fs.readFileSync(htmlFile, 'utf8');
  if (html.includes('name="viewport"')) {
    const patched = html.replace(
      /<meta\s+name="viewport"[^>]*>/g,
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    );
    if (patched !== html) fs.writeFileSync(htmlFile, patched, 'utf8');
  }
}
console.log(`✅ Patched viewport in ${htmlFiles.length} additional HTML files`);

fs.writeFileSync(indexPath, indexHtml, "utf8");
console.log("✅ Fixed index.html icon paths");

// ── 5. Write manifest.json ───────────────────────────────────────────────────
const manifest = {
  name: "View Core",
  short_name: "View Core",
  description: "YouTube Analytics for your team",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#FF0000",
  orientation: "portrait",
  icons: [
    { src: "/favicon.png", sizes: "48x48", type: "image/png" },
    { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    { src: "/icon.png", sizes: "512x512", type: "image/png" },
  ],
};
fs.writeFileSync(path.join(DIST, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log("✅ Updated manifest.json");

console.log("\n🎉 post-build-fix complete!");
