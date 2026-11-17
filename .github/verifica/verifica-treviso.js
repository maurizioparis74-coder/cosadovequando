// Verifica automatica della pagina https://cosadovequando.it/treviso/
// Si esegue nella console del browser (o da Claude in Chrome) sulla pagina pubblicata.
// Restituisce una riga per funzione (F1–F19) con OK / ERRORE e il dettaglio.
// Non scrive nulla nel foglio: il clic di prova (F18) è facoltativo e va attivato con PROVA_CLICK = true.
(async () => {
  const PROVA_CLICK = false;
  const R = [];
  const ok = (f, cond, det) => R.push(`${cond ? 'OK    ' : 'ERRORE'} ${f} – ${det}`);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const summaryN = () => +(($('#summary').textContent.match(/^(\d+)/) || [0, -1])[1]);
  const cards = () => $$('#out .ev');
  const click = el => { el.click(); return wait(150); };
  const isoD = x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  const giorno = new Date(); giorno.setHours(12, 0, 0, 0);

  // F1 feed
  for (let i = 0; i < 20 && !/aggiornati al/.test($('.note .wrap').textContent); i++) await wait(500);
  const feed = await fetch(FEED + (FEED.includes('?') ? '&' : '?') + 'x=' + Date.now()).then(r => r.json()).catch(() => null);
  ok('F1 Feed', feed && feed.eventi && feed.eventi.length === EV.length && /aggiornati al/.test($('.note .wrap').textContent),
     feed ? `${EV.length} eventi caricati, ${$('.note .wrap').textContent}` : 'feed non raggiungibile');

  const range = () => { const [a, b] = windowRange(); return [isoD(a), isoD(b)]; };
  const inRange = () => { const [a, b] = windowRange(); return EV.filter(e => e.e >= a && e.s <= b).length; };

  // F2–F5 periodi
  await click($('#w-oggi')); let [a, b] = range();
  ok('F2 Oggi', a === isoD(giorno) && b === a && summaryN() === inRange(), `${a} · ${summaryN()} eventi`);
  await click($('#w-weekend')); [a, b] = range();
  const wd = giorno.getDay(); const sat = new Date(giorno); sat.setDate(giorno.getDate() + (6 - wd));
  const atteso = wd === 0 ? [isoD(giorno), isoD(giorno)] : [isoD(sat), isoD(new Date(sat.getTime() + 864e5))];
  ok('F3 Weekend', a === atteso[0] && b === atteso[1] && summaryN() === inRange(), `${a} → ${b} · ${summaryN()} eventi`);
  const plus = n => { const x = new Date(giorno); x.setDate(x.getDate() + n); return isoD(x); };
  await click($('#w-7')); [a, b] = range();
  ok('F4 7 giorni', a === isoD(giorno) && b === plus(6), `${a} → ${b} · ${summaryN()} eventi`);
  await click($('#w-30')); [a, b] = range();
  ok('F5 30 giorni', a === isoD(giorno) && b === plus(29), `${a} → ${b} · ${summaryN()} eventi`);

  // F6 calendario «dal»
  const dal = $('#dal'); dal.value = plus(3); dal.dispatchEvent(new Event('change')); await wait(150);
  [a] = range(); const spenti = $$('[data-win]').every(p => p.getAttribute('aria-pressed') === 'false');
  await click($('#w-7')); const tornato = dal.value === isoD(giorno) && range()[0] === isoD(giorno);
  ok('F6 Calendario', a === plus(3) && spenti && tornato, `dal ${plus(3)}: pulsanti spenti ${spenti}, ritorno a oggi ${tornato}`);

  // F7 categorie
  await click($('#w-30'));
  const catPills = $$('#cats .pill'); const catsAttese = Object.keys(CAT).filter(k => EV.some(e => e.c === k));
  let catOk = catPills.length === catsAttese.length, catDet = [];
  for (const p of catPills) {
    await click(p); const k = p.id.slice(2);
    const solo = cards().every(c => c.querySelector('.cat').textContent === CAT[k].nome);
    catOk = catOk && solo; catDet.push(`${CAT[k].nome} ${summaryN()}`); await click(p);
  }
  ok('F7 Categorie', catOk, catDet.join(' · '));

  // F8 zone
  let zOk = true, zDet = [];
  for (const p of $$('#zone .pill').slice(1)) {
    await click(p); const z = p.textContent;
    const atteso2 = EV.filter(e => e.z === z && e.e >= windowRange()[0] && e.s <= windowRange()[1]).length;
    zOk = zOk && summaryN() === atteso2; zDet.push(`${z} ${summaryN()}`);
  }
  await click($('#z-0')); zOk = zOk && summaryN() === inRange();
  ok('F8 Zone', zOk, zDet.join(' · '));

  // F9 ricerca
  const q = $('#q'); const comune = cards().at(-1).querySelector('.meta b').textContent;
  q.value = comune; q.dispatchEvent(new Event('input')); await wait(150);
  const trovato = cards().length > 0 && cards().every(c => c.textContent.toLowerCase().includes(comune.toLowerCase()));
  q.value = ''; q.dispatchEvent(new Event('input')); await wait(150);
  ok('F9 Ricerca', trovato, `«${comune}»: ${trovato ? 'trovato' : 'non trovato'}`);

  // F10 tendine (solo sincronizzazione; l'aspetto sul telefono si guarda a mano)
  const sc = $('#s-cat'); sc.value = catsAttese[0]; sc.dispatchEvent(new Event('change')); await wait(150);
  const tOk = cards().every(c => c.querySelector('.cat').textContent === CAT[catsAttese[0]].nome);
  sc.value = ''; sc.dispatchEvent(new Event('change')); await wait(150);
  ok('F10 Tendine', tOk, `tendina Cosa = ${CAT[catsAttese[0]].nome}`);

  // F11–F13 riepilogo, lista, schede
  await click($('#w-30'));
  const nSchede = cards().length; const nRiep = summaryN();
  ok('F11 Riepilogo', nSchede === nRiep, `riepilogo ${nRiep}, schede ${nSchede}`);
  const giorni = $$('#out .day h2').map(h => h.textContent);
  ok('F12 Lista per giorno', giorni.length > 0, `${giorni.length} sezioni, ultima «${giorni.at(-1)}»`);
  const schedeOk = cards().every(c => c.querySelector('.cat') && c.querySelector('h3').textContent && c.querySelector('.meta b').textContent);
  ok('F13 Schede', schedeOk, 'categoria, titolo e comune presenti su tutte');

  // F14–F17 dettagli e pulsanti
  const c0 = cards()[0]; c0.click(); await wait(150);
  const aperto = c0.getAttribute('aria-expanded') === 'true' && !c0.querySelector('.det').hidden;
  c0.click(); await wait(150); const chiuso = c0.querySelector('.det').hidden;
  ok('F14 Dettagli', aperto && chiuso, `apre ${aperto}, chiude ${chiuso}`);
  const linkVal = cards().map(c => c.querySelector('a[data-act=fonte]')).filter(Boolean);
  const linkBuoni = linkVal.filter(x => /^https?:\/\/[^\s·]+$/.test(x.getAttribute('href')));
  const senzaLink = EV.filter(e => !e.u).map(e => e.id || e.t);
  ok('F15 Vedi l\'evento', !senzaLink.length && linkBuoni.length === nSchede, `${linkBuoni.length}/${nSchede} schede con link valido; eventi senza link: ${senzaLink.join(', ') || 'nessuno'}`);
  const maps = cards().every(c => /google\.com\/maps\/search/.test(c.querySelector('a[data-act=mappa]').href));
  ok('F16 Come arrivare', maps, 'link Google Maps su tutte le schede');
  const cal = cards().every(c => /calendar\.google\.com\/calendar\/render\?action=TEMPLATE&text=.+&dates=\d{8}\/\d{8}/.test(c.querySelector('a[data-act=calendario]').href));
  ok('F17 Calendario', cal, 'link Google Calendar con titolo e date su tutte le schede');

  // F18 statistiche
  if (PROVA_CLICK) { track(shown[0], 'test-verifica', ''); ok('F18 Statistiche', true, 'inviato clic «test-verifica»: controllare la scheda Click'); }
  else ok('F18 Statistiche', typeof track === 'function', 'funzione presente (clic di prova non inviato)');

  // F19 piè di pagina
  const mail = $('footer a[href^="mailto:info@cosadovequando.it"]'), priv = $('footer a[href="/privacy/"]');
  ok('F19 Piè di pagina', !!(mail && priv), 'mail info@ e link privacy presenti');

  // pagine collegate
  const st = async u => (await fetch(u, {cache: 'no-store'})).status;
  const home = await st('/'), privacy = await st('/privacy/'), p404 = await st('/pagina-che-non-esiste-' + Date.now());
  ok('Altre pagine', home === 200 && privacy === 200 && p404 === 404, `home ${home}, privacy ${privacy}, inesistente ${p404}`);

  await click($('#w-weekend'));
  return R.join('\n');
})();
