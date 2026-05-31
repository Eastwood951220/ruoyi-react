import {BulbOutlined, MoonOutlined} from '@ant-design/icons'
import {Switch} from 'antd'
import {useThemeViewTransition} from '@/hooks/useThemeViewTransition'
import {useThemeStore} from '@/store/useThemeStore'
import {cn} from '@/utils/cn'
import styles from './index.module.less'

export type ThemeModeToggleProps = {
	className?: string
	variant?: 'header' | 'login'
	size?: 'small' | 'middle'
}

export function ThemeModeToggle({className, variant = 'header', size = 'middle'}: ThemeModeToggleProps) {
	const darkMode = useThemeStore((state) => state.darkMode)
	const toggleMode = useThemeStore((state) => state.toggleMode)
	const {runTransition, transitioning, triggerRef} = useThemeViewTransition({
		toggleTheme: toggleMode,
	})
	
	return (
		<div
			ref={triggerRef}
			className={cn(styles.toggleWrap, styles[variant], className)}>
			{variant === 'login' ? (<span className={styles.label}>{darkMode ? '深色模式' : '浅色模式'}</span>) : null}
			<Switch
				aria-label="切换明暗模式"
				checked={darkMode}
				checkedChildren={<MoonOutlined/>}
				disabled={transitioning}
				loading={transitioning}
				size={size}
				unCheckedChildren={<BulbOutlined/>}
				onChange={runTransition}
			/>
		</div>
	)
}
