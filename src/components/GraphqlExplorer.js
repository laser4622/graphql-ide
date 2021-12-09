import React from 'react';
import '../App.scss';
import { TabsStore } from '../store/queriesStore';
import { observer } from 'mobx-react-lite'
import EditorInstance from './EditorInstance'
import './bitqueditor/App.scss'

export const GraphqlExplorer = observer(() => {
	return (
		<EditorInstance number={0} key={0} />)
})
