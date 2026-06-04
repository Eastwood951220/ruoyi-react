import { useEffect, useMemo } from 'react'
import { Select } from 'antd'
import type { SelectProps } from 'antd'
import { useDictStore, type DictOption } from '@/store/useDictStore'
import styles from './index.module.less'

type SelectValue = string | number | Array<string | number>
type DictSelectValueType = 'string' | 'number'

type BaseSelectOption = {
  label: string
  value: string | number
}

export interface DictSelectProps extends Omit<SelectProps, 'options'> {
  dictType?: string
  options?: DictOption[]
  valueType?: DictSelectValueType
}

function transformOptionValue(
  option: DictOption,
  valueType: DictSelectValueType,
): BaseSelectOption {
  if (valueType === 'number') {
    const numericValue = Number(option.value)

    return {
      label: option.label,
      value: Number.isNaN(numericValue) ? option.value : numericValue,
    }
  }

  return {
    label: option.label,
    value: option.value,
  }
}

export default function DictSelect(props: DictSelectProps) {
  const {
    dictType,
    options,
    valueType = 'string',
    allowClear = true,
    placeholder = '请选择',
    className,
    ...selectProps
  } = props

  const loadDict = useDictStore((state) => state.loadDict)

  // 只订阅指定 dictType 的缓存值
  const cachedOptions = useDictStore(
    (state) => (dictType ? state.cache.get(dictType) : undefined),
  )

  useEffect(() => {
    if (!dictType || options) return
    if (cachedOptions) return

    void loadDict(dictType)
  }, [cachedOptions, dictType, loadDict, options])

  const selectOptions = useMemo(() => {
    const dictOptions = options ?? cachedOptions ?? []
    return dictOptions.map((item) => transformOptionValue(item, valueType))
  }, [cachedOptions, options, valueType])

  // 空字符串视为未选中，确保 placeholder 正常显示
  const normalizedValue = selectProps.value === '' ? undefined : selectProps.value

  return (
    <Select<SelectValue>
      {...selectProps}
      value={normalizedValue}
      allowClear={allowClear}
      placeholder={placeholder}
      options={selectOptions}
      className={[styles.dictSelect, className].filter(Boolean).join(' ')}
    />
  )
}
