import { useCallback, useEffect, useRef, useState } from 'react'
import { Form, message, Modal } from 'antd'
import { useNavigate } from '@tanstack/react-router'
import type { Dayjs } from 'dayjs'
import {
  listUser,
  delUser,
  changeUserStatus,
  resetUserPwd,
  exportUser,
  importTemplate as fetchImportTemplate,
} from '@/api/system/user'
import type { UserQuery, UserStatus, UserVO } from '@/api/system/user/types'
import { deptTreeSelect } from '@/api/system/dept'
import type { DeptTreeNode } from '@/api/system/dept/types'
import { getConfigKey } from '@/api/system/config'
import { useAuthStore } from '@/store/useAuthStore'
import { useTableList } from '@/hooks/useTableList'

function filterDisabledDept(nodes: DeptTreeNode[]): DeptTreeNode[] {
  return nodes
    .filter((node) => !node.disabled)
    .map((node) => ({
      ...node,
      children: node.children ? filterDisabledDept(node.children) : undefined,
    }))
}

type UserSearchForm = {
  userName?: string
  nickName?: string
  phonenumber?: string
  status?: UserStatus | ''
  dateRange?: [Dayjs, Dayjs] | null
}

type UserListParams = Omit<UserQuery, 'pageNum' | 'pageSize'>

export function useUserPage() {
  const navigate = useNavigate()
  const currentUserId = useAuthStore((state) => state.userInfo?.userId)
  const [form] = Form.useForm<UserSearchForm>()

  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])

  // ---- 部门树 ----
  const [deptOptions, setDeptOptions] = useState<DeptTreeNode[]>([])
  const [enabledDeptOptions, setEnabledDeptOptions] = useState<DeptTreeNode[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<number | string | undefined>()
  const [deptLoading, setDeptLoading] = useState(false)

  // ---- 抽屉 ----
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editUserId, setEditUserId] = useState<number | string | undefined>()

  // ---- 导入弹窗 ----
  const [importOpen, setImportOpen] = useState(false)

  // ---- 选项数据 ----
  const [initPassword, setInitPassword] = useState('')

  const mountedRef = useRef(false)

  const buildQueryParams = useCallback((formValues: UserSearchForm): UserListParams => {
    const params: UserListParams = {
      userName: formValues.userName ?? '',
      nickName: formValues.nickName ?? '',
      phonenumber: formValues.phonenumber ?? '',
      status: formValues.status ?? '',
      deptId: selectedDeptId,
    }
    if (formValues.dateRange?.[0] && formValues.dateRange?.[1]) {
      params.beginTime = formValues.dateRange[0].format('YYYY-MM-DD HH:mm:ss')
      params.endTime = formValues.dateRange[1].format('YYYY-MM-DD HH:mm:ss')
    }
    return params
  }, [selectedDeptId])

  const {
    dataList,
    total,
    loading,
    pageNum,
    pageSize,
    search,
    reset,
    refresh,
    changePage,
  } = useTableList<UserVO, UserSearchForm, UserListParams>({
    form,
    request: listUser,
    buildParams: buildQueryParams,
  })

  // ---- 获取部门树 ----
  const fetchDeptTree = useCallback(async () => {
    setDeptLoading(true)
    try {
      const res = await deptTreeSelect()
      if (!mountedRef.current) return
      const data = res.data ?? []
      setDeptOptions(data)
      setEnabledDeptOptions(filterDisabledDept(data))
    } finally {
      if (mountedRef.current) {
        setDeptLoading(false)
      }
    }
  }, [])

  // ---- 获取初始密码 ----
  const fetchInitPassword = useCallback(async () => {
    const res = await getConfigKey('sys.user.initPassword')
    if (!mountedRef.current) return
    setInitPassword(res.data ?? '')
  }, [])

  // ---- 初始化 ----
  useEffect(() => {
    mountedRef.current = true
    const timer = window.setTimeout(() => {
      void fetchDeptTree()
      void fetchInitPassword()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      mountedRef.current = false
    }
  }, [fetchDeptTree, fetchInitPassword])

  // ---- 单选/多选状态 ----
  const single = selectedRowKeys.length !== 1
  const multiple = selectedRowKeys.length === 0

  // ---- 搜索 ----
  const handleSearch = () => {
    search()
  }

  // ---- 重置 ----
  const handleReset = () => {
    setSelectedDeptId(undefined)
    reset({ deptId: undefined })
  }

  // ---- 部门节点点击 ----
  const handleSelectDept = useCallback(
    (id: number | string | undefined) => {
      setSelectedDeptId(id)
      search({ deptId: id })
    },
    [search],
  )

  // ---- 删除 ----
  const handleDelete = (userIds: number | string | Array<number | string>) => {
    const ids = Array.isArray(userIds) ? userIds : [userIds]
    const label = ids.length === 1 ? `用户编号为"${ids[0]}"` : `选中的${ids.length}条数据`
    Modal.confirm({
      title: '系统提示',
      content: `是否确认删除${label}？`,
      onOk: async () => {
        await delUser(ids)
        message.success('删除成功')
        setSelectedRowKeys([])
        refresh()
      },
    })
  }

  // ---- 状态切换 ----
  const handleStatusChange = (row: UserVO) => {
    const newStatus = row.status === '0' ? '1' : '0'
    const text = newStatus === '0' ? '启用' : '停用'
    Modal.confirm({
      title: '系统提示',
      content: `确认要${text}"${row.userName}"用户吗？`,
      onOk: async () => {
        await changeUserStatus(row.userId, newStatus)
        message.success('修改成功')
        refresh()
      },
      onCancel: () => {
        // 回滚：由于 Switch 可能已经改变了本地状态，需要刷新列表
        refresh()
      },
    })
  }

  // ---- 重置密码 ----
  const handleResetPwd = (row: UserVO) => {
    Modal.confirm({
      title: '重置密码',
      content: `请输入"${row.userName}"的新密码`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        // 此处使用简单的 prompt 方式，实际可以通过自定义 Modal 实现
        // 由于 Ant Design Modal.confirm 不支持 prompt，我们在组件层处理
      },
    })
  }

  // ---- 执行重置密码 ----
  const doResetPwd = useCallback(async (userId: number | string, password: string) => {
    await resetUserPwd(userId, password)
    message.success(`修改成功，新密码是：${password}`)
  }, [])

  // ---- 新增 ----
  const handleAdd = () => {
    setEditUserId(undefined)
    setDrawerOpen(true)
  }

  // ---- 修改 ----
  const handleUpdate = (row?: UserVO) => {
    const userId = row?.userId ?? selectedRowKeys[0]
    if (userId === undefined) return
    setEditUserId(userId)
    setDrawerOpen(true)
  }

  // ---- 提交表单 ----
  // ---- 关闭抽屉 ----
  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditUserId(undefined)
  }

  // ---- 导出 ----
  const handleExport = () => {
    const formValues = form.getFieldsValue()
    const params: UserQuery = {
      ...buildQueryParams(formValues),
      pageNum,
      pageSize,
    }
    void exportUser(params)
  }

  // ---- 导入 ----
  const handleImport = () => {
    setImportOpen(true)
  }

  // ---- 下载模板 ----
  const handleDownloadTemplate = () => {
    void fetchImportTemplate()
  }

  // ---- 导入成功 ----
  const handleImportSuccess = () => {
    setImportOpen(false)
    refresh()
  }

  // ---- 刷新 ----
  const handleRefresh = () => {
    refresh()
  }

  // ---- 分配角色 ----
  const handleAuthRole = (row: UserVO) => {
    void navigate({
      to: '/system/user-auth/role/$userId',
      params: { userId: String(row.userId) },
    })
  }

  return {
    // 查询参数
    form,
    // 表格
    dataList,
    total,
    loading,
    pageNum,
    pageSize,
    changePage,
    selectedRowKeys,
    setSelectedRowKeys,
    single,
    multiple,
    // 部门树
    deptOptions,
    enabledDeptOptions,
    selectedDeptId,
    deptLoading,
    handleSelectDept,
    // 抽屉
    drawerOpen,
    editUserId,
    handleDrawerClose,
    // 导入
    importOpen,
    setImportOpen,
    handleImportSuccess,
    // 选项
    initPassword,
    currentUserId,
    // 动作
    handleSearch,
    handleReset,
    handleDelete,
    handleStatusChange,
    handleResetPwd,
    doResetPwd,
    handleAdd,
    handleUpdate,
    handleExport,
    handleImport,
    handleDownloadTemplate,
    handleRefresh,
    // 分配角色
    handleAuthRole,
  }
}
