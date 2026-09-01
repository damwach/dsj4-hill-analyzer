// Interactive parameter controls — v1.3
const PARAM_SPECS = [
  {section:'Najazd', scope:'ir', attr:'e', label:'e — długość najazdu', min:20, max:220, step:.5, unit:'m'},
  {section:'Najazd', scope:'ir', attr:'t', label:'t — długość progu', min:1, max:20, step:.05, unit:'m'},
  {section:'Najazd', scope:'ir', attr:'gamma', label:'γ — kąt najazdu', min:10, max:45, step:.1, unit:'°'},
  {section:'Najazd', scope:'ir', attr:'alpha', label:'α — kąt progu', min:0, max:20, step:.1, unit:'°'},
  {section:'Najazd', scope:'ir', attr:'r1', label:'r1 — krzywa przejścia', min:5, max:300, step:.5, unit:'m'},
  {section:'Najazd', scope:'ir', attr:'s', label:'s — wysokość progu nad zeskokiem', min:0, max:12, step:.05, unit:'m'},

  {section:'Zeskok — położenie', scope:'dh', attr:'alpha', label:'alpha — kąt początku zeskoku', min:0, max:20, step:.1, unit:'°'},
  {section:'Zeskok — położenie', scope:'dh', attr:'n', label:'n — pozioma współrzędna K', min:20, max:400, step:.1, unit:'m'},
  {section:'Zeskok — położenie', scope:'dh', attr:'h', label:'h — pionowa współrzędna K', min:5, max:250, step:.1, unit:'m'},
  {section:'Zeskok — położenie', scope:'dh', attr:'l1', label:'l1 — P → K', min:0, max:120, step:.1, unit:'m'},
  {section:'Zeskok — położenie', scope:'dh', attr:'l2', label:'l2 — K → L', min:0, max:120, step:.1, unit:'m'},

  {section:'Zeskok — kąty', scope:'dh', attr:'beta-p', label:'βP', min:5, max:55, step:.1, unit:'°'},
  {section:'Zeskok — kąty', scope:'dh', attr:'beta', label:'βK', min:5, max:55, step:.1, unit:'°'},
  {section:'Zeskok — kąty', scope:'dh', attr:'beta-l', label:'βL', min:0, max:50, step:.1, unit:'°'},

  {section:'Dół zeskoku', scope:'dh', attr:'r2', label:'r2 — promień przejścia L → U', min:5, max:300, step:.5, unit:'m'},
  {section:'Dół zeskoku', scope:'dh', attr:'r2x', label:'r2x — dokładne Δx do U', min:0, max:180, step:.1, unit:'m', existingOnly:true},
  {section:'Dół zeskoku', scope:'dh', attr:'r2y', label:'r2y — dokładne Δy do U', min:0, max:100, step:.1, unit:'m', existingOnly:true},
  {section:'Dół zeskoku', scope:'dh', attr:'a', label:'a — odcinek za U', min:0, max:200, step:.5, unit:'m'},

  {section:'Dokładne P / L', scope:'dh', attr:'n-p', label:'n-p — P x', min:0, max:350, step:.1, unit:'m', existingOnly:true},
  {section:'Dokładne P / L', scope:'dh', attr:'h-p', label:'h-p — P y', min:0, max:220, step:.1, unit:'m', existingOnly:true},
  {section:'Dokładne P / L', scope:'dh', attr:'n-l', label:'n-l — L x', min:0, max:400, step:.1, unit:'m', existingOnly:true},
  {section:'Dokładne P / L', scope:'dh', attr:'h-l', label:'h-l — L y', min:0, max:250, step:.1, unit:'m', existingOnly:true},

  {section:'Znaczniki', scope:'dh', attr:'p', label:'P XML — metry po zeskoku', min:0, max:400, step:.5, unit:'m', existingOnly:true},
  {section:'Znaczniki', scope:'dh', attr:'k', label:'K XML — metry po zeskoku', min:20, max:400, step:.5, unit:'m'},
  {section:'Znaczniki', scope:'dh', attr:'hs', label:'HS XML — metry po zeskoku', min:20, max:450, step:.5, unit:'m'}
];

let controlHill = 'A';
let paramBaselines = {A:{},B:{}};

function controlSource(h,spec){ return spec.scope==='ir' ? h?.ir : h?.dh; }
function controlKey(spec){ return `${spec.scope}:${spec.attr}`; }

function captureParamBaseline(which,h){
  paramBaselines[which]={};
  if(!h)return;
  for(const spec of PARAM_SPECS){
    const src=controlSource(h,spec);
    if(hasNum(src,spec.attr))paramBaselines[which][controlKey(spec)]=Number(src[spec.attr]);
  }
}

function sliderBounds(spec,value){
  let min=spec.min,max=spec.max;
  // Do not clamp unusual real-world/custom values: expand range around the XML value.
  if(Number.isFinite(value)){
    if(value<min) min=Math.floor(value-Math.max(5,Math.abs(value)*.25));
    if(value>max) max=Math.ceil(value+Math.max(5,Math.abs(value)*.25));
  }
  return {min,max};
}

function renderParamControls(){
  const root=$('paramControls');
  if(!root)return;
  const h=hills[controlHill];
  $('controlA')?.classList.toggle('active',controlHill==='A');
  $('controlB')?.classList.toggle('active',controlHill==='B');
  if(!h){root.innerHTML='<div class="small">Wczytaj skocznię, aby sterować parametrami.</div>';return;}

  let html='';
  let lastSection='';
  for(const spec of PARAM_SPECS){
    const src=controlSource(h,spec);
    const exists=hasNum(src,spec.attr);
    if(spec.existingOnly && !exists)continue;
    if(!exists)continue;
    if(spec.section!==lastSection){
      if(lastSection)html+='</div>';
      html+=`<div class="param-section"><div class="param-section-title">${spec.section}</div>`;
      lastSection=spec.section;
    }
    const value=Number(src[spec.attr]);
    const b=sliderBounds(spec,value);
    const id=`pc_${spec.scope}_${spec.attr.replace(/[^a-zA-Z0-9]/g,'_')}`;
    const base=paramBaselines[controlHill][controlKey(spec)];
    html+=`<div class="param-control" data-scope="${spec.scope}" data-attr="${spec.attr}">
      <div class="param-head"><label for="${id}">${spec.label}</label><span class="param-unit">${spec.unit}</span></div>
      <div class="param-line">
        <input id="${id}" class="param-slider" type="range" min="${b.min}" max="${b.max}" step="${spec.step}" value="${value}" data-scope="${spec.scope}" data-attr="${spec.attr}">
        <input class="param-number" type="number" min="${b.min}" max="${b.max}" step="${spec.step}" value="${value}" data-scope="${spec.scope}" data-attr="${spec.attr}">
        <button class="param-reset" title="Przywróć wartość z wczytanego XML" data-scope="${spec.scope}" data-attr="${spec.attr}" data-value="${base??value}">↺</button>
      </div>
    </div>`;
  }
  if(lastSection)html+='</div>';
  root.innerHTML=html || '<div class="small">Brak obsługiwanych parametrów liczbowych.</div>';
  bindParamControlEvents();
}

function xmlWithParamChanged(h,scope,attr,value){
  const doc=new DOMParser().parseFromString(h.rawXml,'application/xml');
  if(doc.querySelector('parsererror'))throw new Error('Nie można zmienić parametru — źródłowy XML ma błąd.');
  const selector=scope==='ir'?'inrun > profile':'dhill > profile';
  const el=doc.querySelector(selector);
  if(!el)throw new Error(`Brak ${selector}`);
  el.setAttribute(attr,String(value));
  return new XMLSerializer().serializeToString(doc);
}

function applyInteractiveParam(scope,attr,value,sourceEl){
  const h=hills[controlHill];
  if(!h || !Number.isFinite(Number(value)))return;
  try{
    const v=Number(value);
    const xml=xmlWithParamChanged(h,scope,attr,v);
    const updated=parseHill(xml,h.name);
    hills[controlHill]=updated;
    $('params'+controlHill).innerHTML=paramsTable(updated);
    $('diag'+controlHill).innerHTML=diagHtml(updated);
    $('paramControlStatus').textContent=`${controlHill}: ${attr} = ${v}`;
    // Keep paired range/number fields synchronized without rebuilding the panel mid-drag.
    document.querySelectorAll(`#paramControls [data-scope="${CSS.escape(scope)}"][data-attr="${CSS.escape(attr)}"]`).forEach(el=>{
      if(el!==sourceEl && (el.classList.contains('param-slider')||el.classList.contains('param-number')))el.value=v;
    });
    draw();
  }catch(e){
    $('paramControlStatus').textContent=e.message;
  }
}

function bindParamControlEvents(){
  document.querySelectorAll('#paramControls .param-slider').forEach(el=>el.addEventListener('input',()=>applyInteractiveParam(el.dataset.scope,el.dataset.attr,el.value,el)));
  document.querySelectorAll('#paramControls .param-number').forEach(el=>el.addEventListener('input',()=>applyInteractiveParam(el.dataset.scope,el.dataset.attr,el.value,el)));
  document.querySelectorAll('#paramControls .param-reset').forEach(btn=>btn.addEventListener('click',()=>{
    applyInteractiveParam(btn.dataset.scope,btn.dataset.attr,btn.dataset.value,btn);
    renderParamControls();
  }));
}

function selectControlHill(which){controlHill=which;renderParamControls();$('paramControlStatus').textContent=`Sterujesz skocznią ${which}`;}
function fitAfterParamChanges(){resetView();}
function controlsToEditor(){
  const h=hills[controlHill];
  if(!h)return;
  setEditorXml(h.rawXml,true);
  $('xmlStatus').textContent=`Parametry ${controlHill} → edytor XML`;
}

// Keep controls synchronized with file/demo/editor loads.
const originalSetHill=setHill;
setHill=function(which,h){
  originalSetHill(which,h);
  captureParamBaseline(which,h);
  if(which===controlHill)renderParamControls();
};

const originalSwapHills=swapHills;
swapHills=function(){
  originalSwapHills();
  [paramBaselines.A,paramBaselines.B]=[paramBaselines.B,paramBaselines.A];
  renderParamControls();
};

const originalClearAll=clearAll;
clearAll=function(){originalClearAll();paramBaselines={A:{},B:{}};renderParamControls();};

// app4 loads demo A before this file executes, so initialize it now.
captureParamBaseline('A',hills.A);
captureParamBaseline('B',hills.B);
renderParamControls();
