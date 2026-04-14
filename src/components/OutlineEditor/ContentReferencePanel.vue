<script setup lang="ts">
import type { ReferenceItem } from '../../types'

const props = defineProps<{
  nodeId: string
  depth: number
  references?: ReferenceItem[]
}>()
</script>

<template>
  <div
    class="ref-panel"
    :style="{ marginLeft: `${(depth - 1) * 40 + 16}px`, marginRight: '16px' }"
  >
    <!-- Panel header -->
    <div class="ref-panel__header">
      <img src="/icons/p-content-ref.svg" alt="" class="ref-panel__header-icon" />
      <span class="ref-panel__header-title">内容参考</span>
    </div>

    <!-- Document list -->
    <div class="ref-panel__body">
      <template v-if="references && references.length">
        <div
          v-for="(item, i) in references"
          :key="i"
          class="ref-panel__item"
        >
          <span
            class="ref-panel__tag"
            :class="`ref-panel__tag--${item.type}`"
          >{{ item.label }}</span>
          <span class="ref-panel__filename">{{ item.name }}</span>
        </div>
      </template>
      <div v-else class="ref-panel__empty">暂无内容参考</div>
    </div>
  </div>
</template>

<style>
.ref-panel {
  background: #f8f9fb;
  border: 1px solid #eaedf0;
  border-radius: 12px;
  margin-top: 6px;
  margin-bottom: 12px;
  padding: 20px 24px 18px;
}

.ref-panel__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.ref-panel__header-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.ref-panel__header-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

/* Category tags row */
.ref-panel__categories {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.ref-panel__category-text {
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.ref-panel__category-text:hover {
  color: #e8792b;
}

/* Body */
.ref-panel__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* List items */
.ref-panel__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #eaedf0;
  border-radius: 10px;
}

/* Tags */
.ref-panel__tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 14px;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
  border: 1px solid;
}

.ref-panel__tag--knowledge {
  color: #e8792b;
  background: #fff7f0;
  border-color: #f5c49a;
}

.ref-panel__tag--upload {
  color: #d48a2c;
  background: #fefaf2;
  border-color: #f0d8a8;
}

.ref-panel__tag--recommend {
  color: #c89520;
  background: #fffdf5;
  border-color: #f0e0a0;
}

.ref-panel__empty {
  text-align: center;
  color: #bfbfbf;
  font-size: 13px;
  padding: 20px 0;
}

.ref-panel__filename {
  font-size: 14px;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
