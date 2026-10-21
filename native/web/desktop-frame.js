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
    '#device iframe{width:393px;height:852px;border:0;border-radius:46px;display:block;background:#F8F6FC}' +
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
    '<div id="stage"><div id="device"><iframe title="Roomie" src="' + location.pathname + location.search + '" allow="camera; clipboard-write"></iframe></div></div>' +
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
})();
