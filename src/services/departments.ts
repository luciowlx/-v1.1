export interface DeptNode {
  id: string;
  name: string;
  children?: DeptNode[];
}

let departmentTree: DeptNode[] = [];
const listeners: Array<(tree: DeptNode[]) => void> = [];

export function setDepartmentTree(tree: DeptNode[]) {
  departmentTree = Array.isArray(tree) ? tree : [];
  listeners.forEach((fn) => {
    try { fn(departmentTree); } catch {}
  });
}

export function getDepartmentTree(): DeptNode[] {
  return departmentTree;
}

export function subscribeDepartmentTree(listener: (tree: DeptNode[]) => void): () => void {
  listeners.push(listener);
  try { listener(departmentTree); } catch {}
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export type TreeSelectNode = { title: string; value: string; children?: TreeSelectNode[] };

export function toTreeSelectData(tree: DeptNode[]): TreeSelectNode[] {
  const mapNode = (n: DeptNode): TreeSelectNode => ({
    title: n.name,
    value: n.name,
    children: (n.children || []).map(mapNode)
  });
  return tree.map(mapNode);
}