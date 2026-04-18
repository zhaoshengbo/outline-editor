// --- Internal model ---

export interface ReferenceItem {
  source_type: 'knowledge' | 'upload' | 'recommend'
  source_id?: string
  label: string
  name: string
}

export interface OutlineNode {
  id: string
  title: string
  children: OutlineNode[]
  isParagraph: boolean
  referenceExpanded?: boolean
  references?: ReferenceItem[]
}

export type DropPosition = 'before' | 'after' | 'inside'

export interface DragState {
  draggingId: string
  overNodeId: string | null
  dropPosition: DropPosition | null
}

export interface DragMeta {
  descendantIds: Set<string>
  subtreeDepth: number
  depthMap: Map<string, number>
}

export interface ContextMenuState {
  nodeId: string
  x: number
  y: number
  aboveTarget?: boolean
}

// --- External data protocol ---

export interface OutlineNodeData {
  id: string
  level: number
  title: string
  visible: boolean
  isParagraph?: boolean
  references?: ReferenceItem[]
  children: OutlineNodeData[]
}
