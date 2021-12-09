import React from 'react'
import './App.scss'
import GalleryComponent from './components/GalleryComponent'
import { GraphqlExplorer } from './components/GraphqlExplorer'
import { observer } from 'mobx-react-lite'
import 'react-grid-layout/css/styles.css'

if (process.env.NODE_ENV === 'development') {
	/* require('@welldone-software/why-did-you-render')(React, {
	  trackAllPureComponents: true,
	  exclude: [/^Explorer/, /^RootView/, 
		/^FieldView/, /^ArgView/, 
		/^AbstractArgView/, /^InputArgView/, 
		/^AbstractArgView/, /^ScalarInput/]
	}); */
  }

const App = observer(function App() {
	
	return (
		<div className="App">
			<div className="content flex">
				<GalleryComponent />
				<GraphqlExplorer />
			</div>
		</div>
	)
})

export default App;
