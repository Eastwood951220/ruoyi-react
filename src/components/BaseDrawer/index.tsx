import { Button, Drawer, Spin } from 'antd'
import type { DrawerProps } from 'antd'
import type { ReactNode } from 'react'
import styles from './index.module.less'

export interface BaseDrawerProps {
  open: boolean
  title: string
  width?: number | string
  loading?: boolean
  confirmLoading?: boolean
  destroyOnClose?: boolean
  maskClosable?: boolean
  onClose: () => void
  onConfirm?: () => void
  footer?: ReactNode | null
  children: ReactNode
  className?: string
  extra?: ReactNode
  afterOpenChange?: (open: boolean) => void
  drawerProps?: Omit<DrawerProps, 'open' | 'title' | 'width' | 'onClose' | 'destroyOnClose' | 'maskClosable' | 'extra' | 'afterOpenChange'>
}

export default function BaseDrawer(props: BaseDrawerProps) {
  const {
    open,
    title,
    width = 560,
    loading = false,
    confirmLoading = false,
    destroyOnClose = true,
    maskClosable = false,
    onClose,
    onConfirm,
    footer,
    children,
    className,
    extra,
    afterOpenChange,
    drawerProps,
  } = props

  const defaultFooter = (
    <div className={styles.footer}>
      <Button onClick={onClose}>取消</Button>
      {onConfirm && (
        <Button type="primary" loading={confirmLoading} onClick={onConfirm}>
          确定
        </Button>
      )}
    </div>
  )

  return (
    <Drawer
      open={open}
      title={title}
      width={width}
      destroyOnClose={destroyOnClose}
      maskClosable={maskClosable}
      onClose={onClose}
      className={className}
      extra={extra}
      afterOpenChange={afterOpenChange}
      footer={footer === null ? undefined : (footer ?? defaultFooter)}
      {...drawerProps}
    >
      {loading ? (
        <div className={styles.loadingWrapper}>
          <Spin />
        </div>
      ) : (
        children
      )}
    </Drawer>
  )
}
