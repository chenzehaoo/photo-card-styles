import * as THREE from 'three';
import type { CardRender } from './export';
import { buildGameFrame, buildGameEnergy } from './game3d';
import { isAnimeStyle, drawAnimeTrim, buildAnimeEffect } from './anime3d';
import { extraStyles, isExtraStyle, drawExtraTrim, buildExtraEffect } from './extra3d';

export const layeredPresets = [
  ...extraStyles,
  { id: 'awakening', name: '热血觉醒', color: '#ffe28e', second: '#ff563d', base: '#371f25' },
  { id: 'voltage', name: '赛博电击', color: '#7ef4fb', second: '#ff72ba', base: '#1d303d' },
  { id: 'summon', name: '魔法召唤', color: '#f9dca0', second: '#6ce8c9', base: '#263832' },
  { id: 'holo', name: '全息镭射', color: '#b9d8ef', second: '#f1d39d', base: '#262d37' },
  { id: 'mythic', name: '秘金圣器', color: '#78edc7', second: '#ebc66c', base: '#29291e' },
  { id: 'cyber', name: '赛博机甲', color: '#62f5e1', second: '#ed81ba', base: '#1d272a' },
  { id: 'frost', name: '冰晶契约', color: '#b5eaff', second: '#d6dbf6', base: '#283a43' },
  { id: 'neon', name: '霓虹叠影', color: '#64e6ce', second: '#fa879e', base: '#152c2b' },
  { id: 'prism', name: '晶透棱镜', color: '#d2eaf0', second: '#e7b5bb', base: '#405a65' },
] as const;
export type LayeredPresetId = typeof layeredPresets[number]['id'];

function rounded(ctx: CanvasRenderingContext2D, inset = 0, radius = 28) {
  ctx.beginPath(); ctx.roundRect(inset, inset, 800 - inset * 2, 1000 - inset * 2, radius);
}

function canvasTexture(draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 2000;
  const ctx = canvas.getContext('2d')!; ctx.scale(2, 2); draw(ctx);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}

function drawPhoto(ctx: CanvasRenderingContext2D, captured: CardRender) {
  const r = captured.imageRect, src = captured.canvas;
  let sw = r.width * src.width, sh = r.height * src.height;
  let sx = r.x * src.width, sy = r.y * src.height;
  // Cover without stretching the source photograph.
  if (sw / sh > .8) { sx += (sw - sh * .8) / 2; sw = sh * .8; }
  else { sy += (sh - sw / .8) / 2; sh = sw / .8; }
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, 800, 1000);
}

function titleLines(ctx: CanvasRenderingContext2D, caption: string, comic = false) {
  for (let size = 66; size >= 18; size -= 2) {
    ctx.font = comic ? `italic 800 ${size}px "Microsoft YaHei", sans-serif` : `500 ${size}px Georgia, "Microsoft YaHei", serif`;
    const lines: string[] = []; let line = '';
    for (const char of Array.from(caption)) {
      if (char === '\n' || ctx.measureText(line + char).width > 650) { lines.push(line); line = ''; }
      if (char !== '\n') line += char;
    }
    if (line) lines.push(line);
    if (lines.length * size * 1.2 <= 175) return { lines, size };
  }
  return { lines: [caption], size: 18 };
}

export function buildLayeredCard(id: LayeredPresetId, captured: CardRender, caption: string, fillCorners = false) {
  const preset = layeredPresets.find(item => item.id === id)!;
  const group = new THREE.Group();
  const add = (map: THREE.Texture, index: number) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.5), new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: .002, side: THREE.DoubleSide, toneMapped: false }));
    mesh.userData.layerIndex = index; group.add(mesh); return mesh;
  };
  // Use the same photo mapping underneath the unchanged card, behind every existing layer.
  if (fillCorners) add(canvasTexture(ctx => drawPhoto(ctx, captured)), -1);
  add(canvasTexture(ctx => {
    rounded(ctx); ctx.clip(); ctx.fillStyle = preset.base; ctx.fillRect(0, 0, 800, 1000);
    const metal = ctx.createLinearGradient(0, 0, 800, 1000);
    metal.addColorStop(0, preset.color); metal.addColorStop(.3, '#56636a'); metal.addColorStop(.55, '#f0f0e6'); metal.addColorStop(1, preset.second);
    ctx.fillStyle = metal; ctx.fillRect(0, 0, 800, 1000);
    rounded(ctx, 8, 22); ctx.fillStyle = preset.base; ctx.fill();
    ctx.strokeStyle = preset.color; ctx.lineWidth = 1; rounded(ctx, 26, 12); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#eef5f5'; ctx.font = '32px Georgia'; ctx.fillText('SERENE', 400, 495);
  }), 0);
  add(canvasTexture(ctx => { rounded(ctx, 12, 19); ctx.clip(); drawPhoto(ctx, captured); }), 1);
  add(canvasTexture(ctx => {
    rounded(ctx, 12, 19); ctx.clip();
    const shade = ctx.createLinearGradient(0, 0, 0, 1000);
    shade.addColorStop(0, '#08171890'); shade.addColorStop(.22, '#08171800'); shade.addColorStop(.52, '#08171800'); shade.addColorStop(1, '#07181bf5');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, 800, 1000);
    ctx.strokeStyle = preset.color; ctx.globalAlpha = .32; ctx.lineWidth = 1;
    if (id === 'neon') {
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(25 + i * 9, 130); ctx.lineTo(25 + i * 9, 720); ctx.lineTo(130 + i * 9, 820); ctx.stroke(); }
    } else if (id === 'holo') {
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(560 + i * 22, 28); ctx.lineTo(772, 240 + i * 22); ctx.stroke(); }
    } else { ctx.beginPath(); ctx.moveTo(28, 200); ctx.lineTo(205, 28); ctx.moveTo(772, 690); ctx.lineTo(590, 972); ctx.stroke(); }
  }), 2);
  add(canvasTexture(ctx => {
    if (isExtraStyle(id)) { drawExtraTrim(ctx,id,preset.color); return; }
    if (isAnimeStyle(id)) { drawAnimeTrim(ctx, id, preset.color, preset.second); return; }
    ctx.strokeStyle = preset.color; ctx.lineWidth = 1.5; rounded(ctx, 24, 12); ctx.stroke();
    ctx.strokeStyle = preset.second; ctx.lineWidth = 3;
    for (const [x, y, dx, dy] of [[24, 24, 1, 1], [776, 24, -1, 1], [24, 976, 1, -1], [776, 976, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(x, y + dy * 44); ctx.lineTo(x, y); ctx.lineTo(x + dx * 44, y); ctx.stroke();
    }
    ctx.fillStyle = '#eff7f2'; ctx.font = '18px sans-serif'; ctx.fillText('SERENE / COLLECTION', 62, 74);
    ctx.textAlign = 'right'; ctx.fillStyle = preset.color; ctx.fillText(id.toUpperCase(), 720, 86);
    ctx.fillStyle = preset.color; ctx.fillRect(62, 738, 40, 3);
  }), 3);
  add(canvasTexture(ctx => {
    ctx.fillStyle = '#f5f7f2'; ctx.textBaseline = 'bottom';
    const { lines, size } = titleLines(ctx, caption, isAnimeStyle(id));
    lines.forEach((line, i) => {
      const y = 940 - (lines.length - 1 - i) * size * 1.2;
      if (isAnimeStyle(id)) { ctx.strokeStyle = '#10202b'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeText(line, 62, y, 650); }
      ctx.fillText(line, 62, y, 650);
    });
  }), 4);
  const foil = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { strength: { value: .4 }, time: { value: 0 }, pattern: { value: 0 }, roundedEdge: { value: 1 }, tint: { value: new THREE.Color(preset.color) }, holographic: { value: id === 'holo' ? 1 : .2 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vNormal; void main(){ vUv=uv; vNormal=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; varying vec3 vNormal; uniform float strength; uniform vec3 tint; uniform float holographic;
      uniform float time; uniform float pattern; uniform float roundedEdge;
      vec3 spectrum(float x){ return pow(0.5+0.5*cos(6.283185*(x+vec3(0.0,0.333,0.667))),vec3(0.75)); }
      void main(){
        vec2 p=abs(vUv-0.5)-vec2(0.465,0.472);
        float sdf=length(max(p,0.0))+min(max(p.x,p.y),0.0)-0.028;
        if(roundedEdge>0.5 && sdf>0.0) discard;
        float angle=vNormal.x*1.5+vNormal.y*0.65;
        vec3 rainbow=0.5+0.5*cos(6.2831*(vUv.x*0.6+vUv.y*0.3+angle+vec3(0.0,0.33,0.67)));
        float edge=(1.0-smoothstep(0.004,0.026,-sdf))*roundedEdge;
        float sweep=pow(max(0.0,cos((vUv.x+vUv.y*0.45+angle)*5.0)),32.0);
        float captionMask=smoothstep(0.18,0.32,vUv.y);
        if(holographic>0.9){
          float phase=angle*1.65+sin(time*0.42)*0.24;
          vec2 uv=vUv;
          float diagonal=uv.x*0.85+uv.y*0.65;
          vec2 cell=fract(vec2(uv.x+uv.y,uv.y-uv.x)*18.0)-0.5;
          float facet=abs(cell.x)+abs(cell.y);
          float grating=sin((uv.x*0.85-uv.y)*550.0+phase*30.0);
          float detail=pattern<0.5 ? sin(uv.y*12.0+uv.x*8.0)*0.035 : pattern<1.5 ? facet*0.23 : grating*0.018;
          vec3 chroma=spectrum(diagonal*1.7+phase+detail);
          float band=0.5+0.5*sin(diagonal*12.0+phase*6.0);
          float spec=pow(max(0.0,cos((diagonal+phase*0.65-0.55)*5.4)),30.0);
          float etched=1.0-smoothstep(0.022,0.022+fwidth(facet)*1.5,abs(facet-0.5));
          float textureLight=pattern<0.5 ? 0.03*grating : pattern<1.5 ? etched*0.22 : grating*0.09;
          vec3 film=mix(chroma,vec3(1.0),clamp(spec*0.88+textureLight,0.0,0.95));
          float coverage=(0.36+band*0.3+spec*0.22+textureLight)*strength;
          coverage*=mix(0.12,1.0,captionMask);
          coverage=max(coverage,edge*strength*0.95);
          gl_FragColor=vec4(film,clamp(coverage,0.0,0.9));
          return;
        }
        vec3 color=mix(tint,rainbow,holographic);
        gl_FragColor=vec4(color,(edge*0.7+sweep*0.18*captionMask)*strength);
      }`,
  });
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.5), foil);
  sheen.userData.layerIndex = 5; sheen.userData.animatedFoil = id === 'holo'; group.add(sheen);
  if (['mythic', 'cyber', 'frost'].includes(id)) {
    group.add(buildGameFrame(id,preset.color));
    group.add(buildGameEnergy(id,preset.color));
  }
  if (isAnimeStyle(id)) group.add(buildAnimeEffect(id, preset.color, preset.second));
  if (isExtraStyle(id)) group.add(buildExtraEffect(id,preset.color,preset.second));
  updateLayeredCard(group, 1, .4); return group;
}

export function updateLayeredCard(group: THREE.Group, spacing: number, shine: number, expanded = 0, pattern = 0) {
  for (const object of group.children) {
    const index = object.userData.layerIndex as number;
    object.position.z = (index - 2.5) * (.014 + expanded * .23 * spacing);
    object.position.x = (index - 2.5) * .045 * expanded;
    object.rotation.z = (index - 2.5) * -.025 * expanded;
    if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial) {
      object.material.uniforms.strength.value = shine;
      if (object.material.uniforms.pattern) object.material.uniforms.pattern.value = pattern;
    }
  }
}
