import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
const dir = 'public/squads'
const files = readdirSync(dir).filter(f => f.endsWith('.json'))
const entries = files.map(f => {
  const d = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))
  return { sel: d.sel, copa: d.copa, slug: f.replace(/\.json$/, '') }
}).sort((a, b) => a.copa - b.copa || a.sel.localeCompare(b.sel))
const body = `// AUTO-GERADO por scripts/gen-catalog.mjs — não editar à mão\n` +
  `import type { CatalogEntry } from './types'\n` +
  `export const CATALOG: CatalogEntry[] = ${JSON.stringify(entries)}\n`
writeFileSync('src/engine/catalog.data.ts', body)
console.log(`catalog: ${entries.length} entries`)
