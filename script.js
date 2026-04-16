/* ── script.js — Parliamentary Discourse Dashboard ──────────────── */

// ── Plotly shared theme ──────────────────────────────────────────
const THEME = {
  bg        : 'rgba(0,0,0,0)',
  paper     : 'rgba(0,0,0,0)',
  gridcolor : 'rgba(255,255,255,0.06)',
  textcolor : '#8b9ccc',
  font      : 'DM Sans, sans-serif',
  ruling    : '#e8a048',
  opp       : '#4fc3f7',
  accent    : '#c084fc',
  rulingArr : ['#e8a048','#e89048','#e8b048','#d07830','#f0b058'],
  oppArr    : ['#4fc3f7','#29b6f6','#81d4fa','#0288d1','#40c4ff'],
};

const PLOTLY_LAYOUT_BASE = {
  paper_bgcolor : THEME.paper,
  plot_bgcolor  : THEME.bg,
  font          : { family: THEME.font, color: THEME.textcolor, size: 12 },
  margin        : { t: 20, b: 60, l: 50, r: 20 },
  hoverlabel    : {
    bgcolor  : '#1a2035',
    bordercolor: 'rgba(255,255,255,0.15)',
    font     : { family: THEME.font, color: '#e8ecf4' }
  },
  xaxis: { gridcolor: THEME.gridcolor, zerolinecolor: THEME.gridcolor },
  yaxis: { gridcolor: THEME.gridcolor, zerolinecolor: THEME.gridcolor },
};

const PLOTLY_CONFIG = {
  responsive     : true,
  displayModeBar : true,
  modeBarButtonsToRemove: ['select2d','lasso2d','autoScale2d'],
  displaylogo    : false,
};

// ── Fallback data (used if JSON files not found) ─────────────────
const FALLBACK = {
  ruling: {
    leader : 'Smriti Irani',
    house  : 'Lok Sabha',
    role   : 'Ruling Party',
    profile: { 'Topic 1':0.854, 'Topic 2':0.018, 'Topic 3':0.002, 'Topic 4':0.013, 'Topic 5':0.113 },
    topics : {
      'Topic 1': { words:['women','poshan','child','development','anganwadi','children','union','smt','centre','prime','mission','scheme'], scores:[0.9,0.85,0.82,0.78,0.75,0.72,0.68,0.65,0.6,0.58,0.55,0.5] },
      'Topic 5': { words:['bill','community','today','years','minutes','bengal','lok','know','bring','want'], scores:[0.7,0.65,0.6,0.55,0.5,0.45,0.4,0.38,0.35,0.32] }
    },
    dominant_topic: 'Topic 1'
  },
  opposition: {
    leader : "Derek O'Brien",
    house  : 'Rajya Sabha',
    role   : 'Opposition',
    profile: { 'Topic 1':0.051, 'Topic 2':0.139, 'Topic 3':0.321, 'Topic 4':0.211, 'Topic 5':0.278 },
    topics : {
      'Topic 2': { words:['election','data','manifesto','commission','debate','elections','want','political','point','solution'], scores:[0.9,0.82,0.78,0.75,0.72,0.68,0.62,0.6,0.55,0.5] },
      'Topic 3': { words:['farmers','bill','states','committee','bills','four','today','bengal','back','give'], scores:[0.88,0.82,0.78,0.74,0.7,0.65,0.6,0.55,0.52,0.48] },
      'Topic 4': { words:['cess','opposition','bjp','cent','per','last','dont','address','point','page'], scores:[0.85,0.8,0.75,0.72,0.68,0.62,0.58,0.54,0.5,0.46] },
      'Topic 5': { words:['bill','sabha','want','bring','community','today','years','minutes','bengal','lok'], scores:[0.8,0.76,0.72,0.68,0.64,0.6,0.56,0.52,0.48,0.44] },
    },
    dominant_topic: 'Topic 3'
  },
  venn: {
    ruling_only   : { 'Topic 1': ['women','poshan','child','anganwadi','mission','development','children','centre'] },
    opposition_only: {
      'Topic 2': ['election','data','manifesto','commission'],
      'Topic 3': ['farmers','bill','states','committee'],
      'Topic 4': ['cess','bjp','opposition','cent'],
    },
    shared: { 'Topic 5': ['bill','bengal','community','lok','want','years'] },
    counts: { ruling_only:1, opposition_only:3, shared:1 }
  },
  interpretation: {
    overlap_percentage: 20,
    cards: [
      { icon:'⚖️', title:'Thematic Overlap',   content:'20% of active topics are shared between both leaders, indicating low parliamentary agenda convergence. Shared topic: Topic 5.' },
      { icon:'🏛️', title:'Ruling Party Focus',  content:"Smriti Irani's discourse is concentrated in Topic 1 (avg 0.854), centered on women empowerment, child nutrition and welfare schemes (Poshan Mission, Anganwadi)." },
      { icon:'📋', title:'Opposition Agenda',   content:"Derek O'Brien's speeches span Topics 2–5 covering legislative scrutiny, federalism, fiscal criticism, and regional advocacy for West Bengal." },
      { icon:'🔍', title:'Discourse Framing',   content:"Derek's speeches average 3–4× longer, enabling broader issue coverage. Smriti's shorter interventions reflect targeted scheme advocacy consistent with her ministerial role." }
    ]
  }
};

// ── Fetch JSON with fallback ─────────────────────────────────────
async function fetchJSON(path, fallback) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('not found');
    return await res.json();
  } catch {
    console.warn(`⚠️  ${path} not found — using fallback data.`);
    return fallback;
  }
}

// ── Render profile bar chart ─────────────────────────────────────
function renderProfileChart(divId, profile, color, colorArr) {
  const topics = Object.keys(profile);
  const values = Object.values(profile);

  const trace = {
    type        : 'bar',
    x           : topics,
    y           : values,
    marker      : {
      color     : colorArr,
      line      : { color: 'rgba(255,255,255,0.1)', width: 1 }
    },
    hovertemplate: '<b>%{x}</b><br>Probability: %{y:.3f}<extra></extra>',
  };

  const layout = {
    ...PLOTLY_LAYOUT_BASE,
    yaxis: {
      ...PLOTLY_LAYOUT_BASE.yaxis,
      title: { text: 'Avg Probability', font: { size: 11 } },
      range: [0, 1],
    },
    xaxis: {
      ...PLOTLY_LAYOUT_BASE.xaxis,
      tickfont: { size: 11 },
    },
  };

  Plotly.newPlot(divId, [trace], layout, PLOTLY_CONFIG);
}

// ── Render comparison grouped bar ───────────────────────────────
function renderComparisonChart(divId, ruling, opp) {
  const topics = Object.keys(ruling.profile);

  const t1 = {
    name           : ruling.leader,
    type           : 'bar',
    x              : topics,
    y              : Object.values(ruling.profile),
    marker         : { color: THEME.ruling, opacity: 0.85 },
    hovertemplate  : `<b>${ruling.leader}</b><br>%{x}: %{y:.3f}<extra></extra>`,
  };

  const t2 = {
    name           : opp.leader,
    type           : 'bar',
    x              : topics,
    y              : Object.values(opp.profile),
    marker         : { color: THEME.opp, opacity: 0.85 },
    hovertemplate  : `<b>${opp.leader}</b><br>%{x}: %{y:.3f}<extra></extra>`,
  };

  const layout = {
    ...PLOTLY_LAYOUT_BASE,
    barmode  : 'group',
    legend   : {
      orientation: 'h',
      x: 0.5, xanchor: 'center',
      y: -0.18,
      font: { color: '#e8ecf4', size: 12 }
    },
    yaxis: {
      ...PLOTLY_LAYOUT_BASE.yaxis,
      title: { text: 'Avg Topic Probability', font:{ size: 11 } },
      range : [0, 1],
    },
  };

  Plotly.newPlot(divId, [t1, t2], layout, PLOTLY_CONFIG);
}

// ── Render keyword horizontal bar per leader ─────────────────────
function renderKeywordChart(divId, data, colorArr) {
  const topicKeys = Object.keys(data.topics);
  const traces    = [];

  topicKeys.forEach((topicName, ti) => {
    const td     = data.topics[topicName];
    const words  = td.words.slice(0, 10).reverse();
    const scores = td.scores.slice(0, 10).reverse();

    traces.push({
      name          : topicName,
      type          : 'bar',
      orientation   : 'h',
      x             : scores,
      y             : words,
      marker        : { color: colorArr[ti % colorArr.length], opacity: 0.85 },
      hovertemplate : `<b>%{y}</b><br>Score: %{x:.4f}<extra>${topicName}</extra>`,
      visible       : ti === 0 ? true : 'legendonly',
    });
  });

  const layout = {
    ...PLOTLY_LAYOUT_BASE,
    margin  : { t: 20, b: 50, l: 110, r: 20 },
    legend  : {
      orientation : 'h',
      x: 0.5, xanchor: 'center',
      y: -0.16,
      font: { color: '#e8ecf4', size: 11 }
    },
    xaxis: {
      ...PLOTLY_LAYOUT_BASE.xaxis,
      title: { text: 'Topic-Word Weight', font:{ size: 11 } }
    },
    yaxis: {
      ...PLOTLY_LAYOUT_BASE.yaxis,
      tickfont: { size: 11 }
    },
  };

  Plotly.newPlot(divId, traces, layout, PLOTLY_CONFIG);
}

// ── Render Venn via Plotly SVG shapes ────────────────────────────
function renderVenn(divId, vennData) {
  const counts = vennData.counts;
  const total  = counts.ruling_only + counts.opposition_only + counts.shared;

  // SVG-based Venn drawn as shape annotations in Plotly
  const shapes = [
    {
      type      : 'circle',
      x0: 0.1, y0: 0.15, x1: 0.62, y1: 0.85,
      fillcolor : 'rgba(232,160,72,0.25)',
      line      : { color: THEME.ruling, width: 2.5 }
    },
    {
      type      : 'circle',
      x0: 0.38, y0: 0.15, x1: 0.90, y1: 0.85,
      fillcolor : 'rgba(79,195,247,0.20)',
      line      : { color: THEME.opp, width: 2.5 }
    }
  ];

  const rulingKW  = Object.values(vennData.ruling_only)
  .flat()
  .slice(0, 4)
  .map(w => `• ${w}`)
  .join('<br>');
  const oppKW     = Object.values(vennData.opposition_only)
  .flat()
  .slice(0, 4)
  .map(w => `• ${w}`)
  .join('<br>');
  const sharedKW  = Object.values(vennData.shared)
  .flat()
  .slice(0, 3)
  .map(w => `• ${w}`)
  .join('<br>');

  const annotations = [
    // Ruling label
    { x: 0.22, y: 0.92, text: '<b>Smriti Irani</b>', showarrow: false,
      font:{ color: THEME.ruling, size: 13, family:'Playfair Display, serif' },
      xref:'paper', yref:'paper' },
    // Ruling topics
    { x: 0.22, y: 0.5, text: rulingKW || '—', showarrow: false,
      font:{ color: THEME.ruling, size: 11, family:'DM Mono, monospace' },
      xref:'paper', yref:'paper', align:'center' },
    // Shared label
    { x: 0.5, y: 0.96, text: '<b>Shared</b>', showarrow: false,
      font:{ color: THEME.accent, size: 12, family:'Playfair Display, serif' },
      xref:'paper', yref:'paper' },
    // Shared keywords
    { x: 0.5, y: 0.6, text: sharedKW || 'None', showarrow: false,
      font:{ color: THEME.accent, size: 11, family:'DM Mono, monospace' },
      xref:'paper', yref:'paper', align:'center' },
    // Opposition label
    { x: 0.78, y: 0.92, text: "<b>Derek O'Brien</b>", showarrow: false,
      font:{ color: THEME.opp, size: 13, family:'Playfair Display, serif' },
      xref:'paper', yref:'paper' },
    // Opposition topics
    { x: 0.78, y: 0.5, text: oppKW || '—', showarrow: false,
      font:{ color: THEME.opp, size: 11, family:'DM Mono, monospace' },
      xref:'paper', yref:'paper', align:'center' },
    // Counts
    { x: 0.22, y: 0.08,
      text: `${counts.ruling_only} exclusive topic${counts.ruling_only!==1?'s':''}`,
      showarrow: false, font:{ color:'rgba(232,160,72,0.7)', size:10 },
      xref:'paper', yref:'paper' },
    { x: 0.78, y: 0.08,
      text: `${counts.opposition_only} exclusive topic${counts.opposition_only!==1?'s':''}`,
      showarrow: false, font:{ color:'rgba(79,195,247,0.7)', size:10 },
      xref:'paper', yref:'paper' },
    { x: 0.5, y: 0.08,
      text: `${counts.shared} shared`,
      showarrow: false, font:{ color:'rgba(192,132,252,0.7)', size:10 },
      xref:'paper', yref:'paper' },
  ];

  const layout = {
    ...PLOTLY_LAYOUT_BASE,
    shapes,
    annotations,
    margin   : { t: 20, b: 40, l: 20, r: 20 },
    xaxis    : { visible: false, range:[0,1] },
    yaxis    : { visible: false, range:[0,1] },
    height   : 400,
  };

  Plotly.newPlot(divId, [], layout, PLOTLY_CONFIG);
}

// ── Render keyword legend panels ─────────────────────────────────
function renderVennLegend(containerId, vennData) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const groups = [
    { key: 'ruling_only',    cls: 'ruling-group',     label: 'Ruling Party — Exclusive Topics' },
    { key: 'shared',         cls: 'shared-group',     label: 'Shared Topics' },
    { key: 'opposition_only',cls: 'opposition-group', label: 'Opposition — Exclusive Topics' },
  ];

  el.innerHTML = groups.map(g => {
    const words = Object.values(vennData[g.key]).flat().slice(0, 10);
    const chips  = words.map(w => `<span class="keyword-chip">${w}</span>`).join('');
    return `
      <div class="venn-group ${g.cls}">
        <div class="venn-group-title">${g.label}</div>
        <div class="venn-keywords">${chips || '<span style="color:var(--text3);font-size:0.8rem">None</span>'}</div>
      </div>`;
  }).join('');
}

// ── Render insight cards ──────────────────────────────────────────
function renderInsights(containerId, interpData) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = interpData.cards.map(card => `
    <div class="insight-card">
      <span class="insight-icon">${card.icon}</span>
      <div class="insight-title">${card.title}</div>
      <div class="insight-content">${card.content}</div>
    </div>`
  ).join('');
}

// ── Window resize handler ─────────────────────────────────────────
function handleResize() {
  ['chart-smriti','chart-derek','chart-comparison',
   'chart-keywords-ruling','chart-keywords-opposition','venn-container'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.data) Plotly.relayout(id, { autosize: true });
  });
}

// ── Main init ─────────────────────────────────────────────────────
async function init() {
  const [ruling, opp, venn, interp] = await Promise.all([
    fetchJSON('site_data/ruling_topics.json',     FALLBACK.ruling),
    fetchJSON('site_data/opposition_topics.json', FALLBACK.opposition),
    fetchJSON('site_data/venn_topics.json',       FALLBACK.venn),
    fetchJSON('site_data/interpretation.json',    FALLBACK.interpretation),
  ]);

  // Profile bar charts
  renderProfileChart('chart-smriti', ruling.profile, THEME.ruling, THEME.rulingArr);
  renderProfileChart('chart-derek',  opp.profile,    THEME.opp,    THEME.oppArr);

  // Comparison grouped bar
  renderComparisonChart('chart-comparison', ruling, opp);

  // Keyword charts (horizontal bar)
  renderKeywordChart('chart-keywords-ruling',     ruling, THEME.rulingArr);
  renderKeywordChart('chart-keywords-opposition', opp,    THEME.oppArr);

  // Venn
  renderVenn('venn-container', venn);
  renderVennLegend('venn-legend', venn);

  // Insights
  renderInsights('insight-cards', interp);
}

window.addEventListener('load',   init);
window.addEventListener('resize', handleResize);
