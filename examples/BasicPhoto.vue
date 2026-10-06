<script setup lang="ts">
import { reactive } from 'vue';
import PhotoCard from '../assets/PhotoCard.vue';
import type { ShowcaseCard } from '../assets/catalog';

const card = reactive<ShowcaseCard>({
  id: 'my-photo',
  image: '/photos/summer.jpg',
  type: 'postcard-jade',
  label: 'Summer memories',
  alt: 'My summer photograph',
  position: 'center',
});
</script>

<template>
  <PhotoCard :card="card" />
</template>
