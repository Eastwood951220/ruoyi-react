import type {ModalProps} from 'antd'
import {Button, Modal, Spin} from 'antd'
import type {ReactNode} from 'react'
import styles from './index.module.less'

export interface BaseModalProps {
	open: boolean
	title: string
	width?: number | string
	loading?: boolean
	confirmLoading?: boolean
	destroyOnHidden?: boolean
	maskClosable?: boolean
	onClose: () => void
	onConfirm?: () => void
	footer?: ReactNode | null
	children: ReactNode
	className?: string
	modalProps?: Omit<ModalProps, 'open' | 'title' | 'width' | 'onCancel' | 'destroyOnHidden' | 'maskClosable' | 'footer'>
}

export default function BaseModal(props: BaseModalProps) {
	const {
		open,
		title,
		width = 520,
		loading = false,
		confirmLoading = false,
		destroyOnHidden = true,
		maskClosable = false,
		onClose,
		onConfirm,
		footer,
		children,
		className,
		modalProps,
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
		<Modal
			open={open}
			title={title}
			width={width}
			destroyOnHidden={destroyOnHidden}
			maskClosable={maskClosable}
			onCancel={onClose}
			className={className}
			footer={footer === null ? undefined : (footer ?? defaultFooter)}
			{...modalProps}
		>
			{loading ? (
				<div className={styles.loadingWrapper}>
					<Spin/>
				</div>
			) : (
				children
			)}
		</Modal>
	)
}
