<template>
  <main class="style-studio">
    <header class="studio-header">
      <div class="brand-group">
        <a href="#/pages/welcome/welcome" class="studio-brand">Serene<span class="brand-dot"></span></a>
        <span class="brand-divider"></span><span class="workspace-name">照片工作室</span>
      </div>
      <div class="header-actions">
        <div class="render-modes" role="group" aria-label="作品视图">
          <NativeButton role="button" :aria-pressed="viewMode === 'flat'" aria-label="平面视图" title="平面视图" @click="setView('flat')"><span class="material-symbols-outlined" aria-hidden="true">crop_portrait</span><span class="mode-label">平面</span></NativeButton>
          <NativeButton role="button" :aria-pressed="viewMode === 'three'" aria-label="3D 视图" title="3D 视图" @click="setView('three')"><span class="material-symbols-outlined" aria-hidden="true">view_in_ar</span><span class="mode-label">3D</span></NativeButton>
        </div>
        <NativeButton role="button" class="icon-button" title="导入配置" aria-label="导入配置" @click="pickFile('config')"><span class="material-symbols-outlined" aria-hidden="true">upload_file</span></NativeButton>
        <NativeButton role="button" class="icon-button" title="导出配置" aria-label="导出配置" @click="exportConfig"><span class="material-symbols-outlined" aria-hidden="true">download</span></NativeButton>
        <span class="action-divider"></span>
        <NativeButton role="button" class="save-button" @click="applyCards"><span class="material-symbols-outlined" aria-hidden="true">check</span>应用到首页</NativeButton>
      </div>
    </header>
    <nav class="mobile-panels" aria-label="工作区">
      <NativeButton role="button" :aria-pressed="mobilePanel === 'library'" @click="switchPanel('library')"><span class="material-symbols-outlined" aria-hidden="true">{{ viewMode === 'three' ? 'view_in_ar' : 'grid_view' }}</span>{{ viewMode === 'three' ? '作品预览' : '浏览风格' }}</NativeButton>
      <NativeButton role="button" :aria-pressed="mobilePanel === 'editor'" aria-label="编辑照片" @click="switchPanel('editor')"><span class="material-symbols-outlined" aria-hidden="true">tune</span>编辑照片<span class="mobile-slot" aria-hidden="true">{{ slot + 1 }}</span></NativeButton>
    </nav>
    <div class="studio-body" :data-mobile-panel="mobilePanel">
      <section v-if="viewMode === 'three'" class="three-workspace"><PhotoScene :card="current" /></section>
      <section v-show="viewMode === 'flat'" class="style-library">
        <div class="library-heading">
          <div><h1>照片风格</h1></div>
          <div class="library-count"><span>{{ filteredStyles.length }}</span> 个预设</div>
        </div>
        <nav class="collection-tabs" aria-label="风格分类">
          <NativeButton v-for="group in collections" :key="group.id" role="button" :aria-pressed="collection === group.id" @click="collection = group.id; family = ''">{{ group.name }}<span>{{ group.id === 'all' ? photoStyles.length : photoStyles.filter(style => group.families.includes(style.family)).length }}</span></NativeButton>
        </nav>
        <div class="library-filters">
          <div class="search-field"><span class="material-symbols-outlined" aria-hidden="true">search</span><NativeField v-model="query" type="search" placeholder="搜索名称或风格" aria-label="搜索风格" /></div>
          <select v-model="family" aria-label="卡片结构"><option value="">全部结构</option><option value="original">原有五款</option><option v-for="item in families" :key="item[0]" :value="item[0]">{{ item[1] }}</option></select>
          <select v-model="palette" class="palette-select" aria-label="配色"><option value="">全部配色</option><option v-for="item in palettes" :key="item.id" :value="item.id">{{ item.name }}</option></select>
        </div>
        <div class="palette-toolbar">
          <div class="palette-swatches" role="group" aria-label="配色快捷选择">
            <NativeButton role="button" class="all-palettes" :aria-pressed="palette === ''" title="全部配色" aria-label="全部配色" @click="palette = ''"><span class="material-symbols-outlined" aria-hidden="true">palette</span></NativeButton>
            <NativeButton role="button" v-for="item in palettes" :key="item.id" class="palette-swatch" :style="{ '--swatch': item.accent }" :title="item.name" :aria-label="item.name + '配色'" :aria-pressed="palette === item.id" @click="palette = item.id"></NativeButton>
            <span class="palette-name">{{ palettes.find(item => item.id === palette)?.name || '全部配色' }}</span>
          </div>
          <NativeButton role="button" class="favorites-filter" :aria-pressed="favoritesOnly" aria-label="只看收藏" @click="favoritesOnly = !favoritesOnly"><span class="material-symbols-outlined" aria-hidden="true">favorite</span><span>收藏</span><span>{{ favorites.length }}</span></NativeButton>
        </div>
        <div class="style-grid">
          <div v-for="style in visibleStyles" :key="style.id" class="style-item">
          <NativeButton role="button" class="style-choice"
            :class="{ selected: current.type === style.id, 'glass-preview': style.id === 'glass' }" :aria-pressed="current.type === style.id"
            :aria-label="style.name" @click="selectStyle(style.id)">
            <div class="style-stage"><PhotoCard :card="{ ...current, type: style.id }" lazy /><span v-if="current.type === style.id" class="selection-mark material-symbols-outlined" aria-hidden="true">check</span></div>
            <span class="style-meta"><span class="style-name">{{ style.name.split(' · ')[0] }}</span><span class="style-palette"><span class="meta-swatch" :style="{ background: style.variables['--pc-accent'] || '#a7b3aa' }"></span>{{ style.name.split(' · ')[1] || '经典' }}</span></span>
          </NativeButton>
          <NativeButton role="button" class="favorite-button" :class="{ active: favorites.includes(style.id) }" :aria-pressed="favorites.includes(style.id)" :aria-label="(favorites.includes(style.id) ? '取消收藏' : '收藏') + style.name" :title="favorites.includes(style.id) ? '取消收藏' : '收藏风格'" @click="toggleFavorite(style.id)"><span class="material-symbols-outlined" aria-hidden="true">favorite</span></NativeButton>
          </div>
        </div>
        <div v-if="!filteredStyles.length" class="empty-state"><span class="material-symbols-outlined" aria-hidden="true">{{ favoritesOnly ? 'favorite_border' : 'search_off' }}</span><p>{{ favoritesOnly && !favorites.length ? '还没有收藏的风格' : '没有匹配的风格' }}</p><NativeButton role="button" @click="query = ''; family = ''; palette = ''; collection = 'all'; favoritesOnly = false">查看全部风格</NativeButton></div>
        <nav class="pagination" aria-label="风格分页">
          <span>{{ filteredStyles.length ? (page - 1) * pageSize + 1 : 0 }}–{{ Math.min(page * pageSize, filteredStyles.length) }}<span class="page-total"> / {{ filteredStyles.length }}</span></span>
          <div class="page-controls"><NativeButton role="button" class="icon-button" :disabled="page === 1" title="上一页" aria-label="上一页" @click="changePage(page - 1)"><span class="material-symbols-outlined" aria-hidden="true">chevron_left</span></NativeButton>
          <span>{{ page }} <span class="page-total">/ {{ pageCount }}</span></span>
          <NativeButton role="button" class="icon-button" :disabled="page === pageCount" title="下一页" aria-label="下一页" @click="changePage(page + 1)"><span class="material-symbols-outlined" aria-hidden="true">chevron_right</span></NativeButton></div>
        </nav>
      </section>
      <aside class="card-editor">
        <div class="editor-heading"><h2>首页照片</h2><span>{{ String(slot + 1).padStart(2, '0') }} / 05</span></div>
        <div class="slot-tabs" role="tablist" aria-label="首页卡片">
          <NativeButton v-for="(card, index) in draft" :key="card.id" role="tab" :aria-label="'照片 ' + (index + 1)" :aria-selected="slot === index"
            :class="{ active: slot === index }" @click="slot = index"><img :src="card.image" alt="" /><span>{{ String(index + 1).padStart(2, '0') }}</span></NativeButton>
        </div>
        <div v-if="viewMode === 'flat'" class="preview-area" :class="{ 'glass-preview': current.type === 'glass' }">
          <div class="preview-heading"><span>当前预览</span><span class="material-symbols-outlined" aria-hidden="true">photo_size_select_actual</span></div>
          <div class="editor-preview"><PhotoCard :card="current" /></div>
          <div class="current-style">{{ resolvePhotoStyle(current.type).name }}</div>
        </div>
        <div class="editor-fields">
          <div class="fields-heading"><h3>照片内容</h3><NativeButton role="button" class="reset-button icon-button" title="还原当前照片" aria-label="还原当前照片" @click="resetCurrent"><span class="material-symbols-outlined" aria-hidden="true">restart_alt</span></NativeButton></div>
          <label class="caption-field"><span class="field-heading">文案<span>{{ current.label.length }}/80</span></span><NativeField v-model="current.label" multiline maxlength="80" rows="2" aria-label="文案" /></label>
          <div class="image-source" role="group" aria-label="图片来源">
            <label class="image-field"><span class="field-heading">图片来源</span><NativeField v-model="current.image" type="url" aria-label="图片地址" /></label>
            <NativeButton class="upload-button" aria-label="替换本地图片" @click="pickFile('image')"><span class="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>选择本地图片</NativeButton>
          </div>
          <label class="position-field"><span class="field-heading">画面位置</span><select v-model="current.position" aria-label="图片位置"><option value="center">居中</option><option value="top">顶部</option><option value="bottom">底部</option><option value="left">左侧</option><option value="right">右侧</option></select></label>
          <label class="alt-field"><span class="field-heading">图片描述<span>可选</span></span><NativeField v-model="current.alt" maxlength="200" aria-label="图片描述" /></label>
        </div>
        <ExportPanel v-if="viewMode === 'flat'" :cards="draft" :slot="slot" />
        <div class="editor-footer"><span class="status-dot" :class="{ changed: status === '有未应用的更改' }"></span><p class="status-message" role="status">{{ status || '已载入当前配置' }}</p></div>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, defineAsyncComponent } from 'vue';
import './studio-tokens.css';
import PhotoCard from './PhotoCard.vue';
import NativeField from './NativeField';
import NativeButton from './NativeButton';
import { defaultCards, photoStyles, families, palettes, parseCards, resolvePhotoStyle, type PhotoStyleId } from './catalog';
import { savedCards, saveCards } from './state';
const PhotoScene = defineAsyncComponent(() => import('./PhotoScene.vue'));
const ExportPanel = defineAsyncComponent(() => import('./ExportPanel.vue'));
const viewMode = ref<'flat' | 'three'>('flat');
function setView(mode: 'flat' | 'three') { viewMode.value = mode; switchPanel('library'); }
const draft = ref(savedCards.value.map(card => ({ ...card, position: card.position || 'center' })));
const slot = ref(0);
const mobilePanel = ref<'library' | 'editor'>('library');
function switchPanel(panel: 'library' | 'editor') {
  mobilePanel.value = panel;
  if (window.matchMedia('(max-width: 768px)').matches) nextTick(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}
function selectStyle(id: PhotoStyleId) {
  current.value.type = id;
  switchPanel('editor');
}
const current = computed(() => draft.value[slot.value]);
const query = ref('');
const family = ref('');
const palette = ref('');
const collections: { id: string; name: string; families: string[] }[] = [
  { id: 'all', name: '全部', families: [] },
  { id: 'classic', name: '经典', families: ['original'] },
  { id: 'frame', name: '装裱', families: ['gallery', 'double-mat', 'inset', 'keyline', 'corners', 'bevel', 'arch', 'oval'] },
  { id: 'paper', name: '纸感', families: ['tape', 'filmstrip', 'contact', 'postage', 'postcard', 'ticket', 'notebook', 'stitched', 'offset'] },
  { id: 'design', name: '设计', families: ['blueprint', 'editorial', 'sidebar', 'caption-band', 'overlay', 'floating-label', 'duotone'] },
];
const collection = ref('all');
const favoritesOnly = ref(false);
const favoriteKey = 'serene.photo-style-favorites.v1';
function readFavorites(): PhotoStyleId[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(favoriteKey) || '[]');
    return Array.isArray(value) ? [...new Set(value.filter(id => photoStyles.some(style => style.id === id)))] : [];
  } catch { return []; }
}
const favorites = ref<PhotoStyleId[]>(readFavorites());
function toggleFavorite(id: PhotoStyleId) {
  const next = favorites.value.includes(id) ? favorites.value.filter(item => item !== id) : [...favorites.value, id];
  try { localStorage.setItem(favoriteKey, JSON.stringify(next)); favorites.value = next; }
  catch { status.value = '收藏未保存，请检查浏览器存储空间'; }
}
const page = ref(1);
function changePage(value: number) {
  page.value = value;
  nextTick(() => document.querySelector('.style-library')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
}
const pageSize = 20;
const status = ref('');
const filteredStyles = computed(() => photoStyles.filter(style =>
  (collection.value === 'all' || collections.find(group => group.id === collection.value)?.families.includes(style.family))
  && (!favoritesOnly.value || favorites.value.includes(style.id))
  &&
  (!family.value || style.family === family.value) && (!palette.value || style.palette === palette.value)
  && `${style.id} ${style.name}`.toLowerCase().includes(query.value.trim().toLowerCase())));
const pageCount = computed(() => Math.max(1, Math.ceil(filteredStyles.value.length / pageSize)));
const visibleStyles = computed(() => filteredStyles.value.slice((page.value - 1) * pageSize, page.value * pageSize));
watch([query, family, palette, collection, favoritesOnly], () => { page.value = 1; });
watch(pageCount, count => { page.value = Math.min(page.value, count); });
watch(draft, () => { status.value = '有未应用的更改'; }, { deep: true, flush: 'sync' });
function applyCards() {
  try { saveCards(draft.value); status.value = '已保存到本机首页'; }
  catch (error) { status.value = error instanceof DOMException ? '本机存储空间不足，请使用图片网址或更小的图片' : (error as Error).message; }
}
function resetCurrent() { draft.value[slot.value] = { ...defaultCards[slot.value], position: 'center' }; }
function pickFile(kind: 'image' | 'config') {
  // Native file inputs avoid uni-app's text-input wrapper on H5.
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = kind === 'image' ? 'image/png,image/jpeg,image/webp,image/gif' : 'application/json,.json';
  input.onchange = kind === 'image' ? readImage : importConfig;
  input.click();
}
function readImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  const targetCard = current.value;
  input.value = '';
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) { status.value = '请选择 PNG、JPEG、WebP 或 GIF 图片'; return; }
  if (file.size > 1500000) { status.value = '单张图片请小于 1.5 MB'; return; }
  const reader = new FileReader();
  reader.onload = () => { targetCard.image = String(reader.result); };
  reader.onerror = () => { status.value = '图片读取失败'; };
  reader.readAsDataURL(file);
}
function exportConfig() {
  try {
    const cards = parseCards(draft.value);
    const url = URL.createObjectURL(new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'serene-photo-cards.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.value = '配置已导出';
  } catch (error) { status.value = (error as Error).message; }
}
async function importConfig(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (file.size > 11000000) { status.value = '配置文件过大'; return; }
  try {
    draft.value = parseCards(JSON.parse(await file.text())).map(card => ({ ...card, position: card.position || 'center' }));
    status.value = '配置已导入，待应用';
  } catch { status.value = '导入失败，请检查五张照片的 JSON 配置'; }
}
</script>

<style scoped>
.style-studio { min-height: 100vh; background: #17191c; font: 14px/1.5 var(--ui-font); }
.style-studio .native-button, .style-studio select { font-family: var(--ui-font); letter-spacing: 0; }
.style-studio .native-button { margin: 0; cursor: pointer; line-height: 1.4; }
.style-studio .material-symbols-outlined { font-size: 20px; line-height: 1; }
.studio-header { position: sticky; top: 0; z-index: 20; min-height: 68px; padding: 12px 28px; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--ui-line); background: var(--ui-surface); }
.brand-group, .header-actions { display: flex; align-items: center; gap: 16px; }
.studio-brand { display: flex; align-items: baseline; color: var(--ui-ink); font: 600 30px/1 Georgia, serif; text-decoration: none; }
.brand-dot { width: 5px; height: 5px; background: var(--ui-accent); border-radius: 50%; margin-left: 3px; }
.brand-divider, .action-divider { height: 20px; width: 1px; background: var(--ui-line); }
.workspace-name { font-size: 13px; color: var(--ui-muted); }
.header-actions { gap: 8px; }
.render-modes { display: flex; gap: 2px; background: var(--ui-canvas); padding: 3px; border-radius: var(--ui-radius); }
.render-modes .native-button { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 34px; padding: 6px 14px; border: 0; border-radius: 4px; background: transparent; color: var(--ui-muted); font-size: 13px; }
.render-modes .native-button[aria-pressed="true"] { color: #20251b; background: var(--ui-accent); box-shadow: 0 1px 3px #20252b18; }
.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; flex-shrink: 0; padding: 0; border: 0; border-radius: var(--ui-radius); color: var(--ui-muted); background: transparent; }
.icon-button:hover { color: var(--ui-ink); background: var(--ui-canvas); }
.icon-button:disabled { opacity: .35; cursor: default; }
.save-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 40px; padding: 8px 16px; border: 0; border-radius: var(--ui-radius); background: var(--ui-accent); color: #20251b; font-size: 13px; font-weight: 600; }
.save-button:hover { background: #e0f6ad; }
.mobile-panels { display: none; }
.studio-body { max-width: 1920px; margin: auto; display: grid; grid-template-columns: minmax(0, 1fr) 320px; align-items: start; }
.three-workspace, .style-library { min-width: 0; }
.style-library { padding: 32px; scroll-margin-top: 80px; background: #202226; min-height: calc(100vh - 68px); }
.library-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; }
.library-heading h1 { margin: 0; font: 500 28px/1.4 var(--ui-font); }
.library-count { font-size: 13px; color: var(--ui-muted); white-space: nowrap; }
.library-count > span { color: var(--ui-ink); font-variant-numeric: tabular-nums; }
.collection-tabs { display: flex; gap: 26px; border-bottom: 1px solid var(--ui-line); margin-bottom: 20px; }
.collection-tabs .native-button { display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 0 10px; border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: transparent; color: var(--ui-muted); font-size: 14px; }
.collection-tabs .native-button > span { font-size: 11px; font-variant-numeric: tabular-nums; }
.collection-tabs .native-button[aria-pressed="true"] { border-bottom-color: var(--ui-accent); color: var(--ui-accent); font-weight: 600; }
.library-filters { display: flex; gap: 10px; }
.search-field { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; height: 40px; padding: 0 12px; border: 1px solid var(--ui-line); border-radius: var(--ui-radius); background: var(--ui-surface); color: var(--ui-muted); }
.style-studio :deep(.native-field) { width: 100%; min-width: 0; max-width: 100%; height: 40px; padding: 9px 11px; border: 1px solid #cbd1d5; border-radius: var(--ui-radius); background: white; color: var(--ui-ink); font: 13px/1.5 var(--ui-font); letter-spacing: 0; }
.style-studio :deep(.native-field::placeholder) { color: var(--ui-muted); }
.search-field :deep(.native-field) { color: #f5f6f7; flex: 1; width: 0; height: 36px; padding: 0; border: 0; background: transparent; outline: none; }
.search-field:focus-within { outline: 2px solid var(--ui-accent); outline-offset: 2px; }
.style-studio select { min-width: 0; max-width: 100%; height: 40px; padding: 0 26px 0 10px; border: 1px solid #cbd1d5; border-radius: var(--ui-radius); background: white; color: var(--ui-ink); font-size: 13px; }
.palette-select { width: 112px; }
.palette-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 60px; }
.palette-swatches { display: flex; align-items: center; gap: 10px; }
.palette-swatch { width: 24px; height: 24px; padding: 0; border: 3px solid var(--ui-subtle); border-radius: 50%; background: var(--swatch); flex-shrink: 0; }
.palette-swatch[aria-pressed="true"] { outline: 2px solid var(--ui-ink); outline-offset: 2px; }
.all-palettes { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--ui-muted); }
.all-palettes[aria-pressed="true"] { background: var(--ui-selected); color: var(--ui-accent); }
.palette-name { font-size: 12px; color: var(--ui-muted); white-space: nowrap; }
.favorites-filter { display: flex; align-items: center; gap: 6px; min-height: 36px; padding: 6px 0 6px 12px; border: 0; background: transparent; color: var(--ui-muted); font-size: 12px; }
.favorites-filter[aria-pressed="true"] { color: var(--ui-favorite); }
.favorites-filter[aria-pressed="true"] .material-symbols-outlined { font-variation-settings: 'FILL' 1; }
.style-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px 20px; }
.style-item { position: relative; min-width: 0; }
.style-library select { background: #292c31; color: #f5f6f7; border-color: #484d54; }
.style-choice { display: flex; flex-direction: column; width: 100%; min-width: 0; padding: 0; border: 0; border-radius: 0; background: transparent; text-align: left; overflow: visible; color: var(--ui-ink); }
.style-stage { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 292px; background: #2a2d32; border: 1px solid transparent; border-radius: var(--ui-radius); transition: border-color .15s, background .15s; }
.style-choice:hover .style-stage { background: #32363c; border-color: #777f88; }
.style-choice.selected .style-stage { border-color: var(--ui-accent); background: #31382b; }
.style-choice.glass-preview .style-stage, .preview-area.glass-preview { background: #626f69; }
.preview-area.glass-preview .preview-heading, .preview-area.glass-preview .current-style { color: white; }
.style-stage :deep(.serene-photo-card) { pointer-events: none; }
.selection-mark { position: absolute; bottom: 8px; right: 8px; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; color: #20251b; background: var(--ui-accent); font-size: 16px !important; }
.style-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; width: 100%; min-height: 38px; padding: 10px 1px 0; }
.style-name { font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
.style-palette { display: inline-flex; align-items: center; gap: 5px; color: var(--ui-muted); font-size: 11px; white-space: nowrap; }
.meta-swatch { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.favorite-button { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; background: #24272ded; color: var(--ui-muted); opacity: 0; }
.favorite-button .material-symbols-outlined { font-size: 18px; }
.style-item:hover .favorite-button, .style-item:focus-within .favorite-button, .favorite-button.active { opacity: 1; }
.favorite-button.active { color: var(--ui-favorite); font-variation-settings: 'FILL' 1; }
.pagination { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; margin-top: 24px; border-top: 1px solid var(--ui-line); color: var(--ui-muted); font-size: 13px; font-variant-numeric: tabular-nums; }
.page-controls { display: flex; align-items: center; gap: 12px; }
.page-controls > span { min-width: 44px; text-align: center; }
.page-controls .icon-button { border: 1px solid var(--ui-line); background: var(--ui-surface); }
.card-editor { position: static; align-self: stretch; min-width: 0; background: white; border-left: 1px solid var(--ui-line); }
.editor-heading { display: flex; justify-content: space-between; align-items: center; padding: 26px 20px 16px; }
.editor-heading h2, .fields-heading h3 { margin: 0; font: 600 14px/1.5 var(--ui-font); }
.editor-heading > span { color: var(--ui-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.slot-tabs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; padding: 0 20px 22px; }
.slot-tabs .native-button { position: relative; min-width: 0; height: 60px; padding: 3px; border: 1px solid transparent; border-radius: 4px; background: var(--ui-canvas); overflow: hidden; }
.slot-tabs img { display: block; width: 100%; height: 100%; border-radius: 2px; object-fit: cover; }
.slot-tabs .native-button.active { border: 2px solid var(--ui-accent); padding: 2px; background: white; }
.slot-tabs .native-button > span { position: absolute; bottom: 4px; left: 4px; padding: 1px 3px; border-radius: 2px; color: white; background: #242629cc; font-size: 10px; }
.preview-area { padding: 14px 20px; border-block: 1px solid var(--ui-line); background: var(--ui-canvas); }
.preview-heading { display: flex; justify-content: space-between; align-items: center; color: var(--ui-muted); font-size: 12px; }
.editor-preview { display: flex; justify-content: center; align-items: center; padding: 18px 0; }
.current-style { color: var(--ui-ink); font-size: 12px; text-align: center; }
.editor-fields { padding: 20px; }
.fields-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.card-editor label { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; }
.field-heading { display: flex; justify-content: space-between; align-items: baseline; color: var(--ui-muted); font-size: 13px; }
.field-heading > span { font-size: 11px; }
.card-editor :deep(.native-multiline) { height: 76px; min-height: 76px; resize: vertical; }
.image-source { min-width: 0; margin-bottom: 20px; }
.image-source .image-field { margin-bottom: 8px; }
.upload-button { position: relative; inset: auto; transform: none; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; max-width: 100%; min-width: 0; min-height: 40px; padding: 8px 10px; margin: 0; border: 1px solid #cbd1d5; border-radius: var(--ui-radius); color: var(--ui-ink); background: var(--ui-subtle); font-size: 13px; }
.upload-button:hover { background: var(--ui-canvas); }
.upload-arrow { margin-left: auto; color: var(--ui-muted); }
.card-editor select { width: 100%; }
.editor-footer { display: flex; align-items: flex-start; gap: 8px; padding: 16px 20px; border-top: 1px solid var(--ui-line); }
.status-message { margin: 0; color: var(--ui-muted); font-size: 12px; overflow-wrap: anywhere; }
.status-dot { width: 6px; height: 6px; margin-top: 6px; border-radius: 50%; background: var(--ui-accent); flex-shrink: 0; }
.status-dot.changed { background: #ac751d; }
.empty-state { padding: 80px 12px; text-align: center; color: var(--ui-muted); }
.empty-state > .material-symbols-outlined { font-size: 32px; }
.empty-state .native-button { display: inline-block; padding: 10px 16px; border: 1px solid var(--ui-line); border-radius: var(--ui-radius); background: var(--ui-surface); color: var(--ui-accent); font-size: 13px; }
@media (max-width: 1100px) {
 .studio-body { grid-template-columns: minmax(0, 1fr) 292px; }
 .style-library { padding: 24px 20px; }
 .style-grid { grid-template-columns: repeat(auto-fill, minmax(204px, 1fr)); gap: 20px 12px; }
 .library-filters { flex-wrap: wrap; }
 .search-field { flex-basis: 100%; }
 .library-filters select { flex: 1; }
 .collection-tabs { gap: 18px; }
}
@media (max-width: 768px) {
 .studio-header { min-height: 64px; padding: 10px 16px; gap: 12px; }
 .brand-divider, .workspace-name, .action-divider { display: none; }
 .mobile-panels { position: sticky; top: 64px; z-index: 19; display: flex; height: 48px; background: white; border-bottom: 1px solid var(--ui-line); }
 .mobile-panels .native-button { display: flex; align-items: center; justify-content: center; gap: 8px; height: 48px; width: 50%; padding: 0; border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: transparent; color: var(--ui-muted); font-size: 13px; }
 .mobile-panels .native-button[aria-pressed="true"] { color: var(--ui-accent); border-bottom-color: var(--ui-accent); }
 .mobile-slot { font-size: 11px; }
 .studio-body { display: block; }
 .studio-body[data-mobile-panel="library"] .card-editor, .studio-body[data-mobile-panel="editor"] .style-library, .studio-body[data-mobile-panel="editor"] .three-workspace { display: none; }
 .style-library { padding: 24px 20px; scroll-margin-top: 124px; }
 .style-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px 16px; }
 .style-stage { height: 253px; }
 .card-editor { width: 100%; min-height: calc(100vh - 112px); border: 0; overflow: visible; }
 .slot-tabs { max-width: 440px; margin: auto; }
 .slot-tabs .native-button { height: 70px; }
 .editor-fields { max-width: 520px; margin: auto; }
 .favorite-button { opacity: 1; }
}
@media (max-width: 480px) {
 .studio-header { padding: 10px 12px; gap: 6px; }
 .studio-brand { font-size: 23px; }
 .header-actions { gap: 3px; }
 .render-modes .native-button { width: 30px; padding: 6px 0; }
 .mode-label { display: none; }
 .header-actions .icon-button { width: 30px; }
 .save-button { padding: 8px; font-size: 12px; gap: 4px; }
 .save-button .material-symbols-outlined { display: none; }
 .style-library { padding: 20px 12px; }
 .library-heading h1 { font-size: 22px; }
 .collection-tabs { justify-content: space-between; gap: 8px; }
 .collection-tabs .native-button { font-size: 13px; gap: 4px; }
 .collection-tabs .native-button > span { font-size: 10px; }
 .palette-swatches { gap: 8px; }
 .palette-name { display: none; }
 .palette-toolbar { gap: 4px; }
 .style-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 12px; }
 .style-stage { height: 214px; }
 .style-name { font-size: 12px; }
 .style-palette { font-size: 10px; }
 .style-meta { flex-wrap: wrap; gap: 2px 6px; }
 .favorite-button { width: 28px; height: 28px; top: 6px; right: 6px; }
}
@media (max-width: 340px) {
 .studio-header { padding-inline: 8px; }
 .studio-brand { font-size: 21px; }
 .header-actions .icon-button { width: 27px; }
 .style-library { padding-inline: 10px; }
 .style-grid { grid-template-columns: repeat(2, 150px); gap: 18px 0; justify-content: space-between; }
 .style-stage { border-inline: 0; border-radius: 0; }
}
@media (hover: none) { .favorite-button { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .style-stage { transition: none; } }
</style>
