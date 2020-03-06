var express = require('express');
var proxy = require('express-http-proxy');
var router = express.Router();

const proxyBaseUrl = 'http://localhost:3002';
const fusebitBaseUrl = process.env.FUSBEIT_BASE_URL || 'https://stage.us-west-2.fusebit.io';

const rewriteAuthorization = () => (req, res, next) => {
  // Validate the request is authorized and re-write the authorization to use 
  // an access token that will be accepted by the upstream Fusebit API.
  
  // const newAccessToken = '{jwtToken}';
  // if (req.query.token) {
  //   req.query.token = newAccessToken;
  // }
  // else {
  //   req.headers['authorization'] = `Bearer ${newAccessToken}`;
  // }

  next();
};

const rewriteFunctionUrl = (res, resData) => {
  // Some Fusebit APIs return the execution URL of a Fusebit Function. 
  // This execution URL must be re-written to use the proxy's base URL.

  const payload = JSON.parse(resData);
  if (payload.location) {
    payload.location = payload.location.replace(`${fusebitBaseUrl}/`, `${proxyBaseUrl}/`);
    return JSON.stringify(payload);
  }
  return resData;  
};

router.options([
    '/v1/run/:subscriptionId/*',
    '/v1/account/:accountId/subscription/:subscriptionId/boundary/:boundaryId/function/:functionId',
    '/v1/account/:accountId/subscription/:subscriptionId/boundary/:boundaryId/function/:functionId/log',
    '/v1/account/:accountId/subscription/:subscriptionId/boundary/:boundaryId/function/:functionId/location',
    '/v1/account/:accountId/subscription/:subscriptionId/boundary/:boundaryId/function/:functionId/build/:buildId',
  ], 
  proxy(fusebitBaseUrl)
);

router.get([
    '/v1/account/:accountId/subscription/:subscriptionId/boundary/:boundaryId/function/:functionId/log',
  ], 
  rewriteAuthorization(),
  proxy(fusebitBaseUrl)
);

router.get([
    '/v1/account/:accountId/subscription/:subscriptionId/boundary/:boundaryId/function/:functionId',
    '/v1/account/:accountId/subscription/:subscriptionId/boundary/:boundaryId/function/:functionId/location',
    '/v1/account/:accountId/subscription/:subscriptionId/boundary/:boundaryId/function/:functionId/build/:buildId',
  ], 
  rewriteAuthorization(),
  proxy(fusebitBaseUrl, { userResDecorator: rewriteFunctionUrl })
);

router.put([
    '/v1/account/:accountId/subscription/:subscriptionId/boundary/:boundaryId/function/:functionId',
  ], 
  rewriteAuthorization(),
  proxy(fusebitBaseUrl, { userResDecorator: rewriteFunctionUrl })
);

['post','put','patch','delete','get','head'].forEach(verb => {
  router[verb]('/v1/run/:subscriptionId/*', proxy(fusebitBaseUrl))
});

module.exports = router;
