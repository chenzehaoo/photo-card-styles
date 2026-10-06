<template>
  <section class="export-panel">
    <h3>成品导出</h3>
    <div class="export-options">
      <label>格式<select v-model="format" aria-label="导出格式"><option value="png">PNG</option><option value="jpeg">JPG</option></select></label>
      <label>分辨率<select v-model.number="scale" aria-label="导出分辨率"><option :value="2">400 × 500</option><option :value="4">800 × 1000</option><option :value="6">1200 × 1500</option><option :value="10">2000 × 2500</option></select></label>
    </div>
    <label class="background-label">背景<select v-model="background" aria-label="导出背景"><option v-if="format === 'png'" value="transparent">透明</option><option value="#ffffff">白色</option><option value="#eaf1ed">浅绿</option><option value="#242c28">深灰</option></select></label>
    <div class="export-actions"><NativeButton role="button" :disabled="busy" @click="run(false)"><span class="material-symbols-outlined" aria-hidden="true">download</span>导出当前照片</NativeButton><NativeButton role="button" :disabled="busy" @click="run(true)"><span class="material-symbols-outlined" aria-hidden="true">folder_zip</span>批量导出 ZIP</NativeButton></div>
    <div class="export-status"><p role="status">{{ message }}</p><NativeButton v-if="busy" role="button" @click="controller?.abort()">取消</NativeButton></div>
  </section>
</template>
<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import './studio-tokens.css';
import NativeButton from './NativeButton';
import { exportCard, exportBatch, downloadBlob, photoFilename } from './export';
import type { ShowcaseCard } from './catalog';
const props = defineProps<{ cards: ShowcaseCard[]; slot: number }>();
const format = ref<'png' | 'jpeg'>('png');
const scale = ref(6);
const background = ref('transparent');
const busy = ref(false);
const message = ref('');
let controller: AbortController | undefined;
watch(format, value => { if (value === 'jpeg' && background.value === 'transparent') background.value = '#ffffff'; });
async function run(batch: boolean) {
  if (busy.value) return;
  busy.value = true; controller = new AbortController();
  const cards = props.cards.map(card => ({ ...card }));
  const slot = props.slot;
  const options = { format: format.value, scale: scale.value, background: background.value, signal: controller.signal };
  message.value = batch ? `正在导出 0 / ${cards.length}` : '正在生成图片';
  try {
    const blob = batch ? await exportBatch(cards, options, done => { message.value = `正在导出 ${done} / ${cards.length}`; }) : await exportCard(cards[slot], options);
    controller.signal.throwIfAborted();
    downloadBlob(blob, batch ? 'serene-photos.zip' : photoFilename(cards[slot], slot, options.format));
    message.value = batch ? `已导出 ${cards.length} 张成品照片` : '成品图片已导出';
  } catch (error) { message.value = controller.signal.aborted ? '已取消导出' : error instanceof Error ? error.message : '导出失败'; }
  finally { busy.value = false; }
}
onBeforeUnmount(() => controller?.abort());
</script>
<style scoped>
.export-panel { padding: 20px 20px 8px; border-top: 1px solid var(--ui-line); background: var(--ui-surface); font: 13px/1.5 var(--ui-font); }
h3 { margin: 0 0 16px; font: 600 14px/1.5 var(--ui-font); }
.export-options { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }
.export-panel label { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; color: var(--ui-muted); font-size: 13px; }
select { height: 40px; min-width: 0; border: 1px solid #cbd1d5; border-radius: var(--ui-radius); background: white; color: var(--ui-ink); font: inherit; padding: 0 8px; }
.export-actions { display: flex; flex-direction: column; gap: 8px; }
.native-button { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0; min-height: 40px; padding: 9px; border: 1px solid #cbd1d5; border-radius: var(--ui-radius); background: white; color: var(--ui-ink); font: 13px/1.4 var(--ui-font); cursor: pointer; }
.native-button:hover { background: var(--ui-subtle); }
.export-actions .native-button:first-child { color: white; background: var(--ui-accent); border-color: var(--ui-accent); font-weight: 600; }
.export-actions .native-button:first-child:hover { background: #124e42; }
.native-button:disabled { opacity: .5; cursor: wait; }
.material-symbols-outlined { font-size: 18px; }
.export-status { display: flex; align-items: center; gap: 8px; min-height: 40px; }
.export-status p { margin: 12px 0; color: var(--ui-muted); font-size: 12px; overflow-wrap: anywhere; }
.export-status .native-button { margin-left: auto; padding: 4px 7px; flex-shrink: 0; }
</style>
