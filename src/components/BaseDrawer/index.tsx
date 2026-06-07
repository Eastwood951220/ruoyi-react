import type {DrawerProps} from 'antd'
import {Button, Drawer, Spin} from 'antd'
import type {ReactNode} from 'react'
import styles from './index.module.less'

export interface BaseDrawerProps {
	open: boolean
	title: string
	width?: number | string
	size?: 'default' | 'large'
	loading?: boolean
	confirmLoading?: boolean
	destroyOnHidden?: boolean
	maskClosable?: boolean
	onClose: () => void
	onConfirm?: () => void
	footer?: ReactNode | null
	children: ReactNode
	className?: string
	extra?: ReactNode
	afterOpenChange?: (open: boolean) => void
	drawerProps?: Omit<DrawerProps, 'open' | 'title' | 'width' | 'onClose' | 'destroyOnHidden' | 'maskClosable' | 'extra' | 'afterOpenChange'>
}

export default function BaseDrawer(props: BaseDrawerProps) {
	const {
		open,
		title,
		width = 560,
		size,
		loading = false,
		confirmLoading = false,
		destroyOnHidden = true,
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
			size={size ?? width}
			destroyOnHidden={destroyOnHidden}
			mask={maskClosable}
			onClose={onClose}
			className={className}
			extra={extra}
			afterOpenChange={afterOpenChange}
			footer={footer === null ? undefined : (footer ?? defaultFooter)}
			{...drawerProps}
		>
			{loading ? (
				<div className={styles.loadingWrapper}>
					<Spin/>
				</div>
			) : (
				children
			)}
		</Drawer>
	)
}
