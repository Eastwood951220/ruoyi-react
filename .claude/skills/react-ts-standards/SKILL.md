---
name: react-ts-standards
description: React + TypeScript 代码开发规范。用于编写、重构、修复 React/TS/TSX 代码时，系统性检查并修复 TypeScript 类型错误、空值问题、泛型缺失、API 类型不一致、组件 Props 类型、Hooks 依赖、Ant Design 类型、Zustand Store 类型、DOM 属性透传和构建校验问题。

---

# React + TypeScript 代码开发规范

## 1. 目标

本 Skill 用于 React + TypeScript 项目的代码编写、重构和错误修复。

重点不是只修复单个 TS 报错，而是系统性解决以下类型问题：

- TS2322：类型不能赋值
- TS2345：参数类型不匹配
- TS2339：属性不存在
- TS2531 / TS2532：对象可能为 null 或 undefined
- TS18048：变量可能为 undefined
- TS7006：参数隐式 any
- TS7053：索引访问类型错误
- TS2741 / TS2739：对象缺少必填属性
- TS2769：函数重载不匹配
- TS2786：组件不能作为 JSX 组件使用
- React Props 类型错误
- Hooks 依赖和闭包问题
- Ant Design Form / Table / Modal 类型错误
- Zustand Store selector 类型问题
- API 请求参数与响应类型不一致
- DOM 属性透传导致的 React Warning

## 2. 最高优先级规则

1. 修改代码前必须先阅读相关类型定义，包括：
    - 当前文件的 Props 类型
    - API 入参和返回值类型
    - Store 类型
    - 路由参数类型
    - 表单字段类型
    - 组件库类型定义

2. 不允许为了消除 TypeScript 报错滥用：

```ts
any
as any
as string
as unknown as Xxx
// @ts-ignore
// @ts-expect-error
非空断言 !
```

3. 不允许只修复报错行，必须分析类型错误的来源。

4. 不允许把 `string | null | undefined` 直接传给只接收 `string` 的函数。

5. 不允许直接消费可能为空的 API 响应字段。

6. 不允许组件 Props、事件参数、API 参数、Store 状态出现隐式 any。

7. 修改后必须执行：

```bash
pnpm tsc --noEmit
pnpm lint
pnpm build
```

如果项目已有脚本，优先使用：

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## 3. TypeScript 类型修复总原则

### 3.1 先找类型来源

遇到类型错误时，必须优先定位：

```text
当前变量类型来自哪里？
是 API 返回？
是路由参数？
是 Form 表单值？
是 Store？
是组件 Props？
是 Table record？
是第三方组件事件？
```

禁止直接在报错行强转。

### 3.2 优先修复类型定义，而不是绕过类型系统

错误示例：

```ts
submitForm(values as any)
```

正确做法：

```ts
interface SubmitParams {
  name: string
  deptId: string
}

const params: SubmitParams = {
  name: values.name?.trim() ?? '',
  deptId: values.deptId ?? '',
}

submitForm(params)
```

### 3.3 类型修复优先级

按照以下顺序修复：

1. 补全缺失的 interface / type
2. 修正 API 入参和返回值类型
3. 对 nullable 字段做显式处理
4. 使用类型守卫缩小类型
5. 使用泛型约束
6. 最后才考虑类型断言

类型断言必须有明确依据，且禁止使用 `as any`。

## 4. 常见 TypeScript 错误处理规范

### 4.1 TS2345：参数类型不匹配

#### 问题

```ts
fetchDetail(id)
```

其中 `id` 是：

```ts
string | null | undefined
```

但 `fetchDetail` 只接收：

```ts
string
```

#### 正确处理

```ts
if (!id) {
  message.warning('缺少必要参数')
  return
}

fetchDetail(id)
```

或：

```ts
fetchDetail(id ?? '')
```

仅当空字符串是业务允许的默认值时才可以这样写。

---

### 4.2 TS2322：类型不能赋值

#### 问题

```ts
const userName: string = user.name
```

如果 `user.name` 是：

```ts
string | undefined
```

#### 正确处理

```ts
const userName = user.name ?? ''
```

或修改目标类型：

```ts
const userName: string | undefined = user.name
```

判断标准：

- 业务必须有值：提前校验
- 展示字段：提供默认值
- 数据模型确实可空：修改类型定义

---

### 4.3 TS2339：属性不存在

#### 问题

```ts
record.userName
```

但 `record` 的类型中没有 `userName`。

#### 修复步骤

1. 检查接口真实返回字段。
2. 检查是否字段名写错。
3. 检查 Table 泛型是否声明。
4. 检查类型定义是否遗漏。

#### 正确示例

```ts
interface UserRecord {
  id: string
  userName: string
}

const columns: ColumnsType<UserRecord> = [
  {
    title: '用户名',
    dataIndex: 'userName',
  },
]
```

禁止：

```ts
record as any
```

---

### 4.4 TS2531 / TS2532 / TS18048：对象可能为空

#### 问题

```ts
user.profile.name
```

其中 `profile` 可能为空。

#### 正确处理

展示场景：

```ts
const name = user.profile?.name ?? '未知'
```

必填业务场景：

```ts
if (!user.profile) {
  message.warning('用户资料不存在')
  return
}

submit(user.profile.name)
```

---

### 4.5 TS7006：参数隐式 any

#### 问题

```ts
const handleClick = (row) => {
  console.log(row.id)
}
```

#### 正确处理

```ts
interface UserRecord {
  id: string
  userName: string
}

const handleClick = (row: UserRecord) => {
  console.log(row.id)
}
```

React 事件：

```ts
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setValue(event.target.value)
}
```

---

### 4.6 TS7053：索引访问类型错误

#### 问题

```ts
const value = obj[key]
```

其中 `key` 是 string，但 obj 没有 string 索引签名。

#### 正确处理一：限制 key 类型

```ts
interface UserInfo {
  userName: string
  nickName: string
}

function getValue(obj: UserInfo, key: keyof UserInfo) {
  return obj[key]
}
```

#### 正确处理二：使用 Record

```ts
const map: Record<string, string> = {}

const value = map[key] ?? ''
```

禁止：

```ts
obj[key as any]
```

---

### 4.7 TS2741 / TS2739：对象缺少必填属性

#### 问题

```ts
const params: UserParams = {
  name: 'admin',
}
```

但 `UserParams` 要求：

```ts
interface UserParams {
  name: string
  deptId: string
}
```

#### 正确处理

如果字段业务必填：

```ts
if (!deptId) {
  message.warning('请选择部门')
  return
}

const params: UserParams = {
  name,
  deptId,
}
```

如果字段不是必填，应修改类型：

```ts
interface UserParams {
  name: string
  deptId?: string
}
```

---

### 4.8 TS2769：函数重载不匹配

常见于：

- Ant Design Form
- DatePicker
- Select
- Table
- React Router
- request 封装
- useState 初始值

处理要求：

1. 阅读函数重载定义。
2. 确认传入参数是否符合其中一个重载。
3. 不允许通过 `as any` 绕过。
4. 必要时拆分逻辑，先做类型收窄。

示例：

```ts
if (typeof value === 'string') {
  dayjs(value)
}
```

---

### 4.9 TS2786：组件不能作为 JSX 组件使用

处理方向：

1. 检查组件是否正确 default export / named export。
2. 检查组件返回值是否是 ReactNode。
3. 检查 React 类型版本是否冲突。
4. 检查第三方库版本是否兼容。
5. 检查是否错误地把普通函数当组件使用。

组件必须返回合法 JSX：

```tsx
function UserCard(): JSX.Element {
  return <div>用户</div>
}
```

或：

```tsx
const UserCard: React.FC<UserCardProps> = (props) => {
  return <div>{props.name}</div>
}
```

## 5. 空值处理规范

### 5.1 必填参数：提前 return

适用于：

- 路由 id
- 编辑详情 id
- 删除 id
- API 必填字段
- 权限 code
- 菜单 key

```ts
const id = params.id

if (!id) {
  message.warning('缺少必要参数')
  return
}

await getDetail(id)
```

### 5.2 可选展示字段：使用默认值

```ts
const nickName = user.nickName ?? '-'
```

### 5.3 表单提交前 normalize

```ts
const values = form.getFieldsValue()

const params: QueryParams = {
  name: values.name?.trim() ?? '',
  deptId: values.deptId ?? '',
  status: values.status ?? undefined,
}
```

### 5.4 工具函数支持空值

```ts
function normalizeText(value?: string | null) {
  return value?.trim() ?? ''
}
```

### 5.5 禁止写法

```ts
fetchDetail(id as string)
fetchDetail(id!)
fetchDetail(id as any)
```

## 6. React 组件类型规范

### 6.1 Props 必须显式声明

```tsx
interface UserCardProps {
  user: UserInfo
  onSelect?: (id: string) => void
}

function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div onClick={() => onSelect?.(user.id)}>
      {user.userName}
    </div>
  )
}
```

禁止：

```tsx
function UserCard(props: any) {}
```

### 6.2 children 类型

```tsx
interface PanelProps {
  title: string
  children?: React.ReactNode
}
```

### 6.3 事件类型

```tsx
const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setKeyword(event.target.value)
}

const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault()
}
```

### 6.4 组件拆分规范

复杂组件建议拆分：

```text
index.tsx
types.ts
constants.ts
hooks/useXxx.ts
components/Xxx.tsx
utils.ts
```

## 7. Hooks 类型规范

### 7.1 useState 必须避免错误推断

禁止：

```ts
const [list, setList] = useState([])
```

正确：

```ts
const [list, setList] = useState<UserRecord[]>([])
```

对象状态：

```ts
const [detail, setDetail] = useState<UserDetail | null>(null)
```

### 7.2 useRef 类型

DOM ref：

```ts
const inputRef = useRef<HTMLInputElement | null>(null)
```

定时器：

```ts
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
```

### 7.3 useMemo / useCallback 依赖完整

```ts
const queryParams = useMemo(() => {
  return {
    name: keyword.trim(),
    status,
  }
}, [keyword, status])
```

### 7.4 useEffect 异步请求竞态处理

```ts
useEffect(() => {
  let cancelled = false

  async function fetchData() {
    setLoading(true)

    try {
      const res = await getList()
      if (!cancelled) {
        setList(res.data ?? [])
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  fetchData()

  return () => {
    cancelled = true
  }
}, [])
```

## 8. API 类型规范

### 8.1 API 必须声明入参和返回值

```ts
export interface UserQueryParams {
  userName?: string
  status?: string
}

export interface UserRecord {
  id: string
  userName: string
  nickName?: string | null
}

export function getUserList(params: UserQueryParams) {
  return request.get<ApiResponse<PageResult<UserRecord>>>('/system/user/list', {
    params,
  })
}
```

### 8.2 API 调用前必须处理必填参数

```ts
if (!userId) {
  message.warning('缺少用户 ID')
  return
}

const res = await getUserDetail(userId)
```

### 8.3 API 响应消费必须防御空值

```ts
const list = res.data?.rows ?? []
const total = res.data?.total ?? 0
```

禁止：

```ts
setList(res.data.rows)
```

除非类型明确保证 `data` 和 `rows` 必然存在。

## 9. Ant Design 类型规范

### 9.1 Table 必须声明 record 类型

```tsx
import type { ColumnsType } from 'antd/es/table'

interface UserRecord {
  id: string
  userName: string
}

const columns: ColumnsType<UserRecord> = [
  {
    title: '用户名',
    dataIndex: 'userName',
  },
]

<Table<UserRecord>
  rowKey="id"
  columns={columns}
  dataSource={list}
/>
```

### 9.2 rowKey 必须稳定

```tsx
<Table rowKey="id" />
```

或：

```tsx
<Table rowKey={(record) => record.id} />
```

禁止使用 index 作为长期 rowKey。

### 9.3 Form 表单值需要定义类型

```ts
interface UserFormValues {
  userName?: string
  deptId?: string
}

const [form] = Form.useForm<UserFormValues>()
```

提交前 normalize：

```ts
const values = await form.validateFields()

const params: SaveUserParams = {
  userName: values.userName?.trim() ?? '',
  deptId: values.deptId ?? '',
}
```

### 9.4 Select 类型

```tsx
<Select<string>
  value={status}
  onChange={(value) => setStatus(value)}
/>
```

多选：

```tsx
<Select<string[]>
  mode="multiple"
  value={deptIds}
  onChange={(value) => setDeptIds(value)}
/>
```

### 9.5 Modal / Drawer 必须受控

```tsx
<Modal
  open={open}
  onCancel={handleClose}
/>
```

不使用旧版 `visible`，除非项目 Ant Design 版本仍然要求。

## 10. Zustand / Store 类型规范

### 10.1 Store 必须定义完整类型

```ts
interface AuthState {
  token: string | null
  permissions: string[]
  setToken: (token: string | null) => void
}
```

### 10.2 使用精确 selector

禁止：

```ts
const authStore = useAuthStore()
```

推荐：

```ts
const token = useAuthStore((state) => state.token)
const permissions = useAuthStore((state) => state.permissions)
```

### 10.3 Store nullable 字段必须保护

```ts
const token = useAuthStore((state) => state.token)

if (!token) {
  return null
}
```

## 11. DOM 属性透传规范

### 11.1 禁止非 DOM 属性直接透传

错误：

```tsx
<div {...props} />
```

如果 props 中包含：

```ts
closable
loading
customMode
```

可能导致 React Warning。

正确：

```tsx
const { closable, customMode, ...domProps } = props

return <div {...domProps} />
```

### 11.2 自定义组件 Props 和 DOM Props 分离

```tsx
interface AutoHideScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: 'horizontal' | 'vertical'
  hideDelay?: number
}

function AutoHideScroll({
  mode = 'vertical',
  hideDelay,
  className,
  ...divProps
}: AutoHideScrollProps) {
  return <div className={className} {...divProps} />
}
```

## 12. 类型守卫规范

### 12.1 字符串守卫

```ts
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
```

### 12.2 数组守卫

```ts
const list = Array.isArray(res.data) ? res.data : []
```

### 12.3 对象守卫

```ts
function isUserInfo(value: unknown): value is UserInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'userName' in value
  )
}
```

## 13. 泛型规范

### 13.1 request 泛型

```ts
request.get<ApiResponse<UserDetail>>('/system/user/1')
```

### 13.2 Table 泛型

```tsx
<Table<UserRecord> />
```

### 13.3 hooks 泛型

```ts
const [list, setList] = useState<UserRecord[]>([])
const map = useMemo<Record<string, DictItem[]>>(() => ({}), [])
```

### 13.4 工具函数泛型

```ts
function getOptionLabel<T extends { label: string; value: string }>(
  options: T[],
  value: string,
) {
  return options.find((item) => item.value === value)?.label ?? ''
}
```

## 14. 类型断言使用规范

### 允许场景

仅在以下场景允许类型断言：

1. 第三方库类型不完整，但业务能保证类型。
2. DOM API 返回值需要收窄。
3. JSON.parse 后立即进行类型守卫或 schema 校验。
4. 常量字面量收窄。

示例：

```ts
const status = 'enabled' as const
```

DOM：

```ts
const element = document.querySelector('#root')

if (element instanceof HTMLElement) {
  element.focus()
}
```

禁止：

```ts
const element = document.querySelector('#root') as HTMLElement
element.focus()
```

## 15. 修改前检查清单

修改前必须检查：

- [ ] 报错代码所在文件
- [ ] 当前变量的真实类型来源
- [ ] 是否来自 API 返回
- [ ] 是否来自路由参数
- [ ] 是否来自表单值
- [ ] 是否来自 Store
- [ ] 是否来自组件 Props
- [ ] 是否来自第三方组件事件
- [ ] 是否需要同步修改 types.ts
- [ ] 是否影响调用方
- [ ] 是否存在 nullable 字段
- [ ] 是否存在隐式 any
- [ ] 是否存在错误泛型推断

## 16. 修改后检查清单

修改后必须检查：

- [ ] 是否新增 any
- [ ] 是否新增 as any
- [ ] 是否新增 as string
- [ ] 是否新增非空断言 !
- [ ] 是否所有 nullable 字段都有处理
- [ ] 是否修复了类型来源，而不是只修复报错行
- [ ] 是否补全 Props 类型
- [ ] 是否补全 API 类型
- [ ] 是否补全 Table / Form 泛型
- [ ] 是否避免非 DOM 属性透传
- [ ] 是否运行 typecheck
- [ ] 是否运行 lint
- [ ] 是否运行 build

## 17. 修复 TypeScript 报错时的执行流程

Claude Code 修复类型问题时必须按以下流程执行：

### 第一步：收集错误

运行：

```bash
pnpm tsc --noEmit
```

如果项目有脚本：

```bash
pnpm typecheck
```

### 第二步：按错误类型归类

将错误分为：

```text
1. 空值错误
2. 参数类型错误
3. 对象属性缺失
4. API 类型错误
5. Props 类型错误
6. 泛型缺失
7. 第三方组件类型错误
8. DOM 属性透传错误
9. Store 类型错误
10. 构建配置或声明文件错误
```

### 第三步：从类型源头修复

优先修改：

```text
types.ts
api types
props interface
store type
form values type
table record type
utility function signature
```

再修改调用代码。

### 第四步：复查是否引入新风险

禁止用以下方式快速压错：

```ts
as any
as string
!
@ts-ignore
```

### 第五步：重新执行校验

```bash
pnpm tsc --noEmit
pnpm lint
pnpm build
```

## 18. 输出要求

每次完成代码修改后，Claude Code 必须回复：

```md
## 修改文件

- xxx
- xxx

## 修复内容

- 修复了 xxx 类型错误
- 补全了 xxx 类型定义
- 增加了 xxx 空值保护
- 调整了 xxx API 参数类型

## 类型安全说明

- 是否新增 any：否
- 是否新增 as any：否
- 是否新增非空断言：否
- nullable 字段是否已处理：是

## 校验结果

- pnpm tsc --noEmit：通过 / 未运行，原因是 xxx
- pnpm lint：通过 / 未运行，原因是 xxx
- pnpm build：通过 / 未运行，原因是 xxx

## 潜在风险

- 无
```

## 19. 特别要求

当用户要求“修复 TypeScript 类型问题”时，不允许只处理当前显示的一个报错。

必须：

1. 先运行 typecheck。
2. 收集全部 TypeScript 报错。
3. 按类型归类。
4. 分批修复。
5. 修复后再次 typecheck。
6. 如果还有错误，继续修复。
7. 直到 typecheck 通过，或说明剩余错误原因。

## 20. 禁止行为总结

禁止：

```ts
any
as any
as string
id!
props: any
record: any
// @ts-ignore
// @ts-expect-error
useState([])
<div {...props} />
request.get('/xxx') // 无返回类型
Table columns 不声明 record 类型
Form 不声明 values 类型
直接消费 res.data.xxx
直接调用可能为空的 id
```

允许：

```ts
类型守卫
空值合并
提前 return
补全 interface
补全泛型
修正 API 类型
修正 Props 类型
修正 Store 类型
normalize 表单参数
```
