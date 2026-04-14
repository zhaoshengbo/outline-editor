<script setup lang="ts">
import { ref, onMounted } from 'vue'
import OutlineEditor from './components/OutlineEditor/OutlineEditor.vue'
import type { OutlineNodeData } from './types'

const editorRef = ref<InstanceType<typeof OutlineEditor> | null>(null)

// Demo: load from JSON protocol and set references after mount
const demoData: OutlineNodeData[] = [
  {
    id: 'n1', level: 1, title: '基本情况', visible: true, children: []
  },
  {
    id: 'n2', level: 1, title: '主要工作及成效', visible: true, children: [
      {
        id: 'n2_1', level: 2, title: '工作进展', visible: true, children: [
          {
            id: 'n2_1_1', level: 3, title: '重点项目推进情况', visible: true, children: [
              { id: 'n2_1_1_1', level: 4, title: '项目立项与审批', visible: true, children: [] },
              { id: 'n2_1_1_2', level: 4, title: '项目实施进度', visible: true, children: [] },
            ]
          },
          { id: 'n2_1_2', level: 3, title: '日常工作开展情况', visible: true, children: [] },
        ]
      },
      {
        id: 'n2_2', level: 2, title: '取得成效', visible: true, children: [
          { id: 'n2_2_1', level: 3, title: '经济效益', visible: true, children: [] },
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
]

onMounted(() => {
  // Demo: set references on specific nodes
  editorRef.value?.setReferences('n2_1_1_1', [
    { type: 'knowledge', label: '知识库', name: '全部' },
    { type: 'upload', label: '本地上传', name: '关于赵二狗同志的处理决定' },
    { type: 'recommend', label: '智能推荐', name: '关于北京市2023年国民经济和社会发展计划执行情况与20...' },
    { type: 'recommend', label: '智能推荐', name: '鞍山市"四产融合""十四五"规划' },
  ])
  editorRef.value?.setReferences('n2_2_1', [
    { type: 'knowledge', label: '知识库', name: '全部' },
    { type: 'recommend', label: '智能推荐', name: '武义县人民政府关于印发《武义县"绿水青山就是金山银山...' },
  ])
})
</script>

<template>
  <OutlineEditor ref="editorRef" :initial-data="demoData" />
</template>
