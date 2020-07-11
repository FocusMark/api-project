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
        let queryFilter = parseQueryFilter(user, event);

        let projectResults = await getAllProjects(user, queryFilter);
        return new QueryResponse(200, projectResults.projects, null, projectResults.lastProjectId);
    } catch(err) {
        console.info(err);
        console.info('Aborting Lambda execution');
        return handleError(err);
    }
};

async function getAllProjects(user, filter) {
    console.info(`Querying all projects for user`);
    console.info(filter);
    let params = {
        TableName: configuration.data.dynamodb_projectTable,
        ExpressionAttributeValues: filter.attributeValues,
        KeyConditionExpression: filter.conditionExpression,
        ExpressionAttributeNames: filter.attributeNames,
        FilterExpression: filter.filterExpression,
        Limit: 50
    };
    
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

function parseQueryFilter(user, event) {
    let attributeValues = {
        ':uid': user.userId,
    };
    let attributeNames = {};
    let filterExpression = '';
    let project = new Project(user, null);
    
    // We don't support filtering by these fields.
    deletePrivateFields(project);
    delete project.startDate;
    delete project.targetDate;
    
    for(const filter in event.queryStringParameters) {
        if (project[filter] !== undefined) {
            // Use the projectId of the temporary project created above to ensure unique attribute names
            // This avoids conflicts with reserved attribute keywords in Dynamo, such as the 'status' keyword.
            let attribute = `fm${filter}`;
            
            attributeValues[`:${attribute}`] = event.queryStringParameters[filter];
            attributeNames[`#${attribute}`] = filter;
            if (filterExpression === '') {
                filterExpression = filterExpression + `#${attribute} = :${attribute}`;
            } else {
                filterExpression = filterExpression + ` AND #${attribute} = :${attribute}`;
            } 
        }
    }
    
    return { attributeValues: attributeValues, attributeNames: attributeNames, filterExpression: filterExpression };
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
    
    return new QueryResponse(500, 'Server failed to process your request.');
}