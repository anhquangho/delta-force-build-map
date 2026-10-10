<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ItemRarity } from '@/lib/item-presentation'

const props = withDefaults(defineProps<{
  icon?: string
  fallbackIcon?: string
  rarity?: ItemRarity
  selected?: boolean
  size?: number
}>(), { icon: undefined, fallbackIcon: undefined, rarity: undefined, selected: false, size: 36 })

const imageSource = ref(props.icon ?? props.fallbackIcon)

watch(() => [props.icon, props.fallbackIcon], () => {
  imageSource.value = props.icon ?? props.fallbackIcon
})

function onImageError() {
  if (imageSource.value === props.icon && props.fallbackIcon && props.fallbackIcon !== props.icon) {
    imageSource.value = props.fallbackIcon
  } else {
    imageSource.value = undefined
  }
}
</script>

<template>
  <span
    class="item-icon"
    :class="[`rarity-${rarity ?? 'unspecified'}`, { 'is-selected': selected }]"
    :data-rarity="rarity ?? 'unspecified'"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <img
      v-if="imageSource"
      :src="imageSource"
      alt=""
      decoding="async"
      draggable="false"
      @error="onImageError"
    >
    <span v-else>?</span>
  </span>
</template>
