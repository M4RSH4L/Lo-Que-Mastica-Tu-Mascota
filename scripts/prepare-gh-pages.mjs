import fs from 'node:fs';
import path from 'node:path';

/**
 * Prepara la compilación estática de Vite (`dist/`) para que GitHub Pages funcione
 * sin pantalla en blanco ni errores 404 en cualquiera de los 3 modos posibles:
 * 1. GitHub Actions (`.github/workflows/deploy.yml` -> publica `dist/`)
 * 2. Deploy from a branch -> carpeta `/docs` (`docs/index.html` + `docs/assets/`)
 * 3. Deploy from a branch -> carpeta `/ (root)` (`index.html` + `assets/app.js` y `assets/app.css`)
 */
const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');
const rootAssetsDir = path.join(rootDir, 'assets');

if (fs.existsSync(distDir)) {
  // Limpiar los scripts de fallback de desarrollo del HTML compilado en dist/index.html
  const distIndexHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(distIndexHtmlPath)) {
    let html = fs.readFileSync(distIndexHtmlPath, 'utf-8');
    // Remover el bloque setTimeout de fallback ya que dist/index.html ya apunta directo a ./assets/app.js
    html = html.replace(/<script>\s*window\.__loadCompiledBundle[\s\S]*?<\/script>/g, '');
    html = html.replace(/<script>\s*\/\/ Si se abre en GitHub Pages[\s\S]*?<\/script>/g, '');
    fs.writeFileSync(distIndexHtmlPath, html, 'utf-8');
  }

  // 1. Copiar dist/ a docs/ (para GitHub Pages -> Deploy from a branch -> /docs)
  fs.rmSync(docsDir, { recursive: true, force: true });
  fs.cpSync(distDir, docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  fs.writeFileSync(path.join(rootDir, '.nojekyll'), '');

  // 2. Copiar dist/assets/app.js y app.css a /assets/ (preservando /assets/aistudio si existe)
  const distAssetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(distAssetsDir)) {
    fs.mkdirSync(rootAssetsDir, { recursive: true });
    for (const file of fs.readdirSync(distAssetsDir)) {
      fs.cpSync(
        path.join(distAssetsDir, file),
        path.join(rootAssetsDir, file),
        { recursive: true }
      );
    }
  }

  console.log('GitHub Pages static artifacts prepared in dist/, docs/, and assets/.');
}
