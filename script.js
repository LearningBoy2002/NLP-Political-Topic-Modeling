/* ── script.js — Parliamentary Discourse Dashboard (v2) ─────────── */

// ── Semantic Topic Labels ────────────────────────────────────────
// Inferred from top keywords of each LDA topic
const TOPIC_LABELS = {
  'Topic 1': 'Women & Child Welfare',
  'Topic 2': 'Election Strategy & Debate',
  'Topic 3': 'Farm Bills & Federal Governance',
  'Topic 4': 'Fiscal Criticism & Opposition',
  'Topic 5': 'Parliamentary Debate & Regional Issues',
};

const SHORT_LABELS = {
  'Topic 1': 'Women & Child',
  'Topic 2': 'Election & Debate',
  'Topic 3': 'Farm Bills & Federalism',
  'Topic 4': 'Fiscal Criticism',
  'Topic 5': 'Parliamentary & Regional',
};

function labelTopic(key) { return TOPIC_LABELS[key] || key; }
function shortLabel(key) { return SHORT_LABELS[key]  || key; }

// ── Plotly Light Theme ───────────────────────────────────────────
const THEME = {
  bg         : 'rgba(0,0,0,0)',
  paper      : 'rgba(0,0,0,0)',
  gridcolor  : 'rgba(15,23,60,0.06)',
  zerocolor  : 'rgba(15,23,60,0.10)',
  textcolor  : '#475569',
  font       : 'DM Sans, sans-serif',
  ruling     : '#c2410c',
  rulingMid  : '#ea580c',
  opp        : '#0369a1',
  oppMid     : '#0ea5e9',
  accent     : '#6d28d9',

  // Multi-color arrays for per-topic coloring (ruling)
  rulingArr  : ['#c2410c','#ea580c','#f97316','#b45309','#92400e'],
  oppArr     : ['#0369a1','#0284c7','#0ea5e9','#38bdf8','#075985'],

  // Donut palettes
  donutRuling  : ['#c2410c','#ea580c','#f97316','#d97706','#92400e'],
  donutOpp     : ['#0369a1','#0284c7','#0ea5e9','#7dd3fc','#075985'],
};

const PLOTLY_LAYOUT_BASE = {
  paper_bgcolor : THEME.paper,
  plot_bgcolor  : THEME.bg,
  font          : { family: THEME.font, color: THEME.textcolor, size: 12 },
  margin        : { t: 20, b: 70, l: 55, r: 20 },
  hoverlabel    : {
    bgcolor     : '#0f172a',
    bordercolor : 'rgba(255,255,255,0.15)',
    font        : { family: THEME.font, color: '#f8fafc', size: 12 }
  },
  xaxis: {
    gridcolor   : THEME.gridcolor,
    zerolinecolor: THEME.zerocolor,
    linecolor   : THEME.gridcolor,
    tickfont    : { color: THEME.textcolor },
  },
  yaxis: {
    gridcolor   : THEME.gridcolor,
    zerolinecolor: THEME.zerocolor,
    linecolor   : THEME.gridcolor,
    tickfont    : { color: THEME.textcolor },
  },
};

const PLOTLY_CONFIG = {
  responsive            : true,
  displayModeBar        : true,
  modeBarButtonsToRemove: ['select2d','lasso2d','autoScale2d'],
  displaylogo           : false,
};

// ── Fallback data ────────────────────────────────────────────────
const FALLBACK = {
  ruling: {
    leader : 'Smriti Irani',
    house  : 'Lok Sabha',
    role   : 'Ruling Party',
    profile: { 'Topic 1':0.854,'Topic 2':0.018,'Topic 3':0.002,'Topic 4':0.013,'Topic 5':0.113 },
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
    profile: { 'Topic 1':0.051,'Topic 2':0.139,'Topic 3':0.321,'Topic 4':0.211,'Topic 5':0.278 },
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
      { icon:'⚖️', title:'Thematic Overlap',   content:'20% of active topics are shared between both leaders, indicating low parliamentary agenda convergence. The only shared topic — Parliamentary Debate & Regional Issues — relates to procedural and regional concerns both address.' },
      { icon:'🏛️', title:'Ruling Party Focus',  content:"Smriti Irani's discourse is almost entirely concentrated in Women & Child Welfare (avg 0.854). Six of eight speeches load above 0.99 on this topic, reflecting a tightly programmatic, portfolio-specific communication style tied to Poshan Mission and Anganwadi." },
      { icon:'📋', title:'Opposition Agenda',   content:"Derek O'Brien distributes across Farm Bills & Federalism (0.321), Parliamentary Debate & Regional Issues (0.278), and Fiscal Criticism (0.211). His broader thematic range reflects the multi-domain accountability role of an opposition floor leader." },
      { icon:'🔍', title:'Discourse Framing',   content:"Derek's speeches average 3–4× longer than Smriti's, structurally enabling wider issue coverage. The chamber difference — Rajya Sabha vs Lok Sabha — also shapes discourse depth: upper house debates tend toward longer, more detailed legislative critiques." }
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
    console.warn(`⚠️  ${path} not found — using built-in fallback data.`);
    return fallback;
  }
}

// ── Profile bar chart ────────────────────────────────────────────
function renderProfileChart(divId, profile, colorArr) {
  const rawKeys = Object.keys(profile);
  const labels  = rawKeys.map(k => shortLabel(k));
  const values  = Object.values(profile);

  const trace = {
    type          : 'bar',
    x             : labels,
    y             : values,
    marker        : {
      color       : colorArr,
      opacity     : 0.88,
      line        : { color: 'rgba(255,255,255,0.8)', width: 1.5 }
    },
    hovertemplate : rawKeys.map((k,i) =>
      `<b>${TOPIC_LABELS[k]}</b><br>Avg Probability: <b>%{y:.3f}</b><extra></extra>`
    ),
    customdata    : rawKeys,
  };

  const layout = {
    ...PLOTLY_LAYOUT_BASE,
    yaxis: {
      ...PLOTLY_LAYOUT_BASE.yaxis,
      title    : { text: 'Avg Topic Probability', font:{ size:11 }, standoff: 8 },
      range    : [0, 1],
      tickformat: '.1f',
    },
    xaxis: {
      ...PLOTLY_LAYOUT_BASE.xaxis,
      tickfont : { size: 10, color: THEME.textcolor },
      tickangle: -18,
    },
  };

  Plotly.newPlot(divId, [trace], layout, PLOTLY_CONFIG);
}

// ── Donut chart ──────────────────────────────────────────────────
function renderDonutChart(divId, profile, leader, colors) {
  const rawKeys = Object.keys(profile);
  const labels  = rawKeys.map(k => TOPIC_LABELS[k] || k);
  const values  = Object.values(profile);

  const trace = {
    type         : 'pie',
    hole         : 0.54,
    labels       : labels,
    values       : values,
    marker       : {
      colors     : colors,
      line       : { color: '#ffffff', width: 2.5 }
    },
    textinfo     : 'percent',
    hovertemplate: '<b>%{label}</b><br>Share: <b>%{percent}</b><br>Probability: <b>%{value:.3f}</b><extra></extra>',
    sort         : false,
    rotation     : -90,
  };

  const dominantTopic = rawKeys.reduce((a, b) => profile[a] > profile[b] ? a : b);

  const layout = {
    ...PLOTLY_LAYOUT_BASE,
    margin       : { t: 20, b: 20, l: 20, r: 20 },
    legend       : {
      orientation: 'v',
      x          : 1.02,
      y          : 0.5,
      yanchor    : 'middle',
      font       : { size: 10, color: THEME.textcolor },
    },
    annotations  : [{
      text      : `<b>${shortLabel(dominantTopic)}</b><br><span style="font-size:10px">Dominant</span>`,
      x         : 0.5, y: 0.5,
      font      : { size: 11, color: '#0f172a', family: 'DM Sans, sans-serif' },
      showarrow : false,
      xref      : 'paper', yref: 'paper',
      align     : 'center',
    }],
  };

  Plotly.newPlot(divId, [trace], layout, PLOTLY_CONFIG);
}

// ── Comparison grouped bar ───────────────────────────────────────
function renderComparisonChart(divId, ruling, opp) {
  const rawKeys = Object.keys(ruling.profile);
  const labels  = rawKeys.map(k => shortLabel(k));

  const t1 = {
    name          : ruling.leader,
    type          : 'bar',
    x             : labels,
    y             : Object.values(ruling.profile),
    marker        : { color: THEME.ruling, opacity: 0.85, line: { color: 'white', width: 1.2 } },
    hovertemplate : rawKeys.map(k =>
      `<b>${ruling.leader}</b><br>${TOPIC_LABELS[k]}<br>Probability: <b>%{y:.3f}</b><extra></extra>`
    ),
  };

  const t2 = {
    name          : opp.leader,
    type          : 'bar',
    x             : labels,
    y             : Object.values(opp.profile),
    marker        : { color: THEME.opp, opacity: 0.85, line: { color: 'white', width: 1.2 } },
    hovertemplate : rawKeys.map(k =>
      `<b>${opp.leader}</b><br>${TOPIC_LABELS[k]}<br>Probability: <b>%{y:.3f}</b><extra></extra>`
    ),
  };

  const layout = {
    ...PLOTLY_LAYOUT_BASE,
    barmode  : 'group',
    bargap   : 0.22,
    bargroupgap: 0.06,
    legend   : {
      orientation: 'h',
      x: 0.5, xanchor: 'center',
      y: -0.22,
      font: { color: THEME.textcolor, size: 12 },
      bgcolor: 'rgba(0,0,0,0)',
    },
    yaxis: {
      ...PLOTLY_LAYOUT_BASE.yaxis,
      title    : { text: 'Avg Topic Probability', font:{ size:11 }, standoff: 8 },
      range    : [0, 1],
      tickformat: '.1f',
    },
    xaxis: {
      ...PLOTLY_LAYOUT_BASE.xaxis,
      tickfont : { size: 10 },
      tickangle: -16,
    },
  };

  Plotly.newPlot(divId, [t1, t2], layout, PLOTLY_CONFIG);
}

// ── Keyword horizontal bar ───────────────────────────────────────
function renderKeywordChart(divId, data, colorArr) {
  const topicKeys = Object.keys(data.topics);
  const traces    = [];

  topicKeys.forEach((topicKey, ti) => {
    const td     = data.topics[topicKey];
    const words  = td.words.slice(0, 10).reverse();
    const scores = td.scores.slice(0, 10).reverse();
    const label  = TOPIC_LABELS[topicKey] || topicKey;

    traces.push({
      name         : label,
      type         : 'bar',
      orientation  : 'h',
      x            : scores,
      y            : words,
      marker       : {
        color      : colorArr[ti % colorArr.length],
        opacity    : 0.82,
        line       : { color: 'white', width: 1 }
      },
      hovertemplate: `<b>%{y}</b><br>${label}<br>Weight: <b>%{x:.4f}</b><extra></extra>`,
      visible      : ti === 0 ? true : 'legendonly',
    });
  });

  const layout = {
    ...PLOTLY_LAYOUT_BASE,
    margin  : { t: 20, b: 55, l: 120, r: 20 },
    legend  : {
      orientation : 'h',
      x: 0.5, xanchor: 'center',
      y: -0.18,
      font: { color: THEME.textcolor, size: 11 },
      bgcolor: 'rgba(0,0,0,0)',
    },
    xaxis: {
      ...PLOTLY_LAYOUT_BASE.xaxis,
      title   : { text: 'Topic-Word Weight', font:{ size:11 }, standoff: 8 }
    },
    yaxis: {
      ...PLOTLY_LAYOUT_BASE.yaxis,
      tickfont: { size: 11 }
    },
  };

  Plotly.newPlot(divId, traces, layout, PLOTLY_CONFIG);
}

// ── Venn (Plotly shapes) ─────────────────────────────────────────
function renderVenn(divId, vennData) {
  const counts  = vennData.counts;

  const shapes = [
    {
      type     : 'circle',
      x0: 0.08, y0: 0.12, x1: 0.60, y1: 0.88,
      fillcolor: 'rgba(194,65,12,0.12)',
      line     : { color: THEME.ruling, width: 2.5 }
    },
    {
      type     : 'circle',
      x0: 0.40, y0: 0.12, x1: 0.92, y1: 0.88,
      fillcolor: 'rgba(3,105,161,0.10)',
      line     : { color: THEME.opp, width: 2.5 }
    }
  ];

  const rulingKW = Object.values(vennData.ruling_only).flat().slice(0, 5).join('<br>');
  const oppKW    = Object.values(vennData.opposition_only).flat().slice(0, 5).join('<br>');
  const sharedKW = Object.values(vennData.shared).flat().slice(0, 4).map(w => `• ${w}`).join('<br>');

  const annotations = [
    { x:0.22, y:0.93, text:'<b>Smriti Irani</b>',      showarrow:false, font:{color:THEME.ruling, size:13, family:'Playfair Display, serif'}, xref:'paper', yref:'paper' },
    { x:0.22, y:0.50, text: rulingKW || '—',            showarrow:false, font:{color:THEME.ruling, size:11, family:'DM Mono, monospace'}, xref:'paper', yref:'paper', align:'center' },
    { x:0.50, y:0.96, text:'<b>Shared</b>',             showarrow:false, font:{color:THEME.accent, size:12, family:'Playfair Display, serif'}, xref:'paper', yref:'paper' },
    { x:0.50, y:0.60, text: sharedKW || 'None',         showarrow:false, font:{color:THEME.accent, size:11, family:'DM Mono, monospace'}, xref:'paper', yref:'paper', align:'center' },
    { x:0.78, y:0.93, text:"<b>Derek O'Brien</b>",      showarrow:false, font:{color:THEME.opp,    size:13, family:'Playfair Display, serif'}, xref:'paper', yref:'paper' },
    { x:0.78, y:0.50, text: oppKW || '—',               showarrow:false, font:{color:THEME.opp,    size:11, family:'DM Mono, monospace'}, xref:'paper', yref:'paper', align:'center' },
    { x:0.22, y:0.07, text:`${counts.ruling_only} exclusive topic${counts.ruling_only!==1?'s':''}`, showarrow:false, font:{color:'rgba(194,65,12,0.65)',size:10}, xref:'paper', yref:'paper' },
    { x:0.78, y:0.07, text:`${counts.opposition_only} exclusive topic${counts.opposition_only!==1?'s':''}`, showarrow:false, font:{color:'rgba(3,105,161,0.65)',size:10}, xref:'paper', yref:'paper' },
    { x:0.50, y:0.07, text:`${counts.shared} shared`,   showarrow:false, font:{color:'rgba(109,40,217,0.65)',size:10}, xref:'paper', yref:'paper' },
  ];

  const layout = {
    ...PLOTLY_LAYOUT_BASE,
    shapes,
    annotations,
    margin  : { t: 20, b: 40, l: 20, r: 20 },
    xaxis   : { visible: false, range:[0,1] },
    yaxis   : { visible: false, range:[0,1] },
    height  : 420,
  };

  Plotly.newPlot(divId, [], layout, PLOTLY_CONFIG);
}

// ── Venn legend panels ───────────────────────────────────────────
function renderVennLegend(containerId, vennData) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const groups = [
    { key:'ruling_only',     cls:'ruling-group',     label:'Ruling — Exclusive Topics' },
    { key:'shared',          cls:'shared-group',     label:'Shared Topics' },
    { key:'opposition_only', cls:'opposition-group', label:'Opposition — Exclusive Topics' },
  ];

  el.innerHTML = groups.map(g => {
    const words = Object.values(vennData[g.key]).flat().slice(0, 10);
    const chips = words.map(w => `<span class="keyword-chip">${w}</span>`).join('');
    return `
      <div class="venn-group ${g.cls}">
        <div class="venn-group-title">${g.label}</div>
        <div class="venn-keywords">${chips || '<span style="color:var(--text3);font-size:0.8rem">None</span>'}</div>
      </div>`;
  }).join('');
}

// ── Insight cards ────────────────────────────────────────────────
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

// ── Word Clouds ──────────────────────────────────────────────────
function buildWordList(topicsData) {
  const freq = {};
  Object.entries(topicsData).forEach(([topicKey, td]) => {
    td.words.forEach((word, i) => {
      const score = td.scores[i] || 0.5;
      freq[word]  = Math.max(freq[word] || 0, score);
    });
  });
  // Scale to pixel size range 14–80
  const vals   = Object.values(freq);
  const minV   = Math.min(...vals);
  const maxV   = Math.max(...vals);
  const range  = maxV - minV || 1;
  return Object.entries(freq).map(([word, score]) => {
    const size = Math.round(14 + ((score - minV) / range) * 66);
    return [word, size];
  });
}

function renderWordCloud(canvasId, wrapId, topicsData, colorFn) {
  const canvas = document.getElementById(canvasId);
  const wrap   = document.getElementById(wrapId);
  if (!canvas || !wrap || typeof WordCloud === 'undefined') return;

  const w = wrap.offsetWidth  || 500;
  const h = 280;
  canvas.width  = w;
  canvas.height = h;

  const list = buildWordList(topicsData);

  try {
    WordCloud(canvas, {
      list              : list,
      gridSize          : Math.round(6 * w / 500),
      weightFactor      : size => size * (w / 500),
      fontFamily        : 'DM Sans, sans-serif',
      fontWeight        : '600',
      color             : colorFn,
      rotateRatio       : 0.25,
      rotationSteps     : 2,
      backgroundColor   : 'transparent',
      shuffle           : true,
      drawOutOfBound    : false,
      shrinkToFit       : true,
      clearCanvas       : true,
    });
  } catch(e) {
    console.warn('WordCloud render error:', e);
  }
}

const rulingColorFn = () => {
  const colors = ['#c2410c','#ea580c','#d97706','#92400e','#b45309','#ef4444'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const oppColorFn = () => {
  const colors = ['#0369a1','#0284c7','#0ea5e9','#1d4ed8','#075985','#2563eb'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// ── Resize handler ───────────────────────────────────────────────
function handleResize() {
  const plotIds = [
    'chart-smriti','chart-derek',
    'chart-donut-smriti','chart-donut-derek',
    'chart-comparison',
    'chart-keywords-ruling','chart-keywords-opposition',
    'venn-container'
  ];
  plotIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.data) Plotly.relayout(id, { autosize: true });
  });
}

// ── Main init ────────────────────────────────────────────────────
async function init() {
  const [ruling, opp, venn, interp] = await Promise.all([
    fetchJSON('site_data/ruling_topics.json',     FALLBACK.ruling),
    fetchJSON('site_data/opposition_topics.json', FALLBACK.opposition),
    fetchJSON('site_data/venn_topics.json',       FALLBACK.venn),
    fetchJSON('site_data/interpretation.json',    FALLBACK.interpretation),
  ]);

  // Profile bar charts
  renderProfileChart('chart-smriti', ruling.profile, THEME.rulingArr);
  renderProfileChart('chart-derek',  opp.profile,    THEME.oppArr);

  // Donut charts
  renderDonutChart('chart-donut-smriti', ruling.profile, ruling.leader, THEME.donutRuling);
  renderDonutChart('chart-donut-derek',  opp.profile,    opp.leader,    THEME.donutOpp);

  // Comparison
  renderComparisonChart('chart-comparison', ruling, opp);

  // Keywords
  renderKeywordChart('chart-keywords-ruling',     ruling, THEME.rulingArr);
  renderKeywordChart('chart-keywords-opposition', opp,    THEME.oppArr);

  // Venn
  renderVenn('venn-container', venn);
  renderVennLegend('venn-legend', venn);

  // Insights
  renderInsights('insight-cards', interp);

  // Word clouds (slight delay to let layout settle)
  setTimeout(() => {
    renderWordCloud('wc-smriti', 'wc-wrap-smriti', ruling.topics, rulingColorFn);
    renderWordCloud('wc-derek',  'wc-wrap-derek',  opp.topics,    oppColorFn);
  }, 400);
}

window.addEventListener('load',   init);
window.addEventListener('resize', handleResize);
