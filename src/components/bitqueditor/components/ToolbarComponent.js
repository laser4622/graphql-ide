import { observer } from 'mobx-react-lite'
import { QueriesStore } from '../../../store/queriesStore'
import { parse as parseGql } from 'graphql/language'
import { print } from 'graphql'
import React from 'react'

const ToolbarComponent = observer(({ queryEditor, variablesEditor, docExplorerOpen, toggleDocExplorer}) => {
	const { currentQuery, updateQuery} = QueriesStore
	const handleInputURLChange = e => {
		updateQuery({endpoint_url: e.target.value}, 0)
	}
	const prettifyQuery = () => {
		const editor = queryEditor.current.getEditor()
		const editorContent = editor?.getValue() ?? ''
		const prettifiedEditorContent = editorContent && print(
			parseGql(editorContent, { experimentalFragmentVariables: true }),
		)
		if (prettifiedEditorContent !== editorContent) {
			editor.setValue(prettifiedEditorContent)
		}
		const variableEditor = variablesEditor.current.getEditor()
		const variableEditorContent = variableEditor?.getValue() ?? ''
		try {
			const prettifiedVariableEditorContent = JSON.stringify(
			JSON.parse(variableEditorContent),
			null,
			2,
			)
			if (prettifiedVariableEditorContent !== variableEditorContent) {
			variableEditor.setValue(prettifiedVariableEditorContent)
			}
		} catch {
		}
	}
	return <div className="topBarWrap">
		<div className="topBar">

			{!currentQuery.layout && <button className="topBar__button"
											 onClick={prettifyQuery}
			>
				Prettify
			</button>}
			{!currentQuery.layout && <input
				className="endpointURL"
				type="text"
				value={currentQuery.endpoint_url}
				onChange={handleInputURLChange}
			/>}
			{!docExplorerOpen ? currentQuery.layout ? <></> :
				<button
					className="docExplorerShow"
					onClick={() => toggleDocExplorer(prev => !prev)}
					aria-label="Open Documentation Explorer">
					Docs
				</button> : currentQuery.layout ? <></> :
				<div className="doc-explorer-title-bar">
					<div className="doc-explorer-title">
						Documentation Explorer
					</div>
					<div className="doc-explorer-rhs">
						<button
							className="docExplorerHide"
							aria-label="Close Documentation Explorer"
							onClick={() => toggleDocExplorer(prev => !prev)}
						>
							{'\u2715'}
						</button>
					</div>
				</div>}
		</div>
	</div>
})

export default ToolbarComponent
