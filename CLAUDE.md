# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A frontend outline editor built with Vue + TypeScript. Supports a 4-level heading hierarchy with Chinese-style numbering, drag-and-drop reordering, right-click context menus, paragraph content editing, and a content reference panel.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run build        # Type-check (vue-tsc) + production build
npm run preview      # Preview production build locally
```

No test framework or linter configured.

## Architecture

- **State management**: All state lives in `OutlineEditor.vue` (nodes, editingId, contextMenu, dragState), passed down via Vue `provide/inject`
- **Tree data**: `OutlineNode[]` recursive structure in `src/types/index.ts`
- **Pure tree operations**: `src/utils/treeUtils.ts` — all functions return new objects, never mutate
- **Numbering**: `src/utils/numbering.ts` — generates prefix from depth + sibling index
- **Components** (all in `src/components/OutlineEditor/`):
  - `OutlineEditor.vue` — root, state + event handlers
  - `OutlineNode.vue` — recursive node renderer (editing, hover, drag/drop, paragraph content)
  - `ContextMenu.vue` — horizontal floating toolbar with 7 operations
  - `DragPreview.vue` — fixed-position subtree silhouette following mouse
  - `ContentReferencePanel.vue` — collapsible panel with tabs (placeholder content)
- **Drag & Drop**: HTML5 native API, no external library. Drop position determined by mouse Y within target row thirds (top=before, middle=inside, bottom=after)

## Heading Numbering System

The editor enforces a strict 4-level hierarchy with specific numbering formats:

| Level | Format | Example |
|-------|--------|---------|
| 1 | 一、 | 一、测试概述 |
| 2 | （一） | （一）测试背景与目的 |
| 3 | N. | 1.核心概念界定 |
| 4 | （N） | （1）样本分析定义 |

Maximum depth is 4 levels — this constraint must be enforced in all tree operations (insert, drag-drop, etc.).

## Key Domain Rules

- **Paragraph mode**: Only leaf nodes (no children) can be toggled to paragraph mode, which removes the numbering prefix
- **Paragraph nodes cannot have children** added beneath them
- **Content areas**: Leaf nodes can have an optional paragraph content textarea
- **Content reference panel**: Leaf nodes display a collapsible reference panel with "知识库" (knowledge base) and "全部" (all) tabs
- **Numbering is read-only**: Users edit only the text portion of headings; the numbering prefix is generated from depth + sibling index
- **Tree operations must be immutable**: All tree mutations should return new objects, never mutate in place
