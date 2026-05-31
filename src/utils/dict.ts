import type { DictOption } from '@/store/useDictStore'

export function getDictOption(
  options: DictOption[],
  value?: string | number | null,
): DictOption | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return options.find((item) => item.value === String(value))
}

export function getDictLabel(
  options: DictOption[],
  value?: string | number | null,
  fallback = '',
): string {
  return getDictOption(options, value)?.label ?? fallback
}

export function normalizeDictValues(
  value?: string | number | Array<string | number> | null,
  separator = ',',
): string[] {
  if (value === undefined || value === null || value === '') {
    return []
  }

  if (Array.isArray(value)) {
    return value.map(String)
  }

  return String(value)
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean)
}
