import {makeAutoObservable} from "mobx"


class Queries {
	schema = null
	currentQuery = {
		query: '',
		variables: '{}',
		data_type: 'response',
		config: {},
		endpoint_url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
		id: null
	}
	
	constructor() {
		makeAutoObservable(this)
	}
	setSchema = schema => this.schema = schema
	updateQuery = (params) => {
		this.currentQuery = {...this.currentQuery, ...params}
	}
}

export let QueriesStore = new Queries()
