import * as THREE from 'three';

export function isAnimeStyle(id: string) { return ['awakening', 'voltage', 'summon'].includes(id); }

export function drawAnimeTrim(ctx: CanvasRenderingContext2D, id: string, color: string, secondary: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(26, 108); ctx.lineTo(26, 36); ctx.lineTo(630, 36); ctx.lineTo(774, 130);
  ctx.lineTo(774, 964); ctx.lineTo(70, 964); ctx.lineTo(26, 940); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#0d1728dd';
  ctx.beginPath(); ctx.moveTo(24, 32); ctx.lineTo(420, 32); ctx.lineTo(384, 100); ctx.lineTo(24, 100); ctx.closePath(); ctx.fill();
  ctx.fillStyle = color; ctx.font = 'bold 23px sans-serif'; ctx.fillText(id === 'awakening' ? 'AWAKENING' : id === 'voltage' ? 'OVERVOLT / 03' : 'ARCANA / VII', 55, 76);
  ctx.strokeStyle = secondary; ctx.lineWidth = 3;
  if (id === 'awakening') {
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(590 + i * 30, 42); ctx.lineTo(770, 160 + i * 28); ctx.stroke(); }
    for (let y = 135; y < 705; y += 14) for (let x = 38; x < 68; x += 12) { ctx.fillStyle = '#ffcc7555'; ctx.fillRect(x, y, 3, 3); }
  } else if (id === 'voltage') {
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 3 ? color : secondary; ctx.fillRect(750 - i % 3 * 8, 150 + i * 43, 18, 4); }
    ctx.strokeRect(36, 710, 55, 12); ctx.strokeRect(100, 710, 18, 12);
  } else {
    ctx.save(); ctx.translate(400, 475); ctx.strokeStyle = secondary; ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 8); ctx.translate(255, 0);
      ctx.beginPath(); ctx.moveTo(-9,-12); ctx.lineTo(9,0); ctx.lineTo(-9,12); ctx.moveTo(-9,-12); ctx.lineTo(-9,12); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }
  ctx.fillStyle = secondary; ctx.fillRect(60, 744, 58, 4);
}

export function buildAnimeEffect(id: string, color: string, secondary: string) {
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, strength: { value: .85 }, kind: { value: id === 'awakening' ? 0 : id === 'voltage' ? 1 : 2 }, tint: { value: new THREE.Color(color) }, secondary: { value: new THREE.Color(secondary) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float time; uniform float strength; uniform float kind; uniform vec3 tint; uniform vec3 secondary;
      float line(float d,float width){return 1.0-smoothstep(width,width+max(fwidth(d),0.0007),abs(d));}
      float hash(float v){return fract(sin(v*127.1)*43758.5453);}
      void main(){
        vec2 uv=vUv; if(uv.x<0.035||uv.x>0.965||uv.y<0.035||uv.y>0.965) discard;
        float protect=smoothstep(0.18,0.32,uv.y)*(1.0-smoothstep(0.87,0.95,uv.y));
        vec2 p=(uv-vec2(0.5,0.56))*vec2(0.8,1.0);
        float r=length(p); float a=atan(p.y,p.x); float light=0.0; vec3 color=tint;
        if(kind<0.5){
          float sector=floor((a+3.14159)*24.0);
          float spoke=pow(max(0.0,cos(a*76.0+sin(sector)*2.0)),24.0);
          float pulse=0.68+0.32*sin(time*2.2+r*23.0+sector);
          float speed=spoke*smoothstep(0.15+hash(sector)*0.14,0.49,r)*pulse;
          float streak=pow(max(0.0,sin(a*31.0+sin(a*11.0)*1.6)),40.0)*smoothstep(0.22,0.45,r);
          float flare=exp(-abs(r-(0.29+0.018*sin(a*13.0-time*1.6)))*110.0)*0.3;
          light=speed*1.2+streak*0.9+flare;
          color=mix(secondary,vec3(1.0,0.95,0.69),clamp(speed*1.3,0.0,1.0));
        }else if(kind<1.5){
          float segment=floor(uv.y*26.0); float clock=floor(time*5.0);
          float jagged=mix(hash(segment+clock),hash(segment+1.0+clock),fract(uv.y*26.0));
          float bolt=0.09+jagged*0.13+0.014*sin(uv.y*115.0+time);
          float d=min(abs(uv.x-bolt),abs(1.0-uv.x-bolt-0.025*sin(time)));
          float arc=line(d,0.0025)+exp(-d*80.0)*0.45;
          float band=line(uv.y-(0.3+fract(time*0.16)*0.52),0.009);
          float blocks=step(0.83,hash(floor(uv.y*80.0)+clock))*step(0.67,abs(uv.x-0.5)*2.0);
          light=arc+band*0.25+blocks*0.38;
          color=mix(tint,secondary,step(0.5,uv.x)); color=mix(color,vec3(1.0),line(d,0.0012)*0.8);
        }else{
          float outer=line(r-0.305,0.0018)+line(r-0.286,0.0010);
          float inner=line(r-0.22,0.0013);
          float ticks=line(r-0.295,0.007)*pow(max(0.0,cos((a+time*0.22)*32.0)),18.0);
          float tri=cos(mod(a+time*0.18+3.14159/3.0,6.28318/3.0)-3.14159/3.0)*r;
          float tri2=cos(mod(a-time*0.14+3.14159/3.0+3.14159,6.28318/3.0)-3.14159/3.0)*r;
          float seal=line(tri-0.125,0.0016)+line(tri2-0.125,0.0016);
          float arc=line(r-0.24,0.003)*smoothstep(0.35,0.8,sin(a*3.0-time*0.55));
          light=outer+ticks+inner*0.65+seal*0.75+arc;
          color=mix(tint,secondary,0.5+0.5*sin(a+time*0.2));
        }
        gl_FragColor=vec4(color,clamp(light*protect*strength,0.0,0.94));
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.5), material);
  mesh.userData.layerIndex = 6; mesh.userData.gameEnergy = true;
  return mesh;
}
