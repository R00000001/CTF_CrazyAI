(function(){
  window.CTF_HINTS = {
    stage1: ["Хтось залишив слід там, куди зазвичай не дивляться.","Лист виглядає чистим, але його оболонка — ні.","Open page source. Прапор у HTML-коментарі на початку."],
    stage2: ["Там, де забороняють ботам, люди часто підглядають.","«Двері» інколи називають буквально дверима.","Відкрий /robots.txt → /hidden-<seed>/door.html"],
    stage3: ["Дані приходять тихо, до того як ти їх просиш.","Поглянь на завантаження, яких не видно.","DevTools → Network → /public/data/preload-<seed>.json"],
    stage4: ["Хто вирішує, що ти адмін?","Відповідь зберігається біля тебе.","localStorage.setItem('role','admin') → reload /admin"],
    stage5: ["Ехо утримує. Контейнери мають кришки.","Кришки закриваються тегами.","</textarea> у параметрі q → ключ стане видимим."]
  };

  function refill(){
    const now = Date.now(); const last = +sessionStorage.getItem('hint_ts')||0;
    if (!last || now - last > 5*60*1000){ sessionStorage.setItem('hint_ts', String(now)); sessionStorage.setItem('hint_tokens','3'); }
  }
  function take(){
    refill(); let t = +sessionStorage.getItem('hint_tokens')||0; if (t<=0) return false; sessionStorage.setItem('hint_tokens', String(t-1)); return true;
  }
  function left(){
    const now=Date.now(); const last=+sessionStorage.getItem('hint_ts')||now; const ms=Math.max(0,5*60*1000-(now-last)); const m=Math.floor(ms/60000), s=Math.floor((ms%60000)/1000); return `${m}:${String(s).padStart(2,'0')}`;
  }

  window.CTF_HINT_API = { next(stage){
    if(!take()) return {ok:false, msg:`Ліміт підказок. Спробуй через ${left()}`};
    const arr=(window.CTF_HINTS||{})[stage]||[]; const key='hint_idx_'+stage; const idx=+sessionStorage.getItem(key)||0;
    const out=arr[Math.min(idx,arr.length-1)]||'Немає підказок.'; sessionStorage.setItem(key,String(Math.min(idx+1,arr.length-1))); return {ok:true,msg:out};
  }};
})();