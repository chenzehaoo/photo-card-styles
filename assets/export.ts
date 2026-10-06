import { createApp, h, nextTick } from 'vue';
import { toCanvas } from 'html-to-image';
import { zipSync } from 'fflate';
import PhotoCard from './PhotoCard.vue';
import type { ShowcaseCard } from './catalog';

export interface ExportOptions {
  format: 'png' | 'jpeg';
  scale: number;
  background: string;
  signal?: AbortSignal;
}
export interface CardRender {
  canvas: HTMLCanvasElement;
  imageRect: { x: number; y: number; width: number; height: number };
}
const images = new Map<string, Promise<string>>();
let fontPromise: Promise<string> | undefined;
const fonts = [
  { family: 'Great Vibes', style: 'normal', weight: 400, url: new URL('./fonts/GreatVibes.ttf', import.meta.url).href },
  { family: 'Playfair Display', style: 'normal', weight: 400, url: new URL('./fonts/PlayfairRegular.ttf', import.meta.url).href },
  { family: 'Playfair Display', style: 'normal', weight: 600, url: new URL('./fonts/PlayfairSemibold.ttf', import.meta.url).href },
  { family: 'Playfair Display', style: 'italic', weight: 400, url: new URL('./fonts/PlayfairItalic.ttf', import.meta.url).href },
];

function check(signal?: AbortSignal) { signal?.throwIfAborted(); }
function blobData(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(blob);
  });
}
async function fetchData(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), mode: 'cors' });
  if (!response.ok) throw new Error(`图片请求失败 (${response.status})`);
  return blobData(await response.blob());
}
async function embeddedImage(source: string) {
  if (source.startsWith('data:')) return source;
  if (!images.has(source)) {
    if (images.size > 12) images.delete(images.keys().next().value!);
    const request = fetchData(source).catch(() => {
      images.delete(source);
      throw new Error('无法读取图片，请上传本地图片或使用允许跨域读取的图片网址');
    });
    images.set(source, request);
  }
  return images.get(source)!;
}
async function embeddedFonts() {
  if (!fontPromise) fontPromise = Promise.all(fonts.map(async font => {
    const data = await fetchData(font.url);
    return `@font-face { font-family: '${font.family}'; font-style: ${font.style}; font-weight: ${font.weight}; src: url('${data}') format('truetype'); }`;
  })).then(styles => styles.join('\n')).catch(() => {
    fontPromise = undefined;
    throw new Error('导出字体加载失败，请刷新页面后重试');
  });
  return fontPromise;
}

// A dedicated mounted copy avoids mutating the editor and fixes output at 4:5 on every viewport.
export async function renderCard(card: ShowcaseCard, scale = 4, signal?: AbortSignal): Promise<CardRender> {
  check(signal);
  const [source, fontEmbedCSS] = await Promise.all([embeddedImage(card.image), embeddedFonts()]);
  check(signal);
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:200px;height:250px;pointer-events:none;';
  host.setAttribute('aria-hidden', 'true');
  document.body.appendChild(host);
  const app = createApp({ render: () => h(PhotoCard, { card: { ...card, image: source } }) });
  try {
    app.mount(host);
    await nextTick();
    const node = host.querySelector<HTMLElement>('.serene-photo-card')!;
    node.style.width = '200px'; node.style.height = '250px';
    const photo = node.querySelector<HTMLImageElement>('img');
    if (!photo) throw new Error('图片无法解码');
    try { await photo.decode(); } catch { throw new Error('图片无法解码，请重新选择 PNG、JPG、WebP 或 GIF 图片'); }
    await Promise.all([document.fonts.load('18px "Great Vibes"'), document.fonts.load('20px "Playfair Display"')]);
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    check(signal);
    const rect = node.getBoundingClientRect();
    const image = node.querySelector('.pc-image-wrap')!.getBoundingClientRect();
    const canvas = await toCanvas(node, {
      width: 200, height: 250, pixelRatio: Math.min(10, Math.max(1, scale)),
      fontEmbedCSS, skipFonts: !fontEmbedCSS, skipAutoScale: true,
      style: { transform: 'none', margin: '0', boxShadow: 'none', backdropFilter: 'none' },
    });
    check(signal);
    return { canvas, imageRect: { x: (image.x - rect.x) / 200, y: (image.y - rect.y) / 250, width: image.width / 200, height: image.height / 250 } };
  } finally { app.unmount(); host.remove(); }
}

export function canvasBlob(canvas: HTMLCanvasElement, format: 'png' | 'jpeg', background = 'transparent'): Promise<Blob> {
  const output = document.createElement('canvas');
  output.width = canvas.width; output.height = canvas.height;
  const ctx = output.getContext('2d')!;
  if (background !== 'transparent' || format === 'jpeg') {
    ctx.fillStyle = background === 'transparent' ? '#ffffff' : background;
    ctx.fillRect(0, 0, output.width, output.height);
  }
  ctx.drawImage(canvas, 0, 0);
  return new Promise((resolve, reject) => output.toBlob(blob => {
    output.width = 0; output.height = 0;
    if (blob) resolve(blob); else reject(new Error('图片导出失败'));
  }, `image/${format}`, .95));
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export function photoFilename(card: ShowcaseCard, index: number, format: string) {
  const label = card.label.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim().slice(0, 40) || 'photo';
  return `${String(index + 1).padStart(2, '0')}-${label}-${card.type}.${format === 'jpeg' ? 'jpg' : format}`;
}
export async function exportCard(card: ShowcaseCard, options: ExportOptions) {
  const { canvas } = await renderCard(card, options.scale, options.signal);
  try { return await canvasBlob(canvas, options.format, options.background); }
  finally { canvas.width = 0; canvas.height = 0; }
}
export async function exportBatch(cards: ShowcaseCard[], options: ExportOptions, progress: (done: number) => void) {
  const files: Record<string, Uint8Array> = {};
  for (let index = 0; index < cards.length; index++) {
    check(options.signal);
    const blob = await exportCard(cards[index], options);
    files[photoFilename(cards[index], index, options.format)] = new Uint8Array(await blob.arrayBuffer());
    progress(index + 1);
  }
  check(options.signal);
  const archive = zipSync(files, { level: 0 });
  return new Blob([archive.slice().buffer as ArrayBuffer], { type: 'application/zip' });
}
