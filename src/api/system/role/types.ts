export interface RoleVO {
  roleId: number | string
  roleName: string
  roleKey?: string
  roleSort?: number
  dataScope?: string
  menuCheckStrictly?: boolean
  deptCheckStrictly?: boolean
  status?: string
  remark?: string
  createTime?: string
  menuIds?: Array<number | string>
  deptIds?: Array<number | string>
  admin?: boolean
  /** 是否已分配给当前用户（authRole 接口返回） */
  flag?: boolean
}

export interface RoleForm {
  roleId?: number | string
  roleName?: string
  roleKey?: string
  roleSort?: number
  status?: string
  menuCheckStrictly?: boolean
  deptCheckStrictly?: boolean
  remark?: string
  dataScope?: string
  menuIds?: Array<number | string>
  deptIds?: Array<number | string>
}

export interface RoleQuery {
  pageNum: number
  pageSize: number
  roleName?: string
  roleKey?: string
  status?: string
  beginTime?: string
  endTime?: string
}

export interface RoleUserQuery {
  pageNum: number
  pageSize: number
  roleId: number | string
  userName?: string
  phonenumber?: string
}

export interface RoleMenuTree {
  menus: MenuTreeOption[]
  checkedKeys: Array<number | string>
}

export interface MenuTreeOption {
  id: number | string
  label: string
  disabled?: boolean
  children?: MenuTreeOption[]
}

export interface RoleDeptTree {
  depts: DeptTreeOption[]
  checkedKeys: Array<number | string>
}

export interface DeptTreeOption {
  id: number | string
  label: string
  parentId?: number | string
  weight?: number
  disabled?: boolean
  children?: DeptTreeOption[]
}
