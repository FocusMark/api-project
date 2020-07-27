let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { FMErrors, AWSErrors } = require('../shared/errors');
const QueryResponse = require('../shared/query-response');
const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const Project = require('../shared/project');

let configuration = new Configuration();
let dynamoDbClient = new AWS.DynamoDB.DocumentClient();

exports.getAllHandler = async (event, context) => {
    try {
        let user = new JwtUser(event);

        let projectResults = await getAllProjects(event, user);
        return new QueryResponse(200, projectResults.projects, null, projectResults.lastProjectId);
    } catch(err) {
        console.info(err);
        console.info('Aborting Lambda execution');
        return handleError(err);
    }
};

async function getAllProjects(event, user) {
    console.info(`Querying all projects for user`);
    
    let params = {
        TableName: configuration.data.dynamodb_projectTable,
        ExpressionAttributeValues: {
            ':uid': user.userId,
        },
        KeyConditionExpression: 'userId = :uid',
        Limit: configuration.data.pageSize,
        ReturnConsumedCapacity: "TOTAL",
    };
    
    if (event.queryStringParameters && event.queryStringParameters.lastId) {
        params.ExclusiveStartKey = {
            projectId: event.queryStringParameters.lastId,
            userId: user.userId,
        };
    }
    
    console.info(params);
    try {
        let queryResults = await dynamoDbClient.query(params).promise();
        let projects = queryResults.Items;
        projects.forEach(project => deletePrivateFields(project));
        
        console.info(`Query completed with ${queryResults.Items.length} items found`);
        
        if (queryResults.LastEvaluatedKey) {
            console.info('Additional records are available for querying in DynamoDB.');
            return { projects: projects, lastProjectId: queryResults.LastEvaluatedKey.projectId, };
        } else {
            console.info('Retrieved all records for the user.');
            return { projects: projects, };
        }
    } catch (err) {
        console.info(err);
        throw AWSErrors.DYNAMO_GET_ALL_PROJECTS_FAILED;
    }
}

function deletePrivateFields(project) {
    delete project.createdAt;
    delete project.updatedAt;
    delete project.userId;
    delete project.clientsUsed;
}

function handleError(err) {
    
    switch(err.code) {
        case FMErrors.MISSING_AUTHORIZATION.code:
            return new QueryResponse(401, null, err);
        case AWSErrors.DYNAMO_GET_ALL_PROJECTS_FAILED.code:
            return new QueryResponse(500, null, err);
    }
    
    return new QueryResponse(500, null, { code: 500, message: 'Server failed to process your request.' });
}