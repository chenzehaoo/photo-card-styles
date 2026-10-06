<template>
  <article class="serene-photo-card" :class="[`pc-${style.family === 'original' ? style.id : style.family}`, { 'pc-long-caption': card.label.length > 32 }]"
    :style="style.variables" :data-style="style.id">
    <div class="pc-inner">
      <div class="pc-image-wrap" :class="{ 'pc-image-error': failed }">
        <img v-if="!failed" :src="card.image" :alt="card.alt || card.label" class="pc-image"
          :style="{ objectPosition: card.position || 'center' }" :loading="lazy ? 'lazy' : 'eager'"
          @error="failed = true" />
        <span v-else class="pc-error" role="img" :aria-label="card.alt || card.label">图片无法加载</span>
      </div>
      <span ref="labelRef" class="pc-label" :title="card.label"><span ref="textRef">{{ card.label }}</span></span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { resolvePhotoStyle, type ShowcaseCard } from './catalog';
import './styles.css';
const props = withDefaults(defineProps<{ card: ShowcaseCard; lazy?: boolean }>(), { lazy: false });
const style = computed(() => resolvePhotoStyle(props.card.type));
const failed = ref(false);
watch(() => props.card.image, () => { failed.value = false; });
const labelRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | undefined;
let disposed = false;
function fitLabel() {
  const label = labelRef.value;
  const text = textRef.value;
  if (!label || !text || disposed) return;
  text.style.fontSize = '';
  const css = getComputedStyle(label);
  let size = parseFloat(css.fontSize);
  const width = label.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
  const height = label.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
  // Keep long custom captions inside their reserved area, including vertical labels.
  while (size > 7 && (text.scrollHeight > height + 1 || text.scrollWidth > width + 1)) {
    text.style.fontSize = `${--size}px`;
  }
}
watch(() => [props.card.label, props.card.type], () => nextTick(fitLabel));
onMounted(() => {
  fitLabel();
  if (typeof ResizeObserver !== 'undefined' && labelRef.value) {
    resizeObserver = new ResizeObserver(fitLabel);
    resizeObserver.observe(labelRef.value);
  }
  document.fonts?.ready.then(fitLabel);
});
onBeforeUnmount(() => { disposed = true; resizeObserver?.disconnect(); });
</script>
