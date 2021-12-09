import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { observer } from 'mobx-react-lite'
import { toJS } from 'mobx'
import ReactTooltip from 'react-tooltip'
import PlayIcon from './icons/PlayIcon.js'
import ErrorIcon from './icons/ErrorIcon.js'
import { vegaPlugins } from 'vega-widgets'
import { tablePlugin } from 'table-widget'
import { graphPlugins } from '@bitquery/ide-graph'
import { timeChartPlugins } from '@bitquery/ide-charts'
import { tradingView } from '@bitquery/ide-tradingview'
import './bitqueditor/App.scss'
import '@bitquery/ide-graph/dist/graphs.min.css'
import getQueryFacts from '../utils/getQueryFacts'
import GraphqlEditor from './bitqueditor/components/GraphqlEditor'
import { 
	visitWithTypeInfo,
	TypeInfo} from 'graphql'
import { visit } from 'graphql/language/visitor'
import { parse as parseGql } from 'graphql/language'
import JsonPlugin from './bitqueditor/components/JsonWidget'
import ToolbarComponent from './bitqueditor/components/ToolbarComponent'
import { TabsStore, QueriesStore } from '../store/queriesStore'
import QueryErrorIndicator from './QueryErrorIndicator'
import { getValueFrom, getLeft, getTop } from '../utils/common'
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
import Loader from "react-loader-spinner"
import { DocExplorer } from './DocExplorer'
import { getIntrospectionQuery, buildClientSchema } from 'graphql'
import useDebounce from '../utils/useDebounce'
import { flattenData } from './flattenData.js'


const EditorInstance = observer(function EditorInstance({number})  {
	const { tabs, currentTab, index, jsonMode, codeMode } = TabsStore
	const { query, updateQuery, currentQuery, isMobile,
		setMobile, showSideBar, schema, setSchema, isLoaded } = QueriesStore
	const [docExplorerOpen, toggleDocExplorer] = useState(false)
	const [_variableToType, _setVariableToType] = useState(null)
	const [loading, setLoading] = useState(false)
	const [errorLoading, setErrorLoading] = useState(false)
	const [queryTypes, setQueryTypes] = useState('')
	const [dataSource, setDataSource] = useState({})
	const [accordance, setAccordance] = useState(true)
	const debouncedURL = useDebounce(currentQuery.endpoint_url, 500)
	const workspace = useRef(null)
	const overwrap = useRef(null)
	const executeButton = useRef(null)
	const queryEditor = useRef(null)
	const variablesEditor = useRef(null)
	const widgetDisplay = useRef(null)

	useEffect(() => {
		if (currentTab === tabs[number].id) window.dispatchEvent(new Event('resize'))
	}, [currentTab, tabs, number])
	const setupExecButtonPosition = () => {
		let execButt = workspace.current.offsetWidth / overwrap.current.offsetWidth
		executeButton.current.setAttribute('style', `left: calc(${execButt*100}% - 25px);`)
		window.dispatchEvent(new Event('resize'))
	}
	
	const handleResizer = e => {
		if (e.target && e.target.tagName) { 
			if (e.target.tagName === 'IMG') return 
		}
		e.preventDefault()
		const onMouseUp = () => {
			overwrap.current.removeEventListener('mousemove', onMouseMove)
			overwrap.current.removeEventListener('mouseup', onMouseUp)
		}
		const onMouseMove = e => {
			if (e.buttons === 0) {
				return onMouseUp()
			}
			const leftSize = e.clientX - getLeft(overwrap.current) 
			const editorWidth = workspace.current.clientWidth + widgetDisplay.current.clientWidth
			const rightSize = editorWidth - leftSize
			let flex = leftSize / rightSize
			if (flex >= 0 && isFinite(flex)) workspace.current.setAttribute('style', `flex: ${flex} 1 0%;`)
			setupExecButtonPosition()
		}
		overwrap.current.addEventListener('mousemove', onMouseMove);
    	overwrap.current.addEventListener('mouseup', onMouseUp);
	}
	useEffect(() => {
		setupExecButtonPosition()
	}, [docExplorerOpen])
	const workspaceResizer = e => {
		if (e.target && e.target.className && typeof e.target.className.indexOf === 'function') { 
			if (e.target.className.indexOf('workspace__sizechanger') !== 0) return 
		}
		e.preventDefault()
		const onMouseUp = () => {
			overwrap.current.removeEventListener('mousemove', onMouseMove)
			overwrap.current.removeEventListener('mouseup', onMouseUp)
		}
		const onMouseMove = e => {
			if (e.buttons === 0) {
				return onMouseUp()
			}
			const topSize = e.clientY - getTop(workspace.current) 
			const bottomSize = workspace.current.clientHeight - 75 - topSize
			let flex = bottomSize / topSize
			const widget = document.getElementsByClassName('widget')[number]
			if (flex >= 0) {
				widget && widget.setAttribute('style', `flex: ${flex} 1 0%;`)
				let widgetResizeEvent = new Event('widgetresize')
				window.dispatchEvent(widgetResizeEvent)
			}
		}
		overwrap.current.addEventListener('mousemove', onMouseMove);
    	overwrap.current.addEventListener('mouseup', onMouseUp);
	}
	const getQueryTypes = (query) => {
		console.log('get model')
		const typeInfo = new TypeInfo(schema)
		let typesMap = {}
		const queryNodes = []
		let depth = 0
		let stop = false
		let checkpoint = 0
		let queryLength = 0
		let visitor = {
			enter(node ) {
				typeInfo.enter(node)
				if(node.kind === "Field") {
					if (!depth && queryNodes.length) {
						checkpoint = queryNodes.length
						if (currentQuery.data_type === 'flatten') {
							stop = true
							return visitor.BREAK
						}
					}
					if (node.alias) {
						queryNodes.push(node.alias.value)
					} else {
						queryNodes.push(typeInfo.getFieldDef().name)
					}
					if (depth) {
						let arr = queryNodes.filter(node=> node.split('.').length === depth)
						let index = queryNodes.indexOf(arr[arr.length-1])
						let depthLength = depth!==1 ? index : 0
						if (checkpoint && depthLength <= checkpoint) {
							depthLength += checkpoint
						}
						queryNodes[queryNodes.length-1] = 
							queryNodes[depthLength]+'.'+queryNodes[queryNodes.length-1]
					}
					if (typeInfo.getType().toString()[0] === '[') {
						if (node.selectionSet.selections.length === 1) {
							queryNodes[queryNodes.length-1] = `${queryNodes[queryNodes.length-1]}[0]`
						}
					}
					depth++
					// console.log(typeInfo.getFieldDef().name, typeInfo.getType().toString())
					return {...node, typeInfo: typeInfo.getType()}
				}
			},
			leave(node) {
				if (node.kind === 'Field') {
					let arr = queryNodes.filter(node=> node.split('.').length === depth)
					let index = queryNodes.indexOf(arr[arr.length-1])
					depth--
					if (queryNodes[index] !== undefined) {
						typesMap[queryNodes[index]] = node
					} 
					//-------
					if (queryLength <= 1) {
						if (queryNodes[index].includes('.')) queryLength += 1
						if (queryLength > 1) typesMap = {data: {typeInfo: 'FullResponse'}, ...typesMap}
					}
					if (!depth && queryNodes.length) {
						if (currentQuery.data_type === 'flatten') {
							return visitor.BREAK
						}
					}
				}
				typeInfo.leave(node)
			}
		}
		try {
			visit(parseGql(query), visitWithTypeInfo(typeInfo, visitor))
		} catch (e) {}
		if (stop) {
			let flattenModel = {}
			Object.keys(typesMap).forEach((key, i) => {
				console.log(key, typesMap[key].typeInfo.toString(), i)
				if (key === 'data') {
					flattenModel[key] = typesMap[key]
				} else if ( ['Int', 'String'].some(value => typesMap[key].typeInfo.toString().includes(value)) ) { 
					let flatKey = key.includes('data') ? key : `${key.replace( key.split('.')[0], '' ).replace('[0]', '')}`
					const splittedKey = flatKey.split('.')
					if (splittedKey.length > 3) {
						flatKey = `${splittedKey[splittedKey.length-2]}${splittedKey[splittedKey.length-1]}`
					}
					flatKey = `data.${flatKey.replaceAll('.', '')}`
					flattenModel[flatKey] = {typeInfo: typesMap[key].typeInfo.toString()}
				}
			})
			flattenModel['data.network'] = {typeInfo: 'String'}
			return flattenModel 
		}
		return typesMap
	}

	useEffect(() => {
		if (number === index && !currentQuery.saved) {
			const model = getQueryTypes(query[index].query)
			setQueryTypes(model)
		}
	}, [currentQuery.data_type,currentQuery.saved, dataSource.values])

	const plugins = useMemo(()=> [JsonPlugin, tradingView,  ...vegaPlugins, ...graphPlugins, ...timeChartPlugins, tablePlugin], [])
	let indexx = plugins.map(plugin => plugin.id).indexOf(currentQuery.widget_id)
	const WidgetComponent = indexx>=0 ? plugins[indexx] : plugins[0]

	const getResult = useCallback(() => {
		ReactTooltip.hide(executeButton.current)
		setLoading(true)
		let queryType = getQueryTypes(currentQuery.query)
		console.log(queryType)
		if (JSON.stringify(queryType) !== JSON.stringify(queryTypes)) {
			setQueryTypes(queryType)
		}
		let indexOfData = Object.keys(queryType).indexOf(currentQuery.displayed_data)
		let indexOfWidget = plugins.map(p => p.id).indexOf(currentQuery.widget_id)
		const unusablePair = indexOfData < 0 || indexOfWidget < 0
		let displayed_data = unusablePair ? Object.keys(queryType)[Object.keys(queryType).length-1] : currentQuery.displayed_data
		if (unusablePair) {
			updateQuery({
				displayed_data,
				widget_id: 'json.widget',
				saved: currentQuery.id && true
			}, index)
		}

		let temp = currentQuery.variables !== '{}'
		fetcher({query: currentQuery.query, variables: temp?currentQuery.variables:null}).then(data => {
			data.json().then(json => {
				let values = null
				if ('data' in json) {
					if (currentQuery.displayed_data && currentQuery.displayed_data !== 'data') {
						if (currentQuery.data_type === 'flatten') {
							values = flattenData(json.data)
						} else {
							values = getValueFrom(json.data, displayed_data)
						}
					} else {
						values = json.data
						if ('extensions' in json) {
							values.extensions = json.extensions
						}
					}
				}
				setDataSource({
					data: ('data' in json) ? json.data : null,
					extensions: ('extensions' in json) ? json.extensions : null,
					displayed_data: displayed_data || '',
					values,
					error: ('errors' in json) ? json.errors : null,
					query: toJS(currentQuery.query), 
					variables: toJS(currentQuery.variables)
				})
				if (!('data' in json)) updateQuery({widget_id: 'json.widget'}, index)
			})
			
			setLoading(false)
			setAccordance(true)
			ReactTooltip.hide(executeButton.current)
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(currentQuery), schema, JSON.stringify(queryTypes)])
	useEffect(() => {
		number === index && console.log(!dataSource.values, !!currentQuery.query, !!currentQuery.saved, number === index, !!schema);
		(!dataSource.values && 
		currentQuery.query &&
		currentQuery.saved &&
		number === index &&
		schema) && getResult()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [schema])
	const editQueryHandler = useCallback(handleSubject => {
		if ('query' in handleSubject) {
			const facts = getQueryFacts(schema, handleSubject.query)
			if (facts) {
				const { variableToType } = facts
				if ((JSON.stringify(variableToType) !== JSON.stringify(_variableToType)) 
					&& _variableToType!==null) {
					_setVariableToType(variableToType)
				}
			}
			let queryType = getQueryTypes(handleSubject.query)
			if (JSON.stringify(queryType) !== JSON.stringify(queryTypes)) {
				(typeof queryType === 'object' && Object.keys(queryType).length) 
					&& setQueryTypes(queryType)
			}
		}
		updateQuery({...handleSubject, url: null}, index, null)
		setAccordance(false)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [schema, queryTypes, index])
	const fetcher = (graphQLParams) => {

		return fetch(
			`http://localhost:8010?url=${encodeURI(currentQuery.endpoint_url)}`,
			{
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(graphQLParams),
				credentials: 'same-origin',
			},
		)
	}
	useEffect(() => {


		if (number === index) {
			const fetchSchema = () => {
				setLoading(true)
				let introspectionQuery = getIntrospectionQuery()
				let staticName = 'IntrospectionQuery'
				let introspectionQueryName = staticName
				let graphQLParams = {
					query: introspectionQuery,
					operationName: introspectionQueryName
				}

				fetcher(graphQLParams)
				.then(response => response.json())
				.then(result => {

					if (typeof result !== 'string' && 'data' in result) {
						let schema = buildClientSchema(result.data)
						setSchema(schema)
					}
					setLoading(false)
					setErrorLoading(false)
				}).catch(e => {
					setLoading(false)
					setErrorLoading(true)
				})
			}
			fetchSchema() 
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedURL])

	return (
		<div 
			className={'graphiql__wrapper ' + 
				(currentTab === tabs[number].id ? 'graphiql__wrapper_active' : '')
				+ (!showSideBar ? ' graphiql__wrapper_wide' : '')
			}
		>
			<ToolbarComponent 
				queryEditor={queryEditor}
				variablesEditor={variablesEditor}
				docExplorerOpen={docExplorerOpen}
				toggleDocExplorer={toggleDocExplorer}
			/>
			<div className={'over-wrapper ' + (!currentQuery.layout ? 'active' : '')}  ref={overwrap}>
				<ReactTooltip 
					place="top"
					border={false}
					borderColor="#fff"
					backgroundColor="#5f5f5f"
					arrowColor="transparent"
					delayShow={750}
				/>
				
				<button className="execute-button"
					data-tip='Execute query (Ctrl-Enter)'
					disabled={loading || errorLoading} 
					ref={executeButton} 
					onClick={getResult}
				>
					{loading 
						?	<Loader
								type="Oval"
								color="#3d77b6"
								height={25}
								width={25}
							/> 
						: 	errorLoading	?
								<ErrorIcon fill={'#FF2D00'} /> 	:
								<PlayIcon fill={accordance ? '#eee' : '#14ff41'} />}
				</button>
				<div className="workspace__wrapper" 
						ref={workspace} 
						onMouseDown={workspaceResizer}
				>
					<GraphqlEditor
						schema={schema}
						query={query[number].query}
						number={number}
						variables={query[number].variables}
						variableToType={_variableToType}
						onRunQuery={getResult}
						onEditQuery={editQueryHandler}
						onEditVariables={editQueryHandler}
						ref={{
							ref1: queryEditor,
							ref2: variablesEditor
						}}
					/>
				</div>
				<div className={'widget-display widget-display-wrapper'+
					(isMobile ? ' widget-display-wrapper-fullscreen' : '')}
					ref={widgetDisplay}
				>
					<div
						className="sizeChanger"
						onMouseDown={handleResizer}
					>
					</div>
					<div className="flex-col w-100">
						<QueryErrorIndicator
							error={dataSource.error}
							removeError={setDataSource}
						/>
						<JsonPlugin.renderer
							mode={jsonMode ? 'json' : codeMode ? 'code' : ''}
							dataSource={dataSource}
							displayedData={toJS(currentQuery.displayed_data)}
							config={toJS(query[index].config)}
						/>
					</div>
				</div>
				{docExplorerOpen && <DocExplorer schema={schema} />}
			</div>
		</div> 
	)
})

export default EditorInstance
