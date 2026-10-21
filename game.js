/* Leitstelle Unterfranken – Spiellogik (Einzelspieler, Spielstand im Browser) */
'use strict';
const SAVE_KEY = 'leitstelle-unterfranken-v1';
const ROAD = 1.3;            // Luftlinie mal Straßenfaktor
const TURNOUT = {fw:5, rd:1, pol:0.5, rth:2, phub:3, bepo:5, thw:10, seg:8, wr:6}; // Ausrückzeit in Minuten (Wache besetzt)

let S = null;                // Spielstand
let map, layers = {};
let selMission = null, buildMode = null, sheetView = null;

// ---------- Hilfsfunktionen ----------
const $ = s => document.querySelector(s);
const fmt = n => Math.round(n).toLocaleString('de-DE');
const rnd = (a,b) => a + Math.random()*(b-a);
const rint = (a,b) => Math.floor(rnd(a, b+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
function km(a, b){ const R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
function gtime(min){ const d=Math.floor(min/1440)+1, h=Math.floor(min%1440/60), mm=Math.floor(min%60); return `Tag ${d}, ${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; }
function dur(min){ if(min<1) return '<1 min'; if(min<60) return Math.round(min)+' min'; return Math.floor(min/60)+' h '+Math.round(min%60)+' min'; }
function id(p){ S.nextId++; return p+S.nextId; }
function toast(msg, cls){ const t=document.createElement('div'); t.className='toast '+(cls||''); t.textContent=msg; $('#toasts').appendChild(t); setTimeout(()=>t.remove(), 5000); log(msg); }
function log(msg){ S.log.unshift({t:S.time, m:msg}); S.log.length=Math.min(S.log.length,80); }

// ---------- Neues Spiel ----------
function newGame(){
  S = {v:1, time:8*60, credits:100000, mult:1, rate:6, timeScale:4, courseMin:10, showSilent:true,
       stations:{}, vehicles:{}, missions:{}, courses:[], geo:{}, log:[], nextId:0, helpRate:1.5, earned:0, done:0};
  for(const st of START_STATIONS) addStation(Object.assign({}, st, {own:true}), st.veh);
  for(const st of SILENT){
    const list = st.veh ? st.veh.slice() : estimateVehicles(st.cnt||2);
    addStation({type:st.type, n:st.n, addr:st.addr, lat:st.lat, lng:st.lng, own:false, est:!!st.est || !st.veh}, list.map(t=>[t]));
  }
  for(const h of HOSPITALS) S.stations[h.id] = {id:h.id, type:'kh', n:h.n, addr:h.addr, lat:h.lat, lng:h.lng, dept:h.dept, own:true, veh:[]};
  for(const s of SCHOOLS) S.stations[s.id] = {id:s.id, type:'school', school:s.type, n:s.n, addr:s.addr, lat:s.lat, lng:s.lng, own:true, veh:[]};
  log('Spiel gestartet in Kirchzell');
}
function addStation(st, vehList){
  const sid = st.id || id('st');
  const b = BT[st.type];
  const station = {id:sid, type:st.type, n:st.n, addr:st.addr||'', lat:st.lat, lng:st.lng, own:!!st.own, small:!!st.small, est:!!st.est,
    staff: st.own ? Math.round((b.staff||10)*(st.small?0.5:1)) : 999, trained:{}, veh:[]};
  S.stations[sid] = station;
  for(const [t,name] of vehList) addVehicle(sid, t, name);
  if(st.own) trainStartCrew(station);
  return station;
}
function trainStartCrew(st){ // Startbesatzung für Sonderfahrzeuge ist ausgebildet
  for(const vid of st.veh){ const vt=VT[S.vehicles[vid].type]; if(vt.course){ const need=vt.crewCourse||vt.crew; st.trained[vt.course]=Math.max(st.trained[vt.course]||0, need); } }
}
function addVehicle(sid, type, name){
  const st = S.stations[sid];
  const vid = id('v');
  const nr = st.veh.length+1;
  S.vehicles[vid] = {id:vid, type, name: name || `${VT[type].n} ${st.n.replace(/^(FF|WF|THW OV|BRK) /,'')} ${nr}`, station:sid, status:2, lat:st.lat, lng:st.lng};
  st.veh.push(vid);
  return vid;
}

// ---------- Speichern ----------
function save(){ try{ S.savedAt = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} }
function load(){ try{ const raw = localStorage.getItem(SAVE_KEY); if(raw){ S = JSON.parse(raw); return true; } }catch(e){} return false; }

// ---------- Positionen ----------
function vehPos(v){
  if((v.status===3||v.status===1||v.status===7) && v.t1){
    const f = Math.max(0, Math.min(1, (S.time - v.t0)/(v.t1 - v.t0 || 1)));
    if(S.time < v.t0) return {lat:v.from.lat, lng:v.from.lng};
    const r = v.leg && ROUTES[v.leg.key];
    if(r && v.leg.ok) return alongPath(r, f);
    return {lat:v.from.lat+(v.to.lat-v.from.lat)*f, lng:v.from.lng+(v.to.lng-v.from.lng)*f};
  }
  return {lat:v.lat, lng:v.lng};
}

// ---------- Echte Straßen (OSRM-Routendienst von FOSSGIS, max. 1 Anfrage pro Sekunde) ----------
const ROUTES = {};            // Schlüssel → {pts:[[lat,lng]], cum:[km], len, min}
const routeQueue = []; const routeWait = {};
const SONDERRECHTE = 0.8;     // mit Blaulicht schneller als normaler Verkehr
function routeKey(a, b){ const r = x => x.toFixed(4); return r(a.lat)+','+r(a.lng)+'>'+r(b.lat)+','+r(b.lng); }
function alongPath(r, f){
  const target = f * r.len; const c = r.cum;
  let i = 1; while(i < c.length-1 && c[i] < target) i++;
  const seg = c[i]-c[i-1] || 1, t = Math.max(0, Math.min(1, (target-c[i-1])/seg));
  const a = r.pts[i-1], b = r.pts[i];
  return {lat:a[0]+(b[0]-a[0])*t, lng:a[1]+(b[1]-a[1])*t};
}
function requestRoute(from, to, cb){
  const key = routeKey(from, to);
  if(ROUTES[key]) { cb(key); return key; }
  if(routeWait[key]) { routeWait[key].push(cb); return key; }
  routeWait[key] = [cb]; routeQueue.push({key, from, to});
  return key;
}
let routeBusy = false;
async function routeWorker(){
  if(routeBusy) return;
  const job = routeQueue.shift(); if(!job) return;
  routeBusy = true;
  try{ await routeFetch(job); } finally { routeBusy = false; }
}
async function routeFetch(job){
  try{
    const url = `https://router.project-osrm.org/route/v1/driving/${job.from.lng},${job.from.lat};${job.to.lng},${job.to.lat}?overview=simplified&geometries=geojson`;
    const res = await fetch(url); const j = await res.json();
    const rt = j.routes && j.routes[0];
    if(rt){
      const pts = rt.geometry.coordinates.map(c => [c[1], c[0]]);
      const cum = [0]; for(let i=1;i<pts.length;i++) cum.push(cum[i-1] + km({lat:pts[i-1][0],lng:pts[i-1][1]}, {lat:pts[i][0],lng:pts[i][1]}));
      ROUTES[job.key] = {pts, cum, len: cum[cum.length-1] || 0.01, min: rt.duration/60};
    }
  }catch(e){ /* offline: Luftlinie bleibt */ }
  const cbs = routeWait[job.key] || []; delete routeWait[job.key];
  if(ROUTES[job.key]) cbs.forEach(cb => cb(job.key));
}
// Startet eine Fahrt: zuerst Schätzung per Luftlinie, sobald die Route da ist, echte Strecke und Fahrzeit
function startLeg(v, to, status, delay, blaulicht){
  const from = vehPos(v);
  v.status = status; v.from = from; v.to = {lat:to.lat, lng:to.lng};
  v.t0 = S.time + (delay||0); v.t1 = v.t0 + driveMin(v, from, to);
  v.leg = null;
  if(VT[v.type].v > 150) return; // Hubschrauber fliegt direkt
  if(status===1 && !S.stations[v.station].own) return; // Rückfahrt der Nachbarn ist unsichtbar, spart Anfragen
  const leg = {key:null, ok:false, b:!!blaulicht}; v.leg = leg;
  leg.key = requestRoute(from, to, key => {
    if(v.leg !== leg) return; // Fahrzeug hat inzwischen einen neuen Auftrag
    const r = ROUTES[key]; const minutes = r.min * (leg.b ? SONDERRECHTE : 1);
    // bereits gefahrenen Anteil beibehalten, damit das Fahrzeug nicht springt
    const done = S.time > v.t0 ? Math.min(0.95, (S.time - v.t0)/(v.t1 - v.t0 || 1)) : 0;
    leg.ok = true;
    if(done > 0){ v.t0 = S.time - done*minutes; }
    v.t1 = v.t0 + minutes;
  });
}
function driveMin(v, from, to){ const vt=VT[v.type]; const air = vt.v>150; const d=km(from,to)*(air?1:ROAD); return d/vt.v*60 + (air?1:0); }
function etaTo(v, target){
  const st = S.stations[v.station];
  const p = vehPos(v);
  const turn = v.status===2 ? (TURNOUT[st.type]||3) : 0;
  const known = VT[v.type].v <= 150 && ROUTES[routeKey(p, target)];
  return turn + (known ? known.min * SONDERRECHTE : driveMin(v, p, target));
}
function vehReady(v){ // darf alarmiert werden
  if(!(v.status===2 || v.status===1)) return false;
  const st=S.stations[v.station]; if(!st.own) return true;
  const vt=VT[v.type]; if(vt.course){ const need=vt.crewCourse||vt.crew; if((st.trained[vt.course]||0) < need) return false; }
  return true;
}

// ---------- Einsätze ----------
function ownCounts(){
  const c={fw:0,rd:0,pol:0,thw:0,bepo:0,wr:0,ph:0,rth:0,seg:0};
  for(const st of Object.values(S.stations)) if(st.own && c[st.type]!==undefined) c[st.type]++;
  for(const st of Object.values(S.stations)) if(st.own && st.type==='phub') c.ph++;
  return c;
}
function totalRoles(){ const t={}; for(const v of Object.values(S.vehicles)) for(const r of VT[v.type].roles) t[r]=(t[r]||0)+1; return t; }
function eligibleDefs(){
  const c = ownCounts(), tot = totalRoles();
  return M.filter(d => Object.entries(d.c).every(([k,n]) => (c[k]||0) >= n) && Object.entries(d.r).every(([r,n]) => (tot[r]||0) >= n));
}
function ownBases(){ return Object.values(S.stations).filter(s => s.own && ['fw','rd','pol','thw','bepo','wr','seg'].includes(s.type)); }
// ---------- Eigenes Gebiet: Gemeinden, in denen Alexander eine eigene Feuer- oder Rettungswache hat ----------
function gemeindeOf(st){
  if(st.gem) return st.gem;
  const m = (st.addr||'').match(/\d{5}\s+(.+)$/);
  if(m) return m[1].trim();
  if(st.addr) return st.addr.split(',').pop().trim();
  // ohne Adresse (z.B. selbst gebaute Wache): Gemeinde der nächsten Feuerwache
  const near = Object.values(S.stations).filter(s => s !== st && s.type==='fw' && /\d{5}/.test(s.addr||''))
    .sort((a,b) => km(a, st) - km(b, st))[0];
  return near ? gemeindeOf(near) : '';
}
function ownArea(){
  const g = new Set();
  for(const st of Object.values(S.stations)) if(st.own && (st.type==='fw' || st.type==='rd')) g.add(gemeindeOf(st));
  return g;
}
function placeNear(){
  // Einsatzorte = Orte mit Feuerwehrhaus (jedes Dorf, jeder Ortsteil) in den eigenen Gemeinden
  const area = ownArea();
  const spots = Object.values(S.stations).filter(s => s.type==='fw' && area.has(gemeindeOf(s)));
  const base = spots.length ? pick(spots) : pick(ownBases());
  const name = (base.n.match(/^(?:FF|WF)\s+(.+)$/)||[])[1] || gemeindeOf(base) || base.n;
  return {name, lat:base.lat+rnd(-0.005,0.005), lng:base.lng+rnd(-0.008,0.008)};
}
function createMission(def, kind, extra){
  const pl = (extra && extra.place) || placeNear();
  const mid = id('m');
  const mis = {id:mid, n:def.n, st:def.st||'', kind:kind||'normal', lat:pl.lat, lng:pl.lng, place:pl.name,
    req:Object.assign({}, def.r), cr:Math.round((def.cr||0)*rnd(0.85,1.15)), d:def.d, patients:[], prisoners:0,
    created:S.time, work:null, esc:def.esc||null, escalated:false};
  const np = def.p ? rint(def.p[0], def.p[1]) : 0;
  for(let i=0;i<np;i++) mis.patients.push({nef: Math.random() < (def.nef||0), dept: def.dept || pick(['Innere','Chirurgie','Unfallchirurgie']), done:false});
  mis.prisoners = def.g ? rint(def.g[0], def.g[1]) : 0;
  if(extra){ const e = Object.assign({}, extra); delete e.place; Object.assign(mis, e); }
  S.missions[mid] = mis;
  return mis;
}
function needOf(mis){ // tatsächlicher Bedarf inkl. Patienten
  const r = Object.assign({}, mis.req);
  const np = mis.patients.filter(p=>!p.done).length;
  if(np) r.RTW = Math.max(r.RTW||0, np);
  if(mis.patients.some(p=>p.nef && !p.done)) r.NEF = Math.max(r.NEF||0, 1);
  if(mis.prisoners) r.FUSTW = Math.max(r.FUSTW||0, 1);
  return r;
}
function missionVehicles(mis){ return Object.values(S.vehicles).filter(v => v.mission===mis.id); }
function coverage(mis){
  const need = needOf(mis), vs = missionVehicles(mis), out = [];
  for(const [role, n] of Object.entries(need)){
    const has = vs.filter(v => VT[v.type].roles.includes(role));
    const onScene = has.filter(v => v.status===4).length;
    const enRoute = has.filter(v => v.status===3);
    const eta = enRoute.length ? Math.min(...enRoute.map(v => Math.max(0, v.t1 - S.time))) : null;
    out.push({role, n, onScene, enRoute:enRoute.length, eta, missing: Math.max(0, n - onScene - enRoute.length)});
  }
  return out;
}
function missionState(mis){
  if(mis.work) return 'work';
  const cov = coverage(mis);
  if(cov.every(c => c.missing===0)) return 'coming';
  return 'open';
}

// Wer hat fehlende Kräfte? (eigene und Nachbarn, nächste zuerst)
function candidates(mis, role, ownOnly){
  return Object.values(S.vehicles)
    .filter(v => !v.mission && vehReady(v) && VT[v.type].roles.includes(role) && (ownOnly===undefined || S.stations[v.station].own===ownOnly))
    .map(v => ({v, eta: etaTo(v, mis)})).sort((a,b) => a.eta-b.eta);
}
function alarm(v, mis){
  const st = S.stations[v.station];
  const p = vehPos(v);
  const turn = v.status===2 ? (TURNOUT[st.type]||3) : 0;
  v.mission = mis.id; startLeg(v, mis, 3, turn, true);
}
function autoSelect(mis, ownOnly){ // AAO-Vorschlag: deckt fehlende Rollen mit den schnellsten Fahrzeugen
  const chosen = [], used = new Set();
  for(const c of coverage(mis)){
    let miss = c.missing;
    // bereits ausgewählte Fahrzeuge zählen mit
    miss -= chosen.filter(v => VT[v.type].roles.includes(c.role)).length;
    if(miss<=0) continue;
    for(const cand of candidates(mis, c.role, ownOnly)){
      if(used.has(cand.v.id)) continue;
      chosen.push(cand.v); used.add(cand.v.id); if(--miss<=0) break;
    }
  }
  return chosen;
}
function requestSupport(mis){
  const sel = autoSelect(mis, false);
  sel.forEach(v => alarm(v, mis));
  if(sel.length) toast(`Unterstützung: ${sel.length} Fahrzeug(e) von Nachbarwachen alarmiert`);
  else toast('Keine Nachbarkräfte frei');
  return sel.length;
}
function startWorkIfReady(mis){
  if(mis.work) return;
  if(coverage(mis).every(c => c.onScene >= c.n)){
    mis.work = {start:S.time, end:S.time + mis.d};
    if(mis.esc && !mis.escalated && Math.random() < 0.15){
      const def = M.find(d => d.n===mis.esc);
      if(def){ mis.escalated = true; mis.work = null; mis.n = def.n + ' (ausgeweitet)'; mis.st = def.st || mis.st;
        for(const [r,n] of Object.entries(def.r)) mis.req[r] = Math.max(mis.req[r]||0, n);
        mis.cr += def.cr; mis.d = Math.max(mis.d, def.d);
        toast(`Lage ausgeweitet: ${mis.place}, jetzt ${def.n}. Kräfte nachfordern!`, 'warn'); }
    }
  }
}
function finishMission(mis){
  const vs = missionVehicles(mis);
  let credits = mis.cr;
  // Patienten: RTW transportieren ins passende Krankenhaus
  const rtws = vs.filter(v => VT[v.type].roles.includes('RTW'));
  mis.patients.forEach((p, i) => {
    const r = rtws[i]; if(!r) return;
    const kh = chooseHospital(r, p.dept);
    startLeg(r, kh, 7, 0, p.nef);
    r.task = {kind:'patient', dest:kh.id, credits: RD_CREDITS_PER_PATIENT + (kh.dept.includes(p.dept)?100:0) + (p.nef?150:0)};
    r.mission = null;
  });
  // Gefangene: Streifenwagen zur Polizeiwache
  if(mis.prisoners){
    const fs = vs.filter(v => VT[v.type].roles.includes('FUSTW') && v.mission===mis.id);
    let left = mis.prisoners;
    for(const f of fs){ if(left<=0) break;
      const pol = nearestStation(f, s => s.type==='pol');
      startLeg(f, pol, 7, 0, false);
      f.task = {kind:'prisoner', dest:pol.id, credits: 200*Math.min(left,2)}; f.mission=null; left -= 2; }
  }
  for(const v of vs) if(v.mission===mis.id) sendHome(v);
  credits = Math.round(credits * S.mult);
  S.credits += credits; S.earned += credits; S.done++;
  toast(`Einsatz erledigt: ${mis.n} in ${mis.place} (+${fmt(credits)} Credits)`, 'ok');
  if(selMission===mis.id) closeSheet();
  delete S.missions[mis.id];
}
function chooseHospital(v, dept){
  const khs = Object.values(S.stations).filter(s => s.type==='kh');
  const fit = khs.filter(k => k.dept.includes(dept));
  const list = (fit.length ? fit : khs).map(k => ({k, d: km(vehPos(v), k)})).sort((a,b)=>a.d-b.d);
  // passende Klinik bevorzugen, wenn sie höchstens 25 km weiter ist als die nächste
  const nearest = khs.map(k => ({k, d: km(vehPos(v), k)})).sort((a,b)=>a.d-b.d)[0];
  return (list[0].d - nearest.d < 25) ? list[0].k : nearest.k;
}
function nearestStation(v, f){ return Object.values(S.stations).filter(f).map(s => ({s, d:km(vehPos(v), s)})).sort((a,b)=>a.d-b.d)[0].s; }
function sendHome(v){
  const st = S.stations[v.station];
  v.mission = null; startLeg(v, st, 1, 0, false);
}
function cancelVehicle(v){ if(v.status===3){ v.mission=null; sendHome(v); } }

// Hilfeersuchen einer Nachbarwehr
function helpRequest(){
  const own = Object.values(S.vehicles).filter(v => S.stations[v.station].own && vehReady(v) && !['RTH'].includes(v.type));
  if(!own.length) return;
  const v = pick(own); const role = pick(VT[v.type].roles.filter(r => !['MZF','GWL'].includes(r)) );
  if(!role) return;
  const myType = S.stations[v.station].type; // es fragt eine Wache der gleichen Art an (Feuerwehr bei Feuerwehr usw.)
  const want = myType==='rth' ? 'rd' : myType;
  const silent = Object.values(S.stations).filter(s => !s.own && s.type===want && km(s, S.stations[v.station]) < 25);
  if(!silent.length) return;
  const from = pick(silent);
  const def = {n:`Hilfeersuchen: ${ROLES[role]} benötigt`, st:'Nachbarhilfe', r:{[role]:1}, cr: rint(300, 1500), d: rint(20, 60)};
  const city = (from.addr.match(/\d{5} (.+)$/)||[])[1] || from.addr || from.n;
  const place = {name: city, lat: from.lat + rnd(-0.01,0.01), lng: from.lng + rnd(-0.01,0.01)};
  const mis = createMission(def, 'help', {place, from: from.n, expires: S.time + 15});
  toast(`${from.n} bittet um Unterstützung: ${ROLES[role]}`, 'warn');
}

// Großschadenslage
function startGSL(i){
  const g = Object.assign({}, GSL[i]); const tot = totalRoles();
  g.r = Object.fromEntries(Object.entries(g.r).map(([r,n]) => [r, Math.max(1, Math.min(n, Math.floor((tot[r]||1)*0.8)))])); // nie mehr verlangen, als es gibt
  const mis = createMission(g, 'gsl');
  toast(`GROSSSCHADENSLAGE: ${g.n} in ${mis.place}`, 'warn');
  openMission(mis.id);
}

// ---------- Simulation ----------
let lastReal = Date.now();
function tick(){
  const now = Date.now(); const dtReal = Math.min(5, (now - lastReal)/1000); lastReal = now;
  const dt = dtReal/60 * S.timeScale; // Spielminuten
  S.time += dt;
  // Fahrzeuge
  for(const v of Object.values(S.vehicles)){
    if((v.status===3 || v.status===1 || v.status===7) && S.time >= v.t1){
      if(v.status===3){ v.status = 4; v.lat=v.to.lat; v.lng=v.to.lng; const mis=S.missions[v.mission]; if(mis) startWorkIfReady(mis); else sendHome(v); }
      else if(v.status===1){ v.status = 2; const st=S.stations[v.station]; v.lat=st.lat; v.lng=st.lng; }
      else if(v.status===7){ v.status = 8; v.lat=v.to.lat; v.lng=v.to.lng; v.handover = S.time + 8; }
    }
    if(v.status===8 && S.time >= v.handover){
      if(v.task){ const c = Math.round(v.task.credits*S.mult); S.credits+=c; S.earned+=c; v.task=null; }
      sendHome(v);
    }
  }
  // Einsätze
  for(const mis of Object.values(S.missions)){
    if(mis.kind==='help' && !missionVehicles(mis).length && S.time > mis.expires){ delete S.missions[mis.id]; continue; }
    if(!mis.work) startWorkIfReady(mis);
    if(mis.work && S.time >= mis.work.end) finishMission(mis);
  }
  // Lehrgänge
  for(const c of S.courses.slice()){
    if(S.time >= c.end){ const st=S.stations[c.station]; st.trained[c.course]=(st.trained[c.course]||0)+c.count;
      S.courses.splice(S.courses.indexOf(c),1); toast(`Lehrgang ${COURSES[c.course].n} abgeschlossen: ${c.count} Personen in ${st.n}`, 'ok'); }
  }
  // Neue Einsätze (nur solange das Spiel offen ist)
  if(!S.paused && Object.values(S.missions).filter(m=>m.kind==='normal').length < (S.maxOpen||12)){
    if(Math.random() < S.rate/60 * dt){ const defs = eligibleDefs(); if(defs.length){ const d = pick(defs); const mis=createMission(d); toast(`Neuer Einsatz: ${d.n} in ${mis.place}`); } }
    if(Math.random() < S.helpRate/60 * dt) helpRequest();
  }
  render();
}

// ---------- Bauen, Kaufen, Ausbilden ----------
function buildStation(type, small, latlng, name){
  const b = BT[type]; const price = small && b.small ? b.small : b.price;
  if(S.credits < price){ toast('Nicht genug Credits'); return; }
  S.credits -= price;
  const startVeh = {fw:'LF 10', rd:'RTW', pol:'FuStW', rth:'RTH', phub:'PolHub', bepo:'GruKw', thw:'GKW', seg:'KTW-B', wr:'GW-WR'}[type];
  const st = addStation({type, n:name || b.n, lat:latlng.lat, lng:latlng.lng, own:true, small:!!small}, [[startVeh]]);
  trainStartCrew(st); st.gem = gemeindeOf(st);
  if(type==='fw'||type==='rd') toast(`Neues eigenes Gebiet: ${st.gem}`, 'ok');
  toast(`${st.n} gebaut (−${fmt(price)} Credits)`, 'ok');
  return st;
}
function takeOver(sid){
  const st = S.stations[sid]; const b = BT[st.type]; const price = b.price;
  if(S.credits < price){ toast('Nicht genug Credits'); return; }
  S.credits -= price; st.own = true; st.staff = b.staff; trainStartCrew(st);
  if(st.type==='fw'||st.type==='rd') toast(`Neues eigenes Gebiet: ${gemeindeOf(st)}`, 'ok');
  toast(`${st.n} übernommen, mit ${st.veh.length} Fahrzeugen (−${fmt(price)} Credits)`, 'ok');
}
function slotsOf(st){ const b=BT[st.type]; return st.small && b.smallSlots ? b.smallSlots : b.slots; }
function buyVehicle(sid, type){
  const st=S.stations[sid], vt=VT[type];
  if(st.veh.length >= slotsOf(st)){ toast('Kein Stellplatz frei. Wache ausbauen'); return; }
  if(S.credits < vt.price){ toast('Nicht genug Credits'); return; }
  S.credits -= vt.price; addVehicle(sid, type);
  toast(`${vt.n} gekauft für ${st.n}${vt.course && (st.trained[vt.course]||0) < (vt.crewCourse||vt.crew) ? ' (Lehrgang ' + COURSES[vt.course].n + ' nötig)' : ''}`, 'ok');
}
function expandStation(sid){ const st=S.stations[sid], b=BT[st.type]; const price=b.price-b.small;
  if(S.credits<price){ toast('Nicht genug Credits'); return; } S.credits-=price; st.small=false; st.staff=b.staff; toast(`${st.n} zur normalen Wache ausgebaut`, 'ok'); }
function startCourse(course, sid, count){
  const st=S.stations[sid]; count=Math.max(1, Math.min(count, st.staff));
  S.courses.push({course, station:sid, count, end: S.time + COURSES[course].days * S.courseMin});
  toast(`Lehrgang ${COURSES[course].n} gestartet: ${count} Personen aus ${st.n}`);
}

// ---------- Positionen aus OpenStreetMap (einmalig, im Hintergrund) ----------
async function geocodeAll(force){
  const jobs = [];
  for(const st of Object.values(S.stations)) if(/\d/.test(st.addr||'') || st.type==='fw') jobs.push({key:'st:'+st.id, q:st.addr && /\d/.test(st.addr) ? st.addr : st.n.replace(/^(FF|WF) /,'Feuerwehr ')+', Landkreis Miltenberg', ref:st});
  for(const p of PLACES) jobs.push({key:'place:'+p[0], q:p[0]+', Bayern', ref:{lat:p[1],lng:p[2]}});
  const todo = jobs.filter(j => force || !S.geo[j.key]);
  if(!todo.length) return;
  $('#geo').textContent = `Positionen werden aus OpenStreetMap geladen (0/${todo.length})`; $('#geo').hidden = false;
  let i=0;
  for(const j of todo){
    i++;
    try{
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&q='+encodeURIComponent(j.q), {headers:{'Accept-Language':'de'}});
      const a = await r.json();
      if(a[0]){ const g={lat:+a[0].lat, lng:+a[0].lon};
        if(km(g, j.ref) < 8){ S.geo[j.key]=g; if(j.key.startsWith('st:')){ const st=j.ref; for(const vid of st.veh){ const v=S.vehicles[vid]; if(v.status===2){ v.lat=g.lat; v.lng=g.lng; } } st.lat=g.lat; st.lng=g.lng; } }
        else S.geo[j.key] = {lat:j.ref.lat, lng:j.ref.lng, skip:true}; }
      else S.geo[j.key] = {lat:j.ref.lat, lng:j.ref.lng, skip:true};
    }catch(e){ $('#geo').textContent = 'OpenStreetMap nicht erreichbar, es werden ungefähre Positionen genutzt'; setTimeout(()=>$('#geo').hidden=true, 6000); return; }
    $('#geo').textContent = `Positionen werden aus OpenStreetMap geladen (${i}/${todo.length})`;
    if(i%10===0){ save(); drawStations(); }
    await new Promise(r => setTimeout(r, 1100)); // Nutzungsregeln: max. 1 Anfrage pro Sekunde
  }
  $('#geo').hidden = true; save(); drawStations();
}

// ---------- Karte ----------
const COLORS = {fw:'#d0342c', rd:'#e8a317', pol:'#2f6fd6', rth:'#e8a317', phub:'#2f6fd6', bepo:'#264f9e', thw:'#1d4e9e', seg:'#e8a317', wr:'#1aa3b8', kh:'#c2185b', school:'#6a4fb3'};
function initMap(){
  map = L.map('map', {zoomControl:false, preferCanvas:true}).setView([49.66, 9.22], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:18, attribution:'© OpenStreetMap'}).addTo(map);
  layers.stations = L.layerGroup().addTo(map); layers.silent = L.layerGroup().addTo(map);
  layers.missions = L.layerGroup().addTo(map); layers.vehicles = L.layerGroup().addTo(map);
  map.on('click', e => { if(buildMode){ const bm=buildMode; buildMode=null; $('#buildhint').hidden=true;
    const st = buildStation(bm.type, bm.small, e.latlng, bm.name); if(st){ drawStations(); openStation(st.id); save(); } } });
  drawStations();
}
function icon(txt, color, size, cls){ return L.divIcon({className:'mk '+(cls||''), html:`<div style="background:${color};width:${size}px;height:${size}px;line-height:${size}px;font-size:${Math.round(size*0.6)}px">${txt}</div>`, iconSize:[size,size], iconAnchor:[size/2,size/2]}); }
function drawStations(){
  if(!map) return;
  layers.stations.clearLayers(); layers.silent.clearLayers();
  for(const st of Object.values(S.stations)){
    const b = BT[st.type]; const ic = b ? b.icon : '•';
    if(st.own){ L.marker([st.lat, st.lng], {icon:icon(ic, COLORS[st.type]||'#555', 30)}).on('click', ()=>openStation(st.id)).addTo(layers.stations); }
    else if(S.showSilent){ L.marker([st.lat, st.lng], {icon:icon(ic, '#8a8f98', 20, 'silent')}).on('click', ()=>openStation(st.id)).addTo(layers.silent); }
  }
}
function drawDynamic(){
  if(!map) return;
  layers.missions.clearLayers(); layers.vehicles.clearLayers();
  for(const mis of Object.values(S.missions)){
    const s = missionState(mis); const col = s==='work'?'#2e9e44':s==='coming'?'#e8a317':'#d0342c';
    const txt = mis.kind==='gsl'?'‼':mis.kind==='help'?'?':'!';
    L.marker([mis.lat, mis.lng], {icon:icon(txt, col, 28, 'mis'), zIndexOffset:1000}).on('click', ()=>openMission(mis.id)).addTo(layers.missions);
  }
  for(const v of Object.values(S.vehicles)){
    if(v.status===2) continue;
    if(!S.stations[v.station].own && v.status===1) continue;
    const p = vehPos(v); const st=S.stations[v.station];
    if(st.own && (v.status===3 || v.status===7) && v.leg && v.leg.ok && ROUTES[v.leg.key])
      L.polyline(ROUTES[v.leg.key].pts, {color: COLORS[st.type]||'#333', weight:2, opacity:0.45, interactive:false}).addTo(layers.vehicles);
    L.circleMarker([p.lat, p.lng], {radius:5, color:'#fff', weight:1.5, fillColor: st.own ? (COLORS[st.type]||'#333') : '#8a8f98', fillOpacity:1}).addTo(layers.vehicles);
  }
}

// ---------- Oberfläche ----------
function render(){
  $('#credits').textContent = fmt(S.credits);
  $('#clock').textContent = gtime(S.time);
  const n = Object.keys(S.missions).length; $('#miscount').textContent = n; $('#miscount').hidden = !n;
  $('#mult').textContent = S.mult!==1 ? '×'+S.mult : '';
  drawDynamic();
  if(sheetView==='mission' && selMission) renderMission();
  else if(sheetView==='missions') renderMissionList();
}
function openSheet(view, html){ const changed = $('#sheetbody').dataset.view !== view; sheetView=view; $('#sheetbody').innerHTML=html; $('#sheetbody').dataset.view=view; if(changed) $('#sheetbody').scrollTop=0; $('#sheet').classList.add('open'); }
function closeSheet(){ sheetView=null; selMission=null; $('#sheet').classList.remove('open'); }
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function renderMissionList(){
  const list = Object.values(S.missions).sort((a,b)=>a.created-b.created);
  let h = `<h2>Einsätze</h2>`;
  if(!list.length) h += `<p class="muted">Gerade ruhig. Neue Einsätze kommen, solange das Spiel offen ist.</p>`;
  for(const mis of list){ const s=missionState(mis);
    h += `<button class="row mis-${s}" data-open="${mis.id}"><span class="dot"></span><span class="grow"><b>${esc(mis.n)}</b><br><small>${esc(mis.st)} · ${esc(mis.place)}${mis.from?' · von '+esc(mis.from):''}</small></span><span class="tag">${s==='work'?'läuft':s==='coming'?'Anfahrt':'offen'}</span></button>`; }
  h += `<h3>Großschadenslage starten</h3><div class="grid2">` + GSL.map((g,i)=>`<button class="btn sec" data-gsl="${i}">${esc(g.n)}</button>`).join('') + `</div>`;
  if(sheetView==='missions' && $('#sheetbody').dataset.sig === sig(h)) return;
  openSheet('missions', h); $('#sheetbody').dataset.sig = sig(h);
}
function sig(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return h; }

function openMission(mid){ selMission = mid; sheetView='mission'; renderMission(true); const m=S.missions[mid]; if(m) map.panTo([m.lat, m.lng]); }
function renderMission(force){
  const mis = S.missions[selMission]; if(!mis){ closeSheet(); return; }
  const cov = coverage(mis); const vs = missionVehicles(mis);
  let h = `<h2>${esc(mis.n)}</h2><p class="muted">${esc(mis.st)} · ${esc(mis.place)}${mis.from?' · Anfrage von '+esc(mis.from):''} · ${fmt(mis.cr*S.mult)} Credits</p>`;
  if(mis.work) h += `<div class="bar"><div style="width:${Math.min(100,(S.time-mis.work.start)/(mis.work.end-mis.work.start)*100)}%"></div></div><p class="muted">Einsatz läuft, noch ${dur(mis.work.end - S.time)}</p>`;
  if(mis.patients.length) h += `<p>Patienten: ${mis.patients.length}${mis.patients.some(p=>p.nef)?' (Notarzt nötig)':''}</p>`;
  if(mis.prisoners) h += `<p>Festnahmen: ${mis.prisoners}</p>`;
  h += `<table class="cov"><tr><th>Kraft</th><th>Soll</th><th>Vor Ort</th><th>Anfahrt</th><th>Fehlt</th></tr>`;
  for(const c of cov) h += `<tr class="${c.missing?'miss':''}"><td>${ROLES[c.role]}</td><td>${c.n}</td><td>${c.onScene}</td><td>${c.enRoute}${c.eta!=null?` <small>(${dur(c.eta)})</small>`:''}</td><td>${c.missing||''}</td></tr>`;
  h += `</table>`;
  const missing = cov.filter(c => c.missing);
  if(missing.length){
    h += `<h3>Wo stehen die fehlenden Kräfte?</h3>`;
    for(const c of missing){
      const own = candidates(mis, c.role, true)[0], ext = candidates(mis, c.role, false)[0];
      h += `<p class="small"><b>${ROLES[c.role]}:</b> ${own?`eigene ${esc(S.stations[own.v.station].n)} (${dur(own.eta)})`:'keine eigene frei'} · ${ext?`Nachbar ${esc(S.stations[ext.v.station].n)} (${dur(ext.eta)})`:'kein Nachbar frei'}</p>`;
    }
  }
  h += `<div class="actions"><button class="btn" id="b-aao">Eigene Kräfte vorschlagen</button><button class="btn warn" id="b-sup">Unterstützung anfordern</button></div>`;
  h += `<h3>Eigene Fahrzeuge</h3><div id="vlist">`;
  const ownFree = Object.values(S.vehicles).filter(v => S.stations[v.station].own && !v.mission && (v.status===2||v.status===1))
    .map(v => ({v, eta:etaTo(v, mis), ready:vehReady(v)})).sort((a,b)=>a.eta-b.eta).slice(0,25);
  for(const o of ownFree) h += `<label class="vrow ${o.ready?'':'off'}"><input type="checkbox" value="${o.v.id}" ${o.ready?'':'disabled'}><span class="grow">${esc(o.v.name)}<br><small>${esc(S.stations[o.v.station].n)} · ${VT[o.v.type].roles.map(r=>ROLES[r]).join(', ')}${o.ready?'':' · Besatzung nicht ausgebildet'}</small></span><span>${dur(o.eta)}</span></label>`;
  h += `</div><button class="btn full" id="b-alarm">Alarmieren</button>`;
  if(vs.length){ h += `<h3>Alarmierte Fahrzeuge</h3>`;
    for(const v of vs) h += `<div class="vrow"><span class="grow">${esc(v.name)}<br><small>${esc(S.stations[v.station].n)}${S.stations[v.station].own?'':' (Nachbar)'}</small></span><span>${v.status===4?'vor Ort':'Anfahrt '+dur(Math.max(0,v.t1-S.time))}</span>${v.status===3?`<button class="mini" data-cancel="${v.id}">✕</button>`:''}</div>`; }
  // Neu zeichnen nur, wenn sich etwas Wesentliches geändert hat oder alle 5 Sekunden (Zeiten). Auswahl und Scrollposition bleiben erhalten.
  const key = sig(h.replace(/\(\d+ min\)|\d+ min|<1 min|\d+ h \d+ min|width:[\d.]+%/g,''));
  const body = $('#sheetbody'); const now = Date.now();
  if(!force && body.dataset.sig == key && now - (+body.dataset.at||0) < 5000) return;
  const checked = [...document.querySelectorAll('#vlist input:checked')].map(i=>i.value);
  const scroll = body.scrollTop;
  openSheet('mission', h);
  body.dataset.sig = key; body.dataset.at = now;
  if(!force) body.scrollTop = scroll;
  checked.forEach(v => { const i=document.querySelector(`#vlist input[value="${v}"]`); if(i) i.checked=true; });
}

function openStation(sid){
  const st = S.stations[sid]; sheetView='station';
  if(st.type==='kh'){ openSheet('station', `<h2>${esc(st.n)}</h2><p class="muted">${esc(st.addr)}</p><p>Fachabteilungen: ${st.dept.join(', ')}</p>`); return; }
  if(st.type==='school'){ openSchools(); return; }
  const b = BT[st.type];
  let h = `<h2>${esc(st.n)}</h2><p class="muted">${b.n}${st.small?' (klein)':''} · ${esc(st.addr)}${st.est?' · Ausstattung teils geschätzt':''}</p>`;
  if(!st.own){
    h += `<p>Stille Nachbarwache. Sie hilft auf Anforderung und fragt ab und zu selbst um Hilfe.</p><button class="btn full" data-take="${st.id}">Übernehmen für ${fmt(b.price)} Credits</button>`;
  } else {
    h += `<p>Personal: ${st.staff} · Stellplätze: ${st.veh.length}/${slotsOf(st)}</p>`;
    const tr = Object.entries(st.trained).filter(([k,n])=>n>0); if(tr.length) h += `<p class="small">Ausgebildet: ${tr.map(([k,n])=>COURSES[k].n+' '+n).join(', ')}</p>`;
    if(st.small && b.small) h += `<button class="btn sec" data-expand="${st.id}">Zur normalen Wache ausbauen (${fmt(b.price-b.small)})</button>`;
  }
  h += `<h3>Fahrzeuge</h3>`;
  for(const vid of st.veh){ const v=S.vehicles[vid]; h += `<div class="vrow"><span class="grow">${esc(v.name)}<br><small>${VT[v.type].n}</small></span><span class="st s${v.status}">${statusText(v)}</span></div>`; }
  if(st.own){
    h += `<h3>Fahrzeug kaufen</h3><div class="grid2">`;
    for(const [k,vt] of Object.entries(VT)) if(vt.bt.includes(st.type)) h += `<button class="btn sec" data-buy="${k}" data-st="${st.id}">${vt.n}<br><small>${fmt(vt.price)}${vt.course?' · '+COURSES[vt.course].n:''}</small></button>`;
    h += `</div>`;
  }
  openSheet('station', h);
}
function statusText(v){ return {1:'Rückfahrt',2:'frei',3:'Anfahrt',4:'vor Ort',7:'Transport',8:'Übergabe'}[v.status]; }

function openStations(){
  const own = Object.values(S.stations).filter(s => s.own && BT[s.type] && s.type!=='kh' && s.type!=='school');
  const c = ownCounts();
  let h = `<h2>Meine Wachen</h2><p class="muted">Feuerwachen ${c.fw} · Rettungswachen ${c.rd} · Polizeiwachen ${c.pol} · THW ${c.thw} · BePo ${c.bepo}</p>`;
  for(const st of own){ const free = st.veh.filter(v=>S.vehicles[v].status===2).length;
    h += `<button class="row" data-st-open="${st.id}"><span class="ic" style="background:${COLORS[st.type]}">${BT[st.type].icon}</span><span class="grow"><b>${esc(st.n)}</b><br><small>${free}/${st.veh.length} Fahrzeuge frei</small></span></button>`; }
  h += `<h3>Neue Wache bauen</h3><p class="small muted">Typ wählen, dann auf die Karte tippen. Bestehende Nachbarwachen kannst du auf der Karte antippen und übernehmen.</p><div class="grid2">`;
  for(const t of BT_ORDER){ const b=BT[t]; h += `<button class="btn sec" data-build="${t}" data-small="0">${b.icon} ${b.n}<br><small>${fmt(b.price)}</small></button>`;
    if(b.small) h += `<button class="btn sec" data-build="${t}" data-small="1">${b.icon} ${b.n} (klein)<br><small>${fmt(b.small)}</small></button>`; }
  h += `</div><label class="chk"><input type="checkbox" id="c-silent" ${S.showSilent?'checked':''}> Nachbarwachen auf der Karte zeigen</label>`;
  openSheet('stations', h);
}
function openSchools(){
  const own = Object.values(S.stations).filter(s => s.own && BT[s.type] && !['kh','school'].includes(s.type));
  let h = `<h2>Schulen in Amorbach</h2><p class="muted">Richterstraße · 1 Lehrgangstag = ${S.courseMin} Spielminuten</p>`;
  if(S.courses.length){ h += `<h3>Laufende Lehrgänge</h3>`; for(const c of S.courses) h += `<div class="vrow"><span class="grow">${COURSES[c.course].n}<br><small>${c.count} Personen · ${esc(S.stations[c.station].n)}</small></span><span>${dur(c.end-S.time)}</span></div>`; }
  h += `<h3>Lehrgang starten</h3><label>Lehrgang<select id="l-course">` + Object.entries(COURSES).map(([k,c])=>`<option value="${k}">${c.n} (${c.days} Tage)</option>`).join('') + `</select></label>`;
  h += `<label>Wache<select id="l-st">` + own.map(s=>`<option value="${s.id}">${esc(s.n)}</option>`).join('') + `</select></label>`;
  h += `<label>Anzahl Personen<input id="l-n" type="number" min="1" max="20" value="4" inputmode="numeric"></label><button class="btn full" id="b-course">Lehrgang starten</button>`;
  openSheet('schools', h);
}
function openMore(){
  let h = `<h2>Einstellungen</h2>
  <label>Credits gutschreiben<div class="inline"><input id="i-cr" type="number" inputmode="numeric" placeholder="z.B. 1000000"><button class="btn" id="b-cr">Gutschreiben</button></div></label>
  <div class="grid2 chips">${[50000,100000,250000,500000,1000000].map(v=>`<button class="btn sec" data-addcr="${v}">+${fmt(v)}</button>`).join('')}</div>
  <label>Multiplikator für Einsatz-Credits<div class="inline"><input id="i-mult" type="number" step="0.5" min="0.5" value="${S.mult}" inputmode="decimal"><button class="btn" id="b-mult">Übernehmen</button></div></label>
  <label>Einsatztempo (neue Einsätze pro Spielstunde): <b id="v-rate">${S.rate}</b><input id="i-rate" type="range" min="1" max="30" value="${S.rate}"></label>
  <label>Zeitraffer (Spielminuten pro echter Minute): <b id="v-ts">${S.timeScale}</b><input id="i-ts" type="range" min="1" max="20" value="${S.timeScale}"></label>
  <label>Hilfeersuchen von Nachbarn pro Spielstunde: <b id="v-help">${S.helpRate}</b><input id="i-help" type="range" min="0" max="6" step="0.5" value="${S.helpRate}"></label>
  <label>Spielminuten pro Lehrgangstag: <b id="v-cm">${S.courseMin}</b><input id="i-cm" type="range" min="1" max="60" value="${S.courseMin}"></label>
  <label class="chk"><input type="checkbox" id="c-pause" ${S.paused?'checked':''}> Keine neuen Einsätze (Pause)</label>
  <h3>Statistik</h3><p class="small">Erledigte Einsätze: ${S.done} · Verdiente Credits: ${fmt(S.earned)}</p>
  <h3>Spielstand</h3><p class="small muted">Der Spielstand liegt in diesem Browser. Zum Übertragen auf ein anderes Gerät exportieren und dort einfügen. Die Synchronisierung über Firebase kommt später.</p>
  <div class="actions"><button class="btn sec" id="b-exp">Exportieren</button><button class="btn sec" id="b-imp">Importieren</button><button class="btn sec" id="b-geo">Positionen neu laden</button></div>
  <textarea id="t-io" rows="3" placeholder="Hier erscheint der Export oder fügst du einen Spielstand ein"></textarea>
  <button class="btn danger full" id="b-reset">Neues Spiel starten</button>
  <h3>Funkprotokoll</h3>${S.log.slice(0,30).map(l=>`<p class="small"><span class="muted">${gtime(l.t)}</span> ${esc(l.m)}</p>`).join('')}`;
  openSheet('more', h);
}

// ---------- Ereignisse ----------
document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-open]'); if(!t) return;
  const d = t.dataset;
  if(t.id==='nav-map'){ closeSheet(); return; }
  if(t.id==='nav-mis'){ sheetView='missions'; $('#sheetbody').dataset.sig=''; renderMissionList(); return; }
  if(t.id==='nav-st'){ openStations(); return; }
  if(t.id==='nav-school'){ openSchools(); return; }
  if(t.id==='nav-more'){ openMore(); return; }
  if(t.id==='sheetclose'){ closeSheet(); return; }
  if(d.open){ openMission(d.open); return; }
  if(d.gsl){ startGSL(+d.gsl); return; }
  if(d.stOpen){ const st=S.stations[d.stOpen]; map.setView([st.lat, st.lng], 13); openStation(d.stOpen); return; }
  if(d.take){ takeOver(d.take); drawStations(); openStation(d.take); save(); return; }
  if(d.expand){ expandStation(d.expand); openStation(d.expand); save(); return; }
  if(d.buy){ buyVehicle(d.st, d.buy); openStation(d.st); save(); return; }
  if(d.build){ const b=BT[d.build]; const small=d.small==='1'; const price=small?b.small:b.price;
    if(S.credits<price){ toast('Nicht genug Credits'); return; }
    const name = (window.prompt ? window.prompt('Name der neuen Wache', b.n) : null) || b.n;
    buildMode={type:d.build, small, name}; closeSheet(); $('#buildhint').hidden=false; return; }
  if(d.cancel){ cancelVehicle(S.vehicles[d.cancel]); renderMission(true); return; }
  if(d.addcr){ S.credits += +d.addcr; toast(`+${fmt(+d.addcr)} Credits gutgeschrieben`,'ok'); save(); return; }
  if(t.id==='b-cr'){ const v=Math.round(+$('#i-cr').value||0); if(v>0){ S.credits+=v; toast(`+${fmt(v)} Credits gutgeschrieben`,'ok'); $('#i-cr').value=''; save(); } return; }
  if(t.id==='b-mult'){ const v=+$('#i-mult').value; if(v>0){ S.mult=v; toast(`Multiplikator ×${v} aktiv`,'ok'); save(); } return; }
  if(t.id==='b-aao'){ const mis=S.missions[selMission]; const sel=autoSelect(mis, true); document.querySelectorAll('#vlist input').forEach(i=>i.checked=sel.some(v=>v.id===i.value)); if(!sel.length) toast('Keine passenden eigenen Kräfte frei'); return; }
  if(t.id==='b-sup'){ requestSupport(S.missions[selMission]); renderMission(true); save(); return; }
  if(t.id==='b-alarm'){ const mis=S.missions[selMission]; const ids=[...document.querySelectorAll('#vlist input:checked')].map(i=>i.value);
    ids.forEach(v => alarm(S.vehicles[v], mis)); if(ids.length) toast(`${ids.length} Fahrzeug(e) alarmiert`); renderMission(true); save(); return; }
  if(t.id==='b-course'){ startCourse($('#l-course').value, $('#l-st').value, +$('#l-n').value); openSchools(); save(); return; }
  if(t.id==='b-exp'){ save(); $('#t-io').value = localStorage.getItem(SAVE_KEY); $('#t-io').select(); toast('Spielstand exportiert, Text kopieren'); return; }
  if(t.id==='b-imp'){ try{ const o=JSON.parse($('#t-io').value); if(o && o.stations){ S=o; save(); drawStations(); toast('Spielstand importiert','ok'); closeSheet(); } }catch(err){ toast('Text ist kein gültiger Spielstand'); } return; }
  if(t.id==='b-geo'){ geocodeAll(true); return; }
  if(t.id==='b-reset'){ if(t.dataset.sure){ localStorage.removeItem(SAVE_KEY); newGame(); save(); drawStations(); closeSheet(); toast('Neues Spiel gestartet','ok'); } else { t.dataset.sure='1'; t.textContent='Wirklich? Nochmal tippen'; } return; }
});
document.addEventListener('input', e => {
  const t=e.target;
  if(t.id==='i-rate'){ S.rate=+t.value; $('#v-rate').textContent=t.value; }
  if(t.id==='i-ts'){ S.timeScale=+t.value; $('#v-ts').textContent=t.value; }
  if(t.id==='i-help'){ S.helpRate=+t.value; $('#v-help').textContent=t.value; }
  if(t.id==='i-cm'){ S.courseMin=+t.value; $('#v-cm').textContent=t.value; }
  if(t.id==='c-pause'){ S.paused=t.checked; }
  if(t.id==='c-silent'){ S.showSilent=t.checked; drawStations(); }
});
document.addEventListener('visibilitychange', () => { if(document.hidden) save(); else lastReal = Date.now(); });
window.addEventListener('pagehide', save);

// ---------- Start ----------
function start(){
  if(!load()) { newGame(); save(); }
  // Korrekturen für ältere Spielstände
  for(const st of Object.values(S.stations)){ if(st.addr==='Gönz, 63916 Amorbach') st.addr='Gönz'; if(st.addr==='Roßbacher Straße 119, 63820 Elsenfeld') st.addr='Roßbacher Straße 119, Roßbach'; }
  lastReal = Date.now(); // Zeit läuft nur, solange das Spiel offen ist
  initMap(); render();
  setInterval(tick, 1000);
  setInterval(save, 5000);
  setInterval(routeWorker, 1100); // Routendienst: höchstens eine Anfrage pro Sekunde
  setTimeout(() => geocodeAll(false), 1500);
}
if(typeof window!=='undefined' && window.L) start();
