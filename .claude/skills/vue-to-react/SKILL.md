---
name: vue-to-react
description: 将 RuoYi Vue (plus-ui) 管理页面改造为 React + TypeScript + Ant Design 页面。基于项目已有的 BaseListPage、BaseDrawer、AuthButton、useDict 等基础设施，按约定俗成的模式将 Vue SFC 拆分为 React 目录结构，包含 API 层、类型定义、页面 Hook、子组件和样式文件。

---

# Vue → React 页面改造规范

## 1. 概述

本 Skill 用于将 RuoYi Vue (plus-ui) 项目中的管理页面改造为当前 React + TypeScript + Ant Design 项目。

核心原则：
- **不照搬 Vue 写法**，而是用 React 项目已有的基础设施重新组织代码
- **严格 TypeScript**，不允许 `any`、`as any`、`@ts-ignore`
- **复用已有组件**：`BaseListPage`、`BaseDrawer`、`AuthButton`、`Auth`、`DictSelect`、`DictTag`、`useDict`
- **保持业务能力一致**：查询、分页、增删改、状态切换、导入导出、权限控制
- **不压制 React Hooks lint**：禁止生成 `// eslint-disable-line react-hooks/set-state-in-effect` 和 `// eslint-disable-line react-hooks/exhaustive-deps`，必须通过调整依赖、事件时机或组件结构解决

## 2. 目录结构映射

### Vue 结构

```
src/views/system/user/
  index.vue              ← 所有逻辑集中在一个文件
  authRole.vue           ← 子页面
```

### React 结构

```
src/
  api/system/user/
    index.ts             ← API 函数
    types.ts             ← VO / Form / Query 类型
  api/system/dept/
    index.ts
    types.ts
  features/system/user/
    index.tsx            ← 页面视图层（薄组件）
    index.module.less    ← 页面样式
    hooks/
      useUserPage.ts     ← 页面状态和业务逻辑
    components/
      DeptTreePanel.tsx  ← 左侧树面板
      UserDrawer.tsx     ← 新增/修改抽屉
      UserImportModal.tsx← 导入弹窗
```

### 映射规则

| Vue | React | 说明 |
|-----|-------|------|
| `views/system/xxx/index.vue` | `features/system/xxx/index.tsx` | 页面主文件 |
| `<script setup>` 中的状态 | `hooks/useXxxPage.ts` | 提取为自定义 Hook |
| `<script setup>` 中的模板 | `index.tsx` 的 JSX | 视图层 |
| `<style scoped>` | `index.module.less` | CSS Modules |
| `el-dialog` / 表单逻辑 | `components/XxxDrawer.tsx` | 使用 BaseDrawer |
| 上传逻辑 | `components/XxxImportModal.tsx` | 独立导入弹窗 |
| `api/system/xxx.ts` | `api/system/xxx/index.ts` + `types.ts` | 拆分函数和类型 |

## 3. API 层改造

### 3.1 Vue API 模式

```ts
// Vue: 默认导出对象
import api from '@/api/system/user'
api.listUser(query)
api.getUser(userId)
api.addUser(form)
```

或命名导出：

```ts
import { listType, getType, delType } from '@/api/system/dict/type'
```

### 3.2 React API 模式

```ts
// React: 命名导出函数 + 独立 types.ts
import request, { download, type ApiResponse } from '@/request'
import type { UserVO, UserForm, UserQuery } from './types'

export function listUser(query: UserQuery) {
  return request.get<ApiResponse<UserVO[]>>('/system/user/list', query)
}

export function getUser(userId?: number | string) {
  const url = userId !== undefined ? `/system/user/${userId}` : '/system/user/'
  return request.get<ApiResponse<UserData>>(url)
}

export function addUser(data: UserForm) {
  return request.post<ApiResponse<void>>('/system/user', data)
}

export function delUser(userIds: number | string | Array<number | string>) {
  const ids = Array.isArray(userIds) ? userIds.join(',') : userIds
  return request.delete<ApiResponse<void>>(`/system/user/${ids}`)
}

export function exportUser(data: UserQuery) {
  return download('/system/user/export', { ...data }, `user_${Date.now()}.xlsx`)
}
```

### 3.3 类型定义模式

```ts
// types.ts
export type UserStatus = '0' | '1'

export interface UserVO {
  userId: number | string
  deptId?: number | string
  userName: string
  nickName?: string
  // ... 其他字段
  status: UserStatus
}

export interface UserForm {
  userId?: number | string
  deptId?: number | string | null
  userName?: string
  // ... 其他字段
  postIds?: Array<number | string> | null
  roleIds?: Array<number | string> | null
}

export interface UserQuery {
  pageNum: number
  pageSize: number
  userName?: string
  // ... 其他查询字段
  beginTime?: string
  endTime?: string
}
```

### 3.4 download 函数

Vue 使用 `proxy.download(url, params, filename)`。

React 使用项目已有的 `download` 函数：

```ts
import { download } from '@/request'

// 导出
export function exportUser(data: UserQuery) {
  return download('/system/user/export', { ...data }, `user_${Date.now()}.xlsx`)
}

// 下载模板
export function importTemplate() {
  return download('/system/user/importTemplate', {}, `user_template_${Date.now()}.xlsx`)
}
```

## 4. 状态管理改造

### 4.1 Vue 状态模式

```ts
// Vue: ref / reactive
const loading = ref(true)
const total = ref(0)
const dataList = ref<UserVO[]>([])
const dialog = reactive({ visible: false, title: '' })
const data = reactive<PageData<UserForm, UserQuery>>(initData)
const { queryParams, form, rules } = toRefs(data)
```

### 4.2 React 状态模式

```ts
// React: useState
const [loading, setLoading] = useState(false)
const [total, setTotal] = useState(0)
const [dataList, setDataList] = useState<UserVO[]>([])
const [drawerOpen, setDrawerOpen] = useState(false)
const [editId, setEditId] = useState<number | string | undefined>()
```

### 4.3 Vue proxy 方法替代

| Vue proxy 方法 | React 替代方案 |
|---|---|
| `proxy.useDict('sys_normal_disable')` | `useDict('sys_normal_disable')` 自定义 Hook |
| `proxy.addDateRange(query, dateRange)` | 手动格式化：`dateRange[0].format('YYYY-MM-DD HH:mm:ss')` |
| `proxy.download(url, params, filename)` | `download(url, params, filename)` from `@/request` |
| `proxy.$modal.confirm(msg)` | `Modal.confirm({ title, content, onOk })` from `antd` |
| `proxy.$modal.msgSuccess(msg)` | `message.success(msg)` from `antd` |
| `proxy.getConfigKey(key)` | `getConfigKey(key)` from `@/api/system/config` |
| `proxy.parseTime(time)` | dayjs 格式化或直接展示 |

### 4.4 列表页请求模式

迁移 Vue 列表页时，凡是包含查询表单、分页表格、重置查询、删除后刷新、新增/编辑后刷新、导出、批量删除、表格 loading、`total`、`pageNum`、`pageSize` 任一能力，必须优先复用项目已有的统一列表 Hook 或 `BaseListPage` 内置数据加载能力。

禁止在每个页面复制以下模板：

```tsx
const [dataList, setDataList] = useState([])
const [total, setTotal] = useState(0)
const [loading, setLoading] = useState(false)
const [pageNum, setPageNum] = useState(1)
const [pageSize, setPageSize] = useState(10)
const cancelledRef = useRef(false)
const doFetch = useCallback(...)
useEffect(...)
const handleSearch = ...
const handleReset = ...
```

开始改造前先搜索项目是否已有 `useTableList`、`useListPage`、`useTableRequest`、`useBaseListPage` 等 Hook。若没有，应新增 `src/hooks/useTableList.ts`，集中管理列表请求、分页、搜索、重置、刷新、卸载保护和请求序列号保护。

推荐 Hook API：

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormInstance } from 'antd'

export type TableListResult<T> = {
  rows?: T[]
  total?: number
  list?: T[]
  data?: T[]
}

export type UseTableListOptions<T, F extends object, P extends object> = {
  form: FormInstance<F>
  request: (params: P & { pageNum: number; pageSize: number }) => Promise<TableListResult<T>>
  buildParams: (formValues: F) => P
  defaultPageSize?: number
  immediate?: boolean
}
```

Hook 返回值至少包含：

```tsx
dataList
total
loading
pageNum
pageSize
setDataList
setTotal
search
reset
refresh
changePage
fetchList
```

Hook 内部必须使用 `mountedRef` 和请求序列号保护，避免组件卸载后继续 `setState`，也避免旧请求覆盖新请求。API 响应必须兼容常见列表格式：

```tsx
res.rows ?? res.list ?? res.data ?? []
res.total ?? 0
```

### 4.5 React Hooks lint 约束

生成代码和重构代码时禁止通过关闭 ESLint 规则绕过 Hooks 问题：

```tsx
// 禁止
// eslint-disable-line react-hooks/set-state-in-effect
// eslint-disable-next-line react-hooks/set-state-in-effect
// eslint-disable-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps
```

遇到 `react-hooks/set-state-in-effect` 必须调整架构，通常是把列表请求集中到统一 Hook、把弹窗初始化放到 `afterOpenChange`、把派生状态改为计算值，或把请求触发移动到用户动作/分页事件中。禁止用注释忽略。

处理原则：

- `exhaustive-deps`：`useEffect` 依赖必须完整；初始化函数、回调函数应使用 `useCallback` 包裹，并写全依赖。
- `set-state-in-effect`：不要用 effect 专门把 props/open 同步到本地 state；列表页业务请求不允许手写重复 `useEffect + doFetch`；优先在统一 Hook、用户动作、分页回调、`BaseDrawer`/`Modal` 的 `afterOpenChange` 等位置处理。
- 弹窗/抽屉打开时需要重置表单、清空选中项、回到第一页并请求数据时，优先使用 `afterOpenChange`：

```tsx
const handleOpenChange = (visible: boolean) => {
  if (!visible || !roleId) return
  setSelectedRowKeys([])
  reset()
}

<Modal open={open} afterOpenChange={handleOpenChange} />
```

只有真正的订阅、异步请求、外部系统同步适合放进 `useEffect`；这类 effect 也必须保留完整依赖和卸载保护。

### 4.6 列表页改造示例

以字典类型页面为例，业务页只保留字段映射、按钮事件、抽屉状态和表格列定义：

```tsx
const buildQueryParams = useCallback((formValues: DictSearchForm) => {
  const beginTime = formValues.dateRange?.[0]?.format('YYYY-MM-DD') ?? ''
  const endTime = formValues.dateRange?.[1]?.format('YYYY-MM-DD') ?? ''

  return {
    dictName: formValues.dictName ?? '',
    dictType: formValues.dictType ?? '',
    beginTime,
    endTime,
  }
}, [])

const {
  dataList,
  total,
  loading,
  pageNum,
  pageSize,
  search: handleSearch,
  reset: handleReset,
  refresh,
  changePage,
} = useTableList<DictTypeVO, DictSearchForm, ReturnType<typeof buildQueryParams>>({
  form,
  request: listType,
  buildParams: buildQueryParams,
})
```

删除、批量删除、状态切换、抽屉提交成功后的刷新统一调用：

```tsx
refresh()
```

分页变化统一调用：

```tsx
changePage(nextPageNum, nextPageSize)
```

导出逻辑必须复用 `buildQueryParams`，避免重复拼接查询字段：

```tsx
const handleExport = () => {
  const formValues = form.getFieldsValue()
  void exportType(buildQueryParams(formValues))
}
```

如果 `BaseListPage` 已支持受控分页、loading 和刷新，页面必须用 Hook 返回值接入。当前项目的 `BaseListPage` 使用 `pagination` 和 `onRefresh`：

```tsx
<BaseListPage<DictTypeVO>
  rowKey="dictId"
  columns={columns}
  dataSource={dataList}
  loading={loading}
  pagination={{
    current: pageNum,
    pageSize,
    total,
    showSizeChanger: true,
    showTotal: (t) => `共 ${t} 条`,
    onChange: changePage,
  }}
  queryNode={queryNode}
  toolbarLeft={toolbarLeft}
  onRefresh={refresh}
/>
```

如果当前项目 `BaseListPage` 属性名不同，必须先阅读组件类型定义，按已有类型接入，不允许猜测属性名。

### 4.7 列表页扫描要求

迁移或批量修复前必须扫描以下关键字，并逐个判断是否属于同类列表模式；属于同类模式的页面统一改造为 `useTableList` 或项目已有 Hook，不属于列表页的代码不要机械修改。

```text
react-hooks/set-state-in-effect
eslint-disable-line react-hooks/set-state-in-effect
eslint-disable-next-line react-hooks/set-state-in-effect
cancelledRef
const doFetch = useCallback
const handleSearch = () => {
const handleReset = () => {
```

## 5. 模板 → JSX 改造

### 5.1 权限指令

| Vue | React |
|-----|-------|
| `<el-button v-has-permi="['system:user:add']">` | `<AuthButton permission="system:user:add">` |
| `<el-dropdown-item v-if="checkPermi([...])">` | `<Auth permission="system:user:import"><Menu.Item>` |
| `v-hasPermi` (camelCase) | `permission` prop on `AuthButton` |

### 5.2 字典使用

```tsx
// Vue
const { sys_normal_disable } = toRefs<any>(proxy?.useDict('sys_normal_disable'))
// template: v-for="dict in sys_normal_disable" :label="dict.label" :value="dict.value"

// React
const { sys_normal_disable } = useDict('sys_normal_disable')
// JSX: <DictSelect options={sys_normal_disable} />
// 或: <DictTag options={sys_normal_disable} value={record.status} />
```

### 5.3 表格列定义

```tsx
// Vue: v-if="columns[N].visible" + right-toolbar 组件
// React: BaseListPage 内置列显隐，通过 storageKey 持久化

const columns: ColumnsType<UserVO> = [
  { title: '用户编号', dataIndex: 'userId', key: 'userId', width: 100, ellipsis: true },
  { title: '用户名称', dataIndex: 'userName', key: 'userName', ellipsis: true },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (_, record) => (
      <Switch
        checked={record.status === '0'}
        onChange={() => handleStatusChange(record)}
      />
    ),
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 180,
    render: (_, record) => (
      <Space size="small">
        <AuthButton type="link" size="small" permission="system:user:edit" onClick={() => handleEdit(record)}>
          修改
        </AuthButton>
      </Space>
    ),
  },
]
```

### 5.4 树形组件

```tsx
// Vue: el-tree with node-key, props, filter-node-method
// React: Ant Design Tree with treeData (DataNode[])

// 数据转换
function convertToTreeData(nodes: DeptTreeNode[]): DataNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.label,
    disabled: node.disabled,
    children: node.children ? convertToTreeData(node.children) : undefined,
  }))
}

// 过滤
const filterTreeNode = (node: DataNode): boolean => {
  if (!filterValue) return true
  return String(node.title ?? '').includes(filterValue)
}
```

### 5.5 日期范围

```tsx
// Vue: el-date-picker type="daterange" + proxy.addDateRange()
// React: DatePicker.RangePicker + 手动格式化

<RangePicker
  value={dateRange}
  onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
/>

// 查询时格式化
function buildQueryParams(query: UserQuery, dateRange?: [Dayjs, Dayjs] | null): UserQuery {
  const params = { ...query }
  if (dateRange?.[0] && dateRange?.[1]) {
    params.beginTime = dateRange[0].format('YYYY-MM-DD HH:mm:ss')
    params.endTime = dateRange[1].format('YYYY-MM-DD HH:mm:ss')
  }
  return params
}
```

### 5.6 下拉菜单（更多按钮）

```tsx
// Vue: el-dropdown + el-dropdown-item + v-if="checkPermi([...])"
// React: Dropdown + Auth 包裹菜单项

const moreMenuItems = [
  {
    key: 'import',
    label: (
      <Auth permission="system:user:import">
        <span><ImportOutlined /> 导入数据</span>
      </Auth>
    ),
    onClick: handleImport,
  },
  // ...
]

<Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
  <Button><FormOutlined /> 更多</Button>
</Dropdown>
```

## 6. 组件改造

### 6.1 Dialog → BaseDrawer

| Vue el-dialog | React BaseDrawer |
|---|---|
| `v-model="dialog.visible"` | `open={drawerOpen}` |
| `:title="dialog.title"` | `title={isEdit ? '修改' : '新增'}` |
| `width="600px"` | `width={600}` |
| `@close="closeDialog"` | `onClose={handleClose}` |
| 确定按钮在 footer slot | `onConfirm={handleConfirm}` 自动渲染 |

### 6.2 Drawer 数据加载

```tsx
// Vue: watch(dialog.visible) 或 onMounted 中根据 editId 加载
// React: afterOpenChange + fetchedRef 防止重复加载

const fetchedRef = useRef(false)

const handleAfterOpenChange = useCallback((isOpen: boolean) => {
  if (!isOpen) return
  if (fetchedRef.current) return
  fetchedRef.current = true

  if (isEdit && entityId !== undefined) {
    setLoading(true)
    getEntity(entityId)
      .then((res) => {
        if (res.data) form.setFieldsValue(res.data)
      })
      .finally(() => setLoading(false))
  } else {
    // 新增时设置默认值
    form.setFieldsValue({ status: '0' })
  }
}, [isEdit, entityId, form])

const handleClose = () => {
  fetchedRef.current = false
  form.resetFields()
  onClose()
}

return (
  <BaseDrawer
    open={open}
    title={isEdit ? '修改' : '新增'}
    loading={loading}
    confirmLoading={submitting}
    onClose={handleClose}
    onConfirm={handleConfirm}
    afterOpenChange={handleAfterOpenChange}
  >
    <Form form={form} layout="vertical">
      {/* 表单字段 */}
    </Form>
  </BaseDrawer>
)
```

### 6.3 el-switch → Switch + Modal.confirm

```tsx
// Vue: el-switch @change + proxy.$modal.confirm + catch 回滚
// React: Switch + Modal.confirm + 刷新列表回滚

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
      refresh() // 回滚
    },
  })
}
```

### 6.4 el-upload → Upload.Dragger + fetch

```tsx
// Vue: el-upload with globalHeaders() and auto-upload
// React: Upload.Dragger with customRequest + fetch + globalHeaders()

const handleUpload: UploadProps['customRequest'] = (options) => {
  const { file, onSuccess: uploadSuccess, onError } = options
  setUploading(true)

  const formData = new FormData()
  formData.append('file', file as File)

  fetch(`${uploadUrl}?updateSupport=${updateSupport ? 1 : 0}`, {
    method: 'POST',
    headers: globalHeaders(),
    body: formData,
  })
    .then((resp) => resp.json())
    .then((data) => {
      setUploading(false)
      if (data.code === 200 || data.code === 0) {
        message.success(data.msg || '导入成功')
        uploadSuccess?.(data)
        onSuccess()
      } else {
        message.error(data.msg || '导入失败')
        onError?.(new Error(data.msg))
      }
    })
    .catch((err) => {
      setUploading(false)
      onError?.(err)
    })
}
```

## 7. 页面 Hook 设计

### 7.1 何时提取 Hook

- **简单页面**（如 dict）：状态直接放在组件中
- **复杂页面**（如 user）：提取 `useXxxPage` Hook

判断标准：状态超过 15 个，或有复杂的交互逻辑（树联动、状态回滚等）。

### 7.2 Hook 结构模板

```ts
export function useXxxPage() {
  const [form] = Form.useForm<XxxSearchForm>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<number | string>>([])

  // ---- 抽屉 ----
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editId, setEditId] = useState<number | string | undefined>()

  // ---- 计算属性 ----
  const single = selectedRowKeys.length !== 1
  const multiple = selectedRowKeys.length === 0

  // ---- 列表查询参数映射 ----
  const buildQueryParams = useCallback((formValues: XxxSearchForm): XxxListParams => ({
    field1: formValues.field1 ?? '',
    beginTime: formValues.dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss') ?? '',
    endTime: formValues.dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss') ?? '',
  }), [])

  // ---- 数据获取 ----
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
  } = useTableList<XxxVO, XxxSearchForm, XxxListParams>({
    form,
    request: listXxx,
    buildParams: buildQueryParams,
  })

  // ---- 初始化 ----
  useEffect(() => {
    // 获取树、配置等非列表数据；不要在这里编排表格请求
  }, [])

  // ---- 动作 ----
  const handleSearch = () => search()
  const handleReset = () => reset()
  const handleDelete = (ids) => { Modal.confirm({...}) }
  const handleAdd = () => { setEditId(undefined); setDrawerOpen(true) }
  const handleUpdate = (row?) => { setEditId(row?.id ?? selectedRowKeys[0]); setDrawerOpen(true) }
  // ...

  return {
    // 状态 + setter
    form, dataList, total, loading, pageNum, pageSize, changePage,
    selectedRowKeys, setSelectedRowKeys, single, multiple,
    drawerOpen, editId,
    // 动作
    handleSearch, handleReset, handleDelete, handleAdd, handleUpdate,
    handleDrawerClose, handleRefresh: refresh,
  }
}
```

## 8. 样式改造

### 8.1 Vue scoped styles → CSS Modules

```less
// Vue: <style lang="scss" scoped>
// React: index.module.less

.page {
  height: 100%;
  display: flex;
  gap: 16px;
  min-height: 0;
}

.leftPanel {
  width: 260px;
  flex: 0 0 260px;
  min-height: 0;
}

.content {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
```

### 8.2 布局约定

- 页面根节点：`height: 100%; display: flex; gap: 16px; min-height: 0;`
- 左侧面板：固定宽度 `flex: 0 0 260px`
- 右侧内容：`flex: 1; min-width: 0; min-height: 0;`
- 不使用行内 style
- 使用 `styles.className` 访问

## 9. 改造步骤清单

按以下顺序执行：

### 第一步：阅读 Vue 源文件

- [ ] 梳理所有 API 调用及其参数/返回值
- [ ] 梳理所有权限字符串
- [ ] 梳理所有表单校验规则
- [ ] 梳理所有字典类型
- [ ] 梳理表格列定义和渲染逻辑
- [ ] 梳理特殊交互（状态切换回滚、重置密码、导入导出）
- [ ] 标注不需要迁移的逻辑（如分配角色）

### 第二步：创建 API 层

- [ ] 创建 `src/api/system/xxx/types.ts`（VO、Form、Query）
- [ ] 创建或扩展 `src/api/system/xxx/index.ts`
- [ ] 确保返回类型使用 `ApiResponse<T>` 包装

### 第三步：创建页面目录结构

- [ ] `src/features/system/xxx/index.tsx`
- [ ] `src/features/system/xxx/index.module.less`
- [ ] `src/features/system/xxx/hooks/useXxxPage.ts`（复杂页面）
- [ ] `src/features/system/xxx/components/XxxDrawer.tsx`
- [ ] `src/features/system/xxx/components/XxxImportModal.tsx`（如有导入）

### 第四步：实现页面 Hook

- [ ] 查询参数状态
- [ ] 表格状态（优先由 `useTableList` / 项目已有列表 Hook 管理：dataList, total, loading, pagination）
- [ ] 选中行状态（selectedRowKeys, single, multiple）
- [ ] 抽屉状态（drawerOpen, editId）
- [ ] 数据获取函数（列表页使用统一 Hook；弹窗/抽屉打开加载优先用 `afterOpenChange`）
- [ ] 所有业务动作（搜索、重置、删除、状态切换等）

### 第五步：实现子组件

- [ ] Drawer：使用 BaseDrawer + afterOpenChange + fetchedRef
- [ ] ImportModal：使用 Modal + Upload.Dragger + customRequest
- [ ] 左侧面板（如部门树）：独立组件

### 第六步：组装页面

- [ ] BaseListPage 配置（queryNode, toolbarLeft, columns, pagination, rowSelection, storageKey）
- [ ] 权限按钮（AuthButton / Auth）
- [ ] 字典集成（useDict + DictSelect / DictTag）
- [ ] 导出/下载模板

### 第七步：验证

```bash
pnpm tsc --noEmit
pnpm lint
pnpm build
```

验证时必须确认业务代码没有 `// eslint-disable-line react-hooks/set-state-in-effect`、`// eslint-disable-next-line react-hooks/set-state-in-effect`、`// eslint-disable-line react-hooks/exhaustive-deps`、`// eslint-disable-next-line react-hooks/exhaustive-deps`。如果 lint 报 hooks 依赖或 effect 中同步 setState，应回到实现中调整依赖、`useTableList`、`useCallback`、事件回调或派生状态，而不是加禁用注释。

## 10. 常见陷阱

### 10.1 不要重复 API 调用

Drawer 内部通过 `afterOpenChange` 加载数据，页面层不需要再调用 `getUser`。

### 10.2 不要使用 Vue 的 proxy

所有 `proxy.xxx()` 调用必须替换为 React 项目的对应方案。

### 10.3 不要使用 Element Plus 组件

`el-*` 组件全部替换为 Ant Design 对应组件。

### 10.4 不要保留 v-has-permi

替换为 `AuthButton` 或 `Auth` 组件。

### 10.5 空字符串 ≠ 未选中

`useState('')` 的空字符串会导致 Select 不显示 placeholder。DictSelect 内部已处理，但直接使用 Select 时需注意。

### 10.6 Drawer width 已废弃

使用 `size` prop 或通过 `drawerProps` 传递。

### 10.7 Modal destroyOnClose 已废弃

使用 `destroyOnHidden`。

### 10.8 不要用 eslint-disable-line 绕过 hooks 规则

遇到 `react-hooks/set-state-in-effect` 或 `react-hooks/exhaustive-deps` 时，必须修改代码结构。典型做法是列表页接入 `useTableList`、补全依赖、把函数改成 `useCallback`、把弹窗打开初始化迁移到 `afterOpenChange`，或把可派生 state 改为计算值。不要生成 `// eslint-disable-line react-hooks/set-state-in-effect`、`// eslint-disable-next-line react-hooks/set-state-in-effect`、`// eslint-disable-line react-hooks/exhaustive-deps` 或 `// eslint-disable-next-line react-hooks/exhaustive-deps`。

## 11. 组件对照表

| Element Plus | Ant Design | 说明 |
|---|---|---|
| `el-button` | `Button` / `AuthButton` | 权限按钮用 AuthButton |
| `el-input` | `Input` | |
| `el-select` | `Select` | 字典场景用 DictSelect |
| `el-tree-select` | `TreeSelect` | |
| `el-date-picker` (daterange) | `DatePicker.RangePicker` | |
| `el-table` | `Table` | 通过 BaseListPage 使用 |
| `el-pagination` | BaseListPage 内置 | |
| `el-dialog` | `BaseDrawer` | 统一用抽屉 |
| `el-form` | `Form` | Form.useForm<T>() |
| `el-switch` | `Switch` | 配合 Modal.confirm |
| `el-tag` | `Tag` | 字典场景用 DictTag |
| `el-tree` | `Tree` | 需转换 DataNode 格式 |
| `el-upload` | `Upload.Dragger` | customRequest 模式 |
| `el-card` | `Card` | |
| `el-row` / `el-col` | `Row` / `Col` | |
| `el-radio` | `Radio` / `Radio.Group` | |
| `el-checkbox` | `Checkbox` | |
| `el-dropdown` | `Dropdown` | |
| `el-tooltip` | `Tooltip` | |
| `el-input-number` | `InputNumber` | |
| `el-scrollbar` | 不需要 | Ant Design 自带滚动 |
| `right-toolbar` | BaseListPage 内置 | 列设置、搜索显隐、刷新 |
| `pagination` | BaseListPage 内置 | |
