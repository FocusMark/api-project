let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { FMErrors, AWSErrors } = require('../shared/errors');
const Response = require('../shared/response');
const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const EventService = require('../shared/event-service');

let configuration = new Configuration();
let dynamoDbClient = new AWS.DynamoDB.DocumentClient();
let eventService = new EventService();

exports.deleteHandler = async (event, context) => {
    try {
        let user = new JwtUser(event);
        if (!event.pathParameters || !event.pathParameters.projectId) {
            throw FMErrors.INVALID_ROUTE;
        }

        await deleteProject(user.userId, event.pathParameters.projectId);
        await eventService.publishProjectDeleted(event.pathParameters.projectId, user.userId);
        
        return new Response(200);
    } catch(err) {
        console.info(err);
        console.info('Aborting Lambda execution');
        return handleError(err);
    }
};

async function deleteProject(userId, projectId) {
    console.info(`Deleting the project for user`);
    let params = {
        TableName: configuration.data.dynamodb_projectTable,
        Key: { userId: userId, projectId: projectId },
        ReturnValues: 'ALL_OLD'
    };
    
    let fetchedProject;
    try {
        fetchedProject = await dynamoDbClient.delete(params).promise();
        
    } catch(err) {
        console.info(err);
        throw AWSErrors.DYNAMO_GET_PROJECT_FAILED;
    }
    
    console.info(fetchedProject);
    if (!fetchedProject.Attributes) {
        throw FMErrors.RECORD_NOT_FOUND;
    }
}

function handleError(err) {
    switch(err.code) {
        case FMErrors.MISSING_AUTHORIZATION.code:
            return new Response(401, null, err);
        case FMErrors.INVALID_ROUTE.code:
        case FMErrors.RECORD_NOT_FOUND.code:
            return new Response(404, null, err);
        case AWSErrors.DYNAMO_GET_PROJECT_FAILED.code:
            return new Response(500, null, err);
    }
    
    return new Response(500, 'Server failed to process your request.');
}