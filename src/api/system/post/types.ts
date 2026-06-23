export interface PostVO {
  postId: number | string
  deptId?: number | string
  postCode: string
  postName: string
  postCategory?: string
  deptName?: string
  postSort?: number
  status?: string
  remark?: string
  createTime?: string
}

export interface PostForm {
  postId?: number | string
  deptId?: number | string | null
  postCode?: string
  postName?: string
  postCategory?: string
  postSort?: number
  status?: string
  remark?: string
}

export interface PostQuery {
  pageNum: number
  pageSize: number
  deptId?: number | string
  belongDeptId?: number | string
  postCode?: string
  postName?: string
  postCategory?: string
  status?: string
}
