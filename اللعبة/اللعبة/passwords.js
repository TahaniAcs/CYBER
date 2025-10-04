
/* CYBER TU – Passwords Stage (Standalone Overlay)
   Drop-in module. No dependencies. 
   Usage in your page: 
   <script src="passwords.js"></script>
   <button onclick="PasswordsStage.open()">Passwords</button>
*/
(function(){
  const BRAND = {
    purple: getCSS('--purple', '#380d45'),
    purple2: getCSS('--purple2', '#53265f'),
    gold: getCSS('--gold', '#C8A75F'),
  };

  function getCSS(varName, fallback){
    try{
      const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      return v || fallback;
    }catch{ return fallback; }
  }

  const tpl = `
  <style id="pwdStageStyle">
    .pwd-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:2000;}
    .pwd-wrap{width:min(1020px,94vw);max-height:90vh;display:flex;flex-direction:column;background:#0b1020;color:#fff;border:1px solid #23306b;border-radius:18px;box-shadow:0 25px 60px rgba(0,0,0,.5);overflow:hidden}
    .pwd-hud{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#0e1634;border-bottom:1px solid #23306b}
    .chip{background:#111a3f;border:1px solid #2d3d7e;border-radius:10px;padding:6px 10px;color:#cfd5ff}
    .pwd-screen{padding:18px;overflow:auto}
    .card{background:#12193a;border:1px solid #23306b;border-radius:12px;padding:14px;margin:12px 0;color:#fff}
    .card h3{margin:0 0 8px}
    .muted{color:#cfd5ff}
    .row{display:flex;gap:10px;flex-wrap:wrap}
    .btn{background:#23306b;color:#fff;border:1px solid #3a4aa1;padding:10px 14px;border-radius:10px;cursor:pointer;transition:.15s}
    .btn:hover{filter:brightness(1.05)}
    .btn.primary{background:${BRAND.purple2};border-color:#8c70db}
    .btn.ok{background:#1f7a53;border-color:#37aa7a}
    .btn.bad{background:#8a2741;border-color:#c14e67}
    .btn.partial{background:#b07a2e;border-color:#d0a65a}
    .btn[disabled]{opacity:.7;cursor:not-allowed}
    .toolbar{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#0e1634;border-top:1px solid #23306b}
    .field{display:flex;gap:8px;align-items:center}
    .input{flex:1;min-width:220px;background:#0f1430;color:#fff;border:1px solid #2a3a77;border-radius:10px;padding:10px}
    .hint{font-size:.95rem;color:#e6e6e6}

    .emailCard{background:#fff;color:#111;border-radius:10px;padding:12px;display:flex;gap:12px;align-items:flex-start}
    .emailLeft{width:64px;height:64px;background:#f0f4ff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#3a1d71}
    .emailBody{flex:1}

    /* Drag & Drop */
    .dndWrap{display:grid;grid-template-columns:1.4fr .6fr;gap:12px}
    .dropCol{display:grid;gap:10px}
    .dropArea{background:#0f1430;border:2px dashed #3a4aa1;color:#cfd5ff;border-radius:12px;min-height:90px;padding:10px;display:flex;align-items:center;justify-content:center;text-align:center;transition:.15s}
    .dropArea.inbox{border-color:#3a9ad9}
    .dropArea.delete{border-color:#d08a2a}
    .dropArea.report{border-color:#1f7a53}
    .dropArea.over{filter:brightness(1.15)}
    .fileChip{display:inline-flex;align-items:center;gap:8px;background:#e9edff;color:#0b1020;border:1px solid #c9d4ff;border-radius:999px;padding:10px 12px;font-weight:700;cursor:grab}
    .fileChip:active{cursor:grabbing}

    /* Accent bar in brand gradient */
    .accent{
      height:6px;background:linear-gradient(90deg, ${BRAND.purple}, ${BRAND.purple2}, ${BRAND.gold});
      box-shadow:0 0 14px rgba(200,167,95,.25), inset 0 0 8px rgba(113,18,175,.25);
    }
  </style>
  <div class="pwd-overlay" role="dialog" aria-modal="true">
    <div class="pwd-wrap">
      <div class="accent"></div>
      <div class="pwd-hud">
        <div class="chip">Stage: <b>Passwords</b></div>
        <div style="display:flex;gap:8px">
          <div class="chip">Score: <b id="pwdScore">0</b></div>
          <div class="chip">Lives: <b id="pwdLives">2</b></div>
        </div>
      </div>
      <div class="pwd-screen" id="pwdScreen"></div>
      <div class="toolbar">
        <button class="btn" id="pwdClose">← Back</button>
        <div class="row">
          <button class="btn" id="pwdPrev">Prev</button>
          <button class="btn primary" id="pwdNext">Next</button>
        </div>
      </div>
    </div>
  </div>
  `;

  const PasswordsStage = {
    open(opts={}){
      if(document.querySelector('.pwd-overlay')) return; // already open
      const host = document.createElement('div');
      host.innerHTML = tpl;
      document.body.appendChild(host);

      // state
      const state = { score:0, lives:2, step:0, pwAccepted:false, done:false };
      const screen = host.querySelector('#pwdScreen');
      const btnNext = host.querySelector('#pwdNext');
      const btnPrev = host.querySelector('#pwdPrev');
      const btnClose= host.querySelector('#pwdClose');

      btnPrev.addEventListener('click', ()=>{ if(state.step>0){ state.step--; render(); } });
      btnNext.addEventListener('click', ()=>{ if(state.step<4){ state.step++; render(); } });
      btnClose.addEventListener('click', ()=> close(true));

      function updHUD(){
        host.querySelector('#pwdScore').textContent = state.score;
        host.querySelector('#pwdLives').textContent = state.lives;
      }
      function disableNav(){ btnPrev.disabled=true; btnNext.disabled=true; }
      function enableNav(){ btnPrev.disabled=false; btnNext.disabled=false; }

      // helpers
      function isStrong(pw){
        if(!pw || pw.length<8) return false;
        const up=/[A-Z]/.test(pw), lo=/[a-z]/.test(pw), di=/[0-9]/.test(pw), sp=/[^A-Za-z0-9]/.test(pw);
        return up&&lo&&di&&sp;
      }
      function answer(type, el){
        const card = el?.closest('.card');
        if(card){ card.querySelectorAll('button').forEach(b=>b.disabled=true); }
        if(type==='full'){ state.score+=10; }
        else if(type==='wrong'){ state.score=Math.max(0,state.score-5); state.lives=Math.max(0,state.lives-1); }
        else if(type==='partial'){ state.score=Math.max(0,state.score-2); }
        updHUD();
      }

      function acceptPassword(){
        if(state.pwAccepted) return;
        const v = (screen.querySelector('#pwInput')||{}).value||'';
        if(!isStrong(v)) return;
        state.pwAccepted = true;
        state.score += 10; 
        updHUD();
        const input = screen.querySelector('#pwInput');
        const btn = screen.querySelector('#pwBtn');
        if(input){ input.readOnly=true; input.style.opacity=.8; }
        if(btn){ btn.disabled=true; btn.textContent='Accepted ✓'; }
        state.step = 1; render();
      }

      function initDnD(){
        const file = screen.querySelector('#dragFile');
        const zones = Array.from(screen.querySelectorAll('.dropArea'));
        if(!file || !zones.length) return;

        file.addEventListener('dragstart', (e)=>{
          e.dataTransfer.setData('text/plain','setup.exe');
          file.setAttribute('aria-grabbed','true');
        });
        file.addEventListener('dragend', ()=> file.setAttribute('aria-grabbed','false'));

        zones.forEach(z=>{
          z.addEventListener('dragover',(e)=>{ e.preventDefault(); z.classList.add('over'); });
          z.addEventListener('dragleave', ()=> z.classList.remove('over'));
          z.addEventListener('drop',(e)=>{
            e.preventDefault(); z.classList.remove('over');
            zones.forEach(x=> x.style.pointerEvents='none');
            file.draggable=false; file.style.opacity=.6;
            const kind=z.getAttribute('data-drop');
            if(kind==='report')      answer('full', z);
            else if(kind==='inbox')  answer('wrong', z);
            else if(kind==='delete') answer('partial', z);
          });
        });
      }

      function render(){
        updHUD();
        const s = state.step;
        // boundaries
        btnPrev.disabled = (s===0);
        btnNext.disabled = (s>=4);

        // step views
        if(s===0){
          screen.innerHTML = `
            <div class="card">
              <h3>Create a Strong Password for Your Building</h3>
              <p class="muted">At least 8 characters and include: uppercase, lowercase, number, and symbol.</p>
              <div class="field">
                <input id="pwInput" class="input" type="password" placeholder="Type your password" />
                <button id="pwBtn" class="btn primary" disabled>Accept</button>
              </div>
              <div id="pwMsg" class="muted" style="margin-top:8px">Strength: <b>Weak</b></div>
              <div class="muted" style="margin-top:10px">Tip: Use a passphrase (e.g. "BlueHorse-Tree#2025").</div>
            </div>`;
          const input = screen.querySelector('#pwInput');
          const msg = screen.querySelector('#pwMsg');
          const btn = screen.querySelector('#pwBtn');
          input.addEventListener('input', ()=>{
            const ok=isStrong(input.value);
            btn.disabled=!ok;
            msg.innerHTML = `Strength: <b style="color:${ ok ? '#6fe3a8' : '#ff8da1' }">${ ok ? 'Strong' : 'Weak' }</b>`;
          });
          btn.addEventListener('click', acceptPassword);
          // no nav until accept
          btnPrev.disabled=true; btnNext.disabled=true;
          return;
        }

        if(s===1){
          screen.innerHTML = `
            <div class="card">
              <h3>Google Search — Choose the Safe Amazon Link</h3>
              <p class="muted">All say “Amazon” but only one is the real domain. Pick the safest.</p>
              <div style="margin:12px 0;background:#0f1430;padding:10px;border-radius:8px;border:1px solid #23306b;color:#cfd5ff">
                <div style="font-weight:700;margin-bottom:8px">Search: "amazon"</div>
                <div style="font-size:14px;line-height:1.4">
                  <div>🔗 <small>https://www.amazon.com</small></div>
                  <div>🔗 <small>http://amazon.verify-login.com</small></div>
                  <div>🔗 <small>https://amaz0n.com</small></div>
                </div>
              </div>
              <div class="row">
                <button class="btn" id="a1">https://www.amazon.com</button>
                <button class="btn" id="a2">http://amazon.verify-login.com</button>
                <button class="btn" id="a3">https://amaz0n.com</button>
              </div>
              <div class="muted" style="margin-top:10px">Tip: Check the exact domain  .</div>
            </div>`;
          screen.querySelector('#a1').addEventListener('click', (e)=>{ e.target.classList.add('ok'); answer('full', e.target); });
          screen.querySelector('#a2').addEventListener('click', (e)=>{ e.target.classList.add('bad'); answer('wrong', e.target); });
          screen.querySelector('#a3').addEventListener('click', (e)=>{ e.target.classList.add('bad'); answer('wrong', e.target); });
          enableNav();
          return;
        }

        if(s===2){
          screen.innerHTML = `
            <div class="card">
              <h3> Message</h3>
              <p class="muted">"Congratulations! You have won free credit with STC. Click here to claim your prize!"</p>
              <div class="row">
                <button class="btn" id="b1">Click the link</button>
                <button class="btn" id="b2">Report it</button>
              </div>
            </div>`;
          screen.querySelector('#b1').addEventListener('click', (e)=>{ e.target.classList.add('bad'); answer('wrong', e.target); });
          screen.querySelector('#b2').addEventListener('click', (e)=>{ e.target.classList.add('ok');  answer('full', e.target); });
          enableNav();
          return;
        }

        if(s===3){
          screen.innerHTML = `
            <div class="card">
              <h3>TU Email</h3>
              <div class="emailCard" aria-label="Email preview">
                <div class="emailLeft">TU</div>
                <div class="emailBody">
                  <div style="font-weight:700">From: TU Notifications &lt;no-reply@tu.edu&gt;</div>
                  <div class="muted" style="margin:6px 0">Subject: Important – Please check</div>
                  <div style="margin-top:8px">Please drag this file and drop it into your inbox to complete setup. <br><small class='muted'>Attachment: <b>setup.exe</b></small></div>
                </div>
              </div>

              <div style="height:12px"></div>

              <div class="dndWrap">
                <div>
                  <div class="muted" style="margin-bottom:6px">Drag this attachment:</div>
                  <div id="dragFile" class="fileChip" draggable="true" aria-grabbed="false">📎 setup.exe</div>
                </div>
                <div class="dropCol">
                  <div class="dropArea inbox"  data-drop="inbox"  aria-label="Drop to Inbox">Drop to Inbox</div>
                  <div class="dropArea delete" data-drop="delete" aria-label="Drop to Delete">Drop to Delete</div>
                  <div class="dropArea report" data-drop="report" aria-label="Drop to Report">Drop to Report</div>
                </div>
              </div>

              <div class="muted" style="margin-top:10px">Hint: Real university emails won't ask you to run unknown attachments. </div>
            </div>`;
          initDnD();
          enableNav();
          return;
        }

        // Completed
        screen.innerHTML = `
          <div class="card">
            <h3>Passwords Stage Complete 🎉</h3>
            <p class="muted">Great job! You can close this stage and return to the map.</p>
            <div class="row">
              <button class="btn ok" id="pwdDone">Finish</button>
            </div>
          </div>`;
        btnPrev.disabled=false; btnNext.disabled=true;
        screen.querySelector('#pwdDone').addEventListener('click', ()=> close(false, true));
      }

      function close(byBack=false, completed=false){
        const res = { scoreDelta: state.score, livesDelta: (2-state.lives), completed };
        // cleanup
        host.remove();
        if(typeof opts.onFinish==='function'){
          try{ opts.onFinish(res); }catch{}
        }
      }

      // render first
      render();
      // close on overlay click outside? (اختياري – مقفول الآن)
      host.querySelector('.pwd-overlay').addEventListener('click', (e)=>{
        if(e.target.classList.contains('pwd-overlay')){ /* click outside ignored */ }
      });
    }
  };

  // expose
  window.PasswordsStage = PasswordsStage;
})();


