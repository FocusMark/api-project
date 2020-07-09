let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const Errors = require('../shared/errors');
const Response = require('../shared/response');
const JwtUser = require('../shared/jwt-user');
const Configuration = require('../shared/configuration');

const { QueryFactory } = require('../queries/query-factory');
const QueryStore = require('../queries/query-store');
const QueryData = require('../queries/query-data');

let queryFactory = new QueryFactory();
let queryStore = new QueryStore();

exports.queryHandler = async (event, context) => {
    try {
        console.info('Executing the requested query.');
        let user = new JwtUser(event);
        
        console.info(event);
        if (event.pathParameters) {
            return await queryById(event, user);
        }
        
        return await queryAll(event, user);
        
    } catch(err) {
        console.info(err);
        return new Response(400, null, `${err.code}: ${err.message}`);
    }
}

async function queryById(event, user) {
    console.info(`Path parameters defined - fetching resource for parameters ${event.resource}`);
    if (event.pathParameters.projectId) {
        console.info('Fetching project by id');
        let project = await queryStore.getProjectForuser(user.userId, event.pathParameters.projectId);
        if (project == null) {
            console.info(`No project with id of ${event.resource} exists.`);
            return new Response(404, null, 'Not found');
        }
        
        console.info('Project found - returning.')
        return new QueryData(200, project);
    } else {
        console.info(`The path parameters provided of ${event.resource} is not supported.`);
        return new Response(404, null, 'Not found');
    }
}

async function queryAll(event, user) {
    console.info(`Fetching existing events for User ${user.userId}`);
    let userProjects = await queryStore.getProjectsForUser(user.userId);

    console.info('Query handler completed');
    return new QueryData(200, userProjects.projects, null, userProjects.lastProjectId);
}