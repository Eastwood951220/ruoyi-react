import { useEffect, useMemo, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import type { Editor } from '@tiptap/react'
import styles from './index.module.less'

export interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  disabled?: boolean
}

// ---- 工具栏按钮定义 ----

type ToolbarAction = {
  key: string
  icon: string
  title: string
  action: (editor: Editor) => void
  isActive?: (editor: Editor) => boolean
}

const MARK_ACTIONS: ToolbarAction[] = [
  {
    key: 'bold',
    icon: 'B',
    title: '粗体',
    action: (e) => e.chain().focus().toggleBold().run(),
    isActive: (e) => e.isActive('bold'),
  },
  {
    key: 'italic',
    icon: 'I',
    title: '斜体',
    action: (e) => e.chain().focus().toggleItalic().run(),
    isActive: (e) => e.isActive('italic'),
  },
  {
    key: 'strike',
    icon: 'S',
    title: '删除线',
    action: (e) => e.chain().focus().toggleStrike().run(),
    isActive: (e) => e.isActive('strike'),
  },
  {
    key: 'code',
    icon: '</>',
    title: '行内代码',
    action: (e) => e.chain().focus().toggleCode().run(),
    isActive: (e) => e.isActive('code'),
  },
]

const BLOCK_ACTIONS: ToolbarAction[] = [
  {
    key: 'heading1',
    icon: 'H1',
    title: '一级标题',
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (e) => e.isActive('heading', { level: 1 }),
  },
  {
    key: 'heading2',
    icon: 'H2',
    title: '二级标题',
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e.isActive('heading', { level: 2 }),
  },
  {
    key: 'heading3',
    icon: 'H3',
    title: '三级标题',
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (e) => e.isActive('heading', { level: 3 }),
  },
  {
    key: 'bulletList',
    icon: '•',
    title: '无序列表',
    action: (e) => e.chain().focus().toggleBulletList().run(),
    isActive: (e) => e.isActive('bulletList'),
  },
  {
    key: 'orderedList',
    icon: '1.',
    title: '有序列表',
    action: (e) => e.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e.isActive('orderedList'),
  },
  {
    key: 'blockquote',
    icon: '"',
    title: '引用',
    action: (e) => e.chain().focus().toggleBlockquote().run(),
    isActive: (e) => e.isActive('blockquote'),
  },
  {
    key: 'codeBlock',
    icon: '{ }',
    title: '代码块',
    action: (e) => e.chain().focus().toggleCodeBlock().run(),
    isActive: (e) => e.isActive('codeBlock'),
  },
]

const HISTORY_ACTIONS: ToolbarAction[] = [
  {
    key: 'undo',
    icon: '↩',
    title: '撤销',
    action: (e) => e.chain().focus().undo().run(),
  },
  {
    key: 'redo',
    icon: '↪',
    title: '重做',
    action: (e) => e.chain().focus().redo().run(),
  },
]

// ---- 工具栏按钮组件 ----

interface ToolbarButtonProps {
  action: ToolbarAction
  editor: Editor
}

function ToolbarButton({ action, editor }: ToolbarButtonProps) {
  const isActive = action.isActive?.(editor) ?? false

  return (
    <button
      type="button"
      className={`${styles.toolbarButton} ${isActive ? styles.active : ''}`}
      title={action.title}
      onMouseDown={(e) => {
        e.preventDefault()
        action.action(editor)
      }}
    >
      {action.icon}
    </button>
  )
}

// ---- 主组件 ----

export default function RichTextEditor(props: RichTextEditorProps) {
  const {
    value = '',
    onChange,
    placeholder = '请输入内容...',
    minHeight = 200,
    maxHeight = 400,
    disabled = false,
  } = props

  // 防止受控模式下的光标跳动
  const lastValueRef = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({
        HTMLAttributes: { style: 'max-width: 100%; height: auto;' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      lastValueRef.current = html
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        style: `min-height: ${minHeight}px;`,
      },
    },
  })

  // 外部 value 变化时同步到编辑器
  useEffect(() => {
    if (!editor) return
    if (value === lastValueRef.current) return
    // 仅在外部值确实变化时才 setContent，避免光标跳动
    editor.commands.setContent(value, { emitUpdate: false })
    lastValueRef.current = value
  }, [editor, value])

  const contentStyle = useMemo(
    () => ({ maxHeight: `${maxHeight}px` }),
    [maxHeight],
  )

  if (!editor) return null

  return (
    <div className={styles.richTextEditor}>
      <div className={styles.toolbar}>
        {MARK_ACTIONS.map((action) => (
          <ToolbarButton key={action.key} action={action} editor={editor} />
        ))}
        <span className={styles.divider} />
        {BLOCK_ACTIONS.map((action) => (
          <ToolbarButton key={action.key} action={action} editor={editor} />
        ))}
        <span className={styles.divider} />
        {HISTORY_ACTIONS.map((action) => (
          <ToolbarButton key={action.key} action={action} editor={editor} />
        ))}
      </div>
      <div className={styles.content} style={contentStyle}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
