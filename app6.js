// Geometry source modes — v1.4
function modeAttrsXml(h, changes){
  const doc=new DOMParser().parseFromString(h.rawXml,'application/xml');
  if(doc.querySelector('parsererror'))throw new Error('Nieprawidłowy XML');
  const dh=doc.querySelector('dhill > profile');
  if(!dh)throw new Error('Brak dhill/profile');
  for(const [k,v] of Object.entries(changes)){
    if(v===null||v===undefined)dh.removeAttribute(k);
    else dh.setAttribute(k,String(Math.round(Number(v)*1000)/1000));
  }
  return new XMLSerializer().serializeToString(doc);
}

function geometryModesHtml(h){
  if(!h)return '';
  const d=h.dh,g=h.geometry?.marks||{};
  const pExact=(hasNum(d,'n-p')&&hasNum(d,'h-p'))||(hasNum(d,'np')&&hasNum(d,'hp'));
  const lExact=(hasNum(d,'n-l')&&hasNum(d,'h-l'))||(hasNum(d,'nl')&&hasNum(d,'hl'));
  const uExact=hasNum(d,'r2x')||hasNum(d,'r2y');
  const btn=(group,mode,label,on)=>`<button class="mode-btn ${on?'active':''}" onclick="setGeometryMode('${group}','${mode}')">${label}</button>`;
  return `<div class="geometry-modes">
    <div class="geometry-mode-row"><div class="mode-label"><b>P</b><span>początek strefy lądowania</span></div><div class="mode-buttons">${btn('P','derived','l1 + kąty',!pExact)}${btn('P','exact','n-p / h-p',pExact)}</div></div>
    <div class="geometry-mode-row"><div class="mode-label"><b>L</b><span>koniec strefy lądowania</span></div><div class="mode-buttons">${btn('L','derived','l2 + kąty',!lExact)}${btn('L','exact','n-l / h-l',lExact)}</div></div>
    <div class="geometry-mode-row"><div class="mode-label"><b>U</b><span>początek wybiegu</span></div><div class="mode-buttons">${btn('U','derived','z r2',!uExact)}${btn('U','exact','r2x / r2y',uExact)}</div></div>
    <div class="mode-help">Tryb dokładny zapisuje współrzędne w XML. Przełączenie na dokładny startuje od aktualnie narysowanego punktu, więc profil nie powinien nagle „uciec”.</div>
  </div>`;
}

function setGeometryMode(group,mode){
  const h=hills[controlHill];
  if(!h)return;
  const m=h.geometry.marks;
  let changes={};
  if(group==='P'){
    if(mode==='exact') changes={'n-p':m.P.x,'h-p':-m.P.y};
    else changes={'n-p':null,'h-p':null,'np':null,'hp':null};
  }
  if(group==='L'){
    if(mode==='exact') changes={'n-l':m.L.x,'h-l':-m.L.y};
    else changes={'n-l':null,'h-l':null,'nl':null,'hl':null};
  }
  if(group==='U'){
    if(mode==='exact') changes={'r2x':m.U.x-m.L.x,'r2y':m.L.y-m.U.y};
    else changes={'r2x':null,'r2y':null};
  }
  try{
    const xml=modeAttrsXml(h,changes);
    const updated=parseHill(xml,h.name);
    hills[controlHill]=updated;
    $('params'+controlHill).innerHTML=paramsTable(updated);
    $('diag'+controlHill).innerHTML=diagHtml(updated);
    $('paramControlStatus').textContent=`${controlHill}: ${group} → ${mode==='exact'?'tryb dokładny':'tryb wyliczany'}`;
    renderParamControls();
    draw();
  }catch(e){$('paramControlStatus').textContent=e.message;}
}

// Extend the existing controls renderer with geometry-source selectors.
const renderParamControlsV13=renderParamControls;
renderParamControls=function(){
  renderParamControlsV13();
  const root=$('paramControls');
  const h=hills[controlHill];
  if(root&&h)root.insertAdjacentHTML('afterbegin',geometryModesHtml(h));
};

// Make the inrun labels unambiguous.
for(const spec of PARAM_SPECS){
  if(spec.scope==='ir'&&spec.attr==='t')spec.label='t — długość stolika/progu E2 → T';
  if(spec.scope==='ir'&&spec.attr==='e')spec.label='e — całkowita długość rozbiegu';
}

renderParamControls();
