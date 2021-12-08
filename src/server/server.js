var express = require('express');
var request = require('request');
var cors = require('cors');
var chalk = require('chalk');
var proxy = express();

var startProxy = function(port, credentials, origin) {
	proxy.use(cors({credentials: credentials, origin: origin}));
	proxy.options('*', cors({credentials: credentials, origin: origin}));

	// remove trailing slash
	// remove all forward slashes

	proxy.use('/' , function(req, res) {
		const {url, ...q} = req.query

		var cleanProxyUrl = url.replace(/\/$/, '');

		try {
			console.log(chalk.green('Request Proxied -> ' + req.url));
		} catch (e) {}
		req.pipe(
			request(cleanProxyUrl )
				.on('response', response => {
					// In order to avoid https://github.com/expressjs/cors/issues/134
					const accessControlAllowOriginHeader = response.headers['access-control-allow-origin']
					if(accessControlAllowOriginHeader && accessControlAllowOriginHeader !== origin ){
						console.log(chalk.blue('Override access-control-allow-origin header from proxified URL : ' + chalk.green(accessControlAllowOriginHeader) + '\n'));
						response.headers['access-control-allow-origin'] = origin;
					}
				})
		).pipe(res);
	});

	proxy.listen(port);

	// Welcome Message
	console.log(chalk.bgGreen.black.bold.underline('\n Proxy Active \n'));
	console.log(chalk.blue('PORT: ' + chalk.green(port)));
	console.log(chalk.blue('Credentials: ' + chalk.green(credentials)));
	console.log(chalk.blue('Origin: ' + chalk.green(origin) + '\n'));
	console.log(
		chalk.cyan(
			'To start using the proxy simply replace the proxied part of your url with: ' +
			chalk.bold('http://localhost:' + port + '/'  + '\n')
		)
	);
};


startProxy(8010,  false, '*');