/**
 * ARKALYTHIX ASSET AUDIT SCRIPT
 *
 * Verifica que los assets en public/ estén optimizados y sean necesarios.
 * Ejecutar: bun scripts/optimize-images.js
 */

import fs from 'fs';
import path from 'path';

console.log('🖼️  ARKALYTHIX ASSET AUDIT\n');

const PUBLIC_DIR = path.join(import.meta.dirname, '..', 'public');
const BRAND_DIR = path.join(PUBLIC_DIR, 'brand');

// ── Brand assets ──
const brandFiles = {
  'favicon.svg': { required: true, maxSize: 1000 },
  'icon.svg': { required: true, maxSize: 2000 },
  'logo.svg': { required: true, maxSize: 2000 },
};

let issues = 0;

console.log('📁 Verificando /public/brand/...\n');
for (const [file, config] of Object.entries(brandFiles)) {
  const filePath = path.join(BRAND_DIR, file);
  if (!fs.existsSync(filePath)) {
    if (config.required) {
      console.error(`  ❌ ${file} — REQUERIDO pero no existe`);
      issues++;
    } else {
      console.log(`  ⚠️  ${file} — opcional, no encontrado`);
    }
    continue;
  }

  const size = fs.statSync(filePath).size;
  if (size > config.maxSize) {
    console.warn(`  ⚠️  ${file} — ${(size / 1024).toFixed(1)}KB (máx ${(config.maxSize / 1024).toFixed(1)}KB)`);
    issues++;
  } else {
    console.log(`  ✅ ${file} — ${(size / 1024).toFixed(1)}KB`);
  }
}

// ── Check for legacy PNG logo ──
const legacyPng = path.join(BRAND_DIR, 'logo.png');
if (fs.existsSync(legacyPng)) {
  const sizeMB = (fs.statSync(legacyPng).size / 1024 / 1024).toFixed(1);
  console.error(`\n  ❌ logo.png LEGACY encontrado (${sizeMB}MB) — eliminar, usar logo.svg`);
  issues++;
} else {
  console.log(`\n  ✅ logo.png LEGACY eliminado (usando logo.svg)`);
}

// ── Check for og-template.html legacy ──
const legacyOg = path.join(PUBLIC_DIR, 'static', 'og-template.html');
if (fs.existsSync(legacyOg)) {
  console.error(`  ❌ og-template.html LEGACY encontrado — eliminar, usar /api/og`);
  issues++;
} else {
  console.log(`  ✅ og-template.html LEGACY eliminado (usando /api/og)`);
}

// ── Summary ──
console.log('\n' + '─'.repeat(50));
if (issues === 0) {
  console.log('✅ Todos los assets están optimizados.');
} else {
  console.log(`⚠️  ${issues} issue(s) encontrado(s). Ver arriba.`);
}
console.log('\n💡 Reglas de oro:');
console.log('   • SVG para logos e iconos (escalable, tiny)');
console.log('   • WebP para fotos (producto, equipo)');
console.log('   • /api/og para OG images dinámicas');
console.log('   • Nada en public/ que no se use en código');
