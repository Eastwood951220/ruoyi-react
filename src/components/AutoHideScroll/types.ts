import type { CSSProperties, ReactNode } from 'react'
import type { ScrollDirection } from '@/hooks/useAutoHideScroll'

export type { ScrollDirection, ThumbState } from '@/hooks/useAutoHideScroll'

export interface AutoHideScrollProps {
	children: ReactNode
	className?: string
	style?: CSSProperties
	contentClassName?: string
	
	/**
	 * 滚动方向：
	 * vertical：纵向滚动
	 * horizontal：横向滚动
	 */
	direction?: ScrollDirection
	
	/**
	 * 停止滚动后隐藏 thumb 的延迟时间。
	 * 默认 800ms。
	 */
	hideDelay?: number
	
	/**
	 * thumb 最小尺寸。
	 * 默认 24px。
	 */
	minThumbSize?: number
}
