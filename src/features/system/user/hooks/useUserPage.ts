import { useCallback, useEffect, useRef, useState } from 'react'
import { message, Modal } from 'antd'
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

function filterDisabledDept(nodes: DeptTreeNode[]): DeptTreeNode[] {
  return nodes
    .filter((node) => !node.disabled)
    .map((node) => ({
      ...node,
      children: node.children ? filterDisabledDept(node.children) : undefined,
    }))
}

function buildQueryParams(
  query: UserQuery,
  dateRange?: [Dayjs, Dayjs] | null,
): UserQuery {
  const params = { ...query }
  if (dateRange?.[0] && dateRange?.[1]) {
    params.beginTime = dateRange[0].format('YYYY-MM-DD HH:mm:ss')
    params.endTime = dateRange[1].format('YYYY-MM-DD HH:mm:ss')
  }
  return params
}

export function useUserPage() {
  const currentUserId = useAuthStore((state) => state.userInfo?.userId)

  // ---- 查询参数 ----
  const [userName, setUserName] = useState('')
  const [nickName, setNickName] = useState('')
  const [phonenumber, setPhonenumber] = useState('')
  const [status, setStatus] = useState<UserStatus | ''>('')
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [deptId, setDeptId] = useState<number | string | undefined>()

  // ---- 表格状态 ----
  const [dataList, setDataList] = useState<UserVO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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

  const cancelledRef = useRef(false)

  // ---- 获取列表 ----
  const doFetch = useCallback(
    (page: number, size: number) => {
      const query: UserQuery = {
        pageNum: page,
        pageSize: size,
        userName,
        nickName,
        phonenumber,
        status,
        deptId,
      }
      const params = buildQueryParams(query, dateRange)
      setLoading(true)
      listUser(params)
        .then((res) => {
          if (cancelledRef.current) return
          setDataList(res.rows ?? [])
          setTotal(res.total ?? 0)
        })
        .finally(() => {
          if (!cancelledRef.current) {
            setLoading(false)
          }
        })
    },
    [userName, nickName, phonenumber, status, deptId, dateRange],
  )

  // ---- 获取部门树 ----
  const fetchDeptTree = useCallback(() => {
    setDeptLoading(true)
    deptTreeSelect()
      .then((res) => {
        if (cancelledRef.current) return
        const data = res.data ?? []
        setDeptOptions(data)
        setEnabledDeptOptions(filterDisabledDept(data))
      })
      .finally(() => {
        if (!cancelledRef.current) {
          setDeptLoading(false)
        }
      })
  }, [])

  // ---- 获取初始密码 ----
  const fetchInitPassword = useCallback(() => {
    getConfigKey('sys.user.initPassword').then((res) => {
      if (cancelledRef.current) return
      setInitPassword(res.data ?? '')
    })
  }, [])

  // ---- 初始化 ----
  useEffect(() => {
    cancelledRef.current = false
    fetchDeptTree() // eslint-disable-line react-hooks/set-state-in-effect
    fetchInitPassword()
    return () => {
      cancelledRef.current = true
    }
  }, [fetchDeptTree, fetchInitPassword])

  useEffect(() => {
    cancelledRef.current = false
    doFetch(pageNum, pageSize) // eslint-disable-line react-hooks/set-state-in-effect
    return () => {
      cancelledRef.current = true
    }
  }, [doFetch, pageNum, pageSize])

  // ---- 单选/多选状态 ----
  const single = selectedRowKeys.length !== 1
  const multiple = selectedRowKeys.length === 0

  // ---- 搜索 ----
  const handleSearch = () => {
    setPageNum(1)
    doFetch(1, pageSize)
  }

  // ---- 重置 ----
  const handleReset = () => {
    setUserName('')
    setNickName('')
    setPhonenumber('')
    setStatus('')
    setDateRange(null)
    setDeptId(undefined)
    setSelectedDeptId(undefined)
    setPageNum(1)
    // 需要等状态更新后再请求，使用 setTimeout 确保状态已更新
    setTimeout(() => {
      doFetch(1, pageSize)
    }, 0)
  }

  // ---- 部门节点点击 ----
  const handleSelectDept = useCallback(
    (id: number | string | undefined) => {
      setSelectedDeptId(id)
      setDeptId(id)
      setPageNum(1)
      // 状态更新后由 useEffect 触发 doFetch
    },
    [],
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
        doFetch(pageNum, pageSize)
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
        doFetch(pageNum, pageSize)
      },
      onCancel: () => {
        // 回滚：由于 Switch 可能已经改变了本地状态，需要刷新列表
        doFetch(pageNum, pageSize)
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
    const query: UserQuery = {
      pageNum,
      pageSize,
      userName,
      nickName,
      phonenumber,
      status,
      deptId,
    }
    const params = buildQueryParams(query, dateRange)
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
    doFetch(pageNum, pageSize)
  }

  // ---- 刷新 ----
  const handleRefresh = () => {
    doFetch(pageNum, pageSize)
  }

  return {
    // 查询参数
    userName,
    setUserName,
    nickName,
    setNickName,
    phonenumber,
    setPhonenumber,
    status,
    setStatus,
    dateRange,
    setDateRange,
    deptId,
    // 表格
    dataList,
    total,
    loading,
    pageNum,
    setPageNum,
    pageSize,
    setPageSize,
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
  }
}
