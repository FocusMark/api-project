let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { FMErrors, AWSErrors } = require('../shared/errors');
const Response = require('../shared/response');
const Configuration = require('../shared/configuration');
const Project = require('../shared/project');
const JwtUser = require('../shared/jwt-user');

let configuration = new Configuration();
let dynamoDbClient = new AWS.DynamoDB.DocumentClient();

exports.postHandler = async (event, context) => {
    try {
        let user = new JwtUser(event);
        let project = createProject(user, event);
        
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
    console.info('Creating Project from request');
    let viewModel;
    try {
        viewModel = JSON.parse(event.body);
    } catch(err) {
        throw FMErrors.JSON_MALFORMED;
    }
    
    if (viewModel.projectId || viewModel.userId || viewModel.createdAt || viewModel.updatedAt) {
        throw FMErrors.JSON_INVALID_FIELDS;
    }
    
    let project = new Project(user, viewModel);
    
    console.info('Validating Project');
    let validationResults = project.validate();
    if (validationResults === null) {
        console.info('Validation failed.');
        return new Response(422, null, validationResults);
    }
    
    console.info('Validation completed successfully.');
    return project;
}

async function saveProject(project) {
    console.info(`Persisting Project ${project.projectId} to the read-only query store.`);
    let newRecord = project;
    newRecord.updatedAt = Date.now();
    newRecord.createdAt = Date.now();
    
    let postParameters = {
        TableName: configuration.data.dynamodb_projectTable,
        Item: newRecord,
    };
    
    console.info('Writing to table');
    try {
        await dynamoDbClient.put(postParameters).promise();
    } catch(err) {
        console.info(err);
        throw new AWSErrors.DYNAMO_NEW_PUT_FAILED;
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
        case AWSErrors.DYNAMO_NEW_PUT_FAILED.code:
            return new Response(500, null, err);
    }
    
    return new Response(500, 'Server failed to process your request.');
}