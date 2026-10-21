// Web entry. On a phone (or inside the frame) it starts the app full screen. On a wider screen it shows the app
// inside a phone-sized frame, so every screen keeps its real phone proportions, with a QR code to open it on a phone.
(function () {
  var entry = window.__ROOMIE_ENTRY;
  var embedded = window.self !== window.top;
  var phone = window.matchMedia('(max-width: 600px)').matches || /iPhone|iPad|Android/i.test(navigator.userAgent);
  if (embedded || phone) {
    var s = document.createElement('script');
    s.src = entry; s.async = false;
    document.body.appendChild(s);
    return;
  }

  var url = location.origin + '/';
  var css = '' +
    'html,body{height:100%;margin:0;overflow:hidden}' +
    'body{background:#F8F6FC;background-image:radial-gradient(60% 50% at 15% 10%,#EDE5FD 0%,transparent 70%),radial-gradient(50% 45% at 85% 90%,#FCE9E1 0%,transparent 70%);' +
    'font-family:Geist,system-ui,-apple-system,sans-serif;color:#1F1B3A;display:flex;align-items:center;justify-content:center;gap:72px}' +
    '#stage{flex:none;transform-origin:center center}' +
    '#device{width:393px;height:852px;border-radius:56px;padding:10px;background:#1F1B3A;box-shadow:0 40px 80px -20px rgba(59,36,112,.35),0 0 0 1px rgba(31,27,58,.08)}' +
    '#screen{position:relative;width:393px;height:852px;border-radius:46px;overflow:hidden;background:#F8F6FC}' +
    '#device iframe{width:393px;height:852px;border:0;display:block;background:#F8F6FC}' +
    // iPhone chrome drawn over the app: status bar (live time), Dynamic Island and home indicator
    '#status{position:absolute;inset:0 0 auto 0;height:54px;display:flex;align-items:center;justify-content:space-between;padding:4px 30px 0 46px;box-sizing:border-box;pointer-events:none;color:#1F1B3A;font:600 17px/1 -apple-system,"SF Pro Text",Geist,system-ui,sans-serif;letter-spacing:-.2px}' +
    '#status .r{display:flex;align-items:center;gap:6px}' +
    '#island{position:absolute;top:11px;left:50%;width:124px;height:36px;margin-left:-62px;border-radius:18px;background:#16131F;pointer-events:none}' +
    '#homebar{position:absolute;bottom:8px;left:50%;width:140px;height:5px;margin-left:-70px;border-radius:3px;background:#1F1B3A;pointer-events:none}' +
    '#side{max-width:300px}' +
    '#side img.icon{width:64px;height:64px;border-radius:16px;display:block;margin-bottom:20px}' +
    '#side h1{font-family:Fraunces,Georgia,serif;font-variation-settings:"SOFT" 100,"opsz" 72;font-weight:600;font-size:44px;line-height:1.05;margin:0 0 12px;letter-spacing:-.5px}' +
    '#side p{font-size:17px;line-height:1.45;color:#5E5873;margin:0 0 28px}' +
    '#side .qr{display:flex;align-items:center;gap:16px;padding:14px;border-radius:20px;background:#FCFBFF;box-shadow:0 8px 24px rgba(89,71,140,.08)}' +
    '#side .qr img{width:96px;height:96px;border-radius:8px}' +
    '#side .qr span{font-size:14px;line-height:1.4;color:#5E5873}' +
    '#side .qr b{display:block;font-weight:600;color:#1F1B3A;font-size:15px;margin-bottom:2px}' +
    '@media (max-width:980px){#side{display:none}}';
  document.head.insertAdjacentHTML('beforeend',
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,600,100&family=Geist:wght@400;600&display=swap">' +
    '<style>' + css + '</style>');
  document.body.innerHTML =
    '<div id="stage"><div id="device"><div id="screen"><iframe title="Roomie" src="' + location.pathname + location.search + '" allow="camera; clipboard-write"></iframe>' +
    '<div id="status" aria-hidden="true"><span id="clock"></span><span class="r">' +
    '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
    '<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8 .6 10.2 10.2 0 0 0 .8 3.5L2 4.7a8.5 8.5 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.2A6.8 6.8 0 0 0 8 4a6.8 6.8 0 0 0-4.8 1.9l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.4c.5 0 1 .2 1.3.5L8 11.4 6.7 9.6c.3-.3.8-.5 1.3-.5Z"/></svg>' +
    '<svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.8" stroke="currentColor" opacity=".35"/><rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity=".4"/></svg>' +
    '</span></div><div id="island"></div><div id="homebar"></div></div></div></div>' +
    '<div id="side"><img class="icon" src="/app-icon.png" alt="">' +
    '<h1>Roomie</h1><p>Chores and the pantry, shared fairly between roommates.</p>' +
    '<div class="qr"><img src="/qr.png" alt="QR code to open Roomie on your phone"><span><b>Open it on your phone</b>Scan with your camera, then add it to your home screen.</span></div></div>';

  // scale the phone down on shorter screens so the whole device stays visible
  function fit() {
    var k = Math.min(1, (window.innerHeight - 48) / 872, (window.innerWidth - 48) / 413);
    document.getElementById('stage').style.transform = 'scale(' + k + ')';
    document.getElementById('stage').style.margin = (-(1 - k) * 872 / 2) + 'px ' + (-(1 - k) * 413 / 2) + 'px';
  }
  fit();
  window.addEventListener('resize', fit);

  // the status bar shows the visitor's real time, like a phone does (12-hour, no AM/PM)
  function tick() {
    var d = new Date();
    document.getElementById('clock').textContent = (d.getHours() % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  tick();
  setInterval(tick, 10000);
})();
