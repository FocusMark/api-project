let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { FMErrors, AWSErrors } = require('../shared/errors');
const Response = require('../shared/response');
const Configuration = require('../shared/configuration');
const Project = require('../shared/project');
const JwtUser = require('../shared/jwt-user');

let configuration = new Configuration();
let dynamoDbClient = new AWS.DynamoDB.DocumentClient();

exports.putHandler = async (event, context) => {
    try {
        let user = new JwtUser(event);
        let project = createProject(user, event);
        
        let existingProject = await getProject(project);
        if (!existingProject) {
            return new Response(404, null, 'not found');
        }
        
        await saveProject(project);
        let responseViewModel = { projectId: project.projectId };
        return new Response(201, responseViewModel, null, project.projectId);
    } catch(err) {
        console.info(err);
        console.info('Aborting Lambda execution');
        return handleError(err);
    }
}

function createProject(user, event) {
    console.info('Updating Project from request');
    let viewModel; 
    viewModel = new Project(user, JSON.parse(event.body));
    
    if (!event.pathParameters || !event.pathParameters.projectId) {
        throw FMErrors.INVALID_ROUTE
    }
    
    viewModel.projectId = event.pathParameters.projectId;
    
    console.info('Validating Project');
    let validationResults = viewModel.validate();
    if (validationResults === null) {
        console.info('Validation failed.');
        return new Response(422, null, validationResults);
    }
    
    console.info('Validation completed successfully.');
    return viewModel;
}

async function getProject(project) {
    let params = {
        TableName: configuration.data.dynamodb_projectTable,
        Key: { userId: project.userId, projectId: project.projectId },
    };
    
    try {
        let fetchedProject = await dynamoDbClient.get(params).promise();
        if (Object.keys(fetchedProject).length === 0 || Object.keys(fetchedProject.Item).length == 0) {
            console.info('Project does not exist and can not be updated');
            return null;
        } else {
            console.info('Verified project exists');
            return fetchedProject.Item;
        }
    } catch(err) {
        console.info(err);
        throw AWSErrors.DYNAMO_GET_FAILED;
    }
}

async function saveProject(project) {
    console.info(`Persisting Project ${project.projectId} to the data store.`);
    let newRecord = project;
    newRecord.updatedAt = Date.now();
    newRecord.createdAt = Date.now()
    
    let putParameters = {
        TableName: configuration.data.dynamodb_projectTable,
        Item: newRecord,
        ConditionExpression: 'userId = :uid AND projectId = :pid',
        ExpressionAttributeValues: {
            ':uid': project.userId,
            ':pid': project.projectId
        }
    };
    
    console.info('Writing to table');
    try {
        await dynamoDbClient.put(putParameters).promise();
    } catch(err) {
        console.info(err);
        throw new AWSErrors.DYNAMO_UPDATE_PUT_FAILED;
    }
    console.info('Write complete');
}

function handleError(err) {
    switch(err.code) {
        case FMErrors.MISSING_AUTHORIZATION.code:
            return new Response(401, null, err);
        case FMErrors.JSON_MALFORMED.code:
        case FMErrors.JSON_INVALID_FIELDS.code:
        case FMErrors.JSON_MISSING_FIELDS.code:
            return new Response(422, null, err);
        case FMErrors.INVALID_ROUTE.code:
            return new Response(404, null, err);
        case AWSErrors.DYNAMO_UPDATE_PUT_FAILED.code:
            return new Response(500, null, err);
        case AWSErrors.DYNAMO_GET_FAILED.code:
            return new Response(404, null, err);
    }
    
    return new Response(500, 'Server failed to process your request.');
}