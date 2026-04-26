import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function csvFallbackPlugin() {
  return {
    name: 'csv-fallback',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.endsWith('/leaderboard.csv')) return next()

        const localPath = path.resolve('public/leaderboard.csv')
        if (fs.existsSync(localPath)) return next()

        const env = loadEnv('development', process.cwd(), '')
        const sheetId = env.VITE_SHEET_ID
        if (!sheetId) return next()

        try {
          const upstream = await fetch(
            `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
          )
          if (!upstream.ok) return next()
          const csv = await upstream.text()
          fs.writeFileSync(localPath, csv, 'utf-8')
          res.setHeader('Content-Type', 'text/csv')
          res.end(csv)
        } catch {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  base: '/sdis-leaderboard/',
  plugins: [tailwindcss(), svelte(), csvFallbackPlugin()],
})
