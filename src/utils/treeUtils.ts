import type { OutlineNode, DropPosition } from '../types'

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

export function createNode(title = '点击编辑提纲内容'): OutlineNode {
  return {
    id: generateId(),
    title,
    children: [],
    isParagraph: false,
  }
}

export function findNode(nodes: OutlineNode[], id: string): OutlineNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNode(node.children, id)
    if (found) return found
  }
  return null
}

export function findParent(nodes: OutlineNode[], id: string): { parent: OutlineNode | null; index: number } {
  for (const node of nodes) {
    const idx = node.children.findIndex(c => c.id === id)
    if (idx !== -1) return { parent: node, index: idx }
    const found = findParent(node.children, id)
    if (found.parent !== null) return found
  }
  return { parent: null, index: -1 }
}

export function getDepth(nodes: OutlineNode[], id: string, currentDepth = 1): number {
  for (const node of nodes) {
    if (node.id === id) return currentDepth
    const d = getDepth(node.children, id, currentDepth + 1)
    if (d > 0) return d
  }
  return 0
}

export function getSubtreeMaxDepth(node: OutlineNode, currentDepth = 1): number {
  if (node.children.length === 0) return currentDepth
  return Math.max(...node.children.map(c => getSubtreeMaxDepth(c, currentDepth + 1)))
}

export function isLeaf(node: OutlineNode): boolean {
  return node.children.length === 0
}

export function getSiblingIndex(nodes: OutlineNode[], id: string): number {
  const idx = nodes.findIndex(n => n.id === id)
  if (idx !== -1) return idx
  for (const node of nodes) {
    const childIdx = node.children.findIndex(c => c.id === id)
    if (childIdx !== -1) return childIdx
  }
  return -1
}

function mapNodes(nodes: OutlineNode[], fn: (node: OutlineNode) => OutlineNode): OutlineNode[] {
  return nodes.map(node => {
    const mapped = fn(node)
    return { ...mapped, children: mapNodes(mapped.children, fn) }
  })
}

export function updateNode(nodes: OutlineNode[], id: string, updates: Partial<OutlineNode>): OutlineNode[] {
  return mapNodes(nodes, node => {
    if (node.id === id) return { ...node, ...updates }
    return node
  })
}

export function deleteNode(nodes: OutlineNode[], id: string): OutlineNode[] {
  return nodes
    .filter(n => n.id !== id)
    .map(n => ({ ...n, children: deleteNode(n.children, id) }))
}

export function insertAfterNode(nodes: OutlineNode[], targetId: string, newNode: OutlineNode): OutlineNode[] {
  const result: OutlineNode[] = []
  for (const node of nodes) {
    result.push({ ...node, children: insertAfterNode(node.children, targetId, newNode) })
    if (node.id === targetId) {
      result.push(newNode)
    }
  }
  return result
}

export function insertBeforeNode(nodes: OutlineNode[], targetId: string, newNode: OutlineNode): OutlineNode[] {
  const result: OutlineNode[] = []
  for (const node of nodes) {
    if (node.id === targetId) {
      result.push(newNode)
    }
    result.push({ ...node, children: insertBeforeNode(node.children, targetId, newNode) })
  }
  return result
}

export function insertAsChild(nodes: OutlineNode[], parentId: string, newNode: OutlineNode): OutlineNode[] {
  return nodes.map(node => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, newNode] }
    }
    return { ...node, children: insertAsChild(node.children, parentId, newNode) }
  })
}

export function insertSibling(nodes: OutlineNode[], targetId: string, newNode: OutlineNode): OutlineNode[] {
  return insertAfterNode(nodes, targetId, newNode)
}

export function moveUp(nodes: OutlineNode[], id: string): OutlineNode[] {
  const idx = nodes.findIndex(n => n.id === id)
  if (idx > 0) {
    const result = [...nodes]
    ;[result[idx - 1], result[idx]] = [result[idx], result[idx - 1]]
    return result
  }
  return nodes.map(n => ({ ...n, children: moveUp(n.children, id) }))
}

export function moveDown(nodes: OutlineNode[], id: string): OutlineNode[] {
  const idx = nodes.findIndex(n => n.id === id)
  if (idx !== -1 && idx < nodes.length - 1) {
    const result = [...nodes]
    ;[result[idx], result[idx + 1]] = [result[idx + 1], result[idx]]
    return result
  }
  return nodes.map(n => ({ ...n, children: moveDown(n.children, id) }))
}

export function deepClone(node: OutlineNode): OutlineNode {
  return {
    ...node,
    id: generateId(),
    children: node.children.map(deepClone),
  }
}

export function duplicateNode(nodes: OutlineNode[], id: string): OutlineNode[] {
  const target = findNode(nodes, id)
  if (!target) return nodes
  const clone = deepClone(target)
  return insertAfterNode(nodes, id, clone)
}

export function moveNode(
  nodes: OutlineNode[],
  dragId: string,
  targetId: string,
  position: DropPosition
): OutlineNode[] {
  const dragNode = findNode(nodes, dragId)
  if (!dragNode) return nodes

  // Remove dragged node
  let result = deleteNode(nodes, dragId)

  // Insert at target position
  const dragCopy = { ...dragNode, children: [...dragNode.children] }
  switch (position) {
    case 'before':
      result = insertBeforeNode(result, targetId, dragCopy)
      break
    case 'after':
      result = insertAfterNode(result, targetId, dragCopy)
      break
    case 'inside':
      result = insertAsChild(result, targetId, dragCopy)
      break
  }

  return result
}

export function isDescendant(nodes: OutlineNode[], ancestorId: string, nodeId: string): boolean {
  const ancestor = findNode(nodes, ancestorId)
  if (!ancestor) return false
  return findNode(ancestor.children, nodeId) !== null
}
