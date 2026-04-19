import type { OutlineNode, OutlineNodeData } from '../types'

export function fromOutlineData(data: OutlineNodeData[]): OutlineNode[] {
  return data.map(item => ({
    id: item.id,
    title: item.title,
    isParagraph: item.isParagraph ?? false,
    references: item.references,
    requirements: item.requirements,
    children: fromOutlineData(item.children),
  }))
}

export function toOutlineData(nodes: OutlineNode[], depth = 1): OutlineNodeData[] {
  return nodes.map(node => ({
    id: node.id,
    level: depth,
    title: node.title,
    visible: true,
    ...(node.isParagraph ? { isParagraph: true } : {}),
    ...(node.number !== undefined ? { number: node.number } : {}),
    ...(node.references?.length ? { references: node.references } : {}),
    ...(node.requirements ? { requirements: node.requirements } : {}),
    children: toOutlineData(node.children, depth + 1),
  }))
}
