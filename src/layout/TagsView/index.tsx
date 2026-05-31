import React from "react";
import {CloseCircleOutlined, CloseOutlined, ReloadOutlined, RollbackOutlined,} from '@ant-design/icons'
import {AutoHideScroll} from '@/components/AutoHideScroll'
import {usePermissionStore} from '@/store/usePermissionStore'
import {useTagsViewStore} from '@/store/useTagsViewStore'
import {flattenAffixRoutes, getFullPath, getTagTitle, matchRoute} from '@/routes/routeUtils'
import type {TagView} from '@/routes/types'
import styles from './TagsView.module.less'

type TagsViewProps = {
	darkMode?: boolean
}

type ContextMenuState = {
	visible: boolean
	left: number
	top: number
	selectedTag?: TagView
}

export function TagsView({darkMode}: TagsViewProps) {
	const navigate = useNavigate()
	const routerState = useRouterState()
	const pathname = routerState.location.pathname
	const searchStr = routerState.location.searchStr ?? ''
	const searchParams = useMemo(() => new URLSearchParams(searchStr), [searchStr])
	
	const visitedViews = useTagsViewStore((state) => state.visitedViews)
	const addVisitedView = useTagsViewStore((state) => state.addVisitedView)
	const removeSelectedView = useTagsViewStore((state) => state.removeSelectedView)
	const removeOtherViews = useTagsViewStore((state) => state.removeOtherViews)
	const removeLeftViews = useTagsViewStore((state) => state.removeLeftViews)
	const removeRightViews = useTagsViewStore((state) => state.removeRightViews)
	const removeAllViews = useTagsViewStore((state) => state.removeAllViews)
	
	const allRoutes = usePermissionStore((state) => state.dynamicRoutes)
	
	const affixInitialized = useRef(false)
	
	const [contextMenu, setContextMenu] = useState<ContextMenuState>({
		visible: false,
		left: 0,
		top: 0,
	})
	
	const fullPath = getFullPath(pathname, searchStr)
	const isActive = useCallback((view: TagView) => view.fullPath === fullPath, [fullPath])
	
	// ---- Affix 标签初始化 ----
	useEffect(() => {
		if (affixInitialized.current) return
		if (allRoutes.length === 0) return
		
		const affixTags = flattenAffixRoutes(allRoutes)
		for (const tag of affixTags) {
			addVisitedView(tag)
		}
		affixInitialized.current = true
	}, [allRoutes, addVisitedView])
	
	// ---- 路由变化时自动添加/更新当前标签 ----
	useEffect(() => {
		const matched = matchRoute(pathname, allRoutes)
		const title = getTagTitle(matched?.meta, searchParams, '首页')
		
		const view: TagView = {
			path: pathname,
			fullPath,
			title,
			meta: matched?.meta,
			query: searchStr ? Object.fromEntries(searchParams) : undefined,
			closable: pathname !== '/' && !matched?.meta?.affix,
		}
		addVisitedView(view)
	}, [pathname, fullPath, searchStr, allRoutes, searchParams, addVisitedView])
	
	// ---- 关闭右键菜单 ----
	const closeContextMenu = useCallback(() => {
		setContextMenu((prev) => (prev.visible ? {...prev, visible: false} : prev))
	}, [])
	
	useEffect(() => {
		const handleClick = () => closeContextMenu()
		document.addEventListener('click', handleClick)
		return () => document.removeEventListener('click', handleClick)
	}, [closeContextMenu])
	
	// ---- 关闭标签后跳转（保留 query 参数） ----
	const navigateAfterClose = useCallback(
		(views: TagView[]) => {
			if (views.some((v) => v.fullPath === fullPath)) return
			
			const last = views.at(-1)
			void navigate({to: last?.fullPath ?? '/'})
		},
		[fullPath, navigate],
	)
	
	// ---- 关闭当前标签 ----
	const handleClose = useCallback(
		(tag: TagView, e?: React.MouseEvent) => {
			e?.stopPropagation()
			if (tag.closable === false) return
			
			const nextViews = removeSelectedView(tag)
			navigateAfterClose(nextViews)
		},
		[removeSelectedView, navigateAfterClose],
	)
	
	// ---- 中键关闭 ----
	const handleMouseDown = useCallback(
		(tag: TagView, e: React.MouseEvent) => {
			if (e.button === 1 && tag.closable !== false) {
				e.preventDefault()
				const nextViews = removeSelectedView(tag)
				navigateAfterClose(nextViews)
			}
		},
		[removeSelectedView, navigateAfterClose],
	)
	
	// ---- 右键菜单（使用 fixed 定位，避免被 overflow: hidden 裁剪） ----
	const handleContextMenu = useCallback((tag: TagView, e: React.MouseEvent) => {
		e.preventDefault()
		
		// 确保菜单不超出视口
		const menuWidth = 140
		const menuHeight = 260
		const left = e.clientX + menuWidth > window.innerWidth
			? window.innerWidth - menuWidth - 8
			: e.clientX
		const top = e.clientY + menuHeight > window.innerHeight
			? window.innerHeight - menuHeight - 8
			: e.clientY
		
		setContextMenu({
			visible: true,
			left: Math.max(0, left),
			top: Math.max(0, top),
			selectedTag: tag,
		})
	}, [])
	
	// ---- 刷新当前页 ----
	const handleRefresh = useCallback(() => {
		closeContextMenu()
		void navigate({to: fullPath, replace: true})
	}, [closeContextMenu, navigate, fullPath])
	
	// ---- 关闭当前（右键菜单） ----
	const handleCloseCurrent = useCallback(() => {
		closeContextMenu()
		const tag = contextMenu.selectedTag
		if (!tag || tag.closable === false) return
		
		const nextViews = removeSelectedView(tag)
		navigateAfterClose(nextViews)
	}, [closeContextMenu, contextMenu.selectedTag, removeSelectedView, navigateAfterClose])
	
	// ---- 关闭其他 ----
	const handleCloseOthers = useCallback(() => {
		closeContextMenu()
		const tag = contextMenu.selectedTag
		if (!tag) return
		
		const nextViews = removeOtherViews(tag)
		navigateAfterClose(nextViews)
	}, [closeContextMenu, contextMenu.selectedTag, removeOtherViews, navigateAfterClose])
	
	// ---- 关闭左侧 ----
	const handleCloseLeft = useCallback(() => {
		closeContextMenu()
		const tag = contextMenu.selectedTag
		if (!tag) return
		
		const nextViews = removeLeftViews(tag)
		navigateAfterClose(nextViews)
	}, [closeContextMenu, contextMenu.selectedTag, removeLeftViews, navigateAfterClose])
	
	// ---- 关闭右侧 ----
	const handleCloseRight = useCallback(() => {
		closeContextMenu()
		const tag = contextMenu.selectedTag
		if (!tag) return
		
		const nextViews = removeRightViews(tag)
		navigateAfterClose(nextViews)
	}, [closeContextMenu, contextMenu.selectedTag, removeRightViews, navigateAfterClose])
	
	// ---- 全部关闭 ----
	const handleCloseAll = useCallback(() => {
		closeContextMenu()
		const nextViews = removeAllViews()
		navigateAfterClose(nextViews)
	}, [closeContextMenu, removeAllViews, navigateAfterClose])
	
	// ---- 判断菜单项是否可用 ----
	const selectedTag = contextMenu.selectedTag
	const selectedIndex = selectedTag
		? visitedViews.findIndex((v) => v.fullPath === selectedTag.fullPath)
		: -1
	const isFirst = selectedIndex <= 0
	const isLast = selectedIndex === visitedViews.length - 1
	const isOnly = visitedViews.filter((v) => v.closable !== false).length <= 1
	const isSelectedAffix = selectedTag?.closable === false
	
	return (
		<>
			<div
				className={darkMode ? `${styles.tagsView} ${styles.dark}` : styles.tagsView}
			>
				<AutoHideScroll direction="horizontal" className={styles.scrollContent}>
					<div className={styles.tagsInner}>
						{visitedViews.map((view) => (
							<span
								key={view.fullPath}
								data-path={view.path}
								data-full-path={view.fullPath}
								className={`${styles.tag} ${isActive(view) ? styles.active : ''} ${view.closable === false ? styles.affix : ''}`}
								onClick={() => void navigate({to: view.fullPath})}
								onMouseDown={(e) => handleMouseDown(view, e)}
								onContextMenu={(e) => handleContextMenu(view, e)}>
								{isActive(view) ? (
	                                <span className={styles.dot}/>
                                ) : null}
								<span className={styles.tagTitle}>{view.title}</span>
								{view.closable !== false && (
									<CloseOutlined
										className={styles.closeIcon}
										onClick={(e) => handleClose(view, e)}
									/>
								)}
                            </span>
						))}
					</div>
				</AutoHideScroll>
			</div>
			
			{/* 右键菜单使用 fixed 定位，渲染在 body 层级，不被 overflow: hidden 裁剪 */}
			{contextMenu.visible && selectedTag && (
				<div
					className={styles.contextMenu}
					style={{position: 'fixed', left: contextMenu.left, top: contextMenu.top}}>
					<div className={styles.menuItem} onClick={handleRefresh}>
						<ReloadOutlined/> 刷新页面
					</div>
					<div className={styles.menuDivider}/>
					<div
						className={`${styles.menuItem} ${isSelectedAffix ? styles.disabled : ''}`}
						onClick={isSelectedAffix ? undefined : handleCloseCurrent}>
						<CloseOutlined/> 关闭当前
					</div>
					<div
						className={`${styles.menuItem} ${isOnly ? styles.disabled : ''}`}
						onClick={isOnly ? undefined : handleCloseOthers}>
						<CloseCircleOutlined/> 关闭其他
					</div>
					<div
						className={`${styles.menuItem} ${isFirst ? styles.disabled : ''}`}
						onClick={isFirst ? undefined : handleCloseLeft}>
						<RollbackOutlined/> 关闭左侧
					</div>
					<div
						className={`${styles.menuItem} ${isLast ? styles.disabled : ''}`}
						onClick={isLast ? undefined : handleCloseRight}>
						<RollbackOutlined className={styles.flipX}/> 关闭右侧
					</div>
					<div className={styles.menuDivider}/>
					<div
						className={`${styles.menuItem} ${isOnly ? styles.disabled : ''}`}
						onClick={isOnly ? undefined : handleCloseAll}>
						<CloseCircleOutlined/> 全部关闭
					</div>
				</div>
			)}
		</>
	)
}
