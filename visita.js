// Contatore delle visite: anonimo, senza cookie e senza dati personali.
// Invia solo: pagina (home/trentino/treviso), sito di provenienza (es. instagram.com),
// il parametro ?src= dei nostri link e il tipo di dispositivo (mobile/desktop).
//
// Esclusioni (per avere numeri puliti):
// - i nostri dispositivi: aprire una volta il sito con ?noconta (per riattivare: ?conta).
//   Il browser ricorda la scelta in localStorage (non è un cookie e resta sul dispositivo).
// - i controlli automatici (navigator.webdriver);
// - le pagine caricate in anticipo e mai mostrate (anteprime e precaricamenti delle app,
//   per esempio Facebook): si conta solo dopo 1 secondo di pagina visibile;
// - i ricaricamenti della stessa pagina nella stessa scheda entro 30 minuti.
(function () {
  try {
    var KEY = 'cdq-noconta';
    var q = new URLSearchParams(location.search);
    try {
      if (q.has('noconta')) {
        localStorage.setItem(KEY, '1');
        avviso('Questo dispositivo non viene più contato nelle visite.');
      } else if (q.has('conta')) {
        localStorage.removeItem(KEY);
        avviso('Questo dispositivo viene di nuovo contato nelle visite.');
      }
      if (localStorage.getItem(KEY) === '1') return;
    } catch (_) {}
    if (navigator.webdriver) return;

    var path = location.pathname;
    var pagina = path.indexOf('/treviso') === 0 ? 'treviso' : path.indexOf('/trentino') === 0 ? 'trentino' : 'home';

    var inviata = false, timer = null;
    function invia() {
      if (inviata) return;
      inviata = true;
      try {
        var k = 'cdq-visita-' + pagina, ora = Date.now();
        var prima = +(sessionStorage.getItem(k) || 0);
        sessionStorage.setItem(k, String(ora));
        if (prima && ora - prima < 30 * 60 * 1000) return;
      } catch (_) {}
      var prov = '';
      try {
        if (document.referrer) {
          var h = new URL(document.referrer).hostname.replace(/^(www|m|l|lm)\./, '');
          if (h && h !== location.hostname.replace(/^www\./, '')) prov = h;
        }
      } catch (_) {}
      var src = (q.get('src') || '').slice(0, 30);
      var disp = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
      var body = JSON.stringify({ azione: 'visita', pagina: pagina, prov: prov, src: src, disp: disp });
      var url = 'https://script.google.com/macros/s/AKfycbxEksOq1c2qYgumxE-w7qQR-7aNdT56V29dovnlKqs7h3BnMgxw0MspzhJagWXKqGoTFA/exec';
      if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=utf-8' }));
      else fetch(url, { method: 'POST', mode: 'no-cors', body: body, keepalive: true });
    }
    function visibile() {
      return document.visibilityState === 'visible' && !document.prerendering;
    }
    function controlla() {
      if (inviata) return;
      if (visibile()) { if (!timer) timer = setTimeout(function () { timer = null; if (visibile()) invia(); }, 1000); }
      else if (timer) { clearTimeout(timer); timer = null; }
    }
    document.addEventListener('visibilitychange', controlla);
    document.addEventListener('prerenderingchange', controlla);
    controlla();
  } catch (_) {}

  function avviso(testo) {
    try {
      var d = document.createElement('div');
      d.textContent = testo;
      d.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:9999;background:#222;color:#fff;padding:10px 16px;border-radius:8px;font:14px system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.3)';
      var mostra = function () { document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4000); };
      if (document.body) mostra(); else document.addEventListener('DOMContentLoaded', mostra);
    } catch (_) {}
  }
})();
