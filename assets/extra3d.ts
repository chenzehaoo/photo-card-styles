import * as THREE from 'three';

export const extraStyles = [
  { id: 'inkblade', name: '水墨剑气', color: '#e9eee5', second: '#ec555c', base: '#20272b' },
  { id: 'aurora', name: '极光星轨', color: '#87f1bc', second: '#da9be9', base: '#253c40' },
  { id: 'lava', name: '熔岩裂隙', color: '#ffb865', second: '#fa594c', base: '#3a272b' },
  { id: 'shatter', name: '冰晶碎镜', color: '#bce9fb', second: '#c1bdf7', base: '#2c3c49' },
  { id: 'rhythm', name: '霓虹音浪', color: '#72f2d9', second: '#ef81c5', base: '#293541' },
  { id: 'comic', name: '漫画冲击', color: '#ffe37f', second: '#f17996', base: '#34302c' },
  { id: 'diffraction', name: '衍射光栅', color: '#9affde', second: '#ffa1db', base: '#24333b' },
  { id: 'origami', name: '折纸晶面', color: '#f5dc9b', second: '#92d6f2', base: '#30353a' },
  { id: 'matrix', name: '数据雨幕', color: '#abff9e', second: '#76cfff', base: '#20352c' },
  { id: 'sakura', name: '樱华飞舞', color: '#ffb8d6', second: '#fff0c3', base: '#392939' },
  { id: 'portal', name: '时空回廊', color: '#80eaff', second: '#ff8d68', base: '#273442' },
  { id: 'circuit', name: '符文回路', color: '#f8d780', second: '#a1f3df', base: '#283936' },
] as const;

export function isExtraStyle(id: string) { return extraStyles.some(style => style.id === id); }

export function drawExtraTrim(ctx: CanvasRenderingContext2D, id: string, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = id === 'comic' ? 8 : 2;
  if (id === 'inkblade') {
    for (let i=0;i<5;i++) { ctx.globalAlpha = .8-i*.13; ctx.beginPath(); ctx.moveTo(30+i*3,130); ctx.lineTo(38+i*2,850); ctx.stroke(); }
    ctx.globalAlpha=1; ctx.fillStyle='#bb3445'; ctx.fillRect(700,55,48,65); ctx.strokeStyle='#f3dfd8'; ctx.strokeRect(709,64,30,47);
  } else {
    ctx.beginPath(); ctx.roundRect(26,26,748,948,id === 'shatter' ? 0 : 12); ctx.stroke();
    if (id === 'shatter') { ctx.beginPath(); ctx.moveTo(26,190); ctx.lineTo(175,26); ctx.moveTo(774,740); ctx.lineTo(645,974); ctx.stroke(); }
    if (id === 'comic') { ctx.fillStyle='#ffe37f'; ctx.beginPath(); ctx.moveTo(25,30); ctx.lineTo(385,30); ctx.lineTo(345,105); ctx.lineTo(25,105); ctx.fill(); }
    if (['diffraction', 'matrix', 'circuit'].includes(id)) {
      for (let i=0;i<12;i++) { ctx.fillStyle=color; ctx.fillRect(738,155+i*37, i%3 ? 12 : 25, 2); }
    }
    if (id === 'origami' || id === 'portal') {
      for (let i=0;i<3;i++) { ctx.beginPath(); ctx.moveTo(45+i*12,180); ctx.lineTo(45+i*12,110); ctx.lineTo(120,40+i*12); ctx.stroke(); }
    }
    if (id === 'sakura') {
      ctx.save(); ctx.translate(720,80);
      for (let i=0;i<5;i++) { ctx.rotate(Math.PI*2/5); ctx.beginPath(); ctx.ellipse(0,12,5,12,0,0,Math.PI*2); ctx.stroke(); }
      ctx.restore();
    }
  }
  ctx.fillStyle = id === 'comic' ? '#20232b' : color; ctx.font='bold 22px sans-serif'; ctx.fillText(id.toUpperCase(),56,77);
  ctx.fillStyle=color; ctx.fillRect(60,744,45,3);
}

export function buildExtraEffect(id: string, color: string, secondary: string) {
  const material = new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, side:THREE.DoubleSide,
    uniforms:{ time:{value:0}, strength:{value:.85}, kind:{value:extraStyles.findIndex(style=>style.id===id)}, tint:{value:new THREE.Color(color)}, secondary:{value:new THREE.Color(secondary)} },
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec2 vUv; uniform float time; uniform float strength; uniform float kind; uniform vec3 tint; uniform vec3 secondary;
      float line(float d,float w){return 1.0-smoothstep(w,w+max(fwidth(d),0.001),abs(d));}
      float hash(float x){return fract(sin(x*127.1)*43758.5453);}
      void main(){
        vec2 uv=vUv; if(uv.x<0.035||uv.x>0.965||uv.y<0.04||uv.y>0.96) discard;
        float mask=smoothstep(0.18,0.32,uv.y)*(1.0-smoothstep(0.86,0.95,uv.y));
        vec2 p=(uv-vec2(.5,.56))*vec2(.8,1.0); float r=length(p);float a=atan(p.y,p.x);
        float light=0.0;vec3 c=tint;
        if(kind<.5){
          float slash=uv.x*.8-uv.y*.62+.01*sin(uv.y*60.0+time*.8);
          float brush=line(slash+.1,.018)+line(slash-.30,.012);
          float grain=.6+.4*sin(uv.y*370.0+uv.x*89.0);
          float edge=line(slash+.125,.002)+line(slash-.32,.002);
          light=brush*grain*.85+edge;
          c=mix(vec3(.025,.035,.04),tint,clamp(edge,0.0,1.0));
        }else if(kind<1.5){
          float y=.67+.07*sin(uv.x*7.0+time*.5)+.04*sin(uv.x*13.0-time*.3);
          float curtain=exp(-abs(uv.y-y)*14.0)*(.35+.35*sin(uv.x*120.0+time*.6));
          float arc=line(length(p*vec2(1.0,1.7))-.36,.002)*(0.55+.45*sin(a*4.0-time));
          light=curtain+arc*.6;c=mix(tint,secondary,.5+.5*sin(uv.x*6.0+time*.25));
        }else if(kind<2.5){
          vec2 q=uv*vec2(8.0,11.0);q+=vec2(sin(q.y*1.6),sin(q.x*1.2))*.32;
          vec2 cell=abs(fract(q)-.5);float crack=.5-max(cell.x,cell.y);
          float seam=exp(-crack*85.0);float pulse=.65+.35*sin(time*1.4+floor(q.x)*.7+floor(q.y));
          float border=smoothstep(.12,.42,abs(uv.x-.5));
          light=seam*pulse*(.22+border*.8);c=mix(secondary,tint,seam);
        }else if(kind<3.5){
          vec2 q=vec2(uv.x+uv.y*.5,uv.y-uv.x*.5)*9.0;
          vec2 cell=fract(q);float edge=min(min(cell.x,1.0-cell.x),min(cell.y,1.0-cell.y));
          edge=min(edge,abs(cell.x-cell.y)*.7);
          float facet=hash(floor(q.x)+floor(q.y)*37.0);
          float gleam=pow(max(0.0,sin(facet*6.28+time*.6+uv.x*2.0)),12.0);
          light=line(edge,.009)*(.18+gleam*.65)+gleam*.21;
          c=mix(tint,secondary,facet);
        }else if(kind<4.5){
          float n=floor(uv.x*28.0);float amp=.07+.18*(.5+.5*sin(n*.8+time*1.8))* (.65+.35*sin(n*1.7-time));
          float bar=step(.18,fract(uv.x*28.0))*step(fract(uv.x*28.0),.82)*step(.28,uv.y)*(1.0-smoothstep(.28+amp,.286+amp,uv.y));
          float wave=line(uv.y-(.70+.045*sin(uv.x*24.0-time*1.7)),.0025);
          light=bar*.85+wave;c=mix(tint,secondary,uv.x);
        }else if(kind<5.5){
          vec2 cell=fract(uv*vec2(65.0,81.0))-.5;
          float dots=1.0-smoothstep(.13,.17,length(cell));
          float rays=pow(max(0.0,sin(a*39.0+sin(a*13.0))),20.0)*smoothstep(.16,.47,r);
          float beat=.75+.25*sin(time*1.6+r*26.0);
          light=(rays*.9+dots*smoothstep(.23,.5,r)*.6)*beat;
          c=mix(vec3(.02,.025,.03),tint,step(.5,rays));
        }else if(kind<6.5){
          float diagonal=uv.x+uv.y*.65;
          float grating=pow(.5+.5*sin(diagonal*260.0+time*2.0),16.0);
          float bands=pow(.5+.5*sin(diagonal*18.0-time*.8),6.0);
          c=.5+.5*cos(diagonal*9.0-time*.5+vec3(0.0,2.1,4.2));
          light=grating*.3+bands*.48;
        }else if(kind<7.5){
          vec2 q=uv*vec2(5.0,7.0);vec2 cell=fract(q);
          float tri=step(cell.x,cell.y);float n=hash(floor(q.x)+floor(q.y)*29.0+tri*7.0);
          float fold=line(cell.x-cell.y,.012);
          float glint=pow(max(0.0,sin(n*6.28+time*.7)),10.0);
          light=fold*(.2+glint*.65)+glint*.24;
          c=mix(tint,secondary,n);
        }else if(kind<8.5){
          float col=floor(uv.x*24.0);float speed=.1+hash(col)*.2;
          vec2 grid=vec2(uv.x*24.0,uv.y*35.0+time*speed*35.0);
          vec2 cell=fract(grid);float seed=hash(col*31.0+floor(grid.y));
          float glyph=max(line(cell.x-.3,.055)*step(.18,cell.y)*step(cell.y,.8),line(cell.y-.5,.05)*step(.25,cell.x)*step(cell.x,.75));
          glyph+=line(cell.x-.7,.05)*step(.48,cell.y)*step(cell.y,.8)*step(.5,seed);
          float trail=pow(fract(uv.y+time*speed+hash(col)),5.0);
          light=glyph*trail*.9;c=mix(tint,secondary,seed);
        }else if(kind<9.5){
          for(int i=0;i<18;i++){
            float seed=float(i);float x=hash(seed+4.0);float speed=.035+hash(seed+22.0)*.06;
            vec2 center=vec2(x+.04*sin(time*.7+seed),fract(hash(seed+13.0)-time*speed));
            vec2 d=(uv-center)*vec2(.8,1.0);float angle=time*.4+seed;
            d=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*d;
            float petal=1.0-smoothstep(.8,1.0,length(d/vec2(.009,.021)));
            light+=petal*(.35+.45*hash(seed+8.0));
          }
          c=mix(tint,secondary,.5+.5*sin(uv.y*5.0+time*.3));
        }else if(kind<10.5){
          float box=max(abs(p.x)*1.25,abs(p.y));
          float tunnel=fract(-log(max(box,.015))*2.6-time*.4);
          float rails=pow(max(0.0,cos(a*8.0)),45.0)*smoothstep(.13,.4,r);
          light=line(tunnel-.5,.022)*smoothstep(.10,.35,r)*.75+rails*.45;
          c=mix(tint,secondary,.5+.5*sin(box*12.0-time));
        }else{
          vec2 q=uv*vec2(8.0,10.0);vec2 cell=fract(q)-.5;
          float n=hash(floor(q.x)+floor(q.y)*19.0);
          if(n>.5) cell=cell.yx;
          float trace=line(cell.x,.015)*step(cell.y,.22)+line(cell.y-.22,.015)*step(0.0,cell.x);
          float node=line(length(cell-vec2(0.0,.22))-.08,.018);
          float pulse=pow(.5+.5*sin(q.y*1.5+q.x-time*2.0),12.0);
          light=(trace*.4+node*.65)*( .35+pulse);c=mix(tint,secondary,pulse);
        }
        gl_FragColor=vec4(c,clamp(light*mask*strength,0.0,.9));
      }`,
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2.5),material);
  mesh.userData.layerIndex=6; mesh.userData.gameEnergy=true; return mesh;
}
