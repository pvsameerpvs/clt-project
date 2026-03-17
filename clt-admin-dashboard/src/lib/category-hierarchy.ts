import { Category } from "@/lib/admin-api"

export interface CategoryHierarchyOption {
  category: Category
  depth: number
  path: string
  isLeaf: boolean
}

interface BuildOptions {
  excludeIds?: Set<string>
  leafOnly?: boolean
}

function sortByName(a: Category, b: Category) {
  return a.name.localeCompare(b.name)
}

function buildChildrenMap(categories: Category[]) {
  const byParent = new Map<string, Category[]>()
  const categoryIds = new Set(categories.map((category) => category.id))

  for (const category of categories) {
    const parentId =
      category.parent_id && categoryIds.has(category.parent_id) && category.parent_id !== category.id
        ? category.parent_id
        : "__root__"

    if (!byParent.has(parentId)) byParent.set(parentId, [])
    byParent.get(parentId)?.push(category)
  }

  for (const items of byParent.values()) {
    items.sort(sortByName)
  }

  return byParent
}

export function getDescendantCategoryIds(categories: Category[], rootId: string) {
  const byParent = buildChildrenMap(categories)
  const descendants = new Set<string>()
  const stack = [rootId]

  while (stack.length) {
    const current = stack.pop()
    if (!current) continue
    const children = byParent.get(current) || []
    for (const child of children) {
      if (descendants.has(child.id)) continue
      descendants.add(child.id)
      stack.push(child.id)
    }
  }

  return descendants
}

export function getDirectChildrenCount(categories: Category[]) {
  const counts = new Map<string, number>()
  for (const category of categories) {
    if (!category.parent_id) continue
    counts.set(category.parent_id, (counts.get(category.parent_id) || 0) + 1)
  }
  return counts
}

export function buildCategoryHierarchyOptions(categories: Category[], options: BuildOptions = {}) {
  const { excludeIds, leafOnly = false } = options
  const byParent = buildChildrenMap(categories)
  const ordered: CategoryHierarchyOption[] = []
  const visited = new Set<string>()

  const walk = (category: Category, depth: number, parentPath: string[]) => {
    if (visited.has(category.id)) return
    visited.add(category.id)

    const children = byParent.get(category.id) || []
    const pathParts = [...parentPath, category.name]
    const next: CategoryHierarchyOption = {
      category,
      depth,
      path: pathParts.join(" > "),
      isLeaf: children.length === 0,
    }

    if (!excludeIds?.has(category.id) && (!leafOnly || next.isLeaf)) {
      ordered.push(next)
    }

    for (const child of children) {
      walk(child, depth + 1, pathParts)
    }
  }

  const roots = byParent.get("__root__") || []
  for (const root of roots) {
    walk(root, 0, [])
  }

  for (const category of [...categories].sort(sortByName)) {
    if (!visited.has(category.id)) {
      walk(category, 0, [])
    }
  }

  return ordered
}
