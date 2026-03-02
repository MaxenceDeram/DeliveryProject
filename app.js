/* ════════════════════════════════════════
   SafeHome — app.js  v3
   ════════════════════════════════════════ */

/* ══ TAB NAVIGATION ══ */
function switchTab(name) {
  document.querySelectorAll('.nav-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.tab === name);
  });
  document.querySelectorAll('.tab-content').forEach(t => {
    t.classList.toggle('active', t.id === 'tab-' + name);
  });
  if (name === 'history') initHistory();
}

document.querySelectorAll('.nav-pill').forEach(pill => {
  pill.addEventListener('click', function () {
    switchTab(this.dataset.tab);
  });
});

/* ══ DARK MODE ══ */
let darkMode = false;

function toggleDark() {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');

  // Sync nav icon
  const btn = document.getElementById('darkToggle');
  if (btn) btn.textContent = darkMode ? '☀️' : '🌙';

  // Sync settings toggle
  const st = document.getElementById('dark-toggle-settings');
  if (st) st.classList.toggle('on', darkMode);
}

document.getElementById('darkToggle').addEventListener('click', toggleDark);

/* ══ SVG CHART HELPER ══ */
function drawChart(svgId, areaId, lineId, data, W, H, pad) {
  const mn = Math.min(...data) - pad;
  const mx = Math.max(...data) + pad;
  const pts = data.map((v, i) => {
    const x = ((i / (data.length - 1)) * W).toFixed(1);
    const y = (H - ((v - mn) / (mx - mn)) * (H - 22) - 11).toFixed(1);
    return x + ',' + y;
  });
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p).join(' ');
  document.getElementById(areaId).setAttribute('d', d + ` L${W},${H} L0,${H} Z`);
  document.getElementById(lineId).setAttribute('d', d);
}

/* ══ DASHBOARD CHART ══ */
const dashData = {
  '24h': {
    values: [620,590,560,580,610,680,820,920,980,1050,1100,1200,1150,1180,1200,1120,1000,920,880,860,900,980,1050,1200],
    labels: ['00h','02h','04h','06h','08h','10h','12h','14h','16h','18h','20h','22h','00h']
  },
  '7j': {
    values: [700,750,680,820,900,880,1000,940,850,780,720,680,640,600,620,700,780,880,950,1000,1050,1100,1200,1150],
    labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
  },
  '30j': {
    values: Array.from({length:30},(_,i)=>680+Math.sin(i/3.5)*180+Math.sin(i/1.2)*40+i*6),
    labels: ['S1','S2','S3','S4']
  }
};

function renderDashChart(key) {
  const d = dashData[key];
  drawChart('svg-dash', 'area-dash', 'line-dash', d.values, 800, 130, 40);
  const ax = document.getElementById('xaxis-dash');
  if (ax) ax.innerHTML = d.labels.map(l => `<span>${l}</span>`).join('');
}
renderDashChart('24h');

function setDashTab(btn, key) {
  document.querySelectorAll('#tab-dashboard .time-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderDashChart(key);
}

/* ══ HISTORY ══ */
const histMetrics = {
  co2: {
    name: 'CO₂', unit: 'ppm', thresh: 1000, threshLabel: 'OMS 1000 ppm',
    '7j':  { values: [820,760,930,1050,880,740,1200], labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'] },
    '30j': { values: Array.from({length:20},(_,i)=>700+Math.sin(i/2.5)*200+Math.random()*80), labels: ['S1','S2','S3','S4'] },
    '3m':  { values: Array.from({length:12},(_,i)=>750+Math.sin(i/2)*150+Math.random()*100), labels: ['Jan','Fév','Mar'] }
  },
  pm25: {
    name: 'PM2.5', unit: 'µg/m³', thresh: 5, threshLabel: 'OMS 5 µg/m³',
    '7j':  { values: [3.2,4.1,5.8,7.2,5.1,3.8,10.8], labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'] },
    '30j': { values: Array.from({length:20},(_,i)=>3+Math.sin(i/2)*3+Math.random()*2), labels: ['S1','S2','S3','S4'] },
    '3m':  { values: Array.from({length:12},(_,i)=>4+Math.sin(i/2)*2.5+Math.random()), labels: ['Jan','Fév','Mar'] }
  },
  humidity: {
    name: 'Humidité', unit: '%', thresh: 65, threshLabel: 'Seuil 65%',
    '7j':  { values: [52,55,58,61,63,60,63], labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'] },
    '30j': { values: Array.from({length:20},(_,i)=>50+Math.sin(i/3)*10+Math.random()*5), labels: ['S1','S2','S3','S4'] },
    '3m':  { values: Array.from({length:12},(_,i)=>53+Math.sin(i/2)*7+Math.random()*3), labels: ['Jan','Fév','Mar'] }
  },
  temp: {
    name: 'Température', unit: '°C', thresh: 25, threshLabel: 'Seuil 25°C',
    '7j':  { values: [22,22.5,23,24,24.5,23.8,24.5], labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'] },
    '30j': { values: Array.from({length:20},(_,i)=>21+Math.sin(i/3)*2+Math.random()), labels: ['S1','S2','S3','S4'] },
    '3m':  { values: Array.from({length:12},(_,i)=>20+Math.sin(i/2)*3+Math.random()), labels: ['Jan','Fév','Mar'] }
  }
};

let currentMetric = 'co2';
let currentPeriod = '7j';

function initHistory() {
  renderHistChart();
  renderJournal();
}

function renderHistChart() {
  const m = histMetrics[currentMetric];
  const pd = m[currentPeriod];

  // Update gradient color (always blue)
  const stop0 = document.querySelector('#grad-hist stop:first-child');
  const stop1 = document.querySelector('#grad-hist stop:last-child');
  if (stop0) { stop0.setAttribute('stop-color', '#2563eb'); }
  if (stop1) { stop1.setAttribute('stop-color', '#2563eb'); }
  document.getElementById('line-hist').style.stroke = '#2563eb';

  drawChart('svg-hist', 'area-hist', 'line-hist', pd.values, 800, 130, m.unit === 'ppm' ? 50 : 1);

  // Threshold line position
  const mn = Math.min(...pd.values) - (m.unit === 'ppm' ? 50 : 1);
  const mx = Math.max(...pd.values) + (m.unit === 'ppm' ? 50 : 1);
  const H = 130;
  const yThresh = H - ((m.thresh - mn) / (mx - mn)) * (H - 22) - 11;
  const tl = document.getElementById('hist-thresh-line');
  const tlbl = document.getElementById('hist-thresh-label');
  if (tl) tl.setAttribute('y1', yThresh), tl.setAttribute('y2', yThresh);
  if (tlbl) { tlbl.setAttribute('y', yThresh - 5); tlbl.textContent = m.threshLabel; }

  // X axis
  const ax = document.getElementById('xaxis-hist');
  if (ax) ax.innerHTML = pd.labels.map(l => `<span>${l}</span>`).join('');

  // Stats
  const vals = pd.values;
  const avg = (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
  const max = Math.max(...vals).toFixed(1);
  const min = Math.min(...vals).toFixed(1);
  const over = vals.filter(v => v > m.thresh).length;

  document.getElementById('s-avg').innerHTML   = avg  + ' <small class="stat-unit">' + m.unit + '</small>';
  document.getElementById('s-max').innerHTML   = max  + ' <small class="stat-unit">' + m.unit + '</small>';
  document.getElementById('s-min').innerHTML   = min  + ' <small class="stat-unit">' + m.unit + '</small>';
  document.getElementById('s-thresh').innerHTML = over + ' <small class="stat-unit">fois</small>';

  // Chart title
  const pLabel = currentPeriod === '7j' ? '7 derniers jours' : currentPeriod === '30j' ? '30 jours' : '3 mois';
  document.getElementById('hist-chart-title').textContent = m.name + ' — ' + pLabel;
}

function setHistPeriod(btn, period) {
  document.querySelectorAll('#tab-history .time-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentPeriod = period;
  renderHistChart();
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentMetric = this.dataset.metric;
    renderHistChart();
  });
});

/* ══ JOURNAL ══ */
const journalEntries = [
  { time:'14:32', room:'💻 Bureau',   co2:1200, pm25:10.8, hum:63, temp:24.5, st:'st-bad' },
  { time:'13:50', room:'🛋️ Salon',    co2:850,  pm25:5.5,  hum:55, temp:22.0, st:'st-medium' },
  { time:'13:20', room:'🛏️ Chambre',  co2:510,  pm25:3.5,  hum:52, temp:21.5, st:'st-good' },
  { time:'12:45', room:'💻 Bureau',   co2:1100, pm25:9.2,  hum:61, temp:24.2, st:'st-bad' },
  { time:'12:00', room:'🛋️ Salon',    co2:780,  pm25:4.8,  hum:57, temp:22.0, st:'st-good' },
  { time:'11:30', room:'🛏️ Chambre',  co2:490,  pm25:2.9,  hum:50, temp:21.0, st:'st-good' },
  { time:'11:00', room:'💻 Bureau',   co2:920,  pm25:7.4,  hum:60, temp:23.8, st:'st-medium' },
  { time:'10:30', room:'🛋️ Salon',    co2:720,  pm25:4.2,  hum:54, temp:21.5, st:'st-good' },
  { time:'10:00', room:'🛏️ Chambre',  co2:480,  pm25:2.6,  hum:51, temp:20.8, st:'st-good' },
];
const stLbls = { 'st-good':'Bon', 'st-medium':'Moyen', 'st-bad':'Mauvais' };

function renderJournal() {
  const el = document.getElementById('journal-body');
  if (!el) return;
  el.innerHTML = journalEntries.map(e => `
    <div class="journal-row">
      <span>${e.time}</span>
      <span>${e.room}</span>
      <span>${e.co2} ppm</span>
      <span>${e.pm25} µg/m³</span>
      <span>${e.hum}%</span>
      <span>${e.temp}°C</span>
      <span><span class="j-badge ${e.st}">${stLbls[e.st]}</span></span>
    </div>`).join('');
}

/* ══ ALERTS ══ */
function dismissAlert(btn) {
  const row = btn.closest('.alert-row');
  row.classList.remove('is-active');
  const badge = row.querySelector('.row-status');
  badge.className = 'row-status ignored';
  badge.textContent = 'Ignorée';
  btn.remove();

  // Update counts
  const active = document.querySelectorAll('.alert-row.is-active').length;
  const countBadge = document.getElementById('alert-count-badge');
  const activeLabel = document.getElementById('active-count-label');
  if (countBadge) {
    countBadge.textContent = active;
    countBadge.style.display = active === 0 ? 'none' : '';
  }
  if (activeLabel) activeLabel.textContent = active + ' active';
}

/* ══ MODAL DATA ══ */
const modalContent = {
  co2: {
    icon:'💨', title:'CO₂ — Dioxyde de carbone',
    body:'Le CO₂ est naturellement présent dans l\'air (environ 400 ppm en extérieur). Dans un espace fermé, il s\'accumule avec la respiration. Un taux élevé provoque fatigue, maux de tête et baisse de concentration.',
    info:'<strong>Valeur actuelle :</strong> <span class="hi">1200 ppm</span> · Seuil OMS : &lt; 1000 ppm<br>→ Ouvrez les fenêtres 10–15 min pour aérer'
  },
  pm25: {
    icon:'🌫️', title:'PM2.5 — Particules fines',
    body:'Les PM2.5 sont des microparticules (diamètre < 2,5 µm) qui pénètrent profondément dans les poumons. Elles proviennent de la combustion, cuisson, fumée de tabac ou pollution extérieure.',
    info:'<strong>Valeur actuelle :</strong> <span class="hi">10.8 µg/m³</span> · Recommandation OMS : ≤ 5 µg/m³<br>→ Activez la hotte aspirante lors de la cuisson'
  },
  humidity: {
    icon:'💧', title:'Humidité relative',
    body:'L\'humidité idéale en intérieur est de 40 % à 60 %. Un taux trop élevé favorise les moisissures et les acariens, deux déclencheurs d\'allergies. Un taux trop bas irrite les voies respiratoires.',
    info:'<strong>Valeur actuelle :</strong> <span class="hi">63 %</span> · Plage idéale OMS : 40–60 %<br>→ Ventilez ou utilisez un déshumidificateur'
  },
  temp: {
    icon:'🌡️', title:'Température intérieure',
    body:'La température de confort se situe entre 19°C et 23°C. Des températures élevées favorisent la prolifération bactérienne et peuvent aggraver les problèmes respiratoires.',
    info:'<strong>Valeur actuelle :</strong> <span class="hi">24.5 °C</span> · Recommandé : 19–23 °C<br>→ Dans les limites acceptables'
  },
  chambre: {
    icon:'🛏️', title:'Chambre — Excellent',
    body:'La chambre présente une qualité de l\'air excellente sur tous les paramètres. CO₂, PM2.5 et humidité sont bien en dessous des seuils OMS.',
    info:'<strong>CO₂ :</strong> 510 ppm ✓ · <strong>PM2.5 :</strong> 3.5 µg/m³ ✓ · <strong>Humidité :</strong> 52% ✓<br><span class="hi">Aucune action requise</span>'
  },
  bureau: {
    icon:'💻', title:'Bureau — Action requise',
    body:'Le bureau présente une qualité de l\'air dégradée, notamment à cause d\'un CO₂ élevé lié à une présence prolongée dans une pièce peu ventilée.',
    info:'<strong>CO₂ :</strong> <span class="hi">1200 ppm ⚠</span> · <strong>PM2.5 :</strong> <span class="hi">10.8 µg/m³ ⚠</span><br>→ Ouvrez les fenêtres maintenant'
  },
  salon: {
    icon:'🛋️', title:'Salon — Moyen',
    body:'Le salon affiche une qualité de l\'air correcte mais le CO₂ se rapproche du seuil de vigilance. Une aération préventive est recommandée.',
    info:'<strong>CO₂ :</strong> <span class="hi">850 ppm ~</span> · <strong>PM2.5 :</strong> <span class="hi">5.5 µg/m³ ~</span><br>→ Aération préventive recommandée'
  },
  'bureau-alert': {
    icon:'🚨', title:'Alerte CO₂ — Bureau',
    body:'Le taux de CO₂ dans le bureau dépasse le seuil OMS. Une action immédiate est recommandée pour améliorer la qualité de l\'air.',
    info:'→ <strong>Ouvrez les fenêtres</strong> pendant 10 à 15 minutes<br>→ Activez la ventilation si disponible<br>→ Réduisez le nombre de personnes dans la pièce<br><br><span class="hi">Objectif : descendre sous 1000 ppm</span>'
  }
};

function openModal(type) {
  const d = modalContent[type];
  if (!d) return;
  document.getElementById('m-icon').textContent  = d.icon;
  document.getElementById('m-title').textContent = d.title;
  document.getElementById('m-body').textContent  = d.body;
  document.getElementById('m-info').innerHTML    = d.info;
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

function closeModalOverlay(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
