import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';

const CHEM = {
  li: { name:'ÍON-LÍTIO', ion:'Li⁺', color:0x8c55ff, css:'#8c55ff', anode:'Grafite', cathode:'LFP, NMC ou NCA', electrolyte:'Sal de lítio em solventes orgânicos' },
  na: { name:'ÍON-SÓDIO', ion:'Na⁺', color:0x28dcf6, css:'#28dcf6', anode:'Carbono duro', cathode:'Óxidos lamelares ou azul da Prússia', electrolyte:'Sal de sódio em solventes orgânicos' }
};

const PARTS = [
  { key:'anode', name:'Ânodo', discharge:'Na descarga, o material do ânodo é oxidado: libera íons para o eletrólito e elétrons para o circuito externo.', charge:'Na carga, a fonte externa força íons a retornarem e serem armazenados no eletrodo negativo; o processo de descarga é revertido.' },
  { key:'anodeCollector', name:'Coletor do ânodo', discharge:'Conduz elétrons entre o material ativo do eletrodo negativo e o terminal externo.', charge:'Durante a carga, conduz os elétrons fornecidos pela fonte externa até o eletrodo negativo.' },
  { key:'electrolyte', name:'Eletrólito', discharge:'Meio que transporta íons entre os eletrodos. Os elétrons não atravessam esse caminho: circulam externamente.', charge:'Na carga, os íons atravessam o eletrólito no sentido oposto ao da descarga; elétrons continuam fora da célula.' },
  { key:'separator', name:'Separador', discharge:'Membrana porosa e eletricamente isolante. Evita o contato direto entre os eletrodos, mas permite o transporte iônico.', charge:'Permanece isolante durante a carga: deixa os íons atravessarem, mas bloqueia o contato elétrico direto.' },
  { key:'cathode', name:'Cátodo', discharge:'Na descarga, recebe elétrons e acomoda os íons. É o local da redução no modelo de descarga.', charge:'Na carga, libera os íons que retornam ao eletrodo negativo, enquanto a fonte externa retira elétrons deste eletrodo.' },
  { key:'cathodeCollector', name:'Coletor do cátodo', discharge:'Conduz elétrons entre o cátodo e o terminal positivo. O alumínio é um coletor amplamente usado.', charge:'Durante a carga, conduz elétrons do eletrodo positivo para o circuito e a fonte externa.' }
];

const sceneHost = document.querySelector('#scene');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
camera.position.set(4.8, 3.4, 6.8);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
sceneHost.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.15, 0);
controls.minDistance = 4.3;
controls.maxDistance = 12;

scene.add(new THREE.HemisphereLight(0xbbeeff, 0x101527, 2.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
keyLight.position.set(4, 6, 5);
scene.add(keyLight);
const cyanLight = new THREE.PointLight(0x28dcf6, 18, 11);
cyanLight.position.set(-3, 1.5, 3);
scene.add(cyanLight);
const purpleLight = new THREE.PointLight(0x8c55ff, 20, 10);
purpleLight.position.set(3, 1, -2);
scene.add(purpleLight);

// A âncora pertence ao mundo real; a bateria é sua filha e pode girar sem
// perder a posição encontrada pelo hit-test.
const anchor = new THREE.Group();
const battery = new THREE.Group();
scene.add(anchor);
anchor.add(battery);
const clickable = [];
const layers = {};
const mats = {
  anode:new THREE.MeshStandardMaterial({color:0x172b35,roughness:.72,metalness:.12}),
  copper:new THREE.MeshStandardMaterial({color:0xc47436,roughness:.3,metalness:.88}),
  electrolyte:new THREE.MeshPhysicalMaterial({color:0x38d6e3,transparent:true,opacity:.13,roughness:.05,transmission:.65,thickness:.5}),
  separator:new THREE.MeshPhysicalMaterial({color:0xeafcff,transparent:true,opacity:.72,roughness:.35}),
  cathode:new THREE.MeshStandardMaterial({color:CHEM.li.color,roughness:.45,metalness:.18,emissive:CHEM.li.color,emissiveIntensity:.12}),
  aluminum:new THREE.MeshStandardMaterial({color:0xcad5df,roughness:.25,metalness:.92})
};

function roundedBox(w,h,d,r,material){
  const shape=new THREE.Shape(); const x=-w/2,y=-h/2; const rr=Math.min(r,w*.28,h*.1); const bevel=Math.min(.035,w*.14);
  shape.moveTo(x+rr,y); shape.lineTo(x+w-rr,y); shape.quadraticCurveTo(x+w,y,x+w,y+rr); shape.lineTo(x+w,y+h-rr); shape.quadraticCurveTo(x+w,y+h,x+w-rr,y+h); shape.lineTo(x+rr,y+h); shape.quadraticCurveTo(x,y+h,x,y+h-rr); shape.lineTo(x,y+rr); shape.quadraticCurveTo(x,y,x+rr,y);
  const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel}); geo.center();
  return new THREE.Mesh(geo,material);
}

const layerDefs=[
  ['anode',-.76,.30,mats.anode],['anodeCollector',-.48,.085,mats.copper],['electrolyte',-.22,.38,mats.electrolyte],['separator',0,.085,mats.separator],['electrolyte2',.22,.38,mats.electrolyte],['cathodeCollector',.48,.085,mats.aluminum],['cathode',.76,.30,mats.cathode]
];
layerDefs.forEach(([key,x,width,mat])=>{const mesh=roundedBox(width,3.25,4.65,.22,mat);mesh.position.x=x;mesh.userData.part=key==='electrolyte2'?'electrolyte':key;battery.add(mesh);layers[key]=mesh;clickable.push(mesh)});

const shellMat=new THREE.MeshPhysicalMaterial({color:0x96d9ff,transparent:true,opacity:.09,roughness:.1,metalness:.1,side:THREE.DoubleSide,depthWrite:false});
const shell=roundedBox(2.15,3.62,4.98,.3,shellMat);battery.add(shell);

function label(text,pos,color=0xffffff,parent=battery){
  const c=document.createElement('canvas');c.width=512;c.height=112;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.font='700 42px Arial';x.textAlign='center';x.fillStyle='#'+color.toString(16).padStart(6,'0');x.fillText(text,256,67);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));s.position.copy(pos);s.scale.set(1.45,.32,1);parent.add(s);return s;
}
const anodeLabel=label('ÂNODO',new THREE.Vector3(-.45,1.92,2.48),0x9ad8e7,layers.anode);
const cathodeLabel=label('CÁTODO',new THREE.Vector3(.45,1.92,2.48),CHEM.li.color,layers.cathode);
const partLabel=label('ÂNODO',new THREE.Vector3(0,-1.92,2.48),0xc8ff32,layers.anode);
partLabel.scale.set(1.7,.37,1);

function updateSpriteLabel(sprite,text,color=0xc8ff32){
  const canvas=sprite.material.map.image,ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='rgba(4,12,24,.88)';ctx.fillRect(36,8,440,88);ctx.strokeStyle='#'+color.toString(16).padStart(6,'0');ctx.lineWidth=3;ctx.strokeRect(36,8,440,88);ctx.font='700 36px Arial';ctx.textAlign='center';ctx.fillStyle='#f5f8ff';ctx.fillText(text.toUpperCase(),256,64);sprite.material.map.needsUpdate=true;
}
updateSpriteLabel(anodeLabel,'− Ânodo',0x9ad8e7);
updateSpriteLabel(cathodeLabel,'+ Cátodo',CHEM.li.color);

function particleTexture(text,color){const c=document.createElement('canvas');c.width=256;c.height=128;const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;updateParticleTexture(texture,text,color);return texture}
function updateParticleTexture(texture,text,color){const c=texture.image,x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.font='900 72px Arial';x.textAlign='center';x.textBaseline='middle';x.lineWidth=12;x.strokeStyle='rgba(2,7,15,.95)';x.strokeText(text,128,67);x.fillStyle=color;x.fillText(text,128,67);texture.needsUpdate=true}
function particleTag(texture){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));s.position.set(0,0,.11);s.scale.set(.24,.12,1);return s}

const ionTagTexture=particleTexture(CHEM.li.ion,'#ffffff');
const electronTagTexture=particleTexture('e⁻','#ffffff');

const ionGroup=new THREE.Group(); battery.add(ionGroup); const ions=[];
for(let i=0;i<15;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.095,18,18),new THREE.MeshStandardMaterial({color:CHEM.li.color,emissive:CHEM.li.color,emissiveIntensity:1.1}));m.userData={phase:i/15,y:-1.25+(i%5)*.62,z:-1.65+(i%3)*1.65};m.add(particleTag(ionTagTexture));ionGroup.add(m);ions.push(m)}

const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.05,1.45,0),new THREE.Vector3(-1.7,2.6,0),new THREE.Vector3(0,3.05,0),new THREE.Vector3(1.7,2.6,0),new THREE.Vector3(1.05,1.45,0)]);
const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,72,.025,8,false),new THREE.MeshBasicMaterial({color:0x427b91,transparent:true,opacity:.75}));battery.add(tube);
const electrons=[];for(let i=0;i<8;i++){const e=new THREE.Mesh(new THREE.SphereGeometry(.085,14,14),new THREE.MeshBasicMaterial({color:0xff6a3d}));e.userData.phase=i/8;e.add(particleTag(electronTagTexture));battery.add(e);electrons.push(e)}

const terminalGeo=new THREE.CylinderGeometry(.16,.16,.28,24);const termMat=new THREE.MeshStandardMaterial({color:0xdce8ec,metalness:.9,roughness:.2});[-1.02,1.02].forEach(x=>{const t=new THREE.Mesh(terminalGeo,termMat);t.position.set(x,1.78,0);battery.add(t)});
battery.rotation.y=-.22;

const reticle=new THREE.Mesh(new THREE.RingGeometry(.14,.18,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x28dcf6}));reticle.matrixAutoUpdate=false;reticle.visible=false;scene.add(reticle);
let hitTestSource=null,hitTestRequested=false,inAR=false,placed=false;
const arOverlay=document.querySelector('#arOverlay');
const arInstruction=document.querySelector('#arInstruction');
const isArInterfaceTarget=target=>target.closest('button,.ar-overlay-top,.ar-instruction,.ar-part-card,.ar-particle-legend,.ar-compact-controls,.ar-tools,.ar-exit-slot');
arOverlay.addEventListener('beforexrselect',event=>{if(isArInterfaceTarget(event.target))event.preventDefault()});
let guidanceTimer=null;
let arGestureMovedAt=0;
const arRaycaster=new THREE.Raycaster();
const controller=renderer.xr.getController(0);controller.addEventListener('select',()=>{if(reticle.visible){
  reticle.matrix.decompose(anchor.position,anchor.quaternion,anchor.scale);
  anchor.scale.setScalar(.065);anchor.position.y+=.125;battery.position.set(0,0,0);battery.rotation.set(0,-.22,0);
  anchor.visible=true;placed=true;reticle.visible=false;
  arInstruction.classList.add('placed');arInstruction.querySelector('strong').textContent='BATERIA POSICIONADA';arInstruction.querySelector('span').textContent='Arraste para girar · faça pinça para ampliar · toque numa camada para investigar.';
  clearTimeout(guidanceTimer);guidanceTimer=setTimeout(()=>arInstruction.classList.add('hidden'),2800);
}else if(placed&&performance.now()-arGestureMovedAt>350){
  arRaycaster.setFromXRController(controller);const hit=arRaycaster.intersectObjects(clickable,false)[0];if(hit)selectPart(hit.object.userData.part,true);
}});scene.add(controller);

const arButton=ARButton.createButton(renderer,{requiredFeatures:['hit-test'],optionalFeatures:['dom-overlay'],domOverlay:{root:arOverlay}});
const localizeARButton=()=>{const t=arButton.textContent.trim();const label=t==='START AR'?'ABRIR EM REALIDADE AUMENTADA':t==='STOP AR'?'SAIR DA REALIDADE AUMENTADA':t==='AR NOT SUPPORTED'?'AR NÃO COMPATÍVEL':null;if(label&&t!==label)arButton.textContent=label};
new MutationObserver(localizeARButton).observe(arButton,{childList:true,subtree:true,characterData:true});localizeARButton();document.querySelector('#arButtonSlot').appendChild(arButton);
renderer.xr.addEventListener('sessionstart',()=>{inAR=true;placed=false;explode=0;document.querySelector('#explode').value=0;document.querySelector('#explodeOut').textContent='0%';document.querySelector('#arExplode').classList.remove('active');document.querySelector('#arExplode').setAttribute('aria-pressed','false');document.querySelector('#arExplode').textContent='SEPARAR CAMADAS';anchor.visible=false;controls.enabled=false;arOverlay.classList.add('show');document.querySelector('#arPartCard').classList.remove('show');arInstruction.classList.remove('placed','hidden');arInstruction.querySelector('strong').textContent='ENCONTRE UMA SUPERFÍCIE';arInstruction.querySelector('span').textContent='Mova o celular lentamente. Quando o círculo aparecer, toque para posicionar a bateria.';document.querySelector('#arExitSlot').appendChild(arButton);document.querySelector('#sceneMode').textContent='REALIDADE AUMENTADA'});
renderer.xr.addEventListener('sessionend',()=>{inAR=false;placed=false;explode=0;clearTimeout(guidanceTimer);hitTestSource=null;hitTestRequested=false;reticle.visible=false;anchor.visible=true;anchor.position.set(0,0,0);anchor.rotation.set(0,0,0);anchor.scale.setScalar(1);battery.position.set(0,0,0);battery.rotation.set(0,-.22,0);controls.enabled=true;arOverlay.classList.remove('show');arInstruction.classList.remove('placed','hidden');document.querySelector('#arPartCard').classList.remove('show');document.querySelector('#arButtonSlot').appendChild(arButton);document.querySelector('#sceneMode').textContent='3D INTERATIVO'});

let chemistry='li',cycle='discharge',running=true,speed=1,explode=0,selected='anode';
function updateChem(key){chemistry=key;const d=CHEM[key];document.documentElement.style.setProperty('--ion',d.css);mats.cathode.color.set(d.color);mats.cathode.emissive.set(d.color);ions.forEach(i=>{i.material.color.set(d.color);i.material.emissive.set(d.color)});updateParticleTexture(ionTagTexture,d.ion,'#ffffff');updateSpriteLabel(cathodeLabel,'+ Cátodo',d.color);document.querySelector('#chemTitle').textContent=d.name;document.querySelector('#chemSymbol').textContent=d.ion;document.querySelector('#legendIon').textContent=d.ion;document.querySelector('#arLegendIon').textContent=d.ion;document.querySelectorAll('[data-chem],[data-ar-chem]').forEach(b=>{const on=(b.dataset.chem||b.dataset.arChem)===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});renderParts();selectPart(selected)}
function updateCycle(key){cycle=key;document.querySelectorAll('[data-cycle],[data-ar-cycle]').forEach(b=>{const on=(b.dataset.cycle||b.dataset.arCycle)===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});document.querySelector('#energyFlow').textContent=key==='discharge'?'QUÍMICA → ELÉTRICA':'ELÉTRICA → QUÍMICA';document.querySelector('#redox').textContent=key==='discharge'?'Oxidação no ânodo · redução no cátodo':'Fluxos invertidos pela fonte externa';selectPart(selected)}
function renderParts(){const d=CHEM[chemistry];document.querySelector('#componentGrid').innerHTML=PARTS.map((p,i)=>`<button class="component-card ${p.key===selected?'active':''}" data-part="${p.key}"><small>0${i+1}</small><b>${p.name.toUpperCase()}</b></button>`).join('');document.querySelectorAll('[data-part]').forEach(b=>b.addEventListener('click',()=>selectPart(b.dataset.part)))}
function selectPart(key,showInAR=false){selected=key;const index=PARTS.findIndex(p=>p.key===key);const p=PARTS[index];const d=CHEM[chemistry];const text=p[cycle];document.querySelectorAll('.component-card').forEach(b=>b.classList.toggle('active',b.dataset.part===key));document.querySelector('#detailNumber').textContent=`0${index+1}`;document.querySelector('#detailTitle').textContent=p.name;document.querySelector('#detailText').textContent=text;const material=key==='anode'?d.anode:key==='cathode'?d.cathode:key==='electrolyte'?d.electrolyte:key==='separator'?'Poliolefina microporosa (modelo conceitual)':key==='anodeCollector'?(chemistry==='li'?'Cobre':'Alumínio'):'Alumínio';document.querySelector('#detailMaterial').textContent=`MATERIAL TÍPICO: ${material}`;document.querySelector('.micro-ion').textContent=d.ion;Object.entries(layers).forEach(([k,m])=>{const same=(k===key)||(key==='electrolyte'&&k==='electrolyte2');m.scale.setScalar(same ? 1.045 : .985);if(m.material.emissive)m.material.emissiveIntensity=same ? .7 : (k==='cathode' ? .12 : 0);if(m.material.transparent)m.material.opacity=same ? (k.startsWith('electrolyte') ? .28 : .9) : (k.startsWith('electrolyte') ? .13 : .72)});const focus=layers[key]||layers.electrolyte;focus.add(partLabel);partLabel.position.set(0,-1.92,2.48);updateSpriteLabel(partLabel,p.name);document.querySelector('#arPartTitle').textContent=p.name;document.querySelector('#arPartText').textContent=text;document.querySelector('#arPartMaterial').textContent=`MATERIAL TÍPICO: ${material}`;if(inAR&&showInAR)document.querySelector('#arPartCard').classList.add('show');}

function resize(){const w=sceneHost.clientWidth,h=sceneHost.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}window.addEventListener('resize',resize);resize();
document.querySelectorAll('[data-chem]').forEach(b=>b.addEventListener('click',()=>updateChem(b.dataset.chem)));document.querySelectorAll('[data-cycle]').forEach(b=>b.addEventListener('click',()=>updateCycle(b.dataset.cycle)));document.querySelectorAll('[data-ar-chem]').forEach(b=>b.addEventListener('click',()=>updateChem(b.dataset.arChem)));document.querySelectorAll('[data-ar-cycle]').forEach(b=>b.addEventListener('click',()=>updateCycle(b.dataset.arCycle)));
document.querySelector('#explode').addEventListener('input',e=>{explode=Number(e.target.value)/100;document.querySelector('#explodeOut').textContent=e.target.value+'%'});document.querySelector('#speed').addEventListener('input',e=>{speed=Number(e.target.value);document.querySelector('#speedOut').textContent=speed.toFixed(1).replace('.',',')+'×'});document.querySelector('#pause').addEventListener('click',e=>{running=!running;e.currentTarget.innerHTML=running?'<span>Ⅱ</span> PAUSAR ANIMAÇÃO':'<span>▶</span> CONTINUAR ANIMAÇÃO'});document.querySelector('#resetView').addEventListener('click',()=>{camera.position.set(4.8,3.4,6.8);controls.target.set(0,.15,0);controls.update()});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();renderer.domElement.addEventListener('pointerup',e=>{if(inAR)return;const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(clickable,false)[0];if(hit)selectPart(hit.object.userData.part)});

const arPointers=new Map();let lastPinchDistance=0;
arOverlay.addEventListener('pointerdown',event=>{if(!inAR||!placed||isArInterfaceTarget(event.target))return;arPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});arOverlay.setPointerCapture?.(event.pointerId);if(arPointers.size===2){const p=[...arPointers.values()];lastPinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}});
arOverlay.addEventListener('pointermove',event=>{const previous=arPointers.get(event.pointerId);if(!previous||!placed)return;const dx=event.clientX-previous.x,dy=event.clientY-previous.y;arPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(Math.abs(dx)+Math.abs(dy)>2)arGestureMovedAt=performance.now();if(arPointers.size===1){battery.rotation.y+=dx*.012}else if(arPointers.size===2){const p=[...arPointers.values()],distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(lastPinchDistance){const next=THREE.MathUtils.clamp(anchor.scale.x*(distance/lastPinchDistance),.045,.095);anchor.scale.setScalar(next)}lastPinchDistance=distance}});
const endArPointer=event=>{arPointers.delete(event.pointerId);lastPinchDistance=0};arOverlay.addEventListener('pointerup',endArPointer);arOverlay.addEventListener('pointercancel',endArPointer);
document.querySelector('#arPartClose').addEventListener('click',()=>document.querySelector('#arPartCard').classList.remove('show'));
document.querySelector('#arExplode').addEventListener('click',event=>{const active=explode<.5;explode=active ? .72 : 0;event.currentTarget.classList.toggle('active',active);event.currentTarget.setAttribute('aria-pressed',String(active));event.currentTarget.textContent=active?'JUNTAR CAMADAS':'SEPARAR CAMADAS'});
document.querySelector('#arReset').addEventListener('click',()=>{if(!placed)return;battery.rotation.set(0,-.22,0);anchor.scale.setScalar(.065)});
document.querySelector('#arReposition').addEventListener('click',()=>{if(!inAR)return;placed=false;explode=0;anchor.visible=false;document.querySelector('#arPartCard').classList.remove('show');document.querySelector('#arExplode').classList.remove('active');document.querySelector('#arExplode').setAttribute('aria-pressed','false');document.querySelector('#arExplode').textContent='SEPARAR CAMADAS';arInstruction.classList.remove('placed','hidden');arInstruction.querySelector('strong').textContent='ESCOLHA UM NOVO PONTO';arInstruction.querySelector('span').textContent='Mova o celular e toque no círculo para reposicionar a bateria.'});

const clock=new THREE.Clock();
function animate(timestamp,frame){
  const dt=clock.getDelta(),t=clock.elapsedTime; if(!inAR)controls.update();
  const spread=explode*1.05; const targets={anode:-.76-spread*2.1,anodeCollector:-.48-spread*1.35,electrolyte:-.22-spread*.7,separator:0,electrolyte2:.22+spread*.7,cathodeCollector:.48+spread*1.35,cathode:.76+spread*2.1};Object.entries(targets).forEach(([k,x])=>layers[k].position.x=THREE.MathUtils.lerp(layers[k].position.x,x,.08));
  if(running){const direction=cycle==='discharge'?1:-1;ions.forEach(i=>{i.userData.phase=(i.userData.phase+dt*.18*speed*direction+1)%1;i.position.set(THREE.MathUtils.lerp(-.63,.63,i.userData.phase),i.userData.y,i.userData.z);i.scale.setScalar(.78+Math.sin(t*3+i.userData.phase*9)*.12)});electrons.forEach(e=>{e.userData.phase=(e.userData.phase+dt*.14*speed*direction+1)%1;e.position.copy(curve.getPoint(e.userData.phase))})}
  if(frame){const ref=renderer.xr.getReferenceSpace(),session=renderer.xr.getSession();if(!hitTestRequested){session.requestReferenceSpace('viewer').then(space=>session.requestHitTestSource({space})).then(source=>{hitTestSource=source});session.addEventListener('end',()=>{hitTestRequested=false;hitTestSource=null});hitTestRequested=true}if(hitTestSource){const hits=frame.getHitTestResults(hitTestSource);if(hits.length){reticle.visible=!placed;reticle.matrix.fromArray(hits[0].getPose(ref).transform.matrix)}else reticle.visible=false}}
  renderer.render(scene,camera);
}
renderer.setAnimationLoop(animate);renderParts();selectPart('anode');
