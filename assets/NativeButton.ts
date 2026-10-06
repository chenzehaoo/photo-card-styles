import { defineComponent, h } from 'vue';

export default defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('button', { type: 'button', ...attrs, class: ['native-button', attrs.class] }, slots.default?.());
  },
});
