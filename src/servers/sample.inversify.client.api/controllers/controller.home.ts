import { httpGet, controller } from 'inversify-express-utils';
import { injectable } from 'inversify';

import { Request, Response, NextFunction } from 'express';
import config from '../config/env/development';
//import * as appInsights from 'applicationinsights';

@controller('/')
@injectable()
export class ControllerHome {
    constructor(
    ) {
    }

    @httpGet('/')
    public get(req: Request, res: Response, next: NextFunction): any {
        //appInsights.defaultClient.trackNodeHttpRequest({ request: req, response: res });
        return `vobo.api ${config.env} server is running!`;
    }
}
