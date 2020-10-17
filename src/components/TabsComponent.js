import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'
import tabsStore from '../store/tabsStore'

const TabsComponent = observer(() => {
	const { tabs, currentTab, switchTab, removeTab, addNewTab, setCurrentTab } = tabsStore

	return (
		<div className="tabs">
			<ul>
				{
					tabs.map((tab, i) => (
						<li 
							className={(currentTab == tab ? 'active' : '')} key={i}
							onClick={() => switchTab(tab)}
						>
							{ tab }
							<span 
								className="tab__close"
								onClick={(e) => removeTab(i, e)}
							/> 
						</li>
					))
				}
				<li 
					className="tabs__add"
					onClick={addNewTab}
				><span className="tab__add" /></li>
			</ul>
		</div>
	)
})

export default TabsComponent
