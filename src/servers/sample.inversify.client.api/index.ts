import 'reflect-metadata';
import express = require('express');
import { Container } from 'inversify';
import { interfaces, InversifyExpressServer, TYPE } from 'inversify-express-utils';
import * as passport from 'passport';

import configureServices from './config/services';
import config from './config/env';
import container from './config/di';
import { configureExpress } from './config/express';
import { configureDatabase } from '../../modules/database';
//import * as appInsights from 'applicationinsights';
var fs = require('fs');
var https = require('https');
let start = Date.now();

/* appInsights.setup(config.appInsightsKey)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .start();
 */
configureServices(container, passport);
configureDatabase({ mongodb: config.mongodb }, container);

// create server
let server = new InversifyExpressServer(container);
server.setConfig(configureExpress);


let app = server.build();
console.log(process.cwd())

 app.listen(8001, () => {
    console.log(`server started on port 8001 (${config.env})`);
    let duration = Date.now() - start;
    //appInsights.defaultClient.trackMetric({ name: `[${config.env}] server startup time`, value: duration });
});

console.log(process.env.NODE_ENV);
console.log(new Date().toISOString())

