// Contatore delle visite: anonimo, senza cookie e senza dati personali.
// Invia solo: pagina (home/trentino/treviso), sito di provenienza (es. instagram.com),
// il parametro ?src= dei nostri link e il tipo di dispositivo (mobile/desktop).
(function () {
  try {
    if (navigator.webdriver) return; // esclude i controlli automatici
    var path = location.pathname;
    var pagina = path.indexOf('/treviso') === 0 ? 'treviso' : path.indexOf('/trentino') === 0 ? 'trentino' : 'home';
    var prov = '';
    try {
      if (document.referrer) {
        var h = new URL(document.referrer).hostname.replace(/^(www|m|l|lm)\./, '');
        if (h && h !== location.hostname.replace(/^www\./, '')) prov = h;
      }
    } catch (_) {}
    var src = (new URLSearchParams(location.search).get('src') || '').slice(0, 30);
    var disp = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    var body = JSON.stringify({ azione: 'visita', pagina: pagina, prov: prov, src: src, disp: disp });
    var url = 'https://script.google.com/macros/s/AKfycbxEksOq1c2qYgumxE-w7qQR-7aNdT56V29dovnlKqs7h3BnMgxw0MspzhJagWXKqGoTFA/exec';
    if (navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=utf-8' }));
    else fetch(url, { method: 'POST', mode: 'no-cors', body: body, keepalive: true });
  } catch (_) {}
})();
