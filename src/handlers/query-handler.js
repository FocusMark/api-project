let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const Errors = require('../shared/errors');
const Response = require('../shared/response');
const JwtUser = require('../shared/jwt-user');
const Configuration = require('../shared/configuration');

const { QueryFactory } = require('../queries/query-factory');
const QueryStore = require('../queries/query-store');

let queryFactory = new QueryFactory();
let queryStore = new QueryStore();

exports.queryHandler = async (event, context) => {
    try {
        console.info('Executing the requested query.');
        let user = new JwtUser(event);
        
        console.info(`Fetching existing events for User ${user.userId}`);
        let userProjects = await queryStore.getProjectsForUser(user.userId);
        return new Response(200, userProjects);
        
    } catch(err) {
        return new Response(400, null, `${err.code}: ${err.message}`);
    }
}