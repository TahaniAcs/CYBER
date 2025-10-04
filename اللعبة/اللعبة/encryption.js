
/* encryption.js — CYBER TU: Encryption Stage
   يعتمد على دوال/حالة من ame.html: state, updateHUD(), enableNav(), disableNav(), backToMap()
*/
(function(){
  if (window.renderEncryption) return; // تجنّب التعريف المكرر

  // تهيئة بيانات المرحلة
  window.initEncryption = function(){
    state.encryption = { q0:null, q1:null, practiced:false, decrypted:false };
  };

  function setScreen(html){
    const el = document.getElementById('screen');
    if (el) el.innerHTML = html;
  }

  // قيصر بسيط للتوضيح التعليمي
  function caesarEncrypt(text, shift){
    const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ', al=a.toLowerCase();
    const s=((shift%26)+26)%26;
    let out='';
    for(const ch of text){
      if(a.includes(ch)) out += a[(a.indexOf(ch)+s)%26];
      else if(al.includes(ch)) out += al[(al.indexOf(ch)+s)%26];
      else out += ch;
    }
    return out;
  }
  function caesarDecrypt(text, shift){ return caesarEncrypt(text, -shift); }

  // العرض حسب الخطوات
  window.renderEncryption = function(){
    const s = state.step;
    document.getElementById('hudStage').textContent = 'Encryption';
    disableNav(); // نفعّل عند الحاجة

    // الخطوة 0: اختيار الطريقة المناسبة لسيناريو 1
    if (s === 0){
      setScreen(`
        <div class="card">
          <h3>Choose the Right Method (1/2)</h3>
          <p class="muted">You want to encrypt a large archive on your <b>own laptop</b> and access it quickly.</p>
          <div class="row">
            <button class="btn" onclick="encChoose(0,'symmetric',this)">Use Symmetric (AES)</button>
            <button class="btn" onclick="encChoose(0,'asymmetric',this)">Use Asymmetric (RSA)</button>
          </div>
          <div class="muted" style="margin-top:10px">Hint: Speed matters for local storage.</div>
        </div>
      `);
      // نسمح بالتنقّل بعد الاختيار
      return;
    }

    // الخطوة 1: اختيار الطريقة المناسبة لسيناريو 2
    if (s === 1){
      setScreen(`
        <div class="card">
          <h3>Choose the Right Method (2/2)</h3>
          <p class="muted">You need to send a secret to a partner <b>online</b> without any pre-shared key.</p>
          <div class="row">
            <button class="btn" onclick="encChoose(1,'symmetric',this)">Use Symmetric (AES)</button>
            <button class="btn" onclick="encChoose(1,'asymmetric',this)">Use Asymmetric (RSA)</button>
          </div>
          <div class="muted" style="margin-top:10px">Hint: Key exchange is the challenge.</div>
        </div>
      `);
      return;
    }

    // الخطوة 2: تمرين عملي - تشفير بسيط (قيصر)
    if (s === 2){
      setScreen(`
        <div class="card">
          <h3>Practice: Encrypt</h3>
          <p class="muted">This is a simple Caesar cipher to understand the idea of keys and shifting (not secure in real life!).</p>
          <div class="field" style="margin:8px 0">
            <input id="encPlain" class="input" type="text" placeholder="Type a short message..." />
          </div>
          <div class="field" style="margin:8px 0">
            <input id="encKey" class="input" type="number" min="1" max="25" value="3" style="max-width:160px" />
            <button class="btn primary" onclick="encDoEncrypt()">Encrypt</button>
          </div>
          <div id="encOutWrap" class="hint" style="display:none;margin-top:6px">
            Ciphertext: <b id="encOut"></b>
          </div>
          <div class="muted" style="margin-top:10px">After you encrypt at least once, you can go Next.</div>
        </div>
      `);
      // ممنوع التالي حتى يضغط Encrypt
      document.getElementById('btnNext').disabled = !state.encryption?.practiced;
      document.getElementById('btnPrev').disabled = false;
      return;
    }

    // الخطوة 3: تمرين فك تشفير
    if (s === 3){
      const cipher = 'Fdhvdu Flskhu lv ixq!';
      setScreen(`
        <div class="card">
          <h3>Practice: Decrypt</h3>
          <p class="muted">Decrypt the following with key = 3:</p>
          <div class="hint" style="margin:6px 0">Ciphertext: <b>${cipher}</b></div>
          <div class="field" style="margin:8px 0">
            <input id="decInput" class="input" type="text" placeholder="Type the plaintext..." />
            <button class="btn primary" onclick="encCheckDecrypt()">Check</button>
          </div>
          <div id="decMsg" class="muted" style="margin-top:6px"></div>
        </div>
      `);
      // ممنوع التالي حتى يحلها صح
      document.getElementById('btnNext').disabled = !state.encryption?.decrypted;
      document.getElementById('btnPrev').disabled = false;
      return;
    }

    // الخطوة 4: إتمام المرحلة
    setScreen(`
      <div class="card">
        <h3>Encryption Stage Complete 🎉</h3>
        <p class="muted">Great job! You compared symmetric vs asymmetric and practiced basic encrypt/decrypt.</p>
        <div class="row" style="margin-top:10px">
          <button class="btn" onclick="backToMap()">Back to Map</button>
          <button class="btn" onclick="state.step=0; renderEncryption();">Retry</button>
        </div>
      </div>
    `);
    disableNav(); // ما نحتاج Prev/Next هنا
  };

  // التعامل مع اختيارات الخطوتين 0 و 1
  window.encChoose = function(qIndex, choice, btn){
    // تعطيل أزرار البطاقة لتفادي التكرار
    const card = btn.closest('.card');
    if (card) card.querySelectorAll('button').forEach(b=>b.disabled=true);

    if (!state.encryption) state.encryption = {};
    // تصحيح الإجابات
    if (qIndex === 0){
      // كبير وسريع محليًا -> تماثلي (AES) هو الأنسب
      if (choice === 'symmetric'){ state.score += 10; } else { state.score = Math.max(0, state.score - 2); }
    } else if (qIndex === 1){
      // تبادل عبر الإنترنت بدون مفتاح مشترك -> غير تماثلي (RSA)
      if (choice === 'asymmetric'){ state.score += 10; } else { state.score = Math.max(0, state.score - 2); }
    }
    updateHUD();

    // الانتقال التلقائي
    state.step = qIndex + 1;
    // نزيد خطوة أخرى حتى نصل لتمرين التشفير بعد السؤال الثاني
    if (qIndex === 1) state.step = 2;
    renderEncryption();
    // تفعيل أزرار Prev/Next
    document.getElementById('btnPrev').disabled = false;
    document.getElementById('btnNext').disabled = false;
  };

  // تنفيذ التشفير في الخطوة 2
  window.encDoEncrypt = function(){
    const plain = (document.getElementById('encPlain')?.value || '').trim();
    const key = parseInt(document.getElementById('encKey')?.value || '0', 10);
    const outWrap = document.getElementById('encOutWrap');
    const outEl = document.getElementById('encOut');
    if (!plain || !(key >=1 && key <=25) || !outWrap || !outEl) return;

    const cipher = caesarEncrypt(plain, key);
    outEl.textContent = cipher;
    outWrap.style.display = '';
    if (!state.encryption) state.encryption = {};
    state.encryption.practiced = true;
    document.getElementById('btnNext').disabled = false;
  };

  // التحقق من فك التشفير في الخطوة 3
  window.encCheckDecrypt = function(){
    const input = (document.getElementById('decInput')?.value || '').trim();
    const msg = document.getElementById('decMsg');
    const expected = caesarDecrypt('Fdhvdu Flskhu lv ixq!', 3); // → "Caesar Cipher is fun!"
    if (!msg) return;

    if (input === expected){
      msg.innerHTML = "<span style='color:#6fe3a8'>Correct! +10 points</span>";
      state.score += 10;
      updateHUD();
      state.encryption.decrypted = true;
      document.getElementById('btnNext').disabled = false;
      // انتقال تلقائي خفيف بعد ثانية
      setTimeout(()=>{ state.step = 4; renderEncryption(); }, 600);
    } else {
      msg.innerHTML = "<span style='color:#ff8da1'>Not correct. Hint: key is 3.</span>";
    }
  };
  // الخطوة 4: إتمام المرحلة
setScreen(`
  <div class="card">
    <h3>Encryption Stage Complete 🎉</h3>
    <p class="muted">Congrats! You finished this stage. Click <b>Finish</b> to return to the map.</p>
    <div class="row" style="margin-top:10px">
      <button class="btn ok" onclick="backToMap()">Finish</button>
      <button class="btn" onclick="state.step=0; renderEncryption();">Retry</button>
    </div>
  </div>
`);
disableNav(); // ما نحتاج Prev/Next هنا

})();
