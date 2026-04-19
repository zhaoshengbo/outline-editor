<script setup lang="ts">
import { ref, computed, inject, nextTick, watch } from 'vue'
import type { Ref } from 'vue'
import type { OutlineNode, DragState, DragMeta, ReferenceItem } from '../../types'
import { getPrefix } from '../../utils/numbering'
import { isLeaf } from '../../utils/treeUtils'
import ContentReferencePanel from './ContentReferencePanel.vue'
import { ArrowUp, ArrowDown, CaretRight } from '@element-plus/icons-vue'

const props = defineProps<{
  node: OutlineNode
  depth: number
  index: number
}>()

const editingId = inject<Ref<string | null>>('editingId')!
const dragState = inject<Ref<DragState | null>>('dragState')!
const dragMeta = inject<Ref<DragMeta | null>>('dragMeta')!
const onEdit = inject<(id: string, rowRect?: { x: number; y: number }) => void>('onEdit')!
const onEditDone = inject<(id: string, title: string) => void>('onEditDone')!
const onDelete = inject<(id: string) => void>('onDelete')!
const onDragStart = inject<(id: string, x: number, y: number) => void>('onDragStart')!
const onDragOver = inject<(targetId: string, position: 'before' | 'after' | 'inside') => void>('onDragOver')!
const onDragEnd = inject<() => void>('onDragEnd')!
const onToggleReference = inject<(id: string) => void>('onToggleReference')!
const onAddReference = inject<(nodeId: string, item: ReferenceItem) => void>('onAddReference')!
const onRemoveReference = inject<(nodeId: string, index: number) => void>('onRemoveReference')!

const hovered = ref(false)
const editInput = ref<HTMLInputElement | null>(null)
const editText = ref('')
const rowEl = ref<HTMLElement | null>(null)

const isEditing = computed(() => editingId.value === props.node.id)
const isDragging = computed(() => dragState.value?.draggingId === props.node.id)
const prefix = computed(() => getPrefix(props.depth, props.index))
const nodeIsLeaf = computed(() => isLeaf(props.node))

function getNumberingIndex(children: OutlineNode[], childIndex: number): number {
  let count = 0
  for (let i = 0; i < childIndex; i++) {
    if (!children[i].isParagraph) count++
  }
  return count
}

watch(isEditing, (val) => {
  if (val) {
    editText.value = props.node.title
    nextTick(() => {
      editInput.value?.focus()
      editInput.value?.select()
    })
  }
})

function handleTitleClick() {
  const rect = rowEl.value?.getBoundingClientRect()
  if (rect) {
    const paddingLeft = (props.depth - 1) * 40 + 16
    onEdit(props.node.id, { x: rect.left + paddingLeft, y: rect.top })
  } else {
    onEdit(props.node.id)
  }
}

function handleEditKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === 'Escape') {
    onEditDone(props.node.id, editText.value)
  }
}

function handleEditBlur() {
  onEditDone(props.node.id, editText.value)
}

// --- Drag ---
function handleDragStart(e: DragEvent) {
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', props.node.id)
  const img = new Image()
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  e.dataTransfer!.setDragImage(img, 0, 0)
  onDragStart(props.node.id, e.clientX, e.clientY)
}

function handleDragOverEvent(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer!.dropEffect = 'move'

  if (!dragState.value || !dragMeta.value) return
  if (dragState.value.draggingId === props.node.id) return
  if (dragMeta.value.descendantIds.has(props.node.id)) return

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const y = e.clientY - rect.top
  const third = rect.height / 3
  const targetDepth = dragMeta.value.depthMap.get(props.node.id) ?? 1
  const stDepth = dragMeta.value.subtreeDepth

  let position: 'before' | 'after' | 'inside'
  if (y < third) {
    position = 'before'
  } else if (y > third * 2) {
    position = 'after'
  } else {
    if (targetDepth + stDepth <= 4) {
      position = 'inside'
    } else {
      position = 'after'
    }
  }

  // Validate depth for before/after: dragged node at targetDepth, subtree adds stDepth-1
  if (position === 'before' || position === 'after') {
    if (targetDepth + stDepth - 1 > 4) return
  }

  onDragOver(props.node.id, position)
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  onDragEnd()
}

const showDropIndicator = computed(() => {
  if (!dragState.value) return null
  if (dragState.value.overNodeId !== props.node.id) return null
  return dragState.value.dropPosition
})
</script>

<template>
  <div
    class="onode"
    :class="{ 'onode--dragging': isDragging }"
  >
    <!-- Drop indicator: before -->
    <div
      v-if="showDropIndicator === 'before'"
      class="onode__drop-indicator onode__drop-indicator--before"
      :style="{ paddingLeft: `${(depth - 1) * 40 + 16}px` }"
    >
      <component :is="CaretRight" class="onode__drop-arrow" />
      <div class="onode__drop-line"></div>
    </div>

    <!-- Main row -->
    <div
      ref="rowEl"
      class="onode__row"
      :class="{ 'onode__row--hovered': (hovered && !isDragging) || !!node.referenceExpanded }"
      :style="{ paddingLeft: `${(depth - 1) * 40 + 16}px`, '--row-indent': `${(depth - 1) * 40 + 34}px` }"
      draggable="true"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
      @dragstart="handleDragStart"
      @dragover="handleDragOverEvent"
      @drop="handleDrop"
    >
      <!-- Drag handle (visibility keeps space) -->
      <span
        class="onode__drag-handle"
        :style="{ visibility: hovered && !isDragging ? 'visible' : 'hidden' }"
      >⠿</span>

      <!-- Prefix -->
      <span
        v-if="!node.isParagraph"
        class="onode__prefix"
      >{{ prefix }}</span>

      <!-- Title -->
      <template v-if="isEditing">
        <input
          ref="editInput"
          v-model="editText"
          class="onode__edit-input"
          @keydown="handleEditKeydown"
          @blur="handleEditBlur"
          @click.stop
        />
      </template>
      <template v-else>
        <span
          class="onode__title"
          :class="{ 'onode__title--paragraph': node.isParagraph }"
          @click.stop="handleTitleClick"
        >{{ node.title }}</span>
      </template>

      <!-- Right side actions (fixed width container) -->
      <div class="onode__actions">
        <!-- Content reference toggle (leaf only) -->
        <span
          v-if="nodeIsLeaf && node.references && node.references.length > 0"
          class="onode__ref-toggle"
          :class="{ 'onode__ref-toggle--active': node.referenceExpanded }"
          @click.stop="onToggleReference(node.id)"
        >内容参考 <component :is="node.referenceExpanded ? ArrowUp : ArrowDown" class="onode__ref-arrow" /></span>

        <!-- Delete button (visibility keeps space) -->
        <span
          class="onode__delete"
          :style="{ visibility: hovered && !isDragging ? 'visible' : 'hidden' }"
          @click.stop="onDelete(node.id)"
        >✕</span>
      </div>
    </div>

    <!-- Drop indicator: inside -->
    <div
      v-if="showDropIndicator === 'inside'"
      class="onode__drop-indicator onode__drop-indicator--inside"
      :style="{ paddingLeft: `${depth * 40 + 16}px` }"
    >
      <component :is="CaretRight" class="onode__drop-arrow" />
      <div class="onode__drop-line"></div>
    </div>

    <!-- Content Reference Panel -->
    <ContentReferencePanel
      v-if="nodeIsLeaf && node.referenceExpanded"
      :node-id="node.id"
      :depth="depth"
      :references="node.references"
      @remove="onRemoveReference(node.id, $event)"
    />

    <!-- Children -->
    <div v-if="node.children.length > 0" class="onode__children">
      <OutlineNodeVue
        v-for="(child, childIndex) in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :index="getNumberingIndex(node.children, childIndex)"
      />
    </div>

    <!-- Drop indicator: after -->
    <div
      v-if="showDropIndicator === 'after'"
      class="onode__drop-indicator onode__drop-indicator--after"
      :style="{ paddingLeft: `${(depth - 1) * 40 + 16}px` }"
    >
      <component :is="CaretRight" class="onode__drop-arrow" />
      <div class="onode__drop-line"></div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'OutlineNodeVue' }
</script>

<style>
.onode {
  position: relative;
}

.onode--dragging {
  opacity: 0.35;
}

/* --- Row --- */
.onode__row {
  display: flex;
  align-items: center;
  padding: 4px 16px;
  min-height: 42px;
  cursor: default;
  position: relative;
  border-radius: 6px;
  transition: background-color 0.15s;
  isolation: isolate;
}

.onode__row--hovered::before {
  content: '';
  position: absolute;
  inset: 0;
  left: var(--row-indent, 0px);
  right: 36px;
  background-color: #f5f6f8;
  border-radius: 0;
  z-index: -1;
  transition: background-color 0.15s;
}

/* --- Drag handle (in flow, before prefix) --- */
.onode__drag-handle {
  cursor: grab;
  color: #c0c0c0;
  font-size: 16px;
  user-select: none;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
  margin-right: 2px;
}

.onode__drag-handle:hover {
  color: #888;
}

/* --- Prefix --- */
.onode__prefix {
  font-weight: 600;
  margin-right: 6px;
  flex-shrink: 0;
  user-select: none;
  color: #1a1a1a;
  font-size: 15px;
}

/* --- Title --- */
.onode__title {
  cursor: pointer;
  flex: 1;
  min-width: 0;
  word-break: break-word;
  font-size: 15px;
  color: #1a1a1a;
  font-weight: 500;
}

.onode__title--paragraph {
  color: #1a1a1a;
  font-weight: 400;
}

/* --- Edit input --- */
.onode__edit-input {
  flex: 1;
  font-size: 15px;
  border: 1px solid #4096ff;
  border-radius: 8px;
  padding: 6px 12px;
  outline: none;
  font-family: inherit;
  min-width: 0;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(64, 150, 255, 0.08);
}

/* --- Right actions container (fixed layout) --- */
.onode__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 8px;
  gap: 6px;
}

/* --- Content reference toggle --- */
.onode__ref-toggle {
  font-size: 13px;
  color: #666;
  cursor: pointer;
  padding: 3px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  white-space: nowrap;
  user-select: none;
  flex-shrink: 0;
  background: #fafafa;
  transition: all 0.2s;
}

.onode__ref-toggle:hover {
  border-color: #bbb;
  color: #333;
}

.onode__ref-toggle--active {
  background: #f0f5ff;
  border-color: #4096ff;
  color: #4096ff;
}

.onode__ref-arrow {
  width: 14px;
  height: 14px;
  vertical-align: -2px;
  margin-left: 2px;
}


/* --- Delete button --- */
.onode__delete {
  color: #ccc;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
  transition: color 0.2s;
}

.onode__delete:hover {
  color: #ff4d4f;
}

/* --- Drop indicators (indented) --- */
.onode__drop-indicator {
  display: flex;
  align-items: center;
  height: 2px;
  position: relative;
  padding-right: 16px;
}

.onode__drop-indicator--before {
  margin-top: -1px;
}

.onode__drop-indicator--after {
  margin-bottom: -1px;
}

.onode__drop-indicator--inside {
  margin: 2px 0;
}

.onode__drop-arrow {
  color: #4096ff;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.onode__drop-line {
  flex: 1;
  height: 2px;
  background: #4096ff;
  border-radius: 1px;
}
</style>
