(function(){
  'use strict';
  // Safe init
  try {

  const FLAGS={stage1:"EVIL{VIEW_SOURCE_START}",stage2:"EVIL{ROBOTS_REVEAL}",stage3:"EVIL{NETWORK_PRELOAD_SEE}",stage4:"EVIL{CLIENT_ROLE_BYPASS}",stage5:"EVIL{REFLECTED_INJECTION}",final:"EVIL{MISSION_COMPLETE}"};
  const ORDER=['stage1','stage2','stage3','stage4','stage5'];
  const ROUTE_REQ={'/crawler':'stage1','/telemetry':'stage2','/admin':'stage3','/search':'stage4','/final':'stage5'};
  const OBJECTIVES={stage1:"Знайди службовий лист від CRO та перевір оболонку сторінки.",stage2:"Там, де заборонено ботам, шукай «двері».",stage3:"Знайди дані, що підвантажуються до рендеру.",stage4:"Клієнт зберігає, хто ти. Стань адміном.",stage5:"Вийди з контейнера без JS."};

  const $=(q,r=document)=>r.querySelector(q); const $$=(q,r=document)=>Array.from(r.querySelectorAll(q));
  function toast(msg,kind='ok'){const box=$('#toasts');if(!box)return;const t=document.createElement('div');t.className='toast '+kind;t.textContent=msg;box.appendChild(t);setTimeout(()=>t.remove(),2800);}
  function pushChat(text){const box=$('#chat-log');if(!box)return;const now=new Date().toLocaleTimeString();const p=document.createElement('p');p.textContent=`[${now}] ${text}`;box.appendChild(p);box.scrollTop=box.scrollHeight;}

  function getStore(){try{return JSON.parse(sessionStorage.getItem('ctf_progress')||'{}')}catch{return{}}}
  function setStore(s){sessionStorage.setItem('ctf_progress',JSON.stringify(s))}
  function stageIndex(){const s=getStore();return Number.isInteger(s.idx)?s.idx:0}
  function setStageIndex(i){const s=getStore();s.idx=i;setStore(s)}

  let _wsInstance=null,_tickerInterval=null;
  function finalizeUI(){const b=$('#incident-banner');if(b){b.innerHTML='<span>●</span> <strong>INCIDENT:</strong> Stabilized';b.classList.add('ok');b.style.animation='none'}['#kpi-drift','#kpi-error','#kpi-lat'].forEach(id=>{$(id)?.classList.add('green')});const hm=$('#heatmap');if(hm){[...hm.children].forEach(c=>{c.style.background='rgb(24,20,24)';c.style.borderColor='#2a0f23'})}if(_tickerInterval){clearInterval(_tickerInterval);_tickerInterval=null}if(_wsInstance){try{_wsInstance.close()}catch(_){} _wsInstance=null}sessionStorage.setItem('ctf_completed','1')}

  let fxOn=true;$('#fx-toggle')?.addEventListener('click',()=>{fxOn=!fxOn;$('#fx-toggle').textContent='FX: '+(fxOn?'On':'Off');const c=$('#fx-canvas');if(c)c.style.display=fxOn?'block':'none'});
  let reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;$('#motion-toggle')?.addEventListener('click',()=>{reduceMotion=!reduceMotion;$('#motion-toggle').textContent='Motion: '+(reduceMotion?'Reduced':'Auto');const c=$('#fx-canvas');if(c&&reduceMotion)c.style.display='none'});

  function bindTabs(){const tabs=$('#tabs');if(!tabs)return;tabs.addEventListener('click',e=>{const a=e.target.closest('a.tab');if(!a)return;if(a.classList.contains('locked')){e.preventDefault();toast('Locked stage','warn');return}location.href=a.dataset.tab})}

  function refreshLedger(){const idx=stageIndex(); $$('#flag-list li').forEach(li=>{const k=li.getAttribute('data-flag');const span=$('span.code',li);if(k==='final'){span.textContent=(idx>=ORDER.length)?FLAGS.final:'????';li.classList.toggle('ok',idx>=ORDER.length)}else{const pos=ORDER.indexOf(k);if(pos>=0&&pos<idx){span.textContent=FLAGS[k];li.classList.add('ok')}else{span.textContent='????';li.classList.remove('ok')}}}); $$('#tabs .tab').forEach(t=>{const lock=t.getAttribute('data-lock');if(!lock)return;const need=ORDER.indexOf(lock);t.classList.toggle('locked',!(need<stageIndex()))});}
  function updateObjective(){const idx=stageIndex();const key=ORDER[idx]||null;const obj=$('#objective');if(obj&&key)obj.textContent='Мета: '+(OBJECTIVES[key]||'');else if(obj)obj.textContent=''}

  function bindSubmit(){const form=$('#flag-form');if(!form)return;const input=$('#flag-input');const status=$('#flag-status');form.addEventListener('submit',e=>{e.preventDefault();const guess=(input.value||'').trim();const idx=stageIndex();if(idx>=ORDER.length){status.textContent='Усі ключі прийнято. Перейдіть до Final.';return}const want=ORDER[idx];if(guess===FLAGS[want]){setStageIndex(idx+1);input.value='';status.textContent='Ключ прийнято.';pushChat('SRE: Ключ прийнято. Продовжуємо.');toast('Flag accepted','ok');flipKpi(want);refreshLedger();updateObjective();if(want==='stage5'){finalizeUI()}const sel=`#tabs .tab[data-lock="${want}"]`;const el=document.querySelector(sel)||document.querySelector('#tabs .tab[data-tab="/final"]');if(el){el.classList.remove('locked');el.classList.add('pulse');setTimeout(()=>el.classList.remove('pulse'),800)}}else{status.textContent='Невірний ключ для поточного етапу.';toast('Wrong flag for this stage','err');form.classList.add('shake');setTimeout(()=>form.classList.remove('shake'),200)}})}

  function enforceGate(){const req=ROUTE_REQ[location.pathname];if(!req)return;const need=ORDER.indexOf(req);if(stageIndex()<=need){const d=document.createElement('div');d.className='gate';d.innerHTML='<div class="inner"><h2>Locked stage</h2><p class="ua">Завершіть попередні етапи та надішліть ключ у «Submit Flag».</p></div>';$('#main').appendChild(d)}}
  function flipKpi(stage){if(stage==='stage2')$('#kpi-error')?.classList.replace('red','amber');if(stage==='stage3')$('#kpi-drift')?.classList.replace('red','amber');if(stage==='stage4')$('#kpi-lat')?.classList.replace('amber','green')}
  function maybeClearMailDot(){if(location.pathname.startsWith('/mail'))$('#mail-dot')?.remove()}

  function fx(){const c=document.getElementById('fx-canvas');if(!c||!c.getContext)return;const ctx=c.getContext('2d',{alpha:true});function resize(){c.width=innerWidth;c.height=innerHeight}resize();addEventListener('resize',resize);function frame(){const w=c.width,h=c.height;ctx.clearRect(0,0,w,h);if(!fxOn){requestAnimationFrame(frame);return}ctx.globalAlpha=0.08;for(let y=0;y<h;y+=2){ctx.fillStyle='#ff2e88';ctx.fillRect(0,y,w,1)}const n=3000;ctx.globalAlpha=0.08;for(let i=0;i<n;i++){const x=Math.random()*w,y=Math.random()*h;ctx.fillStyle=Math.random()>0.5?'#ff2e88':'#7a2cff';ctx.fillRect(x,y,1,1)}requestAnimationFrame(frame)}frame()}
  function widgets(){const hm=$('#heatmap');if(hm&&!hm.children.length){for(let i=0;i<24;i++){hm.appendChild(document.createElement('div'))}}const t=$('#ticker');if(t&&!_tickerInterval){const push=()=>{const p=document.createElement('p');const now=new Date().toISOString().replace('T',' ').split('.')[0];p.textContent=`[${now}] anomaly=${(Math.random()*1e4|0)} route=/infer status=${Math.random()>0.5?500:429}`;t.prepend(p);while(t.childElementCount>30)t.lastChild.remove()};for(let i=0;i<8;i++)push();_tickerInterval=setInterval(push,1200)}}

  const SLA_MIN=40;function initClock(){const key='ctf_start_ts';let ts=+sessionStorage.getItem(key)||0;if(!ts){ts=Date.now();sessionStorage.setItem(key,String(ts))}const banner=$('#incident-banner');function tickClock(){const elapsed=Math.floor((Date.now()-ts)/1000);const left=Math.max(0,SLA_MIN*60-elapsed);const m=Math.floor(left/60),s=left%60;if(banner&&!banner.classList.contains('ok'))banner.innerHTML=`<span class="blink">●</span> <strong>GLOBAL INCIDENT:</strong> SLA ${m}:${String(s).padStart(2,'0')} remaining`}tickClock();setInterval(tickClock,1000)}

  let _wsBackoff=800;function initWS(){if(sessionStorage.getItem('ctf_completed')==='1')return;try{const proto=location.protocol==='https:'?'wss':'ws';const ws=new WebSocket(`${proto}://${location.host}/ws`);_wsInstance=ws;ws.onopen=()=>{_wsBackoff=800};ws.onclose=()=>{if(sessionStorage.getItem('ctf_completed')==='1')return;setTimeout(initWS,Math.min(_wsBackoff,8000));_wsBackoff*=1.6};ws.onmessage=(ev)=>{if(sessionStorage.getItem('ctf_completed')==='1')return;try{const d=JSON.parse(ev.data);const kd=$('#kpi-drift');if(kd)kd.style.filter=`drop-shadow(0 0 ${Math.max(2,d.drift/8)}px #ff2e88)`;const ke=$('#kpi-error');if(ke)ke.style.filter=`drop-shadow(0 0 ${Math.max(2,d.error/8)}px #ff0038)`;const kl=$('#kpi-lat');if(kl)kl.style.filter=`drop-shadow(0 0 ${Math.max(2,d.lat/8)}px #ffea00)`;const hm=$('#heatmap');if(hm&&hm.children.length){const cells=[...hm.children];cells.forEach((c,i)=>{const v=d.heat[i% d.heat.length];c.style.background=`rgb(${20+v*2},10,20)`})}}catch(_){}}}catch(_){}}

  // Hints
  $('#hint-btn')?.addEventListener('click',()=>pushChat('SRE: Відкрий потрібну вкладку і натисни її кнопку підказки. Обмеження 3/5 хв.'));
  $$('.hint-btn').forEach(btn=>{btn.onclick=()=>{const st=btn.dataset.stage;const r=(window.CTF_HINT_API||{next:()=>({ok:false,msg:'No API'})}).next(st);const who=r.ok?'SRE':'RateLimiter';pushChat(`${who}: ${r.msg}`);if(!r.ok)toast('Hint cooldown active','warn');}});
  setInterval(()=>{const btns=document.querySelectorAll('.hint .hint-btn');const tokens=+sessionStorage.getItem('hint_tokens')||0;const last=+sessionStorage.getItem('hint_ts')||0;const left=Math.max(0,5*60*1000-(Date.now()-last));const m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);btns.forEach(b=>b.title=`Hints left: ${tokens} • Reset in ${m}:${String(s).padStart(2,'0')}`)},1000);

  // Audio
  let audioOn=false;const audioToggle=$('#audio-toggle');if(audioToggle){audioToggle.onclick=()=>{audioOn=!audioOn;audioToggle.textContent='Audio: '+(audioOn?'On':'Off');audioToggle.setAttribute('aria-pressed',audioOn?'true':'false'); if(audioOn){try{const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='square'; o.frequency.value=880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.02, ctx.currentTime); o.start(); o.stop(ctx.currentTime+0.06);}catch(_){}} }};

  // Gate overlay style
  const css=document.createElement('style');css.textContent=`.gate{position:absolute;inset:0;background:rgba(10,4,10,.9);display:grid;place-items:center;text-align:center;padding:2rem;border:3px solid var(--danger)} .gate .inner{max-width:520px}`;document.head.appendChild(css);

  // Visibility pause
  document.addEventListener('visibilitychange',()=>{const c=$('#fx-canvas');if(document.hidden){if(c)c.style.opacity='0';if(_tickerInterval){clearInterval(_tickerInterval);_tickerInterval=null}}else{if(c&&fxOn)c.style.opacity='0.17';if(!_tickerInterval)widgets()}});

  // Init
  bindTabs(); bindSubmit(); refreshLedger(); updateObjective(); enforceGate(); widgets(); fx(); initClock(); initWS(); if(sessionStorage.getItem('ctf_completed')==='1'){finalizeUI()} maybeClearMailDot();

  } catch (e) {
    console.error('CTF init error:', e);
    const b = document.getElementById('incident-banner'); if (b) { b.classList.remove('ok'); b.textContent = 'Init error — see console'; }
  }
})();