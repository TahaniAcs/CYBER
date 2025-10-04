
/* network.js - Network stage for CYBER TU */
/* يعتمد على: state, updateHUD(), enableNav(), disableNav(), backToMap() */

(function(){
  // تجنب التعريف المكرر
  if (window.renderNetwork) return;

  function setScreen(html){
    const screen = document.getElementById('screen');
    if (screen) screen.innerHTML = html;
  }

  // تهيئة بيانات مؤقتة للمرحلة
  window.initNetwork = function(){
    state.network = { selected:null, firstChoice:null, action:null, outcome:null };
  };

  // العرض الرئيسي حسب state.step
  window.renderNetwork = function(){
    const s = state.step;
    disableNav(); // افتراضيًا

    // خطوة 0: مقدمة + قرار أولي
    if (s === 0){
      setScreen(`
        <div class="card">
          <h3>Network Troubleshooting</h3>
          <p class="muted">The network is slow and some devices show unusual traffic. You have a simple scanner.</p>
          <div class="row" style="margin-top:12px">
            <button class="btn" onclick="networkChoose('ignore', this)">Ignore (unsafe)</button>
            <button class="btn" onclick="networkChoose('scan', this)">Run quick network scan</button>
            <button class="btn" onclick="networkChoose('isolate', this)">Isolate affected machine</button>
          </div>
          <div class="muted" style="margin-top:10px">Tip: Scanning gives data; isolation helps but may not find the root cause.</div>
        </div>
      `);
      return;
    }

    // خطوة 1: نتائج المسح
    if (s === 1){
      setScreen(`
        <div class="card">
          <h3>Scan Results</h3>
          <p class="muted">Choose the most suspicious host/port.</p>
          <div style="margin:10px 0;background:#0f1430;padding:10px;border-radius:8px;border:1px solid #23306b;color:#cfd5ff">
            <div style="font-weight:700;margin-bottom:8px">Scan: 192.168.1.0/24</div>
            <div style="font-size:14px;line-height:1.6">
              <div>• 192.168.1.10 : 80  (HTTP) — Known web server</div>
              <div>• 192.168.1.21 : 22  (SSH)  — Remote admin</div>
              <div>• 192.168.1.77 : 445 (SMB)  — File sharing (unusual)</div>
              <div>• 192.168.1.99 : 31337 (unknown high port)</div>
            </div>
          </div>
          <div class="row">
            <button class="btn" onclick="networkPick('192.168.1.10:80', this)">192.168.1.10:80</button>
            <button class="btn" onclick="networkPick('192.168.1.21:22', this)">192.168.1.21:22</button>
            <button class="btn" onclick="networkPick('192.168.1.77:445', this)">192.168.1.77:445</button>
            <button class="btn" onclick="networkPick('192.168.1.99:31337', this)">192.168.1.99:31337</button>
          </div>
          <div class="muted" style="margin-top:10px">Hint: Unexpected SMB or uncommon high ports can indicate compromise.</div>
        </div>
      `);
      enableNav();
      return;
    }

    // خطوة 2: اتخاذ الإجراء
    if (s === 2){
      const sel = (state.network && state.network.selected) || 'host';
      setScreen(`
        <div class="card">
          <h3>Action for ${sel}</h3>
          <p class="muted">What is the best next step?</p>
          <div class="row">
            <button class="btn" onclick="networkAct('block', this)">Block at firewall</button>
            <button class="btn" onclick="networkAct('notify', this)">Notify admin & monitor</button>
            <button class="btn" onclick="networkAct('reboot', this)">Reboot host remotely</button>
          </div>
          <div class="muted" style="margin-top:10px">Tip: Blocking & notifying are safer than rebooting (which can destroy evidence).</div>
        </div>
      `);
      enableNav();
      return;
    }

    // خطوة 3: النتيجة النهائية
    if (s === 3){
      const outcome = (state.network && state.network.outcome) || { text:'No action taken', score:0 };
      setScreen(`
        <div class="card">
          <h3>Result</h3>
          <p class="muted">${outcome.text}</p>
          <div class="row" style="margin-top:12px">
            <button class="btn" onclick="backToMap()">Back to Map</button>
            <button class="btn" onclick="state.step=0; renderNetwork();">Retry</button>
          </div>
        </div>
      `);
      disableNav();
      return;
    }

    setScreen(`<div class="card"><h3>Network</h3><p class="muted">Loading...</p></div>`);
  };

  // تفاعلات الأزرار
  window.networkChoose = function(choice, btn){
    const card = btn.closest('.card'); if(card) card.querySelectorAll('button').forEach(b=>b.disabled=true);
    if(!state.network) state.network = {};
    state.network.firstChoice = choice;

    if(choice === 'ignore'){
      state.score = Math.max(0, state.score - 5);
      state.lives = Math.max(0, state.lives - 1);
      state.network.outcome = { text:'Ignored the issue. Problem worsened (-5 pts, -1 life).', score:-5 };
      updateHUD();
      state.step = 3; renderNetwork(); return;
    }
    if(choice === 'isolate'){
      state.score += 5;
      state.network.outcome = { text:'Isolated the machine. Helpful but more investigation needed. (+5 pts)', score:5 };
      updateHUD();
      state.step = 3; renderNetwork(); return;
    }
    // scan
    state.step = 1; renderNetwork();
  };

  window.networkPick = function(host, btn){
    const card = btn.closest('.card'); if(card) card.querySelectorAll('button').forEach(b=>b.disabled=true);
    if(!state.network) state.network = {};
    state.network.selected = host;
    state.step = 2; renderNetwork();
  };

  window.networkAct = function(action, btn){
    const card = btn.closest('.card'); if(card) card.querySelectorAll('button').forEach(b=>b.disabled=true);
    const host = (state.network && state.network.selected) || 'host';

    if(!state.network) state.network = {};
    state.network.action = action;

    if(action === 'block'){
      state.score += 10;
      state.network.outcome = { text:`Blocked ${host} at firewall. Suspicious traffic stopped. (+10 pts)`, score:10 };
    } else if(action === 'notify'){
      state.score += 7;
      state.network.outcome = { text:`Notified admins and continued monitoring. Good teamwork. (+7 pts)`, score:7 };
    } else { // reboot
      state.score = Math.max(0, state.score - 3);
      state.lives = Math.max(0, state.lives - 1);
      state.network.outcome = { text:`Rebooted host. Symptoms gone but evidence lost. (-3 pts, -1 life)`, score:-3 };
    }

    updateHUD();
    state.step = 3; renderNetwork();
  };

})();
