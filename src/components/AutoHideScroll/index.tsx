import {cn} from '@/utils/cn'
import styles from './index.module.css'
import type {AutoHideScrollProps} from './types'
import {useAutoHideScroll} from '@/hooks/useAutoHideScroll'

export function AutoHideScroll(props: AutoHideScrollProps) {
	const {
		children,
		className,
		style,
		contentClassName,
		direction = 'vertical',
		hideDelay,
		minThumbSize,
	} = props
	
	const {
		isScrolling,
		thumbVisible,
		thumbStyle,
		rootProps,
		scrollerProps,
		contentProps,
	} = useAutoHideScroll({
		direction,
		hideDelay,
		minThumbSize,
	})
	
	return (
		<div
			className={cn(
				styles.root,
				styles[direction],
				isScrolling && styles.isScrolling,
				className,
			)}
			style={style}
			{...rootProps}
		>
			<div className={styles.scroller} {...scrollerProps}>
				<div className={cn(styles.content, contentClassName)} {...contentProps}>
					{children}
				</div>
			</div>
			
			{thumbVisible && <div className={styles.thumb} style={thumbStyle}/>}
		</div>
	)
}

export default AutoHideScroll
