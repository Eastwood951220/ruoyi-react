import { useMemo, useState } from 'react'
import { Input, Popover, Tooltip } from 'antd'
import SvgIcon from '@/components/SvgIcon'

interface IconSelectProps {
  value?: string
  onChange?: (value: string) => void
}

const iconModules = import.meta.glob('/src/assets/icons/svg/*.svg', { eager: false })
const iconNames = Object.keys(iconModules)
  .map((path) => path.split('/').pop()?.replace('.svg', '') ?? '')
  .filter(Boolean)
  .sort()

export default function IconSelect(props: IconSelectProps) {
  const { value = '', onChange } = props
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const filteredIcons = useMemo(() => {
    if (!filter) return iconNames
    return iconNames.filter((name) => name.includes(filter))
  }, [filter])

  const handleSelect = (name: string) => {
    onChange?.(name)
    setOpen(false)
  }

  const content = (
    <div style={{ width: 400 }}>
      <Input
        placeholder="搜索图标"
        allowClear
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <div style={{ maxHeight: '40vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {filteredIcons.map((name) => (
            <Tooltip key={name} title={name} placement="bottom">
              <div
                onClick={() => handleSelect(name)}
                style={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: value === name ? '2px solid var(--ant-color-primary)' : '1px solid #d9d9d9',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 20,
                  transition: 'all 0.2s',
                }}
              >
                <SvgIcon name={name} />
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Input
        value={value}
        readOnly
        placeholder="点击选择图标"
        style={{ cursor: 'pointer' }}
        addonBefore={value ? <SvgIcon name={value} /> : undefined}
        suffix={<span style={{ color: '#999' }}>{open ? '▲' : '▼'}</span>}
      />
    </Popover>
  )
}
