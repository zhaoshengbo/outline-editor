<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted, watch } from 'vue'
import type { OutlineNode, OutlineNodeData, ReferenceItem, DragState, DragMeta, ContextMenuState } from '../../types'
import { createNode, updateNode, deleteNode, insertSibling, insertAsChild, duplicateNode, moveUp, moveDown, moveNode, findNode, getSubtreeMaxDepth } from '../../utils/treeUtils'
import { fromOutlineData, toOutlineData } from '../../utils/dataConverter'
import { computeNumbers } from '../../utils/numbering'
import OutlineNodeVue from './OutlineNode.vue'
import ContextMenu from './ContextMenu.vue'
import DragPreview from './DragPreview.vue'

const props = defineProps<{
  initialData?: OutlineNodeData[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'node-click': [node: OutlineNode]
  'update:initialData': [data: OutlineNodeData[]]
}>()

const defaultData: OutlineNode[] = [
  {
    id: 'n1',
    title: '总则',
    isParagraph: false,
    children: [
      {
        id: 'n1-1',
        title: '编制目的与依据',
        isParagraph: false,
        children: [
          { id: 'n1-1-1', title: '编制目的', isParagraph: true, children: [] },
          { id: 'n1-1-2', title: '编制依据', isParagraph: false, children: [
            { id: 'n1-1-2-1', title: '《国务院办公厅关于全面推进城镇老旧小区改造工作的指导意见》', isParagraph: false, children: [] },
            { id: 'n1-1-2-2', title: '《住房和城乡建设部关于加强城镇老旧小区改造配套设施建设的通知》', isParagraph: false, children: [] },
          ]},
        ],
      },
      {
        id: 'n1-2',
        title: '适用范围',
        isParagraph: false,
        children: [
          { id: 'n1-2-1', title: '地域范围', isParagraph: true, children: [] },
          { id: 'n1-2-2', title: '改造对象认定标准', isParagraph: false, children: [
            { id: 'n1-2-2-1', title: '基础设施老化严重', isParagraph: false, children: [] },
            { id: 'n1-2-2-2', title: '公共服务设施缺失', isParagraph: false, children: [] },
          ]},
        ],
      },
      {
        id: 'n1-3',
        title: '基本原则',
        isParagraph: false,
        children: [
          { id: 'n1-3-1', title: '政府引导、居民自愿', isParagraph: false, children: [] },
          { id: 'n1-3-2', title: '因地制宜、分类施策', isParagraph: false, children: [] },
          { id: 'n1-3-3', title: '统筹协调、长效管理', isParagraph: false, children: [] },
        ],
      },
    ],
  },
  {
    id: 'n2',
    title: '改造内容与标准',
    isParagraph: false,
    children: [
      {
        id: 'n2-1',
        title: '基础类改造',
        isParagraph: false,
        children: [
          { id: 'n2-1-1', title: '建筑物本体修缮', isParagraph: false, children: [
            { id: 'n2-1-1-1', title: '屋面防水及保温工程', isParagraph: true, children: [] },
            { id: 'n2-1-1-2', title: '外墙及楼道粉刷', isParagraph: false, children: [] },
            { id: 'n2-1-1-3', title: '楼梯扶手及公共门窗更换', isParagraph: false, children: [] },
          ]},
          { id: 'n2-1-2', title: '市政配套设施改造', isParagraph: false, children: [
            { id: 'n2-1-2-1', title: '供水管网改造', isParagraph: true, children: [] },
            { id: 'n2-1-2-2', title: '排水及雨污分流', isParagraph: false, children: [] },
            { id: 'n2-1-2-3', title: '供电线路规整', isParagraph: false, children: [] },
            { id: 'n2-1-2-4', title: '道路及照明修复', isParagraph: false, children: [] },
          ]},
        ],
      },
      {
        id: 'n2-2',
        title: '完善类改造',
        isParagraph: false,
        children: [
          { id: 'n2-2-1', title: '加装电梯', isParagraph: true, children: [] },
          { id: 'n2-2-2', title: '停车设施建设', isParagraph: false, children: [
            { id: 'n2-2-2-1', title: '地面停车位规划', isParagraph: false, children: [] },
            { id: 'n2-2-2-2', title: '充电桩配套安装', isParagraph: false, children: [] },
          ]},
          { id: 'n2-2-3', title: '无障碍设施完善', isParagraph: false, children: [] },
        ],
      },
      {
        id: 'n2-3',
        title: '提升类改造',
        isParagraph: false,
        children: [
          { id: 'n2-3-1', title: '社区养老托幼服务设施', isParagraph: false, children: [] },
          { id: 'n2-3-2', title: '智慧安防系统', isParagraph: false, children: [
            { id: 'n2-3-2-1', title: '视频监控全覆盖', isParagraph: false, children: [] },
            { id: 'n2-3-2-2', title: '智能门禁及访客管理', isParagraph: false, children: [] },
          ]},
          { id: 'n2-3-3', title: '公共绿化及休闲空间', isParagraph: false, children: [] },
        ],
      },
    ],
  },
  {
    id: 'n3',
    title: '实施程序与管理',
    isParagraph: false,
    children: [
      {
        id: 'n3-1',
        title: '项目申报与审批',
        isParagraph: false,
        children: [
          { id: 'n3-1-1', title: '居民意愿征集', isParagraph: true, children: [] },
          { id: 'n3-1-2', title: '改造方案编制', isParagraph: false, children: [] },
          { id: 'n3-1-3', title: '项目立项审批', isParagraph: false, children: [] },
        ],
      },
      {
        id: 'n3-2',
        title: '工程实施管理',
        isParagraph: false,
        children: [
          { id: 'n3-2-1', title: '施工单位遴选', isParagraph: false, children: [] },
          { id: 'n3-2-2', title: '质量安全监管', isParagraph: false, children: [
            { id: 'n3-2-2-1', title: '施工质量管控要点', isParagraph: false, children: [] },
            { id: 'n3-2-2-2', title: '安全文明施工要求', isParagraph: false, children: [] },
          ]},
          { id: 'n3-2-3', title: '竣工验收标准', isParagraph: true, children: [] },
        ],
      },
    ],
  },
  {
    id: 'n4',
    title: '资金保障与监督',
    isParagraph: false,
    children: [
      {
        id: 'n4-1',
        title: '资金筹措渠道',
        isParagraph: false,
        children: [
          { id: 'n4-1-1', title: '中央及省级财政补助', isParagraph: false, children: [] },
          { id: 'n4-1-2', title: '市区两级财政配套', isParagraph: false, children: [] },
          { id: 'n4-1-3', title: '居民合理分担', isParagraph: false, children: [] },
          { id: 'n4-1-4', title: '社会资本引入', isParagraph: false, children: [] },
        ],
      },
      {
        id: 'n4-2',
        title: '资金使用监管',
        isParagraph: false,
        children: [
          { id: 'n4-2-1', title: '专账管理制度', isParagraph: false, children: [] },
          { id: 'n4-2-2', title: '审计与绩效评价', isParagraph: true, children: [] },
        ],
      },
    ],
  },
]

const nodes = ref<OutlineNode[]>(
  computeNumbers(props.initialData ? fromOutlineData(props.initialData) : defaultData)
)

function setNodes(newNodes: OutlineNode[]) {
  nodes.value = computeNumbers(newNodes)
}

let suppressPropWatch = false

watch(() => props.initialData, (data) => {
  if (suppressPropWatch) { suppressPropWatch = false; return }
  if (data) setNodes(fromOutlineData(data))
})

watch(nodes, (newNodes) => {
  suppressPropWatch = true
  emit('update:initialData', toOutlineData(newNodes))
}, { deep: true })

// --- Public API ---
function initData(data: OutlineNodeData[]) {
  setNodes(fromOutlineData(data))
}

function getData(): OutlineNodeData[] {
  return toOutlineData(nodes.value)
}

function setReferences(nodeId: string, refs: ReferenceItem[]) {
  setNodes(updateNode(nodes.value, nodeId, { references: refs }))
}

function clearReferences(nodeId: string) {
  setNodes(updateNode(nodes.value, nodeId, { references: undefined }))
}

function getReferences(nodeId: string): ReferenceItem[] | undefined {
  const node = findNode(nodes.value, nodeId)
  return node?.references
}

defineExpose({ initData, getData, setReferences, clearReferences, getReferences, addReference, removeReference, setRequirements, clearRequirements })

const editorEl = ref<HTMLElement | null>(null)
const editingId = ref<string | null>(null)
const contextMenu = ref<ContextMenuState | null>(null)
const dragState = ref<DragState | null>(null)
const dragMeta = ref<DragMeta | null>(null)
const dragMouseX = ref(0)
const dragMouseY = ref(0)

// --- Event handlers ---

function handleEdit(id: string, rowRect?: { x: number; y: number }) {
  editingId.value = id
  if (rowRect) {
    const editorRect = editorEl.value?.getBoundingClientRect()
    const x = editorRect ? rowRect.x - editorRect.left : rowRect.x
    const y = editorRect ? rowRect.y - editorRect.top : rowRect.y
    contextMenu.value = { nodeId: id, x, y, aboveTarget: true }
    const clickedNode = findNode(nodes.value, id)
    if (clickedNode) emit('node-click', clickedNode)
  }
}

function handleEditDone(id: string, newTitle: string) {
  if (editingId.value === id) {
    editingId.value = null
    contextMenu.value = null
    if (newTitle.trim()) {
      setNodes(updateNode(nodes.value, id, { title: newTitle }))
    }
  }
}

function handleDelete(id: string) {
  setNodes(deleteNode(nodes.value, id))
  contextMenu.value = null
  editingId.value = null
}

function handleCloseContextMenu() {
  contextMenu.value = null
}

function handleToggleParagraph(id: string) {
  const node = findNode(nodes.value, id)
  if (!node) return
  setNodes(updateNode(nodes.value, id, { isParagraph: !node.isParagraph }))
  contextMenu.value = null
}

function handleAddSibling(id: string) {
  const newNode = createNode()
  setNodes(insertSibling(nodes.value, id, newNode))
  editingId.value = newNode.id
  contextMenu.value = null
}

function handleAddChild(id: string) {
  const newNode = createNode()
  setNodes(insertAsChild(nodes.value, id, newNode))
  editingId.value = newNode.id
  contextMenu.value = null
}

function handleDuplicate(id: string) {
  setNodes(duplicateNode(nodes.value, id))
  contextMenu.value = null
}

function handleMoveUp(id: string) {
  setNodes(moveUp(nodes.value, id))
  contextMenu.value = null
}

function handleMoveDown(id: string) {
  setNodes(moveDown(nodes.value, id))
  contextMenu.value = null
}

function handleToggleReference(id: string) {
  const node = findNode(nodes.value, id)
  if (!node) return
  setNodes(updateNode(nodes.value, id, { referenceExpanded: !node.referenceExpanded }))
}

function addReference(nodeId: string, item: ReferenceItem) {
  const node = findNode(nodes.value, nodeId)
  if (!node) return
  const current = node.references ?? []
  setNodes(updateNode(nodes.value, nodeId, { references: [...current, item] }))
}

function removeReference(nodeId: string, index: number) {
  const node = findNode(nodes.value, nodeId)
  if (!node || !node.references) return
  const updated = node.references.filter((_, i) => i !== index)
  setNodes(updateNode(nodes.value, nodeId, {
    references: updated.length > 0 ? updated : undefined
  }))
}

function setRequirements(nodeId: string, text: string) {
  setNodes(updateNode(nodes.value, nodeId, { requirements: text || undefined }))
}

function clearRequirements(nodeId: string) {
  setNodes(updateNode(nodes.value, nodeId, { requirements: undefined }))
}

// --- Drag & Drop ---

function collectDescendantIds(node: OutlineNode, ids: Set<string>) {
  for (const child of node.children) {
    ids.add(child.id)
    collectDescendantIds(child, ids)
  }
}

function buildDepthMap(nodeList: OutlineNode[], depth: number, map: Map<string, number>) {
  for (const node of nodeList) {
    map.set(node.id, depth)
    buildDepthMap(node.children, depth + 1, map)
  }
}

function handleDragStart(id: string, x: number, y: number) {
  // Pre-compute metadata once at drag start
  const dragNode = findNode(nodes.value, id)
  if (!dragNode) return

  const descendantIds = new Set<string>()
  collectDescendantIds(dragNode, descendantIds)

  const depthMap = new Map<string, number>()
  buildDepthMap(nodes.value, 1, depthMap)

  dragMeta.value = {
    descendantIds,
    subtreeDepth: getSubtreeMaxDepth(dragNode),
    depthMap,
  }

  dragState.value = { draggingId: id, overNodeId: null, dropPosition: null }
  dragMouseX.value = x
  dragMouseY.value = y
}

function handleDragOver(targetId: string, position: 'before' | 'after' | 'inside') {
  if (!dragState.value || !dragMeta.value) return
  if (targetId === dragState.value.draggingId) return
  // O(1) descendant check
  if (dragMeta.value.descendantIds.has(targetId)) return

  const targetDepth = dragMeta.value.depthMap.get(targetId) ?? 1
  const stDepth = dragMeta.value.subtreeDepth

  if (position === 'inside') {
    if (targetDepth + stDepth > 4) return
  } else {
    if (targetDepth + stDepth - 1 > 4) return
  }

  // Skip if unchanged
  if (dragState.value.overNodeId === targetId && dragState.value.dropPosition === position) return

  dragState.value = { ...dragState.value, overNodeId: targetId, dropPosition: position }
}

function handleDragEnd() {
  if (dragState.value?.overNodeId && dragState.value.dropPosition) {
    setNodes(moveNode(
      nodes.value,
      dragState.value.draggingId,
      dragState.value.overNodeId,
      dragState.value.dropPosition
    ))
  }
  dragState.value = null
  dragMeta.value = null
}

function handleGlobalDrag(e: DragEvent) {
  if (dragState.value && e.clientX !== 0 && e.clientY !== 0) {
    dragMouseX.value = e.clientX
    dragMouseY.value = e.clientY
  }
}

// Close context menu on outside click
function handleGlobalClick() {
  if (contextMenu.value) {
    contextMenu.value = null
  }
}

function handleGlobalDragEnd() {
  if (dragState.value) {
    handleDragEnd()
  }
}

onMounted(() => {
  document.addEventListener('drag', handleGlobalDrag)
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('dragend', handleGlobalDragEnd)
})

onUnmounted(() => {
  document.removeEventListener('drag', handleGlobalDrag)
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('dragend', handleGlobalDragEnd)
})

// Provide handlers to children
provide('editingId', editingId)
provide('dragState', dragState)
provide('dragMeta', dragMeta)
provide('onEdit', handleEdit as (id: string, rowRect?: { x: number; y: number }) => void)
provide('onEditDone', handleEditDone)
provide('onDelete', handleDelete)
provide('onDragStart', handleDragStart)
provide('onDragOver', handleDragOver)
provide('onDragEnd', handleDragEnd)
provide('onToggleReference', handleToggleReference)
provide('onAddReference', addReference)
provide('onRemoveReference', removeReference)

provide('nodes', nodes)

function getNumberingIndex(list: OutlineNode[], idx: number): number {
  let count = 0
  for (let i = 0; i < idx; i++) {
    if (!list[i].isParagraph) count++
  }
  return count
}
</script>

<template>
  <div ref="editorEl" class="outline-editor">
    <div class="outline-editor__header">
      <h1>大纲编辑器</h1>
    </div>
    <div class="outline-editor__body">
      <OutlineNodeVue
        v-for="(node, index) in nodes"
        :key="node.id"
        :node="node"
        :depth="1"
        :index="getNumberingIndex(nodes, index)"
      />
    </div>

    <ContextMenu
      v-if="contextMenu"
      :state="contextMenu"
      @close="handleCloseContextMenu"
      @toggle-paragraph="handleToggleParagraph"
      @add-sibling="handleAddSibling"
      @add-child="handleAddChild"
      @duplicate="handleDuplicate"
      @move-up="handleMoveUp"
      @move-down="handleMoveDown"
    />

    <DragPreview
      v-if="dragState"
      :drag-state="dragState"
      :mouse-x="dragMouseX"
      :mouse-y="dragMouseY"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #f7f8fa;
  color: #1a1a1a;
  font-size: 15px;
  line-height: 1.8;
}

.outline-editor {
  max-width: 960px;
  margin: 0 auto;
  background: #fff;
  min-height: 100vh;
  padding: 32px 48px 64px;
  position: relative;
}

.outline-editor__header {
  display: none;
}

.outline-editor__body {
  padding: 0;
}
</style>
