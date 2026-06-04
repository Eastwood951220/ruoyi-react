import type { ReactNode } from 'react'
import { Tag } from 'antd'
import type { DictOption } from '@/store/useDictStore'
import { normalizeDictValues } from '@/utils/dict'
import styles from './index.module.less'

export interface DictTagProps {
  options: DictOption[]
  value?: string | number | Array<string | number> | null
  separator?: string
  fallback?: ReactNode
  showUnknown?: boolean
}

const colorMap: Record<string, string> = {
  default: 'default',
  primary: 'blue',
  success: 'green',
  info: 'cyan',
  warning: 'orange',
  danger: 'red',
}

function getTagColor(option: DictOption): string | undefined {
  if (!option.listClass) return undefined
  return colorMap[option.listClass] ?? option.listClass
}

export default function DictTag(props: DictTagProps) {
  const {
    options,
    value,
    separator = ',',
    fallback = null,
    showUnknown = true,
  } = props

  const values = normalizeDictValues(value, separator)

  if (!values.length) {
    return <>{fallback}</>
  }

  return (
    <span className={styles.dictTagGroup}>
      {values.map((itemValue) => {
        const option = options.find((item) => item.value === itemValue)

        if (!option) {
          if (!showUnknown) return null

          return (
            <Tag key={itemValue} className={styles.dictTag}>
              {itemValue}
            </Tag>
          )
        }

        return (
          <Tag
            key={itemValue}
            color={getTagColor(option)}
            className={styles.dictTag}
          >
            {option.label}
          </Tag>
        )
      })}
    </span>
  )
}
