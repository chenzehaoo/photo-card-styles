<template>
  <section class="photo-scene">
    <div class="scene-topbar"><h2>{{ effect === 'layers' ? '收藏卡牌' : '立体照片' }}</h2><select v-model="effect" aria-label="立体模式"><option value="frame">实体相框</option><option value="depth">景深浮雕</option><option value="layers">多层卡牌</option></select></div>
    <div class="scene-preview">
    <div ref="surface" class="scene-surface" :aria-busy="loading" @pointermove="hoverTilt" @pointerleave="hoverOut">
      <div v-if="loading || error" class="scene-message" role="status"><span>{{ error || '正在生成照片纹理' }}</span><NativeButton v-if="error" role="button" @click="retry">重试</NativeButton></div>
    </div>
    <div v-if="effect === 'layers'" class="assembly-controls" role="group" aria-label="卡牌展示">
      <NativeButton :aria-pressed="!expanded" @click="expanded = false"><span class="material-symbols-outlined" aria-hidden="true">layers</span>完整叠合</NativeButton>
      <NativeButton :aria-pressed="expanded" @click="expanded = true"><span class="material-symbols-outlined" aria-hidden="true">view_agenda</span>分层查看</NativeButton>
    </div>
    <div class="scene-toolbar">
      <div class="rotation-controls" role="group" aria-label="旋转视角">
        <NativeButton v-for="direction in rotationDirections" :key="direction.label" :title="direction.label" :aria-label="direction.label" :disabled="!ready" @click="rotateStep(direction.yaw, direction.pitch)"><span class="material-symbols-outlined" aria-hidden="true">{{ direction.icon }}</span></NativeButton>
      </div>
      <NativeButton role="button" title="翻面" aria-label="翻面" :disabled="!ready" @click="flip"><span class="material-symbols-outlined" aria-hidden="true">flip</span></NativeButton>
      <NativeButton role="button" title="复位视角" aria-label="复位视角" :disabled="!ready" @click="reset"><span class="material-symbols-outlined" aria-hidden="true">restart_alt</span></NativeButton>
      <span class="toolbar-divider"></span>
      <NativeButton role="switch" class="motion-toggle" aria-label="拖动旋转" :aria-checked="interact" @click="interact = !interact"><span class="switch-track"><span></span></span>拖动旋转</NativeButton>
      <NativeButton role="button" title="放大" aria-label="放大" @click="zoom(.85)"><span class="material-symbols-outlined" aria-hidden="true">zoom_in</span></NativeButton>
      <NativeButton role="button" title="缩小" aria-label="缩小" @click="zoom(1.15)"><span class="material-symbols-outlined" aria-hidden="true">zoom_out</span></NativeButton>
      <NativeButton role="switch" class="motion-toggle" aria-label="自动旋转" :aria-checked="autoRotate" @click="autoRotate = !autoRotate"><span class="switch-track"><span></span></span>旋转</NativeButton>
      <NativeButton role="switch" class="motion-toggle" aria-label="跟随倾斜" :aria-checked="follow" @click="follow = !follow"><span class="switch-track"><span></span></span>跟随</NativeButton>
      <NativeButton v-if="effect === 'layers'" role="switch" class="motion-toggle" aria-label="动态光效" :aria-checked="energyMotion" @click="energyMotion = !energyMotion"><span class="switch-track"><span></span></span>光效</NativeButton>
      <NativeButton role="button" class="scene-export" :disabled="!ready || loading || !!error || exporting" @click="exportScene"><span class="material-symbols-outlined" aria-hidden="true">photo_camera</span>导出当前视角</NativeButton>
    </div>
    </div>
    <div v-if="effect === 'layers'" class="frame-presets layered-presets" role="group" aria-label="卡牌风格">
      <div class="preset-filter"><select v-model="styleCategory" aria-label="卡牌风格分类"><option value="all">全部风格 · {{ layeredPresets.length }}</option><option value="new">创意特效 · {{ layeredPresets.filter(preset => isExtraStyle(preset.id)).length }}</option><option value="anime">动漫战斗 · 3</option><option value="game">游戏材质 · 3</option><option value="foil">光学镭射 · 3</option></select><span>当前：{{ layeredPresets.find(preset => preset.id === layerStyle)?.name }}</span></div>
      <NativeButton v-for="preset in visiblePresets" :key="preset.id" role="button" :aria-pressed="layerStyle === preset.id" @click="layerStyle = preset.id; revealPreview()"><span class="frame-swatch layered-swatch" :style="{ borderColor: preset.color, background: preset.base, boxShadow: '3px 2px 2px ' + preset.second }"><img :src="card.image" alt="" /></span><span>{{ preset.name }}</span><span v-if="layerStyle === preset.id" class="preset-selected material-symbols-outlined" aria-hidden="true">check</span></NativeButton>
    </div>
    <div v-else class="frame-presets" role="group" aria-label="相框材质">
      <NativeButton v-for="preset in framePresets" :key="preset.id" role="button" :aria-pressed="frameStyle === preset.id" :title="preset.name" @click="frameStyle = preset.id; revealPreview()"><span class="frame-swatch" :style="{ borderColor: preset.color }"></span><span>{{ preset.name }}</span></NativeButton>
    </div>
    <div class="scene-settings">
      <label>摄影棚<select v-model="studio" aria-label="摄影棚"><option value="daylight">柔光白</option><option value="rose">雾粉</option><option value="graphite">石墨灰</option></select></label>
      <label v-if="effect !== 'layers'">光照<NativeField v-model="exposure" type="range" min="65" max="140" aria-label="光照强度" /><span>{{ exposure }}%</span></label>
      <label v-if="effect !== 'layers'">相框厚度<NativeField v-model="thickness" type="range" min="3" max="24" aria-label="相框厚度" /><span>{{ thickness }}</span></label>
      <label v-if="effect === 'layers' && expanded">层间距<NativeField v-model="layerSpacing" type="range" min="20" max="160" aria-label="层间距" /><span>{{ layerSpacing }}</span></label>
      <label v-if="effect === 'layers'">闪光<NativeField v-model="layerShine" type="range" min="0" max="100" aria-label="闪光强度" /><span>{{ layerShine }}%</span></label>
      <label v-if="effect === 'layers' && layerStyle === 'holo'">镭射纹理<select v-model="foilPattern" aria-label="镭射纹理"><option value="0">流光膜</option><option value="1">菱晶膜</option><option value="2">拉丝膜</option></select></label>
      <label v-if="effect === 'depth'">景深强度<NativeField v-model="depth" type="range" min="0" max="30" aria-label="景深强度" /><span>{{ depth }}</span></label>
      <div v-if="effect === 'depth'" class="depth-actions"><NativeButton role="button" @click="pickDepth">{{ customDepth ? '替换深度图' : '导入深度图' }}</NativeButton><NativeButton v-if="customDepth" role="button" @click="clearDepth">移除</NativeButton><span>{{ customDepth ? '自定义深度图' : '亮度估算' }}</span></div>
    </div>
    <div v-if="effect === 'layers'" class="finished-export">
      <div class="export-heading"><span>成品卡牌</span><span>PNG · 4:5</span></div>
      <div class="export-options">
        <select v-model="finishedSize" aria-label="成品分辨率"><option value="1000">1000 × 1250</option><option value="2000">2000 × 2500</option></select>
        <NativeButton role="button" class="final-export" :disabled="!ready || loading || !!error || exporting" @click="exportFinished"><span class="material-symbols-outlined" aria-hidden="true">download</span>{{ exporting ? '正在合成' : '导出矩形照片' }}</NativeButton>
      </div>
    </div>
    <p class="scene-feedback" role="status">{{ feedback }}</p>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import './studio-tokens.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildFrame, disposeFrame, framePresets, type FramePresetId } from './frame3d';
import { buildLayeredCard, updateLayeredCard, layeredPresets, type LayeredPresetId } from './layered3d';
import { animateGameEnergy } from './game3d';
import { isExtraStyle } from './extra3d';
import { isAnimeStyle } from './anime3d';
import NativeField from './NativeField';
import NativeButton from './NativeButton';
import { renderCard, canvasBlob, downloadBlob, type CardRender } from './export';
import { resolvePhotoStyle, type ShowcaseCard } from './catalog';

const props = defineProps<{ card: ShowcaseCard }>();
const surface = ref<HTMLDivElement | null>(null);
function revealPreview() {
  if (window.matchMedia('(max-width: 768px)').matches) surface.value?.scrollIntoView({ block: 'start', behavior: 'instant' });
}
const loading = ref(false);
const error = ref('');
const feedback = ref('');
const ready = ref(false);
const exporting = ref(false);
const effect = ref('layers');
const expanded = ref(false);
const finishedSize = ref('2000');
let expansion = 0;
const layerStyle = ref<LayeredPresetId>('holo');
const styleCategory = ref('all');
const visiblePresets = computed(() => layeredPresets.filter(preset => {
  if (styleCategory.value === 'all') return true;
  if (styleCategory.value === 'new') return isExtraStyle(preset.id);
  if (styleCategory.value === 'anime') return isAnimeStyle(preset.id);
  const game = ['mythic', 'cyber', 'frost'].includes(preset.id);
  return styleCategory.value === 'game' ? game : ['holo', 'neon', 'prism'].includes(preset.id);
}));
const foilPattern = ref('0');
const interact = ref(false);
const energyMotion = ref(true);
let energyTime = 0;
const layerSpacing = ref('100');
const layerShine = ref('85');
let layeredGroup: THREE.Group | undefined;
const frameStyle = ref<FramePresetId>('gallery');
const studio = ref('graphite');
const exposure = ref('100');
let frameGroup: THREE.Group | undefined;
let environment: THREE.WebGLRenderTarget | undefined;
const thickness = ref('10');
const depth = ref('12');
const autoRotate = ref(false);
const follow = ref(true);
const customDepth = ref(false);
let depthImage: HTMLImageElement | undefined;
let renderer: THREE.WebGLRenderer | undefined;
let controls: OrbitControls | undefined;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let group: THREE.Group;
let face: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
let body: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
let back: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
let currentRender: CardRender | undefined;
let resizeObserver: ResizeObserver | undefined;
let abort: AbortController | undefined;
let generation = 0;
let disposed = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let frame = 0;
let previousTime = 0;
let targetRotation = -.12;
let targetPitch = 0;
const rotationDirections = [
  { label: '向左旋转', icon: 'west', yaw: -.2, pitch: 0 },
  { label: '向右旋转', icon: 'east', yaw: .2, pitch: 0 },
  { label: '向上旋转', icon: 'north', yaw: 0, pitch: -.2 },
  { label: '向下旋转', icon: 'south', yaw: 0, pitch: .2 },
];
function rotateStep(yaw: number, pitch: number) {
  if (!ready.value) return;
  autoRotate.value = false;
  targetRotation += yaw;
  targetPitch = THREE.MathUtils.clamp(targetPitch + pitch, -1.2, 1.2);
  hoverOut();
}
let tiltX = 0;
let tiltY = 0;
let homeDistance = 6;
let dragging = false;
let reducedMotion = false;
let depthGeneration = 0;
let contextUnavailable = false;

function makeScene() {
  if (!surface.value || disposed) return;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor('#17191c');
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.setAttribute('aria-label', '可交互立体照片');
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.tabIndex = 0;
    renderer.domElement.addEventListener('keydown', keyboardRotate);
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
    surface.value.prepend(renderer.domElement);
    scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture; scene.environmentIntensity = .7;
    room.dispose(); pmrem.dispose();
    camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    camera.position.set(0, .15, 6);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false;
    controls.enabled = false; controls.enableZoom = false;
    renderer.domElement.style.touchAction = 'pan-y';
    controls.autoRotateSpeed = 1.5;
    controls.addEventListener('start', () => { dragging = true; tiltX = 0; tiltY = 0; });
    controls.addEventListener('end', () => { dragging = false; });
    scene.add(new THREE.HemisphereLight('#ffffff', '#8d8b99', 1.4));
    const key = new THREE.DirectionalLight('#ffffff', 2); key.position.set(-3, 5, 6); scene.add(key);
    const fill = new THREE.DirectionalLight('#d2e3f6', 1); fill.position.set(4, 0, -2); scene.add(fill);
    group = new THREE.Group(); group.rotation.y = targetRotation; scene.add(group);
    body = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 1), new THREE.MeshStandardMaterial({ color: '#ebede6', roughness: .55, metalness: .08 }));
    face = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.5, 96, 120), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .8, metalness: 0, transparent: true, alphaTest: .015 }));
    back = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 2.44), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .9 }));
    back.rotation.y = Math.PI;
    group.add(body, face, back); group.visible = false;
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(surface.value);
    resize(); updateGeometry();
    frame = requestAnimationFrame(animate);
    updateTexture();
  } catch { error.value = '无法启用 3D，请检查浏览器硬件加速或使用平面导出'; ready.value = false; }
}
function resize() {
  if (!renderer || !surface.value) return;
  const width = surface.value.clientWidth, height = surface.value.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  homeDistance = effect.value === 'layers' && !expanded.value
    ? Math.max(1.3 / tangent, 1.05 / tangent / camera.aspect) * 1.12
    : Math.max(1.46 / tangent, 1.21 / tangent / camera.aspect) * 1.35;
  camera.position.normalize().multiplyScalar(homeDistance);
  camera.updateProjectionMatrix();
  if (controls) { controls.minDistance = homeDistance * .75; controls.maxDistance = homeDistance * 1.8; controls.update(); }
}
function animate(time: number) {
  if (disposed) return;
  frame = requestAnimationFrame(animate);
  if (!renderer || contextUnavailable || document.hidden || !surface.value?.clientWidth) return;
  const dt = Math.min((time - previousTime) / 1000 || 0, .05); previousTime = time;
  if (controls) { controls.autoRotate = autoRotate.value; controls.update(dt); }
  const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 10);
  group.rotation.y += (targetRotation + tiltY - group.rotation.y) * ease;
  group.rotation.x += (targetPitch + tiltX - group.rotation.x) * ease;
  expansion += ((expanded.value ? 1 : 0) - expansion) * ease;
  if (layeredGroup) updateLayeredCard(layeredGroup, Number(layerSpacing.value) / 100, Number(layerShine.value) / 100, expansion, Number(foilPattern.value));
  if (energyMotion.value && !reducedMotion) energyTime += dt;
  if (layeredGroup) animateGameEnergy(layeredGroup, energyTime);
  renderer.render(scene, camera);
}
async function updateTexture() {
  if (!renderer || disposed) return;
  const version = ++generation;
  abort?.abort(); abort = new AbortController();
  loading.value = true; error.value = ''; ready.value = false;
  // Do not leave a previous photograph visible while a new source is being prepared.
  group.visible = false;
  try {
    const captured = await renderCard({ ...props.card }, 8, abort.signal);
    if (disposed || version !== generation) { captured.canvas.width = 0; return; }
    currentRender?.canvas && (currentRender.canvas.width = 0);
    currentRender = captured;
    const texture = new THREE.CanvasTexture(captured.canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    face.material.map?.dispose(); face.material.map = texture; face.material.needsUpdate = true;
    const style = resolvePhotoStyle(props.card.type);
    body.material.color.set('#e5e5e8');
    const reverse = document.createElement('canvas'); reverse.width = 600; reverse.height = 750;
    const ctx = reverse.getContext('2d')!;
    ctx.fillStyle = style.variables['--pc-paper'] || '#f1f4ef'; ctx.fillRect(0, 0, 600, 750);
    ctx.strokeStyle = style.variables['--pc-accent'] || '#6b8573'; ctx.strokeRect(35, 35, 530, 680);
    ctx.fillStyle = style.variables['--pc-ink'] || '#345340'; ctx.textAlign = 'center'; ctx.font = '32px Georgia';
    ctx.fillText('Serene', 300, 345); ctx.font = '20px sans-serif';
    ctx.fillText(props.card.label, 300, 395, 470); ctx.font = '16px sans-serif'; ctx.fillText(style.name, 300, 445, 470);
    back.material.map?.dispose(); back.material.map = new THREE.CanvasTexture(reverse); back.material.map.colorSpace = THREE.SRGBColorSpace; back.material.needsUpdate = true;
    updateGeometry(); group.visible = true; ready.value = true;
  } catch (reason) { if (version === generation && !disposed) error.value = reason instanceof Error ? reason.message : '照片纹理生成失败'; }
  finally { if (version === generation && !disposed) loading.value = false; }
}
function updateGeometry() {
  if (!body || !face) return;
  const thicknessValue = Number(thickness.value) / 100;
  body.scale.z = thicknessValue; face.position.z = thicknessValue / 2 + .002; back.position.z = -thicknessValue / 2 - .002;
  if (frameGroup) { group.remove(frameGroup); disposeFrame(frameGroup); }
  if (layeredGroup) { group.remove(layeredGroup); disposeFrame(layeredGroup); layeredGroup = undefined; }
  body.visible = face.visible = back.visible = effect.value !== 'layers';
  if (effect.value === 'layers') {
    frameGroup = undefined;
    if (currentRender) { layeredGroup = buildLayeredCard(layerStyle.value, currentRender, props.card.label); group.add(layeredGroup); updateLayeredCard(layeredGroup, Number(layerSpacing.value) / 100, Number(layerShine.value) / 100); }
    return;
  }
  frameGroup = buildFrame(frameStyle.value, thicknessValue); group.add(frameGroup);
  back.position.z = -thicknessValue / 2 - .026;
  const positions = face.geometry.attributes.position;
  const uv = face.geometry.attributes.uv;
  let pixels: Uint8ClampedArray | undefined;
  const sample = document.createElement('canvas'); sample.width = 200; sample.height = 250;
  if (currentRender && effect.value === 'depth') {
    const ctx = sample.getContext('2d', { willReadFrequently: true })!;
    const rect = currentRender.imageRect;
    if (depthImage) ctx.drawImage(depthImage, rect.x * 200, rect.y * 250, rect.width * 200, rect.height * 250);
    else { ctx.filter = 'blur(9px)'; ctx.drawImage(currentRender.canvas, 0, 0, 200, 250); }
    pixels = ctx.getImageData(0, 0, 200, 250).data;
  }
  for (let i = 0; i < positions.count; i++) {
    let displacement = 0;
    const u = uv.getX(i), v = 1 - uv.getY(i);
    if (pixels && currentRender) {
      const r = currentRender.imageRect;
      const x = (u - r.x) / r.width, y = (v - r.y) / r.height;
      if (x > 0 && x < 1 && y > 0 && y < 1) {
        const index = (Math.min(249, Math.floor(v * 250)) * 200 + Math.min(199, Math.floor(u * 200))) * 4;
        const brightness = (.2126 * pixels[index] + .7152 * pixels[index + 1] + .0722 * pixels[index + 2]) / 255;
        displacement = brightness * Math.sin(x * Math.PI) * Math.sin(y * Math.PI) * Number(depth.value) / 100;
      }
    }
    positions.setZ(i, displacement);
  }
  positions.needsUpdate = true; face.geometry.computeVertexNormals(); face.geometry.computeBoundingSphere();
}
function hoverTilt(event: PointerEvent) {
  if (!follow.value || dragging || event.pointerType !== 'mouse' || !surface.value) return;
  const rect = surface.value.getBoundingClientRect();
  tiltY = ((event.clientX - rect.left) / rect.width - .5) * .35;
  tiltX = ((event.clientY - rect.top) / rect.height - .5) * .25;
}
function hoverOut() { tiltX = 0; tiltY = 0; }
function zoom(factor: number) {
  if (!camera || !controls) return;
  camera.position.setLength(THREE.MathUtils.clamp(camera.position.length() * factor, controls.minDistance, controls.maxDistance)); controls.update();
}
function flip() { targetRotation += Math.PI; }
function reset() {
  autoRotate.value = false; targetPitch = 0; targetRotation = effect.value === 'layers' ? -.12 : -.32; hoverOut();
  camera.position.set(0, 0, homeDistance); controls?.target.set(0, 0, 0); controls?.update();
}
function keyboardRotate(event: KeyboardEvent) {
  if (!ready.value || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', '+', '=', '-'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'Home') reset();
  else if (['+', '=', '-'].includes(event.key)) zoom(event.key === '-' ? 1.15 : .85);
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') rotateStep(event.key === 'ArrowLeft' ? -.2 : .2, 0);
  else rotateStep(0, event.key === 'ArrowUp' ? -.2 : .2);
}
function contextLost(event: Event) { event.preventDefault(); contextUnavailable = true; error.value = '3D 显示已中断，请重试'; ready.value = false; }
function contextRestored() { contextUnavailable = false; updateTexture(); }
function retry() {
  if (contextUnavailable) { feedback.value = '图形上下文尚未恢复，请切换到平面视图后重新打开 3D'; return; }
  if (renderer) updateTexture(); else makeScene();
}
async function exportScene() {
  if (!renderer || !ready.value || exporting.value) return;
  exporting.value = true;
  try {
    const size = renderer.getSize(new THREE.Vector2());
    const ratio = renderer.getPixelRatio();
    let canvas: HTMLCanvasElement;
    try {
      renderer.setPixelRatio(1); renderer.setSize(1600, Math.round(1600 * size.y / size.x), false);
      renderer.render(scene, camera);
      canvas = document.createElement('canvas'); canvas.width = renderer.domElement.width; canvas.height = renderer.domElement.height;
      canvas.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
    } finally { renderer.setPixelRatio(ratio); renderer.setSize(size.x, size.y, false); }
    downloadBlob(await canvasBlob(canvas, 'png'), `serene-3d-${props.card.type}.png`);
    canvas.width = 0; feedback.value = '3D 视图已导出';
  } catch { feedback.value = '3D 导出失败，请重试'; }
  finally { exporting.value = false; }
}
async function exportFinished() {
  if (!renderer || !layeredGroup || !currentRender || !ready.value || loading.value || error.value || exporting.value) return;
  exporting.value = true;
  const size = renderer.getSize(new THREE.Vector2()), ratio = renderer.getPixelRatio();
  const rotation = group.rotation.clone(), alpha = renderer.getClearAlpha();
  let canvas: HTMLCanvasElement | undefined;
  let exportArtwork: THREE.Group | undefined;
  const filename = `serene-photo-rect-${layerStyle.value}.png`;
  try {
    // Render the assembled artwork with its own camera, independent of inspection pose.
    const outputCamera = new THREE.OrthographicCamera(-1, 1, 1.25, -1.25, .1, 20);
    outputCamera.position.z = 6;
    // Preserve every card layer; an aligned photo underlay fills only the silhouette gaps.
    exportArtwork = buildLayeredCard(layerStyle.value, currentRender, props.card.label, true);
    group.add(exportArtwork); layeredGroup.visible = false;
    const artwork = exportArtwork;
    updateLayeredCard(artwork, 1, Number(layerShine.value) / 100, 0, Number(foilPattern.value));
    animateGameEnergy(artwork, .75);
    group.rotation.set(0, 0, 0);
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(1); renderer.setSize(Number(finishedSize.value), Number(finishedSize.value) * 1.25, false);
    renderer.render(scene, outputCamera);
    canvas = document.createElement('canvas'); canvas.width = renderer.domElement.width; canvas.height = renderer.domElement.height;
    canvas.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
  } catch { feedback.value = '成品合成失败，请重试'; }
  finally {
    if (exportArtwork) { group.remove(exportArtwork); disposeFrame(exportArtwork); }
    layeredGroup.visible = true;
    group.rotation.copy(rotation);
    updateLayeredCard(layeredGroup, Number(layerSpacing.value) / 100, Number(layerShine.value) / 100, expansion, Number(foilPattern.value));
    animateGameEnergy(layeredGroup, energyTime);
    renderer.setClearAlpha(alpha); renderer.setPixelRatio(ratio); renderer.setSize(size.x, size.y, false);
    renderer.render(scene, camera);
  }
  try {
    if (canvas) { downloadBlob(await canvasBlob(canvas, 'png'), filename); feedback.value = '成品卡牌已导出'; }
  } catch { feedback.value = '成品导出失败，请重试'; }
  finally { if (canvas) canvas.width = 0; exporting.value = false; }
}
function pickDepth() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp';
  const version = ++depthGeneration;
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5000000 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { feedback.value = '请选择小于 5 MB 的 PNG、JPG 或 WebP 深度图'; return; }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      if (disposed || version !== depthGeneration) return;
      depthImage = image; customDepth.value = true; updateGeometry(); feedback.value = '深度图已应用';
    } catch { feedback.value = '深度图无法读取'; }
    finally { URL.revokeObjectURL(url); }
  };
  input.click();
}
function clearDepth() { depthGeneration++; depthImage = undefined; customDepth.value = false; updateGeometry(); }
watch([effect, depth, thickness, frameStyle, layerStyle], updateGeometry);
watch(effect, value => { follow.value = value === 'layers' && !reducedMotion; reset(); });
watch(interact, value => {
  if (controls) controls.enabled = value;
  if (renderer) renderer.domElement.style.touchAction = value ? 'none' : 'pan-y';
});
watch([effect, expanded], resize);
watch([studio, exposure], () => {
  if (!renderer) return;
  renderer.setClearColor(studio.value === 'rose' ? '#eee2e6' : studio.value === 'graphite' ? '#17191c' : '#eef0f2');
  renderer.toneMappingExposure = Number(exposure.value) / 100;
});
watch(follow, value => { if (!value) hoverOut(); });
watch(() => props.card.image, clearDepth);
watch(() => [props.card.image, props.card.label, props.card.type, props.card.position], () => {
  clearTimeout(timer); abort?.abort(); generation++; ready.value = false;
  if (group) group.visible = false;
  timer = setTimeout(updateTexture, 250);
});
onMounted(() => { reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; follow.value = !reducedMotion; makeScene(); });
onBeforeUnmount(() => {
  disposed = true; generation++; depthGeneration++; abort?.abort(); clearTimeout(timer); cancelAnimationFrame(frame);
  resizeObserver?.disconnect(); controls?.dispose();
  environment?.dispose();
  group?.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => { material.map?.dispose(); material.dispose(); });
    }
  });
  if (renderer) {
    renderer.domElement.removeEventListener('keydown', keyboardRotate);
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
    renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  }
  if (currentRender) currentRender.canvas.width = 0;
  depthImage = undefined;
});
</script>
<style scoped>
.photo-scene { display: grid; grid-template-columns: 180px minmax(0, 1fr); grid-template-areas: "head head" "presets preview" "presets settings" "presets export" "presets feedback"; grid-template-rows: auto auto auto auto 1fr; min-height: calc(100vh - 68px); background: var(--ui-canvas); font: 13px/1.5 var(--ui-font); }
.scene-topbar { grid-area: head; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 22px 24px; border-bottom: 1px solid var(--ui-line); background: var(--ui-surface); }
h2 { margin: 0; font: 600 24px/1.4 var(--ui-font); }
.native-button, :deep(.native-button) { display: inline-flex; align-items: center; justify-content: center; gap: 6px; margin: 0; min-height: 36px; padding: 8px; background: var(--ui-surface); border: 1px solid var(--ui-line); border-radius: var(--ui-radius); color: var(--ui-ink); font: 13px/1.4 var(--ui-font); cursor: pointer; }
.native-button:hover { border-color: #aab4bc; background: var(--ui-subtle); }
.native-button:disabled { opacity: .45; cursor: default; }
.material-symbols-outlined { font-size: 20px; }
select { max-width: 100%; min-width: 0; min-height: 38px; padding: 8px; border: 1px solid #484d54; border-radius: var(--ui-radius); background: var(--ui-surface); color: var(--ui-ink); font: inherit; }
.frame-presets { grid-area: presets; display: flex; flex-direction: column; align-items: stretch; gap: 4px; padding: 16px 12px; border-right: 1px solid var(--ui-line); background: var(--ui-subtle); }
.frame-presets .native-button { justify-content: flex-start; gap: 12px; min-height: 44px; padding: 8px 10px; background: transparent; border-color: transparent; text-align: left; }
.frame-presets .native-button:hover { background: #33373d; }
.frame-presets .native-button[aria-pressed="true"] { color: var(--ui-accent); border-color: #76854e; background: var(--ui-selected); font-weight: 600; }
.frame-swatch { display: block; flex-shrink: 0; width: 24px; height: 30px; border: 4px solid; box-shadow: 1px 2px 3px #20252b22; background: var(--ui-surface); }
.frame-swatch img { display: block; width: 100%; height: 100%; object-fit: cover; }
.preset-selected { margin-left: auto; font-size: 16px; }
.layered-swatch { border-width: 2px; }
.preset-filter { display: flex; flex-direction: column; gap: 10px; padding: 0 0 14px; margin-bottom: 6px; border-bottom: 1px solid var(--ui-line); }
.preset-filter select { width: 100%; font-size: 12px; }
.preset-filter span { color: var(--ui-muted); font-size: 12px; overflow-wrap: anywhere; }
.scene-preview { grid-area: preview; min-width: 0; display: flex; flex-direction: column; }
.rotation-controls { display: flex; gap: 4px; }
.rotation-controls :deep(.native-button) { width: 40px; min-height: 40px; padding: 8px; }
.assembly-controls { display: flex; align-self: center; gap: 2px; padding: 3px; margin: 20px 12px 0; background: #2c3035; border-radius: var(--ui-radius); }
.assembly-controls .native-button { border: 0; background: transparent; padding: 8px 14px; color: var(--ui-muted); }
.assembly-controls .native-button[aria-pressed="true"] { background: var(--ui-accent); color: #20251b; box-shadow: 0 1px 3px #20252b18; }
.scene-surface { position: relative; flex: 0 0 auto; overflow: hidden; width: 100%; min-width: 0; height: 560px; }
.scene-surface :deep(canvas) { position: absolute; inset: 0; display: block; width: 100% !important; height: 100% !important; touch-action: pan-y; }
.scene-message { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; padding: 24px; color: var(--ui-muted); text-align: center; background: var(--ui-canvas); }
.scene-toolbar { position: relative; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px; padding: 12px 16px; border-top: 1px solid var(--ui-line); background: var(--ui-surface); }
.scene-toolbar > .native-button:not(.motion-toggle):not(.scene-export) { width: 36px; padding: 6px; }
.toolbar-divider { height: 20px; border-left: 1px solid var(--ui-line); }
.motion-toggle { background: transparent; border: 0; padding: 8px 5px; font-size: 12px; white-space: nowrap; }
.switch-track { display: block; flex-shrink: 0; width: 28px; height: 16px; border-radius: 10px; padding: 2px; background: #8d979f; }
.switch-track > span { display: block; width: 12px; height: 12px; border-radius: 50%; background: var(--ui-surface); }
[aria-checked="true"] .switch-track { background: var(--ui-accent); }
[aria-checked="true"] .switch-track > span { transform: translateX(12px); }
.scene-export { font-size: 12px; }
.scene-settings { grid-area: settings; display: flex; flex-wrap: wrap; align-items: center; gap: 16px 24px; padding: 18px 24px; border-top: 1px solid var(--ui-line); background: var(--ui-surface); }
.scene-settings label { display: flex; align-items: center; gap: 10px; color: var(--ui-muted); font-size: 12px; }
.scene-settings label > span { min-width: 30px; font-variant-numeric: tabular-nums; }
.scene-settings :deep(.native-field) { width: 100px; height: 24px; min-height: 0; padding: 0; border: 0; background: transparent; accent-color: var(--ui-accent); }
.depth-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; }
.finished-export { grid-area: export; padding: 20px 24px; border-top: 1px solid var(--ui-line); background: var(--ui-surface); }
.export-heading { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; font-weight: 600; }
.export-heading span:last-child { color: var(--ui-muted); font-size: 12px; font-weight: 400; }
.export-options { display: flex; flex-wrap: wrap; gap: 8px; }
.export-options select { flex: 1; min-width: 120px; }
.export-options .final-export { padding: 10px 16px; background: var(--ui-accent); border-color: var(--ui-accent); color: #20251b; font-weight: 600; }
.export-options .final-export:hover { background: #e0f6ad; }
.scene-feedback { grid-area: feedback; margin: 0; min-height: 30px; padding: 0 24px 12px; background: var(--ui-surface); color: var(--ui-muted); font-size: 12px; overflow-wrap: anywhere; }
@media (min-width: 1600px) { .scene-surface { height: 640px; } .photo-scene { grid-template-columns: 200px minmax(0, 1fr); } }
@media (max-width: 1100px) {
 .photo-scene { grid-template-columns: 144px minmax(0, 1fr); }
 .frame-presets { padding: 12px 8px; }
 .frame-presets .native-button { gap: 8px; padding-inline: 6px; font-size: 12px; }
 .scene-surface { height: 480px; }
 .scene-settings, .finished-export { padding: 16px; }
 .export-options .final-export { width: 100%; }
}
@media (max-width: 768px) {
 .photo-scene { display: flex; flex-direction: column; min-height: calc(100vh - 112px); }
 .scene-topbar { padding: 20px; }
 h2 { font-size: 22px; }
 .frame-presets { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; padding: 14px 16px; border-right: 0; border-bottom: 1px solid var(--ui-line); }
 .frame-presets .native-button { min-width: 0; min-height: 42px; gap: 8px; font-size: 12px; padding: 8px 6px; }
 .frame-swatch { width: 16px; height: 20px; }
 .preset-filter { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; align-items: center; margin: 0 0 4px; padding: 0 0 10px; }
 .preset-filter select { width: auto; }
 .preset-filter span { font-size: 11px; }
 .assembly-controls { align-self: center; }
 .scene-surface { height: 460px; scroll-margin-top: 124px; }
 .scene-settings { justify-content: center; }
 .scene-toolbar { padding: 12px; }
 .export-options .final-export { width: auto; }
}
@media (max-width: 480px) {
 .scene-topbar { padding: 18px 16px; }
 .frame-presets { gap: 4px; padding: 12px; }
 .frame-presets .native-button { gap: 6px; font-size: 11px; }
 .scene-surface { height: 390px; }
 .scene-toolbar { gap: 5px; }
 .scene-export { width: 100%; }
 .scene-settings { justify-content: flex-start; gap: 12px; }
 .export-options .final-export { width: 100%; }
}
</style>
