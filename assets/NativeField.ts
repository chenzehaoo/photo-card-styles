import { defineComponent, h } from 'vue';

// Render browser form elements directly; uni-app wraps template input/textarea tags.
export default defineComponent({
  name: 'NativeField',
  inheritAttrs: false,
  props: { modelValue: { type: String, default: '' }, multiline: Boolean },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () => h(props.multiline ? 'textarea' : 'input', {
      ...attrs,
      class: [attrs.class, 'native-field', { 'native-multiline': props.multiline }],
      value: props.modelValue,
      onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
    });
  },
});
