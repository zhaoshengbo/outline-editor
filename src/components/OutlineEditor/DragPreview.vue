<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Ref } from 'vue'
import type { OutlineNode, DragState } from '../../types'
import { findNode, getDepth } from '../../utils/treeUtils'
import { getPrefix } from '../../utils/numbering'

const props = defineProps<{
  dragState: DragState
  mouseX: number
  mouseY: number
}>()

const nodes = inject<Ref<OutlineNode[]>>('nodes')!

const dragNode = computed(() => findNode(nodes.value, props.dragState.draggingId))
const dragDepth = computed(() => getDepth(nodes.value, props.dragState.draggingId))

interface PreviewItem {
  id: string
  title: string
  depth: number
  prefix: string
  isParagraph: boolean
}

function collectPreview(node: OutlineNode, depth: number, siblingIndex: number): PreviewItem[] {
  const result: PreviewItem[] = [{
    id: node.id,
    title: node.title,
    depth,
    prefix: node.isParagraph ? '' : getPrefix(depth, siblingIndex),
    isParagraph: node.isParagraph,
  }]
  node.children.forEach((child, i) => {
    result.push(...collectPreview(child, depth + 1, i))
  })
  return result
}

const previewItems = computed(() => {
  if (!dragNode.value) return []
  const idx = nodes.value.findIndex(n => n.id === dragNode.value!.id)
  const siblingIndex = idx !== -1 ? idx : 0
  return collectPreview(dragNode.value, dragDepth.value, siblingIndex)
})
</script>

<template>
  <div
    class="drag-preview"
    :style="{
      transform: `translate3d(${mouseX + 16}px, ${mouseY + 16}px, 0)`,
    }"
  >
    <!-- Header with handle and close icon -->
    <div class="drag-preview__header">
      <span class="drag-preview__handle">⠿</span>
    </div>

    <!-- Content -->
    <div class="drag-preview__body">
      <div
        v-for="item in previewItems"
        :key="item.id"
        class="drag-preview__item"
        :style="{ paddingLeft: `${(item.depth - dragDepth) * 24}px` }"
      >
        <span class="drag-preview__text">
          <span v-if="!item.isParagraph" class="drag-preview__prefix">{{ item.prefix }}</span>
          <span>{{ item.title }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style>
.drag-preview {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2000;
  will-change: transform;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  pointer-events: none;
  max-width: 420px;
  min-width: 200px;
  overflow: hidden;
}

.drag-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.drag-preview__handle {
  color: #ccc;
  font-size: 14px;
}

.drag-preview__close {
  color: #ccc;
  font-size: 12px;
}

.drag-preview__body {
  padding: 8px 14px 10px;
}

.drag-preview__item {
  padding: 3px 0;
}

.drag-preview__text {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #333;
  line-height: 1.6;
}

.drag-preview__prefix {
  font-weight: 500;
  margin-right: 4px;
  flex-shrink: 0;
}

</style>
