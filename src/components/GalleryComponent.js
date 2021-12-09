import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'
import { QueriesStore, TabsStore } from '../store/queriesStore'
import QueriesComponent from './Gallery/QueriesComponent'
import { useToasts } from 'react-toast-notifications'
import QueryBuilder from './Gallery/QueryBuilder/index'
import { getAllQueries } from '../api/api'
import { makeDefaultArg, getDefaultScalarArgValue } from "./Gallery/QueryBuilder/CustomArgs"

const GalleryComponent = observer(function GalleryComponent() {
	const [allQueries, setAllQueries] = useState([])
	const [myQueries, setMyQueries] = useState([])
	const [dashboardQueries, setDashboardQueries] = useState([])
	const [showAllQueries, toggleQueries] = useState(false)
	const [showBuilder, toggleBuilder] = useState(true)
	const { currentQuery, showSideBar,
		toggleSideBar, setSharedQueires, setQueryIsTransfered,
		queryJustSaved, updateQuery, schema } = QueriesStore
	const { index } = TabsStore
	const { addToast } = useToasts()

	useEffect(() => {
		const handler = () => addToast((
			<a href="https://bitquery.io/blog/blockchain-graphql-query" target="_blank" rel="noopener noreferrer">
				Create your first GraphQL Query
			</a>), 
			{
				appearance: 'info'
			})
		window.addEventListener('unauth', handler)
		return () => window.removeEventListener('unauth', handler)
	}, [addToast])

	
	let component = null
	if (showBuilder) {
		component = (
			<QueryBuilder
				width={'300px'}
				minWidth={'300px'}
				title={'Builder'}
				schema={schema}
				query={currentQuery.query}
				onEdit={query=>updateQuery({query}, index)}
				explorerIsOpen={showBuilder}
				onToggleExplorer={toggleSideBar}
				onToggleSideBar={toggleSideBar}
				getDefaultScalarArgValue={getDefaultScalarArgValue}
				makeDefaultArg={makeDefaultArg}
			/>
	)} else if (currentQuery.layout) {
		component = (
			<ul className="list-group">
				<QueriesComponent queries={dashboardQueries} />
			</ul>
	)} else if (showAllQueries) {
		component = (
			<ul className="list-group">
				<QueriesComponent queries={allQueries} />
			</ul>
	)} else {
		component = (
			<ul className="list-group">
				<QueriesComponent queries={myQueries} />
			</ul>
	)}
	const [url, setUrl] = useState(QueriesStore.currentQuery.endpoint_url)

	return (
		<div className={'gallery flex flex-col active'} >
			<div style={{margin: '0 4px'}}>
				<input
					placeholder="URL"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					style={{marginRight: 4, width: '80%'}}
				/>
				<button onClick={()=>{
					QueriesStore.updateQuery({endpoint_url: url}, 0)

				}}>Set</button>


			</div>
			{ component }
		</div>
	)
})

export default GalleryComponent
