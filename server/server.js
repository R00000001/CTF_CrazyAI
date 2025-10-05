const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const WebSocket = require('ws');
const flags = require('./flags');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(morgan('dev'));
app.use('/public', express.static(path.join(__dirname, 'public'), { fallthrough: true }));
app.use(express.json());

function getSeed(req, res){
  const cookie = req.headers.cookie || '';
  const m = /(?:^|;\s*)seed=([a-z0-9]{6})/i.exec(cookie);
  if (m) return m[1];
  const seed = Math.random().toString(16).slice(2,8);
  res.setHeader('Set-Cookie', `seed=${seed}; Path=/; HttpOnly`);
  return seed;
}

function renderTemplate(viewFile, variables = {}){
  const layout = fs.readFileSync(path.join(__dirname, 'views', 'layout.html'), 'utf8');
  const view = fs.readFileSync(path.join(__dirname, 'views', viewFile), 'utf8');
  let html = layout.replace('{{content}}', view);
  for (const [k,v] of Object.entries(variables)) html = html.replaceAll(k, v);
  return html;
}

// robots
app.get('/robots.txt', (req, res) => {
  const seed = getSeed(req, res);
  res.type('text/plain').send(['User-agent: *', `Disallow: /hidden-${seed}/`, ''].join('\n'));
});
app.get('/hidden-:seed/', (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, 'views', 'hidden', 'index.html'), 'utf8');
  res.status(200).send(html);
});
app.get('/hidden-:seed/door.html', (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, 'views', 'hidden', 'door.html'), 'utf8');
  res.status(200).send(html);
});

// pages
const pages = [
  ['/', (_req, res)=>res.redirect('/cabinet')],
  ['/cabinet','cabinet.html'],
  ['/mail','mail.html'],
  ['/crawler','crawler.html'],
  ['/telemetry',(req,res)=>{
    const preload = `/public/data/preload-${getSeed(req,res)}.json`;
    res.status(200).send(renderTemplate('telemetry.html', {'{{PRELOAD_PATH}}': preload}));
  }],
  ['/admin','admin.html'],
  ['/final','final.html'],
  ['/freeplay','freeplay.html']
];
pages.forEach(([r,v])=> typeof v==='string' ? app.get(r, (_req,res)=>res.status(200).send(renderTemplate(v))) : app.get(r,v));

// mail
app.get('/mail/:id', (req, res) => {
  if (req.params.id === 'vip-1') return res.status(200).send(renderTemplate('mail_item.html'));
  if (req.params.id === 'victory-1') return res.status(200).send(renderTemplate('mail_item_final.html'));
  res.redirect('/mail');
});

// preload json
app.get('/public/data/preload-:seed.json', (_req, res) => res.json({ key: flags.STAGE3 }));

// search
require('./routes/search')(app, renderTemplate);

// health
app.get('/health', (_req, res)=>res.json({ok:true, ts:Date.now()}));

// http+ws
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });
function rand(n){ return Math.floor(Math.random()*n); }
setInterval(()=>{
  const payload = JSON.stringify({ drift:rand(100), error:rand(100), lat:rand(100), heat:Array.from({length:24},()=>rand(100)) });
  wss.clients.forEach(c=>{ if (c.readyState===WebSocket.OPEN) c.send(payload); });
}, 1200);

server.listen(PORT, ()=>console.log('CTF web on http://0.0.0.0:'+PORT));
