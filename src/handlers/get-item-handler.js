let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { FMErrors, AWSErrors } = require('../shared/errors');
const QueryResponse = require('../shared/query-response');
const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');

let configuration = new Configuration();
let dynamoDbClient = new AWS.DynamoDB.DocumentClient();

exports.getItemHandler = async (event, context) => {
    try {
        let user = new JwtUser(event);
        if (!event.pathParameters || !event.pathParameters.projectId) {
            throw FMErrors.INVALID_ROUTE;
        }

        let projectResults = await getProject(user.userId, event.pathParameters.projectId);
        return new QueryResponse(200, projectResults);
    } catch(err) {
        console.info(err);
        console.info('Aborting Lambda execution');
        return handleError(err);
    }
};

async function getProject(userId, projectId) {
    console.info(`Querying all projects for user`);
    let params = {
        TableName: configuration.data.dynamodb_projectTable,
        Key: { userId: userId, projectId: projectId },
    };
    
    try {
        let fetchedProject = await dynamoDbClient.get(params).promise();
        
        if (Object.keys(fetchedProject).length === 0 || Object.keys(fetchedProject.Item).length == 0) {
            console.info('Project does not exist and can not be updated');
            return null;
        }
    
        console.info('Verified project exists');
        delete fetchedProject.Item.createdAt;
        delete fetchedProject.Item.updatedAt;
        delete fetchedProject.Item.userId;
        delete fetchedProject.Item.clientsUsed;
    
        return fetchedProject.Item;
    } catch(err) {
        console.info(err);
        throw AWSErrors.DYNAMO_GET_PROJECT_FAILED;
    }
}

function handleError(err) {
    switch(err.code) {
        case FMErrors.MISSING_AUTHORIZATION.code:
            return new QueryResponse(401, null, err);
        case AWSErrors.DYNAMO_GET_PROJECT_FAILED.code:
            return new QueryResponse(500, null, err);
    }
    
    return new QueryResponse(500, 'Server failed to process your request.');
}