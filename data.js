/* Leitstelle Unterfranken – Spieldaten
   Quellen: Leitstellenspiel-Wiki (Gebäude, Fahrzeuge, Einsätze), Kreisbrandinspektion Miltenberg (kbi-mil.de),
   ffamorbach.de, bos-fahrzeuge.info, ffw-erlenbach-stadt.de, feuerwehr-collenberg.de, feuerwehr-eichenbuehl.de,
   Kostensatzung Kirchzell 2026, ov-obernburg.thw.de, kliniken.de, gesetze-bayern.de (Dienststellen BePo).
   Einträge mit est:true sind geschätzt und werden später durch Recherche ersetzt. */

// ---------- Rollen: was ein Einsatz verlangen kann ----------
const ROLES = {
  LF: 'Löschfahrzeug', TLF: 'Tanklöschfahrzeug', DLK: 'Drehleiter', RW: 'Rüstwagen', ELW1: 'ELW 1', ELW2: 'ELW 2',
  GWA: 'GW-Atemschutz', GWOEL: 'GW-Öl', SW: 'Schlauchwagen', GWMESS: 'GW-Messtechnik', GWG: 'GW-Gefahrgut',
  GWH: 'GW-Höhenrettung', DEKON: 'Dekon-P', FWK: 'Feuerwehrkran', MZF: 'MZF/MTW', GWL: 'GW-Logistik', MZB: 'Boot',
  RTW: 'RTW', NEF: 'NEF', KTW: 'KTW', LNA: 'KdoW-LNA', ORGL: 'KdoW-OrgL', RTH: 'RTH',
  GWSAN: 'GW-SAN', ELWSEG: 'ELW 1 (SEG)',
  FUSTW: 'Streifenwagen', GRUKW: 'GruKw (BePo)', FUEKW: 'FüKw', LEBEFKW: 'leBefKw', WAWE: 'Wasserwerfer',
  SEK: 'SEK', MEK: 'MEK', DHU: 'Diensthundeführer', PHUB: 'Polizeihubschrauber',
  GKW: 'GKW (THW)', MTWTZ: 'MTW-TZ (THW)', THWR: 'THW Räumen', THWP: 'THW Pumpen',
  GWWR: 'GW-Wasserrettung', GWTAU: 'GW-Taucher'
};

// ---------- Fahrzeugtypen (bayerische Bezeichnungen) ----------
// roles: welche Anforderungen das Fahrzeug erfüllt; crew: Mindestbesatzung; v: Durchschnitt km/h mit Sonderrechten
// price: Credits; course: benötigter Lehrgang (Anzahl = crew), bt: erlaubte Gebäudetypen
const VT = {
  'TSF':      {n:'TSF', roles:['LF'], crew:6, v:55, price:3000, bt:['fw']},
  'TSF-W':    {n:'TSF-W', roles:['LF'], crew:6, v:55, price:4000, bt:['fw']},
  'MLF':      {n:'MLF', roles:['LF'], crew:6, v:55, price:4500, bt:['fw']},
  'LF 8':     {n:'LF 8', roles:['LF'], crew:9, v:50, price:4000, bt:['fw']},
  'LF 8/6':   {n:'LF 8/6', roles:['LF'], crew:9, v:50, price:4500, bt:['fw']},
  'LF 10':    {n:'LF 10', roles:['LF'], crew:9, v:55, price:5000, bt:['fw']},
  'LF 16/TS': {n:'LF 16/TS', roles:['LF'], crew:9, v:50, price:5000, bt:['fw']},
  'LF 20':    {n:'LF 20', roles:['LF'], crew:9, v:55, price:5500, bt:['fw']},
  'HLF 10':   {n:'HLF 10', roles:['LF','RW'], crew:9, v:55, price:15000, bt:['fw']},
  'HLF 20':   {n:'HLF 20', roles:['LF','RW'], crew:9, v:55, price:20000, bt:['fw']},
  'TLF 3000': {n:'TLF 3000', roles:['LF','TLF'], crew:3, v:55, price:6000, bt:['fw']},
  'TLF 16/25':{n:'TLF 16/25', roles:['LF','TLF'], crew:6, v:50, price:5500, bt:['fw']},
  'DLK 23/12':{n:'DLK 23/12', roles:['DLK'], crew:3, v:55, price:10000, bt:['fw']},
  'RW 2':     {n:'RW 2', roles:['RW'], crew:3, v:50, price:12000, bt:['fw']},
  'ELW 1':    {n:'ELW 1', roles:['ELW1'], crew:3, v:65, price:25000, bt:['fw']},
  'ELW 2':    {n:'ELW 2', roles:['ELW2','ELW1'], crew:5, v:60, price:25000, course:'ELW2', bt:['fw']},
  'KdoW':     {n:'KdoW', roles:['ELW1'], crew:1, v:75, price:20000, bt:['fw']},
  'MZF':      {n:'MZF', roles:['MZF'], crew:3, v:70, price:5000, bt:['fw']},
  'MTW':      {n:'MTW', roles:['MZF'], crew:3, v:70, price:5000, bt:['fw']},
  'GW-L1':    {n:'GW-L1', roles:['GWL'], crew:3, v:50, price:10000, bt:['fw']},
  'GW-L2':    {n:'GW-L2', roles:['GWL','SW'], crew:3, v:50, price:12000, bt:['fw']},
  'SW-Kats':  {n:'SW-Kats', roles:['SW'], crew:3, v:50, price:12000, bt:['fw']},
  'GW-A':     {n:'GW-Atemschutz', roles:['GWA'], crew:3, v:55, price:11000, bt:['fw']},
  'GW-Mess':  {n:'GW-Messtechnik', roles:['GWMESS'], crew:3, v:55, price:15000, course:'GWMESS', bt:['fw']},
  'GW-G':     {n:'GW-Gefahrgut', roles:['GWG'], crew:3, v:50, price:19000, course:'GWG', bt:['fw']},
  'GW-H':     {n:'GW-Höhenrettung', roles:['GWH'], crew:9, v:55, price:12000, course:'GWH', bt:['fw']},
  'Dekon-P':  {n:'GW Dekon-P', roles:['DEKON'], crew:6, v:50, price:20000, course:'DEKON', bt:['fw']},
  'FwK':      {n:'Feuerwehrkran', roles:['FWK'], crew:2, v:40, price:30000, course:'FWK', bt:['fw']},
  'WLF AB-Tank':   {n:'WLF + AB Tank', roles:['TLF'], crew:2, v:50, price:17000, course:'WLF', bt:['fw']},
  'WLF AB-Öl':     {n:'WLF + AB Öl', roles:['GWOEL'], crew:2, v:50, price:17000, course:'WLF', bt:['fw']},
  'WLF AB-G':      {n:'WLF + AB Gefahrgut', roles:['GWG'], crew:2, v:50, price:25000, course:'WLF', bt:['fw']},
  'WLF AB-Schlauch':{n:'WLF + AB Schlauch', roles:['SW'], crew:2, v:50, price:17000, course:'WLF', bt:['fw']},
  'WLF AB-Log':    {n:'WLF + AB Logistik', roles:['GWL'], crew:2, v:50, price:17000, course:'WLF', bt:['fw']},
  'GW-Öl':    {n:'GW-Öl', roles:['GWOEL'], crew:3, v:50, price:10000, bt:['fw']},
  'MZB':      {n:'Mehrzweckboot', roles:['MZB'], crew:2, v:40, price:6000, bt:['fw','wr']},
  'V-LKW':    {n:'V-LKW', roles:['GWL'], crew:3, v:50, price:10000, bt:['fw']},
  // Rettungsdienst
  'RTW':      {n:'RTW', roles:['RTW'], crew:2, v:70, price:5000, bt:['rd','fw']},
  'KTW':      {n:'KTW', roles:['KTW'], crew:2, v:65, price:5000, bt:['rd']},
  'NEF':      {n:'NEF', roles:['NEF'], crew:2, v:80, price:20000, course:'NOTARZT', crewCourse:1, bt:['rd','fw']},
  'KdoW-LNA': {n:'KdoW-LNA', roles:['LNA'], crew:1, v:80, price:20000, course:'LNA', bt:['rd']},
  'KdoW-OrgL':{n:'KdoW-OrgL', roles:['ORGL'], crew:1, v:80, price:20000, course:'ORGL', bt:['rd']},
  'RTH':      {n:'RTH', roles:['RTH','NEF'], crew:2, v:220, price:300000, course:'NOTARZT', crewCourse:1, bt:['rth']},
  'KTW-B':    {n:'KTW Typ B', roles:['KTW'], crew:2, v:60, price:5000, bt:['seg']},
  'GW-SAN':   {n:'GW-SAN', roles:['GWSAN'], crew:6, v:55, price:10000, course:'GWSAN', bt:['seg']},
  'ELW-SEG':  {n:'ELW 1 (SEG)', roles:['ELWSEG'], crew:2, v:65, price:25000, course:'SEGEL', bt:['seg']},
  // Polizei
  'FuStW':    {n:'Funkstreifenwagen', roles:['FUSTW'], crew:2, v:80, price:5000, bt:['pol']},
  'DHuFüKw':  {n:'DHuFüKw', roles:['DHU'], crew:1, v:75, price:15000, course:'HUND', bt:['pol','bepo']},
  'GruKw':    {n:'GruKw', roles:['GRUKW'], crew:9, v:65, price:10000, bt:['bepo']},
  'FüKw':     {n:'FüKw', roles:['FUEKW'], crew:3, v:70, price:15000, course:'HUFUE', bt:['bepo']},
  'leBefKw':  {n:'leBefKw', roles:['LEBEFKW'], crew:3, v:70, price:10000, course:'ZUGF', bt:['bepo']},
  'WaWe':     {n:'Wasserwerfer', roles:['WAWE'], crew:5, v:45, price:40000, course:'WAWE', bt:['bepo']},
  'SEK-MTF':  {n:'SEK-MTF', roles:['SEK'], crew:9, v:75, price:30000, course:'SEK', bt:['bepo']},
  'MEK-MTF':  {n:'MEK-MTF', roles:['MEK'], crew:9, v:75, price:30000, course:'MEK', bt:['bepo']},
  'PolHub':   {n:'Polizeihubschrauber', roles:['PHUB'], crew:3, v:220, price:300000, course:'PHUB', bt:['phub']},
  // THW
  'GKW':      {n:'GKW', roles:['GKW'], crew:9, v:50, price:25000, bt:['thw']},
  'MTW-TZ':   {n:'MTW-TZ', roles:['MTWTZ'], crew:4, v:60, price:15000, course:'ZUGTRUPP', bt:['thw']},
  'MzGW':     {n:'MzGW (FGr N)', roles:['GKW'], crew:9, v:50, price:25000, bt:['thw']},
  'BRmG R':   {n:'Radlader (FGr R)', roles:['THWR'], crew:2, v:30, price:30000, course:'RAEUMEN', bt:['thw']},
  'MLW IV':   {n:'MLW IV (FGr WP)', roles:['THWP'], crew:7, v:50, price:20000, course:'PUMPEN', bt:['thw']},
  // Wasserrettung
  'GW-WR':    {n:'GW-Wasserrettung', roles:['GWWR'], crew:6, v:55, price:15000, course:'WR', bt:['wr','fw']},
  'GW-Taucher':{n:'GW-Taucher', roles:['GWTAU'], crew:4, v:55, price:15000, course:'TAUCHER', bt:['wr','fw']},
};

// ---------- Gebäudetypen (Preise laut Wiki, Coins entfallen) ----------
const BT = {
  fw:   {n:'Feuerwache', price:100000, small:50000, slots:8, smallSlots:3, icon:'🚒', staff:30},
  rd:   {n:'Rettungswache', price:200000, small:100000, slots:6, smallSlots:2, icon:'🚑', staff:12},
  pol:  {n:'Polizeiwache', price:100000, small:50000, slots:8, smallSlots:3, icon:'🚓', staff:20},
  rth:  {n:'Rettungshubschrauber-Station', price:1000000, slots:1, icon:'🚁', staff:4},
  phub: {n:'Polizeihubschrauber-Station', price:1000000, slots:1, icon:'🚁', staff:4},
  bepo: {n:'Bereitschaftspolizei', price:500000, slots:20, icon:'🛡️', staff:120},
  thw:  {n:'THW-Ortsverband', price:200000, slots:10, icon:'🔧', staff:40},
  seg:  {n:'SEG-Wache', price:100000, slots:6, icon:'⛑️', staff:25},
  wr:   {n:'Wasserrettungswache', price:500000, slots:4, icon:'🛟', staff:20},
  kh:   {n:'Krankenhaus', price:200000, icon:'🏥'},
  school:{n:'Schule', icon:'🎓'},
};
const BT_ORDER = ['fw','rd','pol','rth','phub','bepo','thw','seg','wr'];

// ---------- Lehrgänge (Schulen in Amorbach, Richterstraße) ----------
const COURSES = {
  ELW2:{n:'ELW 2', school:'fw', days:7}, GWMESS:{n:'GW-Messtechnik', school:'fw', days:3}, GWG:{n:'GW-Gefahrgut', school:'fw', days:3},
  GWH:{n:'GW-Höhenrettung', school:'fw', days:4}, DEKON:{n:'Dekon-P', school:'fw', days:3}, FWK:{n:'Feuerwehrkran', school:'fw', days:3},
  WLF:{n:'Wechsellader', school:'fw', days:2}, WR:{n:'GW-Wasserrettung', school:'fw', days:3}, TAUCHER:{n:'GW-Taucher', school:'fw', days:5},
  NOTARZT:{n:'Notarzt', school:'rd', days:7}, LNA:{n:'LNA', school:'rd', days:9}, ORGL:{n:'OrgL', school:'rd', days:11},
  GWSAN:{n:'SEG-GW SAN', school:'rd', days:3}, SEGEL:{n:'SEG-Einsatzleitung', school:'rd', days:4},
  ZUGF:{n:'Zugführer leBefKw', school:'pol', days:7}, HUFUE:{n:'Hundertschaftsführer FüKw', school:'pol', days:7},
  PHUB:{n:'Polizeihubschrauber', school:'pol', days:7}, WAWE:{n:'Wasserwerfer', school:'pol', days:7}, SEK:{n:'SEK', school:'pol', days:7},
  MEK:{n:'MEK', school:'pol', days:7}, HUND:{n:'Hundeführer', school:'pol', days:7},
  ZUGTRUPP:{n:'Zugtrupp', school:'thw', days:7}, RAEUMEN:{n:'Fachgruppe Räumen', school:'thw', days:7}, PUMPEN:{n:'Wasserschaden/Pumpen', school:'thw', days:7},
};
const SCHOOLS = [
  {id:'s-fw', type:'fw', n:'Feuerwehrschule', addr:'Richterstraße 4, 63916 Amorbach', lat:49.6475, lng:9.2195},
  {id:'s-rd', type:'rd', n:'Rettungsschule', addr:'Richterstraße 4, 63916 Amorbach', lat:49.6477, lng:9.2199},
  {id:'s-pol', type:'pol', n:'Polizeischule', addr:'Richterstraße 4, 63916 Amorbach', lat:49.6473, lng:9.2203},
  {id:'s-thw', type:'thw', n:'THW-Schule', addr:'Richterstraße 4, 63916 Amorbach', lat:49.6479, lng:9.2205},
];

// ---------- Krankenhäuser ----------
const DEPTS = ['Innere','Chirurgie','Unfallchirurgie','Kardiologie','Neurologie','Gynäkologie','Pädiatrie','Urologie','Neurochirurgie','Intensiv','Brandverletzte'];
const HOSPITALS = [
  {id:'kh-mil', n:'Klinik Miltenberg', addr:'Breitendieler Straße 32, 63897 Miltenberg', lat:49.6995, lng:9.2560, beds:20, dept:['Innere','Chirurgie']},
  {id:'kh-erl', n:'Helios Klinik Erlenbach', addr:'Krankenhausstraße 45, 63906 Erlenbach am Main', lat:49.8000, lng:9.1560, beds:267, dept:['Innere','Chirurgie','Unfallchirurgie','Kardiologie','Gynäkologie','Neurologie','Urologie','Intensiv']},
  {id:'kh-ab', n:'Klinikum Aschaffenburg', addr:'Am Hasenkopf 1, 63739 Aschaffenburg', lat:49.9640, lng:9.1620, beds:731, dept:['Innere','Chirurgie','Unfallchirurgie','Kardiologie','Gynäkologie','Pädiatrie','Urologie','Neurologie','Neurochirurgie','Intensiv']},
  {id:'kh-wue', n:'Uniklinik Würzburg', addr:'Josef-Schneider-Straße 2, 97080 Würzburg', lat:49.8033, lng:9.9570, beds:1400, dept:DEPTS.slice()},
];

// ---------- Startwachen (gehören Alexander) ----------
const START_STATIONS = [
  {id:'own-ff-kirchzell', type:'fw', n:'FF Kirchzell', addr:'Feuerwehrhaus, 63931 Kirchzell', lat:49.6178, lng:9.1771, small:true,
   veh:[['HLF 20','Florian Kirchzell 40/1'],['LF 16/TS','Florian Kirchzell 43/1'],['LF 8','Florian Kirchzell 41/1'],['MZF','Florian Kirchzell 11/1'],['GW-L1','Florian Kirchzell 55/1']]},
  {id:'own-rd-kirchzell', type:'rd', n:'BRK Kirchzell', addr:'Feuerwehrhaus, 63931 Kirchzell', lat:49.6182, lng:9.1776, small:true,
   veh:[['RTW','Rotkreuz Kirchzell 71/1']]},
  {id:'own-pol-mil', type:'pol', n:'PI Miltenberg', addr:'Burgweg 21, 63897 Miltenberg', lat:49.7044, lng:9.2580, small:false,
   veh:[['FuStW','Miltenberg 11/1'],['FuStW','Miltenberg 11/2']]},
  {id:'own-rth-mil', type:'rth', n:'Christoph 18 (Klinik Miltenberg)', addr:'Breitendieler Straße 32, 63897 Miltenberg', lat:49.6998, lng:9.2566, small:false,
   veh:[['RTH','Christoph 18']]},
];

// ---------- Stille Wachen (echte Standorte, Ausstattung recherchiert oder geschätzt) ----------
// cnt = Fahrzeuganzahl laut KBI; veh = bekannte Fahrzeuge; est = Ausstattung geschätzt
const SILENT = [
  // Landkreis Miltenberg, Fahrzeuge bekannt
  {n:'FF Amorbach', type:'fw', addr:'Oberes Tor 4, 63916 Amorbach', lat:49.6450, lng:9.2205,
   veh:['HLF 20','DLK 23/12','WLF AB-Tank','SW-Kats','MZF','MTW']},
  {n:'FF Miltenberg', type:'fw', addr:'Mainstraße 9, 63897 Miltenberg', lat:49.7040, lng:9.2650,
   veh:['ELW 1','MTW','DLK 23/12','HLF 20','LF 20','GW-L1','MZB','WLF AB-Öl']},
  {n:'FF Weilbach', type:'fw', addr:'Lorenz-Breunig-Straße 1, 63937 Weilbach', lat:49.6680, lng:9.2180, veh:['MZF','LF 20','TSF-W']},
  {n:'FF Erlenbach', type:'fw', addr:'Elsenfelder Straße 51, 63906 Erlenbach am Main', lat:49.8060, lng:9.1650,
   veh:['ELW 1','MZF','HLF 20','TLF 16/25','MLF','GW-Mess','DLK 23/12']},
  {n:'FF Collenberg', type:'fw', addr:'Bahnhofstraße 12, 97903 Collenberg', lat:49.7700, lng:9.3330, veh:['MZF','HLF 10','RW 2','TLF 3000','GW-L1','MZB','DLK 23/12']},
  {n:'FF Eichenbühl', type:'fw', addr:'Am Feuerwehrhaus 1, 63928 Eichenbühl', lat:49.7055, lng:9.3310, veh:['MZF','HLF 20','TLF 16/25','V-LKW']},
  {n:'FF Kleinheubach', type:'fw', addr:'Im Steiner 11, 63924 Kleinheubach', lat:49.7215, lng:9.2120, cnt:7, veh:['TLF 16/25','V-LKW','HLF 20','LF 10','MZF'], est:true},
  {n:'FF Großheubach', type:'fw', addr:'Beim Trieb 38, 63920 Großheubach', lat:49.7280, lng:9.2260, cnt:9,
   veh:['ELW 2','RW 2','WLF AB-Schlauch','MZB','GW-H','HLF 20','LF 10','MZF'], est:true},
  {n:'FF Obernburg', type:'fw', addr:'Jahnstraße 2b, 63785 Obernburg am Main', lat:49.8395, lng:9.1430, cnt:7,
   veh:['ELW 2','KdoW','MZB','WLF AB-Öl','HLF 20','LF 20','GW-A'], est:true},
  {n:'FF Großwallstadt', type:'fw', addr:'Quellenstraße 54, 63868 Großwallstadt', lat:49.8790, lng:9.1530, cnt:7, veh:['WLF AB-Log','WLF AB-Tank','HLF 20','LF 10','MZF'], est:true},
  {n:'FF Trennfurt', type:'fw', addr:'Trennfurter Straße 109, 63911 Klingenberg am Main', lat:49.7790, lng:9.1840, cnt:8, veh:['WLF AB-G','HLF 20','LF 20','DLK 23/12','MZF'], est:true},
  {n:'FF Leidersbach', type:'fw', addr:'Hauptstraße 236, 63849 Leidersbach', lat:49.9000, lng:9.2190, cnt:3, veh:['Dekon-P','LF 10','MZF'], est:true},
  {n:'FF Wörth am Main', type:'fw', addr:'Luxburgstraße 10, 63939 Wörth am Main', lat:49.7970, lng:9.1530, cnt:6, veh:['RW 2','HLF 20','LF 10','MZF'], est:true},
  {n:'FF Eschau', type:'fw', addr:'Wildensteiner Straße 39, 63863 Eschau', lat:49.8180, lng:9.2580, cnt:3, veh:['LF 10','MZF'], est:true},
  {n:'FF Altenbuch', type:'fw', addr:'Hauptstraße 29, 97901 Altenbuch', lat:49.8270, lng:9.4050, cnt:3, veh:['GW-L1','LF 10','MZF'], est:true},
  // Landkreis Miltenberg, Ausstattung nach Fahrzeuganzahl geschätzt
  {n:'FF Schneeberg', type:'fw', addr:'Vereinsstraße 8, 63936 Schneeberg', lat:49.6407, lng:9.2565, cnt:3},
  {n:'FF Zittenfelden', type:'fw', addr:'Zittenfelden 7, 63936 Schneeberg', lat:49.6290, lng:9.2410, cnt:1},
  {n:'FF Boxbrunn', type:'fw', addr:'Boxbrunn 36, 63916 Amorbach', lat:49.6170, lng:9.2560, cnt:2},
  {n:'FF Breitenbuch', type:'fw', addr:'Breitenbuch, 63931 Kirchzell', lat:49.6040, lng:9.1520, veh:['LF 8/6']},
  {n:'FF Preunschen', type:'fw', addr:'Dorfstraße 32, 63931 Kirchzell', lat:49.5940, lng:9.1980, veh:['LF 8/6']},
  {n:'FF Watterbach', type:'fw', addr:'Watterbach, 63931 Kirchzell', lat:49.6260, lng:9.1530, veh:['LF 8']},
  {n:'FF Ottorfszell', type:'fw', addr:'Ottorfszell, 63931 Kirchzell', lat:49.6060, lng:9.2050, veh:['TSF']},
  {n:'FF Bürgstadt', type:'fw', addr:'Am Bischof 8, 63927 Bürgstadt', lat:49.7139, lng:9.2685, cnt:6},
  {n:'FF Breitendiel', type:'fw', addr:'Greinbergstraße 5, 63897 Miltenberg', lat:49.6930, lng:9.2440, cnt:4},
  {n:'FF Elsenfeld', type:'fw', addr:'Dammsfeldstraße 17, 63820 Elsenfeld', lat:49.8430, lng:9.1650, cnt:6},
  {n:'FF Faulbach', type:'fw', addr:'Am Sportplatz 4b, 97906 Faulbach', lat:49.7860, lng:9.4450, cnt:4},
  {n:'FF Breitenbrunn', type:'fw', addr:'Faulbacher Straße 5, 97906 Faulbach', lat:49.7980, lng:9.4250, cnt:3},
  {n:'FF Dorfprozelten', type:'fw', addr:'Schifferstraße 16, 97904 Dorfprozelten', lat:49.7810, lng:9.3790, cnt:3},
  {n:'FF Eisenbach', type:'fw', addr:'Schulstraße 10, 63785 Obernburg', lat:49.8320, lng:9.1820, cnt:3},
  {n:'FF Ebersbach', type:'fw', addr:'Floßgasse 5, 63849 Leidersbach', lat:49.8960, lng:9.2480, cnt:1},
  {n:'FF Gönz', type:'fw', addr:'Gönz', lat:49.6350, lng:9.2050, cnt:1},
  {n:'FF Niedernberg', type:'fw', addr:'Lindenstraße 2, 63843 Niedernberg', lat:49.9130, lng:9.1370, cnt:11},
  {n:'FF Sulzbach', type:'fw', addr:'Spessartstraße 124, 63834 Sulzbach am Main', lat:49.9120, lng:9.1530, cnt:8},
  {n:'FF Mömlingen', type:'fw', addr:'Sudetenstraße 36, 63853 Mömlingen', lat:49.8580, lng:9.0830, cnt:7},
  {n:'FF Kleinwallstadt', type:'fw', addr:'Ostring 112, 63839 Kleinwallstadt', lat:49.8710, lng:9.1680, cnt:4},
  {n:'FF Pfohlbach', type:'fw', addr:'Heppdieler Straße 2, 63928 Eichenbühl', lat:49.6980, lng:9.3550, cnt:4},
  {n:'FF Laudenbach', type:'fw', addr:'Miltenberger Straße 21, 63925 Laudenbach', lat:49.7470, lng:9.1820, cnt:3},
  {n:'FF Mönchberg', type:'fw', addr:'Hauptstraße 67, 63933 Mönchberg', lat:49.7930, lng:9.2700, cnt:3},
  {n:'FF Soden', type:'fw', addr:'Sodentalstraße 106, 63834 Sulzbach am Main', lat:49.9050, lng:9.1800, cnt:3},
  {n:'FF Stadtprozelten', type:'fw', addr:'Brandenburger Straße 7, 97909 Stadtprozelten', lat:49.7860, lng:9.4100, cnt:3},
  {n:'FF Heppdiel', type:'fw', addr:'Höhenstraße 27, 63928 Eichenbühl', lat:49.6900, lng:9.3450, cnt:2},
  {n:'FF Hobbach', type:'fw', addr:'Brunnenstraße 11a, 63863 Eschau', lat:49.8320, lng:9.2850, cnt:2},
  {n:'FF Kirschfurt', type:'fw', addr:'Theresienhofstraße 7, 97896 Collenberg', lat:49.7660, lng:9.3200, cnt:2},
  {n:'FF Mainbullau', type:'fw', addr:'Mainbullau 22, 63897 Miltenberg', lat:49.7020, lng:9.2950, cnt:2},
  {n:'FF Mechenhard', type:'fw', addr:'Schäfergasse 4, 63906 Erlenbach am Main', lat:49.8110, lng:9.1900, cnt:2},
  {n:'FF Monbrunn', type:'fw', addr:'Monbrunn, 63897 Miltenberg', lat:49.6800, lng:9.2950, cnt:2},
  {n:'FF Neunkirchen', type:'fw', addr:'Frankenstraße 19, 63930 Neunkirchen', lat:49.7270, lng:9.3740, cnt:2},
  {n:'FF Riedern', type:'fw', addr:'Am Park 1, 63928 Eichenbühl', lat:49.6900, lng:9.3830, cnt:2},
  {n:'FF Röllfeld', type:'fw', addr:'Stefanstraße 6, 63911 Klingenberg am Main', lat:49.7740, lng:9.1830, cnt:2},
  {n:'FF Rück-Schippach', type:'fw', addr:'Elsavatalstraße 104, 63820 Elsenfeld', lat:49.8430, lng:9.2050, cnt:2},
  {n:'FF Rüdenau', type:'fw', addr:'Rathausstraße 3, 63924 Rüdenau', lat:49.7280, lng:9.1890, cnt:2},
  {n:'FF Sommerau', type:'fw', addr:'Schulstraße 11, 63863 Eschau', lat:49.8050, lng:9.2400, cnt:2},
  {n:'FF Umpfenbach', type:'fw', addr:'Eichenbühler Straße 9, 63930 Neunkirchen', lat:49.7130, lng:9.3700, cnt:2},
  {n:'FF Weckbach', type:'fw', addr:'Ohrnbachtalstraße 23, 63937 Weilbach', lat:49.6560, lng:9.1900, cnt:2},
  {n:'FF Wenschdorf', type:'fw', addr:'Wenschdorf 13, 63897 Miltenberg', lat:49.6860, lng:9.2340, cnt:2},
  {n:'FF Wildensee', type:'fw', addr:'Wildensee 47, 63863 Eschau', lat:49.8350, lng:9.3200, cnt:2},
  {n:'FF Hofstetten', type:'fw', addr:'Talstraße 48, 63839 Kleinwallstadt', lat:49.8640, lng:9.1950, cnt:1},
  {n:'FF Neudorf', type:'fw', addr:'Neudorf 11, 63916 Amorbach', lat:49.6560, lng:9.2400, cnt:1},
  {n:'FF Neuenbuch', type:'fw', addr:'Neuenbucher Straße 56, 97909 Stadtprozelten', lat:49.8030, lng:9.4050, cnt:1},
  {n:'FF Richelbach', type:'fw', addr:'Lindenstraße 39, 63930 Neunkirchen', lat:49.7430, lng:9.3700, cnt:1},
  {n:'FF Rossbach', type:'fw', addr:'Roßbacher Straße 119, Roßbach', lat:49.8550, lng:9.2150, cnt:1},
  {n:'FF Streit', type:'fw', addr:'Am Kirchplatz 1, 63906 Erlenbach am Main', lat:49.8150, lng:9.2050, cnt:1},
  {n:'WF ICO Obernburg', type:'fw', addr:'Industrie Center Obernburg, 63785 Obernburg am Main', lat:49.8460, lng:9.1350, cnt:10, veh:['ELW 1','HLF 20','TLF 3000','LF 20','DLK 23/12','GW-A','GW-G','MZF'], est:true},
  {n:'WF Fripa', type:'fw', addr:'Großheubacher Straße 4, 63897 Miltenberg', lat:49.7120, lng:9.2420, cnt:1},
  {n:'WF WIKA', type:'fw', addr:'Alexander-Wiegand-Straße 30, 63911 Klingenberg am Main', lat:49.7870, lng:9.1750, cnt:1},
  // Würzburg (Sonderfahrzeuge für ganz Unterfranken, geschätzt)
  {n:'Feuerwehr Würzburg', type:'fw', addr:'Würzburg', lat:49.7890, lng:9.9180,
   veh:['ELW 2','ELW 1','HLF 20','HLF 20','DLK 23/12','DLK 23/12','RW 2','GW-A','GW-Mess','GW-G','Dekon-P','FwK','GW-H','GW-Öl','GW-Taucher','GW-WR','MZB'], est:true},
  // Rettungsdienst
  {n:'BRK Rettungswache Bürgstadt', type:'rd', addr:'Hettersau 2, 63927 Bürgstadt', lat:49.7190, lng:9.2750, veh:['RTW','KTW','KTW','NEF']},
  {n:'BRK Bereitschaft Eichenbühl (SEG)', type:'seg', addr:'Eichenbühl', lat:49.7060, lng:9.3290, veh:['KTW-B','GW-SAN','ELW-SEG'], est:true},
  {n:'Rettungswache Erlenbach', type:'rd', addr:'Erlenbach am Main', lat:49.8020, lng:9.1590, veh:['RTW','RTW','NEF','KdoW-LNA'], est:true},
  {n:'Rettungswache Aschaffenburg', type:'rd', addr:'Aschaffenburg', lat:49.9620, lng:9.1600, veh:['RTW','RTW','NEF','KdoW-LNA','KdoW-OrgL'], est:true},
  {n:'Rettungswache Würzburg', type:'rd', addr:'Würzburg', lat:49.8000, lng:9.9500, veh:['RTW','RTW','NEF','KdoW-LNA','KdoW-OrgL'], est:true},
  // Polizei
  {n:'Polizeiinspektion Großwallstadt', type:'pol', addr:'Hauptstraße 23, 63868 Großwallstadt', lat:49.8800, lng:9.1520, veh:['FuStW','FuStW','FuStW'], est:true},
  {n:'PI Aschaffenburg-Nilkheim', type:'pol', addr:'Lorbeerweg 1, 63741 Aschaffenburg', lat:49.9620, lng:9.1310, veh:['FuStW','FuStW','FuStW','DHuFüKw'], est:true},
  {n:'III. Bereitschaftspolizeiabteilung Würzburg', type:'bepo', addr:'Würzburg', lat:49.7800, lng:9.9600,
   veh:['FüKw','leBefKw','GruKw','GruKw','GruKw','GruKw','WaWe','SEK-MTF','MEK-MTF','DHuFüKw'], est:true},
  {n:'Polizeihubschrauber Würzburg', type:'phub', addr:'Würzburg', lat:49.7820, lng:9.9300, veh:['PolHub']},
  // THW
  {n:'THW OV Obernburg', type:'thw', addr:'Im Weidig 22, 63785 Obernburg am Main', lat:49.8420, lng:9.1480, veh:['MTW-TZ','GKW','GKW','MLW IV']},
  {n:'THW OV Miltenberg', type:'thw', addr:'Fährweg 43, 63897 Miltenberg', lat:49.7050, lng:9.2720, veh:['MTW-TZ','GKW'], est:true},
  {n:'THW OV Würzburg', type:'thw', addr:'Schweinfurter Straße 13, 97080 Würzburg', lat:49.8000, lng:9.9450, veh:['MTW-TZ','GKW','MzGW','BRmG R']},
];

// Schätzung der Ausstattung nach Fahrzeuganzahl (wenn nicht bekannt)
function estimateVehicles(cnt){
  if(cnt<=1) return ['TSF-W'];
  if(cnt===2) return ['TSF-W','MZF'];
  if(cnt===3) return ['LF 10','TSF-W','MZF'];
  if(cnt===4) return ['HLF 20','LF 10','MZF','MTW'];
  if(cnt<=6) return ['HLF 20','LF 20','TLF 3000','MZF','MTW','ELW 1'].slice(0,cnt);
  return ['ELW 1','HLF 20','LF 20','TLF 3000','DLK 23/12','RW 2','MZF','MTW','GW-L1','LF 10','MZB'].slice(0,cnt);
}

// ---------- Orte für Einsatzstellen (werden beim Start per OpenStreetMap genauer bestimmt) ----------
const PLACES = [
  ['Kirchzell',49.6174,9.1760],['Breitenbuch',49.6040,9.1520],['Ottorfszell',49.6060,9.2050],['Preunschen',49.5940,9.1980],['Watterbach',49.6260,9.1530],
  ['Amorbach',49.6442,9.2216],['Schneeberg',49.6407,9.2565],['Weilbach',49.6680,9.2180],['Miltenberg',49.7037,9.2640],['Bürgstadt',49.7139,9.2685],
  ['Kleinheubach',49.7215,9.2120],['Großheubach',49.7280,9.2260],['Laudenbach',49.7470,9.1820],['Eichenbühl',49.7055,9.3310],['Klingenberg am Main',49.7830,9.1810],
  ['Erlenbach am Main',49.8045,9.1615],['Wörth am Main',49.7970,9.1530],['Obernburg am Main',49.8395,9.1430],['Elsenfeld',49.8430,9.1650],['Collenberg',49.7690,9.3300],
  ['Dorfprozelten',49.7810,9.3790],['Stadtprozelten',49.7860,9.4100],['Faulbach',49.7860,9.4450],['Altenbuch',49.8270,9.4050],['Großwallstadt',49.8790,9.1530],
  ['Kleinwallstadt',49.8710,9.1680],['Niedernberg',49.9130,9.1370],['Mömlingen',49.8580,9.0830],['Sulzbach am Main',49.9120,9.1530],['Leidersbach',49.9000,9.2190],
  ['Eschau',49.8180,9.2580],['Mönchberg',49.7930,9.2700],['Neunkirchen (Unterfranken)',49.7270,9.3740],['Rüdenau',49.7280,9.1890],
];

// ---------- Einsätze ----------
// c: benötigte eigene Wachen (laut Wiki) {fw,rd,pol,thw,bepo,wr,ph}; r: benötigte Fahrzeuge {Rolle:Anzahl}
// cr: Credits im Schnitt; d: Dauer vor Ort (Minuten); p: Patienten [min,max]; nef: NEF-Wahrscheinlichkeit; g: Gefangene [min,max]
// esc: Ausweitung in Einsatz; st: bayerisches Stichwort
const M = [];
function m(n, st, c, r, cr, d, extra){ M.push(Object.assign({n, st, c, r, cr, d}, extra||{})); }
// Feuerwehr klein
m('Mülleimerbrand','B 1',{fw:1},{LF:1},150,10);
m('Containerbrand','B 1',{fw:1},{LF:1},170,15,{esc:'Zimmerbrand'});
m('Brennender PKW','B 2',{fw:1},{LF:1},250,20,{p:[0,1]});
m('Motorrad-Brand','B 1',{fw:1},{LF:1},150,15);
m('Brennendes Gras','B 1',{fw:1},{LF:1},150,15,{esc:'Kleiner Feldbrand'});
m('Brennendes Laub','B 1',{fw:1},{LF:1},120,10);
m('Sperrmüllbrand','B 1',{fw:1},{LF:1},150,15);
m('Strohballen Brand','B 2',{fw:1},{LF:1},300,30);
m('Traktor Brand','B 2',{fw:1},{LF:1},250,20);
m('Brennende Telefonzelle','B 1',{fw:1},{LF:1},150,10);
m('Baum auf Straße','THL 1',{fw:1},{LF:1},200,20);
m('Kleiner Waldbrand','B 2',{fw:1},{LF:2},400,30,{esc:'Großer Waldbrand'});
m('Brand in Briefkasten','B 1',{fw:1},{LF:1},100,10);
m('Brennendes Gebüsch','B 1',{fw:1},{LF:1},120,10);
m('Brennender Anhänger','B 1',{fw:1},{LF:1},180,15);
m('Auslaufende Betriebsstoffe','THL 1',{fw:1},{LF:1},200,20);
m('Kleintier in Not','THL 1',{fw:1},{LF:1},150,15);
m('Kleine Ölspur','THL 1',{fw:1},{LF:1},150,20);
m('Brandgeruch','B 1',{fw:1},{LF:1},100,10);
m('Ausgelöster Heimrauchmelder','B 2',{fw:1},{LF:1},150,10,{esc:'Zimmerbrand'});
m('Äste auf Fahrbahn','THL 1',{fw:1},{LF:1},120,15);
m('Baum auf Radweg','THL 1',{fw:1},{LF:1},120,15);
m('Umherfliegendes Baumaterial','THL 1',{fw:1},{LF:1},150,20);
m('Motorradunfall','THL 2',{fw:1,pol:1},{LF:1,FUSTW:1},400,30,{p:[1,1],nef:0.4});
m('Auffahrunfall','THL 1',{fw:1,pol:1},{LF:1,FUSTW:1},350,25,{p:[0,2]});
// Feuerwehr mittel
m('Zimmerbrand','B 3',{fw:2},{LF:2},450,30,{p:[0,1],esc:'Dachstuhlbrand'});
m('Küchenbrand','B 2',{fw:2},{LF:2},400,25,{p:[0,1]});
m('Gartenlaubenbrand','B 2',{fw:2},{LF:2},300,25);
m('Brennender LKW','B 3',{fw:2},{LF:2},500,35);
m('Kleiner Feldbrand','B 2',{fw:2},{LF:2},350,30,{esc:'Mittlerer Feldbrand'});
m('Wohnwagenbrand','B 2',{fw:2},{LF:2},350,25);
m('Feuer auf Balkon','B 2',{fw:2},{LF:2},300,20);
m('Person im Aufzug','THL 1',{fw:2},{LF:1},250,20);
m('Brennender Müllwagen','B 2',{fw:2},{LF:2},350,25);
m('Kellerbrand','B 3',{fw:3},{LF:2,DLK:1},700,40,{p:[0,1]});
m('Schornsteinbrand','B 2',{fw:3},{LF:1,DLK:1},500,40);
m('Dachstuhlbrand','B 4',{fw:3},{LF:3,DLK:1},900,60,{p:[0,2]});
m('Fettbrand in Pommesbude','B 3',{fw:3},{LF:2},500,30,{p:[0,1]});
m('Verkehrsunfall','THL 2',{fw:3},{LF:1,RW:1},600,40,{p:[1,2],nef:0.5});
m('Feuer in Schnellrestaurant','B 3',{fw:3},{LF:2,DLK:1},600,35);
m('Carportbrand','B 2',{fw:3},{LF:2},400,25);
m('Geplatzte Wasserleitung','THL 1',{fw:3},{LF:1},250,30);
m('Keller unter Wasser','THL 1',{fw:4},{LF:2},400,45);
m('Garagenbrand','B 3',{fw:4},{LF:2,DLK:1},600,35);
m('Brand im Supermarkt','B 4',{fw:4},{LF:3,DLK:1,RW:1},1200,60,{p:[0,2]});
m('Baum auf PKW','THL 2',{fw:4},{LF:1,RW:1},600,40,{p:[0,1]});
m('Tiefgarage unter Wasser','THL 2',{fw:4},{LF:3},700,60);
m('Saunabrand','B 3',{fw:4,pol:2},{LF:2,DLK:1,FUSTW:1},700,40);
m('Feuer in Einfamilienhaus','B 4',{fw:4},{LF:3,DLK:1,RW:1},1300,60,{p:[0,2],nef:0.3});
m('Gasgeruch','THL 2',{fw:4,rd:1,pol:1},{LF:2,RTW:1,FUSTW:1},800,40);
m('Maschinenbrand','B 3',{fw:5},{LF:2,GWA:1},800,45);
m('Dehnfugenbrand','B 3',{fw:5,pol:1},{LF:2,DLK:1,FUSTW:1},700,40);
m('LKW in Hauswand','THL 3',{fw:5,thw:1},{LF:2,RW:1,GKW:1},1500,90,{p:[0,1]});
m('Strohballen qualmen in Scheune','B 3',{fw:5},{LF:3,GWA:1},800,60);
m('Gasunfall in Werkstatt','THL 3',{fw:5,rd:1},{LF:2,GWA:1,RTW:1},1000,45,{p:[1,1]});
m('Große Ölspur','THL 2',{fw:6},{LF:2,GWOEL:1,ELW1:1},900,60);
m('Kaminbrand','B 2',{fw:6},{LF:1,DLK:1},500,40);
m('Mähdrescher Brand','B 3',{fw:6},{LF:3,TLF:1},900,45);
m('Aufgerissener Öltank','THL 3',{fw:6},{LF:2,GWOEL:1,ELW1:1},1100,60);
m('Baum auf Dach','THL 2',{fw:6},{LF:1,DLK:1,RW:1},800,60);
m('Kleinflugzeug abgestürzt','B 5',{fw:6,rd:3,pol:2},{LF:3,RW:1,ELW1:1,RTW:2,NEF:1,FUSTW:2},3000,90,{p:[1,3],nef:1});
m('Person in Baumaschine eingeklemmt','THL 3',{fw:6,rd:2},{LF:2,RW:1,RTW:1,NEF:1},1400,60,{p:[1,1],nef:1});
m('Mittlerer Feldbrand','B 3',{fw:7},{LF:4,TLF:1,ELW1:1},1300,60,{esc:'Großer Feldbrand'});
m('Brennende Lok','B 4',{fw:7,rd:1},{LF:3,TLF:1,ELW1:1,RTW:1},1600,60,{p:[0,1]});
m('Brennendes Reetdachhaus','B 5',{fw:7,rd:3,pol:2},{LF:4,DLK:1,ELW1:1,GWA:1,RTW:1,FUSTW:1},2200,90,{p:[0,2]});
m('Person hinter Tür','THL 1',{fw:7,rd:1,pol:1},{LF:1,RTW:1,FUSTW:1},500,20,{p:[1,1]});
m('Ausgedehnte Ölspur','THL 3',{fw:8,pol:2},{LF:3,GWOEL:1,ELW1:1,FUSTW:2},1500,90);
m('LKW umgestürzt','THL 3',{fw:8},{LF:2,RW:1,GWOEL:1,ELW1:1},1700,90,{p:[0,1]});
m('Brennender Bus','B 5',{fw:8,rd:6,pol:2},{LF:4,TLF:1,ELW1:1,RTW:3,NEF:1,FUSTW:2},3500,90,{p:[2,6],nef:1});
m('Großer Waldbrand','B 5',{fw:8},{LF:6,TLF:2,SW:1,ELW1:1},3000,120,{esc:'Großfeuer im Wald'});
m('Baum auf Gleisen','THL 3',{fw:8,pol:3},{LF:2,RW:1,ELW1:1,FUSTW:2},1500,60);
m('Straße unter Wasser','THL 2',{fw:9},{LF:4,ELW1:1},1400,90);
m('Verkehrsunfall mit Zug','THL 4',{fw:9,rd:4,pol:4},{LF:3,RW:2,ELW1:1,RTW:3,NEF:2,FUSTW:3},4500,120,{p:[2,5],nef:1});
m('Baumaschine umgestürzt','THL 3',{fw:10,pol:3},{LF:2,RW:1,FWK:1,ELW1:1,FUSTW:1},2500,120);
m('Großer Feldbrand','B 5',{fw:10},{LF:7,TLF:2,SW:1,ELW1:1},3500,120);
m('Tiefgaragenbrand','B 5',{fw:10,rd:3,pol:3},{LF:5,GWA:1,ELW1:1,RTW:2,FUSTW:2},3500,120,{p:[0,3]});
m('Bürobrand (Groß)','B 5',{fw:10,rd:6,pol:3},{LF:6,DLK:2,GWA:1,ELW1:1,RTW:3,NEF:1,FUSTW:2},5000,120,{p:[1,4],nef:0.7});
m('Gefahrgut-LKW verunglückt','ABC 2',{fw:11,rd:1,pol:2},{LF:3,RW:1,GWG:1,GWMESS:1,ELW1:1,RTW:1,FUSTW:2},4500,150,{p:[0,1]});
m('LKW Auffahrunfall','THL 3',{fw:11,pol:2},{LF:3,RW:2,ELW1:1,FUSTW:2},2500,90,{p:[1,3],nef:0.5});
m('Tankstellenbrand','B 5',{fw:11},{LF:5,TLF:2,GWA:1,ELW1:1},4000,120);
m('Verletzte Person auf Baugerüst','THL 3',{fw:12,rd:1},{LF:1,DLK:1,GWH:1,RTW:1,NEF:1},1800,60,{p:[1,1],nef:1});
m('Abgestürzter Kletterer','THL 3',{fw:12,rd:1,pol:1},{LF:1,GWH:1,RTW:1,NEF:1,FUSTW:1},2000,90,{p:[1,1],nef:1});
m('Fassadenteile drohen zu fallen','THL 2',{fw:12,pol:2},{LF:1,DLK:1,GWH:1,FUSTW:1},1500,90);
m('Beschädigter Kesselwagen','ABC 3',{fw:12,pol:3,thw:1},{LF:3,GWG:1,GWMESS:1,ELW1:1,FUSTW:2,GKW:1},5000,180);
m('Brand in Werkstatt','B 4',{fw:12},{LF:4,DLK:1,GWA:1,ELW1:1},2500,90);
m('Leck in Chemikalientank','ABC 3',{fw:13,rd:4,pol:1},{LF:4,GWG:1,GWMESS:1,ELW2:1,RTW:2,FUSTW:1},6000,180,{p:[0,3]});
m('Sporthallenbrand','B 5',{fw:13},{LF:6,DLK:1,GWA:1,ELW2:1},4500,120);
m('Unbekannte Substanz','ABC 3',{fw:14,rd:7,pol:5},{LF:4,GWG:1,GWMESS:1,DEKON:1,ELW2:1,RTW:3,NEF:1,FUSTW:3},8000,180,{p:[1,5],nef:1});
m('Chemieunfall an Schule','ABC 4',{fw:15,rd:7,pol:5},{LF:5,GWG:1,GWMESS:1,DEKON:1,ELW2:1,RTW:4,NEF:2,LNA:1,FUSTW:3},10000,180,{p:[3,10],nef:1});
m('Brand in Mehrfamilienhaus','B 6',{fw:15,rd:5,pol:3},{LF:6,DLK:2,GWA:1,ELW2:1,RTW:3,NEF:1,FUSTW:2},7000,150,{p:[2,6],nef:1});
m('Parkdeck voll Wasser gelaufen','THL 3',{fw:15,pol:4},{LF:6,ELW2:1,FUSTW:2},4000,150);
m('Lagerhallenbrand','B 7',{fw:18,rd:9,pol:9,thw:3},{LF:10,DLK:2,TLF:2,SW:2,GWA:2,ELW2:1,RTW:3,NEF:1,FUSTW:4,GKW:2,MTWTZ:1},15000,240,{p:[0,4]});
m('Großfeuer im Wald','B 7',{fw:20,pol:5},{LF:12,TLF:4,SW:2,GWL:1,ELW2:1,FUSTW:3},15000,300);
m('Gasexplosion','B 7',{fw:25,rd:9,pol:5},{LF:8,RW:2,DLK:2,GWA:1,ELW2:1,RTW:6,NEF:3,LNA:1,FUSTW:4},20000,240,{p:[4,12],nef:1});
m('Feuer auf Bauernhof - Mittel','B 5',{fw:9,rd:3,pol:2},{LF:5,TLF:1,DLK:1,ELW1:1,RTW:1,FUSTW:1},4000,120,{p:[0,2]});
m('Scheunenbrand','B 5',{fw:7},{LF:5,TLF:1,ELW1:1},3000,120);
// Rettungsdienst
m('Gestürzte Person','RD 1',{rd:1},{RTW:1},0,15,{p:[1,1]});
m('Gestürzter Fußgänger','RD 1',{rd:1},{RTW:1},0,15,{p:[1,1]});
m('Gestürzter Radfahrer','RD 1',{rd:1},{RTW:1},0,15,{p:[1,1]});
m('Alkoholintoxikation','RD 1',{rd:1},{RTW:1},0,15,{p:[1,1]});
m('Nasenbluten unstillbar','RD 1',{rd:1},{RTW:1},0,15,{p:[1,1]});
m('Kopfplatzwunde','RD 1',{rd:1},{RTW:1},0,15,{p:[1,1]});
m('Arbeitsunfall im Garten','RD 1',{rd:1},{RTW:1},0,15,{p:[1,1],nef:0.2});
m('Herzinfarkt','RD 2',{rd:3},{RTW:1,NEF:1},0,20,{p:[1,1],nef:1,dept:'Kardiologie'});
m('Akuter Asthma-Anfall','RD 2',{rd:3},{RTW:1},0,20,{p:[1,1],nef:0.5,dept:'Innere'});
m('Krampfanfall','RD 2',{rd:3},{RTW:1},0,20,{p:[1,1],nef:0.5,dept:'Neurologie'});
m('Fieber','RD 1',{rd:3},{RTW:1},0,15,{p:[1,1],dept:'Innere'});
m('Schlaganfall','RD 2',{rd:3},{RTW:1,NEF:1},0,20,{p:[1,1],nef:1,dept:'Neurologie'});
m('Unterzuckerung','RD 2',{rd:3},{RTW:1},0,15,{p:[1,1],nef:0.4,dept:'Innere'});
m('Akute Bauchschmerzen','RD 1',{rd:3},{RTW:1},0,15,{p:[1,1],dept:'Chirurgie'});
m('Bluthochdruck','RD 1',{rd:3},{RTW:1},0,15,{p:[1,1],dept:'Innere'});
m('Angefahrene Person','RD 2',{rd:3,pol:1},{RTW:1,NEF:1,FUSTW:1},300,20,{p:[1,1],nef:1,dept:'Unfallchirurgie'});
m('Bewusstlose Person','RD 2',{rd:4},{RTW:1,NEF:1},0,20,{p:[1,1],nef:1,dept:'Innere'});
m('Unfall mit Motorsäge','RD 2',{rd:4},{RTW:1,NEF:1},0,20,{p:[1,1],nef:1,dept:'Unfallchirurgie'});
m('Grillunfall','RD 2',{rd:4},{RTW:1,NEF:1},0,20,{p:[1,1],nef:0.8,dept:'Brandverletzte'});
m('Gehirnerschütterung','RD 1',{rd:5},{RTW:1},0,15,{p:[1,1],dept:'Neurologie'});
m('Schwangere in Notsituation','RD 2',{rd:5},{RTW:1,NEF:1},0,20,{p:[1,1],nef:1,dept:'Gynäkologie'});
m('Beginnende Geburt','RD 1',{rd:5},{RTW:1},0,20,{p:[1,1],nef:0.3,dept:'Gynäkologie'});
m('Herzrhythmusstörungen','RD 2',{rd:7},{RTW:1,NEF:1},0,20,{p:[1,1],nef:1,dept:'Kardiologie'});
m('Akuter Harnstau','RD 1',{rd:7},{RTW:1},0,15,{p:[1,1],dept:'Urologie'});
m('Schädelverletzung','RD 2',{rd:9},{RTW:1,NEF:1},0,25,{p:[1,1],nef:1,dept:'Neurochirurgie'});
m('Wirbelsäulenverletzung','RD 2',{rd:9},{RTW:1,NEF:1},0,25,{p:[1,1],nef:1,dept:'Unfallchirurgie'});
m('Sturz aus Höhe','RD 2',{rd:9},{RTW:1,NEF:1},0,25,{p:[1,1],nef:1,dept:'Unfallchirurgie'});
m('Stromschlag','RD 2',{rd:9},{RTW:1,NEF:1},0,20,{p:[1,1],nef:1,dept:'Kardiologie'});
// Polizei
m('Ladendiebstahl','',{pol:1},{FUSTW:1},250,20,{g:[0,1]});
m('Parkendes Auto gerammt','',{pol:1},{FUSTW:1},200,20);
m('Taschendiebstahl','',{pol:1},{FUSTW:1},200,20,{g:[0,1]});
m('Einbruch in Keller','',{pol:1},{FUSTW:1},300,30,{g:[0,1]});
m('Einbruch in Wohnung','',{pol:1},{FUSTW:1},350,30,{g:[0,1]});
m('Sachbeschädigung','',{pol:1},{FUSTW:1},200,20,{g:[0,1]});
m('Ruhestörung','',{pol:1},{FUSTW:1},150,15);
m('Trunkenheitsfahrt','',{pol:1},{FUSTW:1},300,25,{g:[0,1]});
m('Ampelausfall','',{pol:1},{FUSTW:1},200,45);
m('Pannenfahrzeug','',{pol:1},{FUSTW:1},150,20);
m('Hausfriedensbruch','',{pol:1},{FUSTW:1},250,20,{g:[0,1]});
m('Verkehrsbehinderung','',{pol:1},{FUSTW:1},150,20);
m('Diebstahl aus Kfz','',{pol:1},{FUSTW:1},200,20,{g:[0,1]});
m('Fahrraddiebstahl','',{pol:1},{FUSTW:1},150,15);
m('Wildunfall','',{pol:1},{FUSTW:1},150,20);
m('Randalierende Person','',{pol:2},{FUSTW:2},400,25,{g:[1,1]});
m('Häusliche Gewalt','',{pol:2},{FUSTW:2},500,30,{g:[0,1],p:[0,1]});
m('Tiere auf der Fahrbahn','',{pol:2},{FUSTW:1},200,25);
m('Tankbetrug','',{pol:2},{FUSTW:1},250,20,{g:[0,1]});
m('Bank: Stiller Alarm','',{pol:2},{FUSTW:3},800,30,{g:[0,2]});
m('Schlägerei','',{pol:3},{FUSTW:3},700,30,{p:[1,3],g:[0,2],esc:'Massenschlägerei'});
m('Raub','',{pol:3},{FUSTW:3},800,40,{g:[0,1]});
m('Personenkontrolle','',{pol:3},{FUSTW:2},400,30,{g:[0,1]});
m('Waffenentzug','',{pol:3},{FUSTW:3},900,40,{g:[0,1]});
m('Häusliche Gewalt - eskaliert','',{pol:4},{FUSTW:4},1200,45,{p:[0,2],g:[1,1]});
m('Massenschlägerei','',{pol:6},{FUSTW:6},2000,60,{p:[2,6],g:[2,6]});
m('Tankstellenüberfall','',{pol:6},{FUSTW:5},2000,60,{g:[1,2]});
m('Entflohener Gefangener','',{pol:7,ph:1},{FUSTW:5,PHUB:1},3000,90,{g:[1,1]});
m('Kabeldiebstahl','',{pol:2,ph:1},{FUSTW:2,PHUB:1},1500,60,{g:[0,2]});
m('Suche nach Vermissten','',{fw:1,rd:1,pol:2,ph:1},{LF:1,RTW:1,FUSTW:2,PHUB:1},2000,120,{p:[0,1]});
m('Banküberfall','',{rd:1,pol:8,ph:1},{FUSTW:6,RTW:1,PHUB:1},5000,90,{g:[1,3]});
// BePo / THW / Wasser
m('Schwerpunkteinsatz Verkehrsüberwachung','',{bepo:1},{GRUKW:2,LEBEFKW:1},2500,120);
m('Präsenzeinsatz Volksfest','',{bepo:1},{GRUKW:2,LEBEFKW:1},2500,180);
m('Geplante Razzia','',{pol:1,bepo:1},{FUSTW:2,GRUKW:2,LEBEFKW:1,SEK:1},4000,120,{g:[1,4]});
m('Jugendschutzkontrolle in Diskothek','',{pol:1,bepo:1},{FUSTW:2,GRUKW:1},2000,120,{g:[0,2]});
m('Spontaner Aufstand','',{pol:5,bepo:1,ph:1},{FUSTW:4,GRUKW:3,LEBEFKW:1,FUEKW:1,WAWE:1,PHUB:1},9000,180,{g:[2,8],p:[1,4]});
m('Erdrutsch','THL 3',{pol:2,thw:1},{GKW:1,MTWTZ:1,FUSTW:1},2500,180);
m('Eingestürztes Wohnhaus','THL 4',{fw:7,rd:1,pol:2,thw:1},{LF:3,RW:1,ELW1:1,RTW:2,NEF:1,FUSTW:2,GKW:2,MTWTZ:1},8000,240,{p:[1,4],nef:1});
m('Explosion in Biogasanlage','B 6',{fw:25,rd:5,pol:5,thw:3},{LF:8,TLF:2,GWA:1,GWMESS:1,ELW2:1,RTW:3,NEF:1,FUSTW:3,GKW:2,MTWTZ:1},16000,240,{p:[1,4],nef:1});
m('Person in Wasser','W 2',{wr:1},{GWWR:1,MZB:1},1200,45,{p:[1,1],nef:0.5});
m('Pkw in Wasser','W 3',{fw:4,rd:1,pol:2,wr:2},{LF:2,MZB:1,GWWR:1,GWTAU:1,RTW:1,FUSTW:1},3500,90,{p:[1,2],nef:1});
m('Tauchunfall','W 2',{rd:1,wr:1},{GWTAU:1,RTW:1,NEF:1},1500,60,{p:[1,1],nef:1});
m('Gewässerverschmutzung durch Öl','THL 3',{fw:3,pol:1,wr:1},{LF:2,MZB:1,GWOEL:1,FUSTW:1},2000,120);

// ---------- Großschadenslagen (statt Verbandseinsätze, selten oder per Knopf) ----------
const GSL = [
  {n:'Großbrand', st:'B 8', r:{LF:16,DLK:3,TLF:4,SW:3,GWA:2,GWL:2,ELW2:2,ELW1:3,RTW:6,NEF:2,LNA:1,ORGL:1,FUSTW:6,GKW:2,MTWTZ:1}, cr:60000, d:360, p:[3,10]},
  {n:'Massenkarambolage', st:'THL 5', r:{LF:8,RW:4,ELW2:1,ELW1:2,GWOEL:1,RTW:10,NEF:4,LNA:1,ORGL:1,KTW:4,FUSTW:8,GKW:2}, cr:50000, d:300, p:[8,20]},
  {n:'Gefahrgutunfall', st:'ABC 4', r:{LF:6,GWG:2,GWMESS:2,DEKON:1,ELW2:1,RTW:4,NEF:2,LNA:1,FUSTW:4}, cr:40000, d:300, p:[2,8]},
  {n:'Gefahrgutunfall Groß', st:'ABC 5', r:{LF:12,GWG:3,GWMESS:3,DEKON:2,ELW2:2,RTW:8,NEF:3,LNA:1,ORGL:1,FUSTW:8,GRUKW:2,GKW:2}, cr:80000, d:420, p:[5,15]},
  {n:'Unangemeldete Demonstration', st:'', r:{FUSTW:10,GRUKW:6,LEBEFKW:2,FUEKW:1,WAWE:2,DHU:2,PHUB:1,RTW:2}, cr:40000, d:300, g:[5,20], p:[0,5]},
  {n:'Flugzeug abgestürzt', st:'B 8', r:{LF:14,TLF:4,RW:3,DLK:2,ELW2:2,GWA:2,RTW:12,NEF:5,LNA:1,ORGL:1,KTW:6,GWSAN:2,FUSTW:10,GKW:3,MTWTZ:1,PHUB:1}, cr:120000, d:480, p:[10,30]},
  {n:'Zugunglück (Klein)', st:'THL 5', r:{LF:8,RW:3,ELW2:1,ELW1:2,RTW:8,NEF:3,LNA:1,ORGL:1,FUSTW:6,GKW:2,MTWTZ:1}, cr:60000, d:360, p:[5,15]},
  {n:'Zugunglück (Groß)', st:'THL 6', r:{LF:16,RW:5,FWK:1,ELW2:2,ELW1:3,RTW:15,NEF:6,LNA:2,ORGL:1,KTW:8,GWSAN:3,FUSTW:12,GKW:4,MTWTZ:2,THWR:1}, cr:150000, d:600, p:[15,40]},
  {n:'Zusammenstoß zweier Boote', st:'W 4', r:{MZB:4,GWWR:2,GWTAU:2,LF:4,RTW:4,NEF:2,LNA:1,FUSTW:3}, cr:50000, d:300, p:[3,10]},
];
const RD_CREDITS_PER_PATIENT = 250; // Transport ins passende Krankenhaus
