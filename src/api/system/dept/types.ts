export interface DeptTreeNode {
  id: number | string
  label: string
  disabled?: boolean
  children?: DeptTreeNode[]
}

export interface DeptVO {
  deptId: number | string
  parentId?: number | string
  deptName: string
  orderNum?: number
  leader?: string
  phone?: string
  email?: string
  status?: string
  children?: DeptVO[]
}
