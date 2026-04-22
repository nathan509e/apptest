import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const scoreStoragePlugin = () => ({
  name: 'score-storage',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString() });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const { name, xml } = data;
            const dir = path.resolve(process.cwd(), 'public/scores');
            
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            
            const safeName = name.replace(/[^a-zA-Z0-9.\-_ ()]/g, '_');
            const filePath = path.join(dir, safeName);
            
            fs.writeFileSync(filePath, xml);
            
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, fileName: safeName }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      } else if (req.url === '/api/scores' && req.method === 'GET') {
        const dir = path.resolve(process.cwd(), 'public/scores');
        let files = [];
        
        if (fs.existsSync(dir)) {
          files = fs.readdirSync(dir).filter(f => f.endsWith('.xml') || f.endsWith('.musicxml') || f.endsWith('.mxl'));
          files = files.map(f => {
             const stat = fs.statSync(path.join(dir, f));
             return { name: f, time: stat.mtimeMs };
          }).sort((a, b) => b.time - a.time).map(f => f.name);
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ scores: files }));
      } else {
        next();
      }
    });
  }
})

export default defineConfig({
  base: '/apptest/',
  plugins: [react(), scoreStoragePlugin()],
})
