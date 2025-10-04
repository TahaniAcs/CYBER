
/* CYBER TU – Phishing Stage (Standalone Overlay)
   Drop-in module, no dependencies. Uses CSS vars: --purple, --purple2, --gold
*/
(function(){
  // لو كان مُحمّل سابقاً، احذفه أولاً لتجنب تعريف مكرر
  try { if (window.PhishingStage) delete window.PhishingStage; } catch(e){}

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
  <style id="phishStageStyle">
    .phish-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:2100}
    .phish-wrap{width:min(1020px,94vw);max-height:90vh;display:flex;flex-direction:column;background:#0b1020;color:#fff;border:1px solid #23306b;border-radius:18px;box-shadow:0 25px 60px rgba(0,0,0,.5);overflow:hidden}
    .accent{height:6px;background:linear-gradient(90deg, ${BRAND.purple}, ${BRAND.purple2}, ${BRAND.gold});box-shadow:0 0 14px rgba(200,167,95,.25), inset 0 0 8px rgba(113,18,175,.25)}
    .hud{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#0e1634;border-bottom:1px solid #23306b}
    .chip{background:#111a3f;border:1px solid #2d3d7e;border-radius:10px;padding:6px 10px;color:#cfd5ff}
    .screen{padding:18px;overflow:auto}
    .toolbar{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#0e1634;border-top:1px solid #23306b}
    .btn{background:#23306b;color:#fff;border:1px solid #3a4aa1;padding:10px 14px;border-radius:10px;cursor:pointer;transition:.15s}
    .btn:hover{filter:brightness(1.05)}
    .btn.primary{background:${BRAND.purple2};border-color:#8c70db}
    .btn.ok{background:#1f7a53;border-color:#37aa7a}
    .btn.bad{background:#8a2741;border-color:#c14e67}
    .btn.partial{background:#b07a2e;border-color:#d0a65a}
    .btn[disabled]{opacity:.7;cursor:not-allowed}

    .card{background:#12193a;border:1px solid #23306b;border-radius:12px;padding:14px;margin:12px 0;color:#fff}
    .card h3{margin:0 0 8px}
    .muted{color:#cfd5ff}
    .row{display:flex;gap:10px;flex-wrap:wrap}

    /* email preview */
    .msg{background:#0f1430;border:1px solid #23306b;border-radius:12px;overflow:hidden}
    .msgHead{display:flex;gap:10px;align-items:center;padding:10px 12px;background:#10183a;border-bottom:1px solid #23306b}
    .msgBody{padding:12px}
    .from{font-weight:700}
    .pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;background:#182254;border:1px solid #31408f;color:#cfd5ff;padding:4px 8px;border-radius:999px}
    .danger{color:#ff9bad}
    .okMark{color:#7fe3a9}

    /* link bar */
    .linkBar{display:grid;gap:8px;margin-top:8px}
    .linkItem{display:flex;align-items:center;justify-content:space-between;background:#0f1430;border:1px solid #23306b;border-radius:10px;padding:10px}
    .url{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;font-size:12.5px}
    .preview{font-size:12.5px;color:#cfd5ff;opacity:.9}

    /* DnD area */
    .dndWrap{display:grid;grid-template-columns:1.4fr .6fr;gap:12px}
    .dropCol{display:grid;gap:10px}
    .dropArea{background:#0f1430;border:2px dashed #3a4aa1;color:#cfd5ff;border-radius:12px;min-height:90px;padding:10px;display:flex;align-items:center;justify-content:center;text-align:center;transition:.15s}
    .dropArea.inbox{border-color:#3a9ad9}
    .dropArea.delete{border-color:#d08a2a}
    .dropArea.report{border-color:#1f7a53}
    .dropArea.over{filter:brightness(1.15)}
    .fileChip{display:inline-flex;align-items:center;gap:8px;background:#e9edff;color:#0b1020;border:1px solid #c9d4ff;border-radius:999px;padding:10px 12px;font-weight:700;cursor:grab}
    .fileChip:active{cursor:grabbing}

    /* Minimal input style for step 1 */
    .input{flex:1;min-width:220px;background:#0f1430;color:#fff;border:1px solid #2a3a77;border-radius:10px;padding:10px}
    /* Simple chat UI for Step 1 */
    .chatWrap{background:#0f1430;border:1px solid #23306b;border-radius:12px;padding:12px}
    .chatLine{display:flex;gap:8px;margin:6px 0}
    .chatThem .bubble{background:#1a2252;border:1px solid #2f3f84}
    .chatYou  .bubble{background:#20305f;border:1px solid #3b4b96}
    .bubble{padding:8px 10px;border-radius:10px;max-width:85%}
    .chatFrom{font-size:12px;opacity:.9;margin-bottom:3px}
    .chatActions{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}
    .hintSmall{font-size:12.5px;color:#cfd5ff;margin-top:6px}
  </style>
  <div class="phish-overlay" role="dialog" aria-modal="true">
    <div class="phish-wrap">
      <div class="accent"></div>
      <div class="hud">
        <div class="chip">Stage: <b>Phishing</b></div>
        <div style="display:flex;gap:8px">
          <div class="chip">Score: <b id="pScore">0</b></div>
          <div class="chip">Lives: <b id="pLives">2</b></div>
        </div>
      </div>
      <div class="screen" id="pScreen"></div>
      <div class="toolbar">
        <button class="btn" id="pClose">← Back</button>
        <div class="row">
          <button class="btn" id="pPrev">Prev</button>
          <button class="btn primary" id="pNext">Next</button>
        </div>
      </div>
    </div>
  </div>
  `;

  const PhishingStage = {
    open(opts={}){
      // امنع تكرار الفتح
      if(document.querySelector('.phish-overlay')) return;
      const host = document.createElement('div');
      host.innerHTML = tpl;
      document.body.appendChild(host);

      const state = { score:0, lives:2, step:0, step1Acted:false };
      const screen = host.querySelector('#pScreen');
      const btnNext = host.querySelector('#pNext');
      const btnPrev = host.querySelector('#pPrev');
      const btnClose= host.querySelector('#pClose');

      btnPrev.addEventListener('click', ()=>{ if(state.step>0){ state.step--; render(); } });
      btnNext.addEventListener('click', ()=>{ if(state.step<4){ state.step++; render(); } });
      btnClose.addEventListener('click', ()=> close(true));

      function updHUD(){
        host.querySelector('#pScore').textContent = state.score;
        host.querySelector('#pLives').textContent = state.lives;
      }
      function enableNav(){ btnPrev.disabled=false; btnNext.disabled=false; }
      function disableNav(){ btnPrev.disabled=true; btnNext.disabled=true; }

      function answer(type, el){
        const card = el?.closest('.card');
        if(card){ card.querySelectorAll('button').forEach(b=>b.disabled=true); }
        if(type==='full'){ state.score+=10; }
        else if(type==='wrong'){ state.score=Math.max(0,state.score-5); state.lives=Math.max(0,state.lives-1); }
        else if(type==='partial'){ state.score=Math.max(0,state.score-2); }
        updHUD();
      }

      function initDnD(){
        const file = screen.querySelector('#dragFile');
        const zones = Array.from(screen.querySelectorAll('.dropArea'));
        if(!file || !zones.length) return;

        file.addEventListener('dragstart', (e)=>{
          e.dataTransfer.setData('text/plain','invoice.zip');
          file.setAttribute('aria-grabbed','true');
        });
        file.addEventListener('dragend', ()=> file.setAttribute('aria-grabbed','false'));

        zones.forEach(z=>{
          z.addEventListener('dragover',(e)=>{ e.preventDefault(); z.classList.add('over'); });
          z.addEventListener('dragleave', ()=> z.classList.remove('over'));
          z.addEventListener('drop',(e)=>{
            e.preventDefault(); z.classList.remove('over');
            zones.forEach(x=> x.style.pointerEvents='none');
            const fileEl = screen.querySelector('#dragFile');
            if(fileEl){ fileEl.draggable=false; fileEl.style.opacity='.6'; }
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
        btnPrev.disabled = (s===0);
        btnNext.disabled = (s>=4);

        // Step 0 — Identify suspicious sender/display name mismatch
        if(s===0){
          screen.innerHTML = `
            <div class="card">
              <h3>Spot the Suspicious Sender</h3>
              <div class="msg">
                <div class="msgHead">
                  <span class="from">"IT Support (TU)" &lt;secure-update@tu-helpcenter-secure.com&gt;</span>
                  <span class="pill danger">⚠ Looks-alike domain</span>
                </div>
                <div class="msgBody">
                  Dear Student, your mailbox will be deactivated. <b>Sign in now</b> to keep your emails.
                </div>
              </div>
              <p class="muted" style="margin-top:8px">Which action is safest?</p>
              <div class="row">
                <button class="btn" id="s0a">Open and sign in</button>
                <button class="btn" id="s0b">Report as phishing</button>
                <button class="btn" id="s0c">Reply and ask if it's real</button>
              </div>
            </div>`;
          screen.querySelector('#s0a').addEventListener('click',(e)=>{ e.target.classList.add('bad');  answer('wrong', e.target); });
          screen.querySelector('#s0b').addEventListener('click',(e)=>{ e.target.classList.add('ok');   answer('full', e.target); });
          screen.querySelector('#s0c').addEventListener('click',(e)=>{ e.target.classList.add('partial'); answer('partial', e.target); });
          enableNav();
          return;
        }

        // Step 1 — (NEW) Support Chat: social engineering
        if(s===1){
          screen.innerHTML = `
            <div class="card">
              <h3>Support Chat — Verify the Request</h3>
              <div class="chatWrap">
                <div class="chatLine chatThem">
                  <div class="bubble">
                    <div class="chatFrom">"TU Support" (unknown number)</div>
                    Hello! We detected suspicious activity. Please send the 6-digit code that you just received to keep your account active.
                  </div>
                </div>
                <div class="chatLine chatYou">
                  <div class="bubble">
                    (You haven't replied yet)
                  </div>
                </div>
              </div>
              <div class="chatActions">
                <input id="seInput" class="input" placeholder="Type your message…" />
                <button class="btn" id="seSend">Send the code</button>
                <button class="btn ok" id="seBlock">Block & Report</button>
                <button class="btn partial" id="seAsk">Ask for verification</button>
              </div>
              <div class="hintSmall">Hint: Real support will never ask you to <b>send codes</b> you receive.</div>
            </div>`;
          // امنع التالي حتى يتخذ اللاعب إجراءً
          btnNext.disabled = !state.step1Acted;
          btnPrev.disabled = false;

          const lockAndAllowNext = ()=>{
            state.step1Acted = true;
            ['seSend','seBlock','seAsk','seInput'].forEach(id=>{
              const el = screen.querySelector('#'+id);
              if(el) el.disabled = true;
            });
            btnNext.disabled = false;
          };

          screen.querySelector('#seSend').addEventListener('click', (e)=>{
            e.target.classList.add('bad');
            answer('wrong', e.target);
            lockAndAllowNext();
          });
          screen.querySelector('#seBlock').addEventListener('click', (e)=>{
            e.target.classList.add('ok');
            answer('full', e.target);
            lockAndAllowNext();
          });
          screen.querySelector('#seAsk').addEventListener('click', (e)=>{
            e.target.classList.add('partial');
            answer('partial', e.target);
            lockAndAllowNext();
          });
          return;
        }

        // Step 2 — Attachment decision
        if(s===2){
          screen.innerHTML = `
            <div class="card">
              <h3>Suspicious Attachment</h3>
              <div class="msg">
                <div class="msgHead">
                  <span class="from">Finance Office &lt;finance@tu.edu&gt;</span>
                  <span class="pill">Attachment</span>
                </div>
                <div class="msgBody">
                  Please review the attached invoice and confirm payment.<br>
                  <small class="muted">Attachment: <b>invoice.zip</b></small>
                </div>
              </div>
              <p class="muted" style="margin-top:8px">What's the safest next step?</p>
              <div class="row">
                <button class="btn" id="s2a">Open the ZIP</button>
                <button class="btn" id="s2b">Report as phishing</button>
                <button class="btn" id="s2c">Delete without reporting</button>
              </div>
            </div>`;
          screen.querySelector('#s2a').addEventListener('click',(e)=>{ e.target.classList.add('bad');  answer('wrong', e.target); });
          screen.querySelector('#s2b').addEventListener('click',(e)=>{ e.target.classList.add('ok');   answer('full', e.target); });
          screen.querySelector('#s2c').addEventListener('click',(e)=>{ e.target.classList.add('partial'); answer('partial', e.target); });
          enableNav();
          return;
        }

        // Step 3 — Drag & drop the attachment
        if(s===3){
          screen.innerHTML = `
            <div class="card">
              <h3>Handle the Attachment</h3>
              <div class="dndWrap">
                <div>
                  <div class="muted" style="margin-bottom:6px">Drag this file:</div>
                  <div id="dragFile" class="fileChip" draggable="true" aria-grabbed="false">📎 invoice.zip</div>
                </div>
                <div class="dropCol">
                  <div class="dropArea inbox"  data-drop="inbox">Drop to Inbox</div>
                  <div class="dropArea delete" data-drop="delete">Drop to Delete</div>
                  <div class="dropArea report" data-drop="report">Drop to Report</div>
                </div>
              </div>
              <div class="muted" style="margin-top:10px">Tip: Unknown compressed files can hide malware.</div>
            </div>`;
          initDnD();
          enableNav();
          return;
        }

        // Step 4 — Completed
        screen.innerHTML = `
          <div class="card">
            <h3>Phishing Stage Complete 🎉</h3>
            <p class="muted">Great job spotting phishing attempts. You can close this stage and return to the map.</p>
            <div class="row">
              <button class="btn ok" id="pDone">Finish</button>
            </div>
          </div>`;
        btnPrev.disabled=false; btnNext.disabled=true;
        screen.querySelector('#pDone').addEventListener('click', ()=> close(false, true));
      }

      function close(byBack=false, completed=false){
        const res = { scoreDelta: state.score, livesDelta:(2 - state.lives), completed };
        const overlay = host.querySelector('.phish-overlay');
        if(overlay) overlay.remove();
        if(typeof opts.onFinish==='function'){
          try{ opts.onFinish(res); }catch{}
        }
      }

      // start
      render();
      // منع الإغلاق بالنقر خارجياً
      host.querySelector('.phish-overlay').addEventListener('click', (e)=>{
        if(e.target.classList.contains('phish-overlay')){ /* ignore */ }
      });
    }
  };

  window.PhishingStage = PhishingStage;
})();
