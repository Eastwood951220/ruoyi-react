import { useMemo } from 'react'
import { Button, Checkbox, Tooltip } from 'antd'
import { HolderOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import styles from './index.module.less'

export interface ColumnSettingItem {
  key: string
  title: string
  visible: boolean
  order: number
  disabled: boolean
}

interface ColumnSettingProps {
  items: ColumnSettingItem[]
  onToggleVisible: (key: string) => void
  onReorder: (oldIndex: number, newIndex: number) => void
  onReset: () => void
}

// ---- 可排序行 ----

interface SortableRowProps {
  item: ColumnSettingItem
  onToggleVisible: (key: string) => void
}

function SortableRow({ item, onToggleVisible }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={styles.columnSettingItem}>
      <div className={styles.columnSettingLeft}>
        <Tooltip title="拖动排序" placement="left">
          <HolderOutlined className={styles.dragHandle} {...attributes} {...listeners} />
        </Tooltip>
        <Checkbox
          checked={item.visible}
          disabled={item.disabled}
          onChange={() => onToggleVisible(item.key)}
        />
        <span className={styles.columnSettingLabel}>{item.title}</span>
      </div>
    </div>
  )
}

// ---- ColumnSetting 组件 ----

export default function ColumnSetting({ items, onToggleVisible, onReorder, onReset }: ColumnSettingProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((s) => s.key === active.id)
    const newIndex = items.findIndex((s) => s.key === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex)
    }
  }

  const itemKeys = useMemo(() => items.map((s) => s.key), [items])

  return (
    <div className={styles.columnSettingPopover}>
      <div className={styles.columnSettingHeader}>
        <span className={styles.columnSettingTitle}>列设置</span>
        <Button size="small" icon={<ReloadOutlined />} onClick={onReset}>
          重置
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemKeys} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableRow key={item.key} item={item} onToggleVisible={onToggleVisible} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}
