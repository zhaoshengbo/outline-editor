# 大纲编辑器

一个基于 Vue 3 + TypeScript 的前端大纲编辑器，支持四级标题层级、拖拽排序、右键菜单、段落内容编辑及内容参考面板。

## 目录

- [功能概览](#功能概览)
- [快速开始](#快速开始)
- [架构说明](#架构说明)
- [数据类型](#数据类型)
- [组件说明](#组件说明)
  - [OutlineEditor（主组件）](#outlineeditor主组件)
  - [OutlineNode（节点渲染）](#outlinenode节点渲染)
  - [ContextMenu（右键菜单）](#contextmenu右键菜单)
  - [DragPreview（拖拽预览）](#dragpreview拖拽预览)
  - [ContentReferencePanel（内容参考面板）](#contentreferencepanel内容参考面板)
- [工具函数](#工具函数)
- [标题编号系统](#标题编号系统)
- [领域规则](#领域规则)
- [使用示例](#使用示例)

---

## 功能概览

- 四级标题层级，中文格式编号（一、（一）、1.、（1））
- 单击标题进入编辑，编号前缀只读
- 悬停显示拖拽手柄与删除按钮
- HTML5 原生拖拽排序，三区域放置（前 / 后 / 子级），实时深度校验
- 右键浮动工具栏（7 个操作，状态联动启用/禁用）
- 叶子节点支持段落模式（去除编号前缀）
- 叶子节点可附加段落内容文本域
- 叶子节点可展开内容参考面板，展示关联引用

---

## 快速开始

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器（Vite）
npm run build     # 类型检查 + 生产构建
npm run preview   # 本地预览生产构建
```

**技术栈**：Vue 3.5、TypeScript、Vite、@element-plus/icons-vue

---

## 架构说明

所有状态集中在 `OutlineEditor.vue`（根组件），通过 Vue `provide / inject` 向子组件传递状态与事件处理函数，无需 Pinia / Vuex。

```
OutlineEditor.vue          ← 状态中心，provide 所有依赖
├── OutlineNode.vue        ← 递归节点渲染（inject 依赖）
│   └── ContentReferencePanel.vue  ← 叶子节点内容参考面板
├── ContextMenu.vue        ← 右键浮动工具栏
└── DragPreview.vue        ← 跟随鼠标的拖拽幽灵
```

**设计原则**：
- 树操作全部不可变（immutable），返回新对象，不在原对象上修改
- 最大深度 4 级，所有插入/拖拽操作均校验此约束
- 编号由深度 + 兄弟索引动态计算，不存储在节点数据中

---

## 数据类型

> 定义位置：`src/types/index.ts`

### `OutlineNode`（内部树节点）

```typescript
interface OutlineNode {
  id: string                    // 随机 8 位唯一标识
  title: string                 // 节点文本（不含编号前缀）
  children: OutlineNode[]       // 子节点数组
  isParagraph: boolean          // true = 段落模式（隐藏编号）
  referenceExpanded?: boolean   // 内容参考面板是否展开
  references?: ReferenceItem[]  // 关联的内容参考项
}
```

### `OutlineNodeData`（外部序列化格式）

用于 `initData` / `getData` 接口的导入导出格式：

```typescript
interface OutlineNodeData {
  id: string
  level: number               // 1–4，外部显式指定层级
  title: string
  visible: boolean
  isParagraph?: boolean       // 仅 true 时写入
  references?: ReferenceItem[]
  children: OutlineNodeData[]
}
```

### `ReferenceItem`（内容参考项）

```typescript
interface ReferenceItem {
  type: 'knowledge' | 'upload' | 'recommend'
  label: string   // 标签显示文字，如"知识库"
  name: string    // 文档名称
}
```

### 其他 UI 状态类型

```typescript
interface DragState {
  draggingId: string
  overNodeId: string | null
  dropPosition: 'before' | 'after' | 'inside' | null
}

interface ContextMenuState {
  nodeId: string
  x: number   // 屏幕坐标
  y: number
}
```

---

## 组件说明

所有组件位于 `src/components/OutlineEditor/`。

---

### `OutlineEditor`（主组件）

> `src/components/OutlineEditor/OutlineEditor.vue`

整个编辑器的入口组件，管理全部状态，对外暴露数据读写 API。

#### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `initialData` | `OutlineNodeData[]` | 可选，初始化数据（外部序列化格式） |
| `readonly` | `boolean` | 可选，只读模式（预留，暂未实现） |

#### 公开方法（通过 `ref` 调用）

| 方法 | 签名 | 说明 |
|------|------|------|
| `initData` | `(data: OutlineNodeData[]) => void` | 使用外部数据重新初始化编辑器 |
| `getData` | `() => OutlineNodeData[]` | 导出当前树为外部序列化格式 |
| `setReferences` | `(nodeId: string, refs: ReferenceItem[]) => void` | 设置指定节点的内容参考 |
| `clearReferences` | `(nodeId: string) => void` | 清除指定节点的内容参考 |
| `getReferences` | `(nodeId: string) => ReferenceItem[] \| undefined` | 获取指定节点的内容参考 |

#### 使用示例

```vue
<template>
  <OutlineEditor ref="editorRef" :initial-data="myData" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import OutlineEditor from './components/OutlineEditor/OutlineEditor.vue'
import type { OutlineNodeData } from './types'

const editorRef = ref<InstanceType<typeof OutlineEditor>>()

const myData: OutlineNodeData[] = [
  {
    id: 'node-1',
    level: 1,
    title: '第一章',
    visible: true,
    children: [
      { id: 'node-1-1', level: 2, title: '第一节', visible: true, children: [] }
    ]
  }
]

onMounted(() => {
  // 设置内容参考
  editorRef.value?.setReferences('node-1-1', [
    { type: 'knowledge', label: '知识库', name: '参考文献.pdf' }
  ])
})

function save() {
  const data = editorRef.value?.getData()
  console.log(JSON.stringify(data, null, 2))
}
</script>
```

---

### `OutlineNode`（节点渲染）

> `src/components/OutlineEditor/OutlineNode.vue`

递归渲染单个节点及其所有子节点。内部组件，不直接使用。

#### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `node` | `OutlineNode` | 节点数据 |
| `depth` | `number` | 从根起的深度（1 起始） |
| `index` | `number` | 兄弟节点中的编号索引（段落节点不计入） |

#### 注入依赖（来自 `OutlineEditor`）

通过 `inject` 获取以下依赖，不通过 props 传递：

- `editingId`：当前正在编辑的节点 ID
- `dragState`：拖拽状态
- `onEdit(id)`、`onEditDone(id, title)`、`onDelete(id)`
- `onContextMenu(id, x, y)`
- `onDragStart(id, x, y)`、`onDragOver(id, position)`、`onDragEnd()`
- `onToggleReference(id)`

#### 交互行为

- **单击标题**：进入编辑模式，输入框自动聚焦并全选
- **失焦 / Enter / Escape**：退出编辑并保存
- **右键点击**：触发上下文菜单
- **鼠标悬停**：显示拖拽手柄（左）和删除按钮（右）
- **拖拽手柄**：发起拖拽，显示拖拽预览
- **拖拽目标区域划分**：行高上方 33% = before、中间 34% = inside、下方 33% = after

---

### `ContextMenu`（右键菜单）

> `src/components/OutlineEditor/ContextMenu.vue`

横向浮动工具栏，固定定位于右键点击坐标处。

#### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `state` | `ContextMenuState` | 菜单目标节点及屏幕坐标 |

#### Emits

| 事件 | 参数 | 说明 |
|------|------|------|
| `close` | — | 关闭菜单 |
| `toggle-paragraph` | `id: string` | 切换为段落模式 |
| `add-sibling` | `id: string` | 插入同级节点 |
| `add-child` | `id: string` | 插入子级节点 |
| `duplicate` | `id: string` | 深拷贝节点 |
| `move-up` | `id: string` | 上移节点 |
| `move-down` | `id: string` | 下移节点 |
| `delete` | `id: string` | 删除节点 |

#### 按钮启用规则

| 操作 | 禁用条件 |
|------|----------|
| 设为段落内容 | 节点有子节点（非叶子） |
| 添加下级 | 节点为段落模式，或当前深度已达 4 级 |
| 上移 | 已是第一个同级节点 |
| 下移 | 已是最后一个同级节点 |

---

### `DragPreview`（拖拽预览）

> `src/components/OutlineEditor/DragPreview.vue`

固定定位的幽灵组件，跟随鼠标显示被拖拽的完整子树。

#### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `dragState` | `DragState` | 当前拖拽状态（含 draggingId） |
| `mouseX` | `number` | 鼠标实时 X 坐标 |
| `mouseY` | `number` | 鼠标实时 Y 坐标 |

内部组件，由 `OutlineEditor` 自动控制显示与隐藏，无需手动使用。

---

### `ContentReferencePanel`（内容参考面板）

> `src/components/OutlineEditor/ContentReferencePanel.vue`

叶子节点下方的可折叠参考内容面板。

#### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `nodeId` | `string` | 所属节点 ID |
| `depth` | `number` | 节点深度（用于计算对齐缩进） |
| `references` | `ReferenceItem[]` | 可选，参考内容列表 |

#### 展示逻辑

- 仅在节点的 `referenceExpanded` 为 `true` 时渲染
- `references` 为空时显示"暂无内容参考"
- `type` 对应标签颜色：`knowledge` 橙色、`upload` 棕色、`recommend` 橄榄色

---

## 工具函数

### `src/utils/treeUtils.ts`

所有树操作均为纯函数，返回新对象，不修改原数据。

| 函数 | 说明 |
|------|------|
| `createNode(title?)` | 创建新节点，默认标题"点击编辑提纲内容" |
| `findNode(nodes, id)` | 递归查找节点 |
| `findParent(nodes, id)` | 查找父节点及子索引 |
| `isLeaf(node)` | 判断是否为叶子节点 |
| `getDepth(nodes, id)` | 获取节点深度（1 起始） |
| `getSubtreeMaxDepth(node)` | 获取子树最大深度 |
| `updateNode(nodes, id, updates)` | 不可变更新节点属性 |
| `deleteNode(nodes, id)` | 不可变删除节点 |
| `insertAfterNode(nodes, targetId, newNode)` | 在目标节点后插入 |
| `insertBeforeNode(nodes, targetId, newNode)` | 在目标节点前插入 |
| `insertAsChild(nodes, parentId, newNode)` | 作为子节点插入 |
| `moveUp(nodes, id)` | 与上一兄弟交换位置 |
| `moveDown(nodes, id)` | 与下一兄弟交换位置 |
| `deepClone(node)` | 深拷贝（重新生成所有 ID） |
| `duplicateNode(nodes, id)` | 深拷贝并插入原节点之后 |
| `moveNode(nodes, dragId, targetId, position)` | 拖拽移动节点 |
| `isDescendant(nodes, ancestorId, nodeId)` | 判断祖先-后代关系 |

### `src/utils/numbering.ts`

```typescript
getPrefix(depth: number, index: number): string
```

根据深度和兄弟索引生成编号前缀，见[标题编号系统](#标题编号系统)。

### `src/utils/dataConverter.ts`

```typescript
fromOutlineData(data: OutlineNodeData[]): OutlineNode[]
toOutlineData(nodes: OutlineNode[], depth?: number): OutlineNodeData[]
```

内外部数据格式互转。外部格式含显式 `level` 字段，内部格式由树深度隐式确定。

---

## 标题编号系统

| 层级 | 格式 | 示例 |
|------|------|------|
| 1 | 中文数字 + 、 | 一、测试概述 |
| 2 | （中文数字） | （一）测试背景与目的 |
| 3 | 阿拉伯数字 + . | 1.核心概念界定 |
| 4 | （阿拉伯数字） | （1）样本分析定义 |

- 编号由深度和有效兄弟索引动态生成，**不持久化存储**
- 段落节点不参与编号计数
- 最多支持 20 个同级项，超出后回退为 `index + 1`

---

## 领域规则

### 最大深度约束
- 树最多 4 级，所有插入和拖拽操作均强制校验
- 拖拽时：`目标节点深度 + 被拖节点子树深度 ≤ 4`

### 段落模式
- 仅**叶子节点**（无子节点）可切换为段落模式
- 段落节点隐藏编号前缀，字重更轻
- 段落节点**不可添加子节点**
- 可通过右键菜单"设为段落标题"切换回标题模式

### 叶子节点特性
- 可附加段落内容文本域
- 可展开内容参考面板
- 右侧显示"内容参考"折叠按钮

### 不可变操作
- 所有树变更必须返回新对象，禁止在原对象上直接修改
- 保证 Vue 响应式系统能正确检测变更

---

## 使用示例

### 基础嵌入

```vue
<template>
  <div class="app">
    <OutlineEditor :initial-data="outlineData" />
  </div>
</template>

<script setup lang="ts">
import OutlineEditor from './components/OutlineEditor/OutlineEditor.vue'
import type { OutlineNodeData } from './types'

const outlineData: OutlineNodeData[] = [
  {
    id: '1',
    level: 1,
    title: '引言',
    visible: true,
    children: []
  },
  {
    id: '2',
    level: 1,
    title: '主体内容',
    visible: true,
    children: [
      {
        id: '2-1',
        level: 2,
        title: '第一节',
        visible: true,
        children: []
      }
    ]
  }
]
</script>
```

### 读写数据 + 设置内容参考

```vue
<template>
  <OutlineEditor ref="editorRef" :initial-data="data" />
  <button @click="exportData">导出</button>
  <button @click="loadNew">加载新数据</button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import OutlineEditor from './components/OutlineEditor/OutlineEditor.vue'
import type { OutlineNodeData, ReferenceItem } from './types'

const editorRef = ref<InstanceType<typeof OutlineEditor>>()

const data: OutlineNodeData[] = [/* ... */]

onMounted(() => {
  // 程序化设置内容参考
  const refs: ReferenceItem[] = [
    { type: 'knowledge', label: '知识库', name: '政策文件2024.pdf' },
    { type: 'upload', label: '上传文件', name: '附件资料.docx' }
  ]
  editorRef.value?.setReferences('node-id', refs)
})

function exportData() {
  const result = editorRef.value?.getData()
  console.log(result)
}

function loadNew() {
  const newData: OutlineNodeData[] = [/* ... */]
  editorRef.value?.initData(newData)
}
</script>
```
