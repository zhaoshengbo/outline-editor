<script setup lang="ts">
import { ref, computed } from 'vue'
import OutlineEditor from './components/OutlineEditor/OutlineEditor.vue'
import type { OutlineNode, OutlineNodeData, ReferenceItem } from './types'

const editorRef = ref<InstanceType<typeof OutlineEditor> | null>(null)

const demoData = ref<OutlineNodeData[]>([
  {
    id: 'n1', level: 1, title: '基本情况', visible: true, children: []
  },
  {
    id: 'n2', level: 1, title: '主要工作及成效', visible: true, children: [
      {
        id: 'n2_1', level: 2, title: '工作进展', visible: true, children: [
          {
            id: 'n2_1_1', level: 3, title: '重点项目推进情况', visible: true, children: [
              { id: 'n2_1_1_1', level: 4, title: '项目立项与审批', visible: true, children: [], references: [
                { source_type: 'knowledge', label: '知识库', name: '全部' },
                { source_type: 'upload', label: '本地上传', name: '关于赵二狗同志的处理决定' },
                { source_type: 'recommend', label: '智能推荐', name: '关于北京市2023年国民经济和社会发展计划执行情况与20...' },
                { source_type: 'recommend', label: '智能推荐', name: '鞍山市"四产融合""十四五"规划' },
              ] },
              { id: 'n2_1_1_2', level: 4, title: '项目实施进度', visible: true, children: [] },
            ]
          },
          { id: 'n2_1_2', level: 3, title: '日常工作开展情况', visible: true, children: [] },
        ]
      },
      {
        id: 'n2_2', level: 2, title: '取得成效', visible: true, children: [
          { id: 'n2_2_1', level: 3, title: '经济效益', visible: true, children: [], references: [
            { source_type: 'knowledge', label: '知识库', name: '全部' },
            { source_type: 'recommend', label: '智能推荐', name: '武义县人民政府关于印发《武义县"绿水青山就是金山银山...' },
          ] },
          { id: 'n2_2_2', level: 3, title: '社会效益', visible: true, children: [] },
        ]
      },
    ]
  },
  {
    id: 'n3', level: 1, title: '存在问题', visible: true, children: [
      { id: 'n3_1', level: 2, title: '突出问题', visible: true, children: [] },
      { id: 'n3_2', level: 2, title: '原因分析', visible: true, children: [] },
    ]
  },
  {
    id: 'n4', level: 1, title: '下一步工作打算', visible: true, children: [
      { id: 'n4_1', level: 2, title: '工作目标', visible: true, children: [] },
      {
        id: 'n4_2', level: 2, title: '具体措施', visible: true, children: [
          {
            id: 'n4_2_1', level: 3, title: '短期措施', visible: true, children: [
              { id: 'n4_2_1_1', level: 4, title: '立行立改事项', visible: true, children: [] },
              { id: 'n4_2_1_2', level: 4, title: '限期整改事项', visible: true, children: [] },
            ]
          },
          { id: 'n4_2_2', level: 3, title: '长期措施', visible: true, children: [] },
        ]
      },
    ]
  },
])

// --- Selected node ---
const selectedNodeId = ref<string | null>(null)

function findNodeData(list: OutlineNodeData[], id: string): OutlineNodeData | null {
  for (const n of list) {
    if (n.id === id) return n
    const found = findNodeData(n.children, id)
    if (found) return found
  }
  return null
}

const selectedNodeData = computed(() =>
  selectedNodeId.value ? findNodeData(demoData.value, selectedNodeId.value) : null
)

function handleNodeClick(node: OutlineNode) {
  selectedNodeId.value = node.id
  addingRef.value = false
}

// --- Add reference form ---
const addingRef = ref(false)
const newRefType = ref<'knowledge' | 'upload' | 'recommend'>('recommend')
const newRefName = ref('')

const typeOptions = [
  { source_type: 'knowledge' as const, label: '知识库' },
  { source_type: 'upload' as const, label: '本地上传' },
  { source_type: 'recommend' as const, label: '智能推荐' },
]

function confirmAddRef() {
  if (!newRefName.value.trim() || !selectedNodeId.value) return
  const opt = typeOptions.find(o => o.source_type === newRefType.value)!
  editorRef.value?.addReference(selectedNodeId.value, {
    source_type: newRefType.value, label: opt.label, name: newRefName.value.trim()
  })
  newRefName.value = ''
  addingRef.value = false
}

function cancelAddRef() {
  newRefName.value = ''
  addingRef.value = false
}

function removeRef(index: number) {
  if (!selectedNodeId.value) return
  editorRef.value?.removeReference(selectedNodeId.value, index)
}
</script>

<template>
  <div class="app-layout">
    <div class="app-editor">
      <OutlineEditor ref="editorRef" v-model:initial-data="demoData" @node-click="handleNodeClick" />
    </div>

    <div class="app-panel">
      <div class="app-panel__header">内容参考</div>

      <div v-if="!selectedNodeData" class="app-panel__empty">点击标题以选择节点</div>

      <template v-else>
        <div class="app-panel__node-title">{{ selectedNodeData.title }}</div>

        <div class="app-panel__refs">
          <div
            v-for="(item, i) in selectedNodeData.references ?? []"
            :key="i"
            class="app-panel__ref-item"
          >
            <span class="app-panel__ref-tag" :class="`app-panel__ref-tag--${item.source_type}`">{{ item.label }}</span>
            <span class="app-panel__ref-name">{{ item.name }}</span>
            <button class="app-panel__ref-del" @click="removeRef(i)">×</button>
          </div>
          <div v-if="!selectedNodeData.references?.length" class="app-panel__no-refs">暂无内容参考</div>
        </div>

        <div v-if="addingRef" class="app-panel__add-form">
          <div class="app-panel__type-row">
            <button
              v-for="opt in typeOptions"
              :key="opt.source_type"
              class="app-panel__type-btn"
              :class="{ 'app-panel__type-btn--active': newRefType === opt.source_type }"
              @click="newRefType = opt.source_type"
            >{{ opt.label }}</button>
          </div>
          <input
            v-model="newRefName"
            class="app-panel__input"
            placeholder="输入名称..."
            @keydown.enter="confirmAddRef"
            @keydown.escape="cancelAddRef"
          />
          <div class="app-panel__form-actions">
            <button class="app-panel__btn app-panel__btn--primary" @click="confirmAddRef">确认</button>
            <button class="app-panel__btn" @click="cancelAddRef">取消</button>
          </div>
        </div>

        <button v-else class="app-panel__add-btn" @click="addingRef = true">+ 添加内容参考</button>
      </template>
    </div>
  </div>
</template>

<style>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-editor {
  flex: 1;
  min-width: 0;
}

.app-panel {
  width: 280px;
  flex-shrink: 0;
  border-left: 1px solid #eaedf0;
  background: #fff;
  padding: 24px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
}

.app-panel__header {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 20px;
}

.app-panel__empty {
  font-size: 13px;
  color: #bfbfbf;
  text-align: center;
  margin-top: 40px;
}

.app-panel__node-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  background: #f5f6f8;
  padding: 8px 12px;
  margin-bottom: 16px;
  word-break: break-word;
}

.app-panel__refs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.app-panel__ref-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f8f9fb;
  border: 1px solid #eaedf0;
}

.app-panel__ref-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
  border: 1px solid;
}

.app-panel__ref-tag--knowledge {
  color: #e8792b;
  background: #fff7f0;
  border-color: #f5c49a;
}

.app-panel__ref-tag--upload {
  color: #d48a2c;
  background: #fefaf2;
  border-color: #f0d8a8;
}

.app-panel__ref-tag--recommend {
  color: #c89520;
  background: #fffdf5;
  border-color: #f0e0a0;
}

.app-panel__ref-name {
  font-size: 13px;
  color: #1a1a1a;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-panel__ref-del {
  border: none;
  background: none;
  color: #ccc;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
  padding: 0 2px;
  transition: color 0.2s;
}

.app-panel__ref-del:hover {
  color: #ff4d4f;
}

.app-panel__no-refs {
  font-size: 13px;
  color: #bfbfbf;
  text-align: center;
  padding: 12px 0;
}

.app-panel__add-btn {
  width: 100%;
  border: 1px dashed #d0d0d0;
  background: none;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  padding: 8px;
  font-family: inherit;
  transition: border-color 0.2s, color 0.2s;
}

.app-panel__add-btn:hover {
  border-color: #e8792b;
  color: #e8792b;
}

.app-panel__add-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #f8f9fb;
  border: 1px solid #eaedf0;
}

.app-panel__type-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.app-panel__type-btn {
  border: 1px solid #e0e0e0;
  background: #fafafa;
  color: #666;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.app-panel__type-btn:hover {
  border-color: #e8792b;
  color: #e8792b;
}

.app-panel__type-btn--active {
  border-color: #e8792b;
  color: #e8792b;
  background: #fff7f0;
}

.app-panel__input {
  font-size: 13px;
  border: 1px solid #e0e0e0;
  padding: 6px 10px;
  outline: none;
  font-family: inherit;
  background: #fff;
  transition: border-color 0.2s;
}

.app-panel__input:focus {
  border-color: #e8792b;
}

.app-panel__form-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.app-panel__btn {
  border: 1px solid #e0e0e0;
  background: #f5f5f5;
  color: #666;
  font-size: 12px;
  padding: 4px 14px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.app-panel__btn:hover {
  background: #ebebeb;
}

.app-panel__btn--primary {
  background: #e8792b;
  border-color: #e8792b;
  color: #fff;
}

.app-panel__btn--primary:hover {
  background: #d06820;
  border-color: #d06820;
}
</style>
