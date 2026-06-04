import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { FormInstance } from 'antd'

export type TableListPageParams = {
  pageNum: number
  pageSize: number
}

export type TableListResult<T> = {
  rows?: T[]
  list?: T[]
  data?: T[]
  total?: number
}

export type UseTableListOptions<T, F extends object, P extends object> = {
  form: FormInstance<F>
  request: (params: P & TableListPageParams) => Promise<TableListResult<T>>
  buildParams: (formValues: F) => P
  defaultPageSize?: number
  immediate?: boolean
  reloadKey?: string | number | boolean | null
  transformRows?: (rows: T[], response: TableListResult<T>) => T[]
  onSuccess?: (rows: T[], response: TableListResult<T>) => void
}

export function useTableList<T, F extends object, P extends object>(
  options: UseTableListOptions<T, F, P>,
) {
  const [initialConfig] = useState(() => ({
    defaultPageSize: options.defaultPageSize ?? 10,
    immediate: options.immediate ?? true,
  }))
  const optionsRef = useRef(options)

  const mountedRef = useRef(false)
  const requestSeqRef = useRef(0)
  const reloadKeyRef = useRef(options.reloadKey)
  const pageStateRef = useRef({
    pageNum: 1,
    pageSize: initialConfig.defaultPageSize,
  })

  const [dataList, setDataList] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(initialConfig.immediate)
  const [pageNum, setPageNumState] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialConfig.defaultPageSize)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const setPageNum: Dispatch<SetStateAction<number>> = useCallback((value) => {
    setPageNumState((previous) => {
      const next = typeof value === 'function' ? value(previous) : value
      pageStateRef.current = {
        ...pageStateRef.current,
        pageNum: next,
      }
      return next
    })
  }, [])

  const setPageSize: Dispatch<SetStateAction<number>> = useCallback((value) => {
    setPageSizeState((previous) => {
      const next = typeof value === 'function' ? value(previous) : value
      pageStateRef.current = {
        ...pageStateRef.current,
        pageSize: next,
      }
      return next
    })
  }, [])

  const setPagination = useCallback((nextPageNum: number, nextPageSize: number) => {
    pageStateRef.current = {
      pageNum: nextPageNum,
      pageSize: nextPageSize,
    }
    setPageNumState(nextPageNum)
    setPageSizeState(nextPageSize)
  }, [])

  const fetchList = useCallback(async (
    nextPageNum = pageStateRef.current.pageNum,
    nextPageSize = pageStateRef.current.pageSize,
    paramOverrides?: Partial<P>,
  ) => {
    const requestSeq = requestSeqRef.current + 1
    requestSeqRef.current = requestSeq

    if (mountedRef.current) {
      setLoading(true)
    }

    try {
      const { form, request, buildParams, transformRows, onSuccess } = optionsRef.current
      const formValues = form.getFieldsValue()
      const queryParams = buildParams(formValues)
      const requestParams: P & TableListPageParams = {
        ...queryParams,
        ...paramOverrides,
        pageNum: nextPageNum,
        pageSize: nextPageSize,
      }
      const response = await request(requestParams)

      if (!mountedRef.current || requestSeq !== requestSeqRef.current) return

      const rows = response.rows ?? response.list ?? response.data ?? []
      const nextRows = transformRows ? transformRows(rows, response) : rows
      setDataList(nextRows)
      setTotal(response.total ?? nextRows.length)
      onSuccess?.(nextRows, response)
    } catch {
      // The request layer owns user-facing error messages.
    } finally {
      if (mountedRef.current && requestSeq === requestSeqRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    let timer: number | undefined
    if (initialConfig.immediate) {
      timer = window.setTimeout(() => {
        void fetchList(1, initialConfig.defaultPageSize)
      }, 0)
    }

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer)
      }
      mountedRef.current = false
      requestSeqRef.current += 1
    }
  }, [fetchList, initialConfig.defaultPageSize, initialConfig.immediate])

  useEffect(() => {
    if (reloadKeyRef.current === options.reloadKey) return
    reloadKeyRef.current = options.reloadKey
    if (!mountedRef.current) return

    const timer = window.setTimeout(() => {
      setPagination(1, pageStateRef.current.pageSize)
      void fetchList(1, pageStateRef.current.pageSize)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [fetchList, options.reloadKey, setPagination])

  const search = useCallback((paramOverrides?: Partial<P>) => {
    setPagination(1, pageStateRef.current.pageSize)
    void fetchList(1, pageStateRef.current.pageSize, paramOverrides)
  }, [fetchList, setPagination])

  const reset = useCallback((paramOverrides?: Partial<P>) => {
    optionsRef.current.form.resetFields()
    setPagination(1, pageStateRef.current.pageSize)
    void fetchList(1, pageStateRef.current.pageSize, paramOverrides)
  }, [fetchList, setPagination])

  const refresh = useCallback((paramOverrides?: Partial<P>) => {
    void fetchList(pageStateRef.current.pageNum, pageStateRef.current.pageSize, paramOverrides)
  }, [fetchList])

  const changePage = useCallback((
    nextPageNum: number,
    nextPageSize: number,
    paramOverrides?: Partial<P>,
  ) => {
    setPagination(nextPageNum, nextPageSize)
    void fetchList(nextPageNum, nextPageSize, paramOverrides)
  }, [fetchList, setPagination])

  return {
    dataList,
    total,
    loading,
    pageNum,
    pageSize,
    setDataList,
    setTotal,
    setPageNum,
    setPageSize,
    search,
    reset,
    refresh,
    changePage,
    fetchList,
  }
}
