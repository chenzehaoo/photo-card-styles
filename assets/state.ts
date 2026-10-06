import { ref } from 'vue';
import { defaultCards, parseCards, type ShowcaseCard } from './catalog';

const storageKey = 'serene.photo-cards.v1';
function readSaved(): ShowcaseCard[] {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return parseCards(JSON.parse(saved));
  } catch { /* Missing storage or old invalid data falls back to the original five. */ }
  return defaultCards.map(card => ({ ...card }));
}
export const savedCards = ref<ShowcaseCard[]>(readSaved());
export function saveCards(cards: ShowcaseCard[]) {
  const validated = parseCards(cards);
  localStorage.setItem(storageKey, JSON.stringify(validated));
  savedCards.value = validated;
}
