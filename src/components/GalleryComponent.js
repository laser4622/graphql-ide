import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'
import { QueriesStore } from '../store/queriesStore'
import { useToasts } from 'react-toast-notifications'
import QueryBuilder from './Gallery/QueryBuilder/index'
import { makeDefaultArg, getDefaultScalarArgValue } from "./Gallery/QueryBuilder/CustomArgs"

const GalleryComponent = observer(function GalleryComponent() {
	const { currentQuery,updateQuery, schema } = QueriesStore
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

	// const [url, setUrl] = useState(QueriesStore.currentQuery.endpoint_url)

	return (
		<div className={'gallery flex flex-col active'} >
			{/*<div style={{margin: '0 4px'}}>*/}
			{/*	<input*/}
			{/*		placeholder="URL"*/}
			{/*		value={url}*/}
			{/*		onChange={(e) => setUrl(e.target.value)}*/}
			{/*		style={{marginRight: 4, width: '80%'}}*/}
			{/*	/>*/}
			{/*	<button onClick={()=>{*/}
			{/*		QueriesStore.updateQuery({endpoint_url: url}, 0)*/}

			{/*	}}>Set</button>*/}


			{/*</div>*/}
			<QueryBuilder
				width={'300px'}
				minWidth={'300px'}
				title={'Builder'}
				schema={schema}
				query={currentQuery.query}
				onEdit={query=>updateQuery({query}, 0)}
				explorerIsOpen={true}
				getDefaultScalarArgValue={getDefaultScalarArgValue}
				makeDefaultArg={makeDefaultArg}
			/>
		</div>
	)
})

export default GalleryComponent
