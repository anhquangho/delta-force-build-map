<script setup lang="ts">
import type { ItemRarity } from '@/lib/item-presentation'

withDefaults(defineProps<{
  icon?: string
  rarity?: ItemRarity
  selected?: boolean
  size?: number
}>(), { icon: undefined, rarity: undefined, selected: false, size: 36 })
</script>

<template>
  <span
    class="item-icon"
    :class="{ 'is-selected': selected }"
    :data-rarity="rarity ?? 'unspecified'"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <img
      v-if="icon"
      :src="icon"
      alt=""
      draggable="false"
    >
    <span v-else>?</span>
  </span>
</template>
