<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Ref } from 'vue'
import type { OutlineNode, ContextMenuState } from '../../types'
import { findNode, isLeaf, getDepth, findParent } from '../../utils/treeUtils'
import { EditPen, List, Plus, DocumentAdd, CopyDocument, Top, Bottom } from '@element-plus/icons-vue'

const props = defineProps<{
  state: ContextMenuState
}>()

const emit = defineEmits<{
  close: []
  'toggle-paragraph': [id: string]
  'add-sibling': [id: string]
  'add-child': [id: string]
  duplicate: [id: string]
  'move-up': [id: string]
  'move-down': [id: string]
}>()

const nodes = inject<Ref<OutlineNode[]>>('nodes')!

const node = computed(() => findNode(nodes.value, props.state.nodeId))
const nodeIsLeaf = computed(() => node.value ? isLeaf(node.value) : false)
const depth = computed(() => getDepth(nodes.value, props.state.nodeId))

const canAddChild = computed(() => {
  if (!node.value) return false
  if (node.value.isParagraph) return false
  return depth.value < 4
})

const canMoveUp = computed(() => {
  const topIdx = nodes.value.findIndex(n => n.id === props.state.nodeId)
  if (topIdx > 0) return true
  const { parent, index } = findParent(nodes.value, props.state.nodeId)
  if (parent && index > 0) return true
  return false
})

const canMoveDown = computed(() => {
  const topIdx = nodes.value.findIndex(n => n.id === props.state.nodeId)
  if (topIdx !== -1 && topIdx < nodes.value.length - 1) return true
  const { parent, index } = findParent(nodes.value, props.state.nodeId)
  if (parent && index < parent.children.length - 1) return true
  return false
})

function handleClick(e: MouseEvent) {
  e.stopPropagation()
}
</script>

<template>
  <div
    class="context-menu"
    :style="{
      left: `${state.x}px`,
      top: `${state.y}px`,
      transform: state.aboveTarget ? 'translateY(-100%) translateY(-6px)' : 'none'
    }"
    @click="handleClick"
    @contextmenu.prevent.stop
    @mousedown.prevent
  >
    <!-- Toggle paragraph -->
    <button
      v-if="node && !node.isParagraph"
      class="context-menu__btn"
      :disabled="!nodeIsLeaf"
      @click="emit('toggle-paragraph', state.nodeId)"
    ><component :is="EditPen" class="context-menu__icon" />设为段落内容</button>
    <button
      v-else
      class="context-menu__btn"
      @click="emit('toggle-paragraph', state.nodeId)"
    ><component :is="List" class="context-menu__icon" />设为段落标题</button>

    <span class="context-menu__divider"></span>

    <button
      class="context-menu__btn"
      @click="emit('add-sibling', state.nodeId)"
    ><component :is="Plus" class="context-menu__icon" />添加同级</button>

    <button
      class="context-menu__btn"
      :disabled="!canAddChild"
      @click="emit('add-child', state.nodeId)"
    ><component :is="DocumentAdd" class="context-menu__icon" />添加下级</button>

    <span class="context-menu__divider"></span>

    <button
      class="context-menu__btn"
      @click="emit('duplicate', state.nodeId)"
    ><component :is="CopyDocument" class="context-menu__icon" />复制</button>

    <span class="context-menu__divider"></span>

    <button
      class="context-menu__btn"
      :disabled="!canMoveUp"
      @click="emit('move-up', state.nodeId)"
    ><component :is="Top" class="context-menu__icon" />上移</button>

    <button
      class="context-menu__btn"
      :disabled="!canMoveDown"
      @click="emit('move-down', state.nodeId)"
    ><component :is="Bottom" class="context-menu__icon" />下移</button>
  </div>
</template>

<style>
.context-menu {
  position: absolute;
  z-index: 1000;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 3px 6px;
  gap: 2px;
}

.context-menu__btn {
  border: none;
  background: none;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.15s, color 0.15s;
  font-family: inherit;
}

.context-menu__btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.context-menu__btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.context-menu__btn--danger:hover:not(:disabled) {
  background: #fff1f0;
  color: #ff4d4f;
}

.context-menu__icon {
  width: 14px;
  height: 14px;
  opacity: 0.5;
  flex-shrink: 0;
}

.context-menu__btn:hover:not(:disabled) .context-menu__icon {
  opacity: 0.8;
}

.context-menu__divider {
  width: 1px;
  height: 14px;
  background: #e8e8e8;
  flex-shrink: 0;
  margin: 0 2px;
}
</style>
