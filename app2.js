function buildLanding(ir,dh){
  const diag=[];
  const s=num(ir,'s',0);
  const B0={x:0,y:-s};
  const sillFoot={...B0};
  const K={x:num(dh,'n',100),y:-num(dh,'h',55)};
  const bp=deg(num(dh,'beta-p',35)),bk=deg(num(dh,'beta',33)),bl=deg(num(dh,'beta-l',30));
  const l1=num(dh,'l1',0),l2=num(dh,'l2',0);
  const hasPExact=(hasNum(dh,'h-p')&&hasNum(dh,'n-p'))||(hasNum(dh,'hp')&&hasNum(dh,'np'));
  const hasLExact=(hasNum(dh,'h-l')&&hasNum(dh,'n-l'))||(hasNum(dh,'hl')&&hasNum(dh,'nl'));
  const P=hasPExact?{x:firstNum(dh,['n-p','np']),y:-firstNum(dh,['h-p','hp'])}:deriveP(K,l1,bp,bk);
  const L=hasLExact?{x:firstNum(dh,['n-l','nl']),y:-firstNum(dh,['h-l','hl'])}:deriveL(K,l2,bk,bl);
  diag.push({k:'P',v:hasPExact?'dokładne h-p / n-p (priorytet)':'z l1 + βP/βK'});
  diag.push({k:'L',v:hasLExact?'dokładne h-l / n-l (priorytet)':'z l2 + βK/βL'});
  diag.push({k:'K geom',v:`n=${num(dh,'n',0)} / h=${num(dh,'h',0)}`});
  diag.push({k:'początek zeskoku',v:`B0=(0, -${s.toFixed(2)}) m; alpha=${hasNum(dh,'alpha')?num(dh,'alpha'):6}°`});
  const alpha0=deg(num(dh,'alpha',6));
  let landing=hermiteX(B0.x,B0.y,-Math.tan(alpha0),P.x,P.y,-Math.tan(bp),120);
  let PK;
  if(hasPExact)PK=hermiteX(P.x,P.y,-Math.tan(bp),K.x,K.y,-Math.tan(bk),65);
  else{PK=arcFromTangent(P,l1,bp,bk,65);if(PK.length)PK[PK.length-1]={...K};}
  landing.push(...PK.slice(1));
  let KL;
  if(hasLExact)KL=hermiteX(K.x,K.y,-Math.tan(bk),L.x,L.y,-Math.tan(bl),65);
  else{KL=arcFromTangent(K,l2,bk,bl,65);if(KL.length)KL[KL.length-1]={...L};}
  landing.push(...KL.slice(1));
  const r2=num(dh,'r2',0);const base=lowerTransitionDefault(L,bl,r2,100);
  let U=base.U,transition=base.points,uMode=base.mode;
  const hasX=hasNum(dh,'r2x'),hasY=hasNum(dh,'r2y');
  if(hasX||hasY){U={x:L.x+(hasX?num(dh,'r2x'):base.U.x-L.x),y:L.y-(hasY?num(dh,'r2y'):L.y-base.U.y)};const ex=lowerTransitionToExactU(L,U,bl,r2,110);transition=ex.points;uMode=(hasX&&hasY?'r2x/r2y mają priorytet dla U':'częściowe r2x/r2y + r2')+'; '+ex.mode;}
  landing.push(...transition.slice(1));
  const a=num(dh,'a',0);const end={x:U.x+Math.max(0,a),y:U.y};if(a>0)landing.push(...linePoints(U,end,70).slice(1));
  if(hasNum(dh,'rl'))diag.push({k:'rl',v:'IGNOROWANE — silnik DSJ4 nie używa go do profilu'});
  if(hasNum(dh,'zu'))diag.push({k:'zu',v:'IGNOROWANE — brak potwierdzenia użycia przez silnik'});
  diag.push({k:'U',v:uMode});
  if(hasNum(dh,'r2x')||hasNum(dh,'r2y'))diag.push({k:'U coords',v:`Δx=${hasNum(dh,'r2x')?num(dh,'r2x'):'auto'}, Δy=${hasNum(dh,'r2y')?num(dh,'r2y'):'auto'}`});
  if(num(dh,'hr',0)!==0||num(dh,'nr',0)!==0||num(dh,'ar',0)!==0)diag.push({k:'hr/nr/ar',v:'wykryte; backslope jeszcze nie jest rysowany'});
  return {points:landing,marks:{B0,sillFoot,P,K,L,U,end},diag};
}
function buildGeometry(ir,dh){const inrun=buildInrun(ir);const landing=buildLanding(ir,dh);return {inrun:inrun.points,landing:landing.points,marks:{...inrun.marks,...landing.marks},diag:landing.diag};}
function paramsTable(h){if(!h)return '<span class="small">—</span>';const d=h.dh,i=h.ir;const rows=[['K XML',hasNum(d,'k')?d.k:'—','m po zeskoku'],['HS XML',hasNum(d,'hs')?d.hs:'—','m po zeskoku'],['P XML',hasNum(d,'p')?d.p:'—','m po zeskoku'],['n',d.n,'m'],['h',d.h,'m'],['h-p',d['h-p']??'—','m'],['n-p',d['n-p']??'—','m'],['h-l',d['h-l']??'—','m'],['n-l',d['n-l']??'—','m'],['l1',d.l1,'m'],['l2',d.l2,'m'],['alpha',d.alpha??'—','°'],['βP',d['beta-p'],'°'],['βK',d.beta,'°'],['βL',d['beta-l'],'°'],['r2',d.r2,'m'],['r2x',d.r2x??'—','m'],['r2y',d.r2y??'—','m'],['e',i.e,'m'],['t',i.t,'m'],['γ',i.gamma,'°'],['α próg',i.alpha,'°'],['r1',i.r1,'m'],['s',i.s,'m'],['rl',d.rl??'—','ignored'],['zu',d.zu??'—','ignored']];return '<table>'+rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]??'—'} ${r[2]}</td></tr>`).join('')+'</table>';}
function diagHtml(h){if(!h)return '<span class="small">—</span>';return h.geometry.diag.map(x=>`<div class="diagline"><strong>${x.k}:</strong> ${x.v}</div>`).join('');}
function setHill(which,h){hills[which]=h;$('name'+which).textContent=h?h.name:'Brak pliku';$('params'+which).innerHTML=paramsTable(h);$('diag'+which).innerHTML=diagHtml(h);resetView();}
