let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const Errors = require('../shared/errors');
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
        return new Response(201, project, null, project.projectId);
    } catch(err) {
        console.info(err);
        if (err.code === Errors.MALFORMED_BODY.code || err.code === Errors.MALFORMED_JSON_BODY.code) {
            return new Response(422, null, err.message);
        }
        return new Response(500, 'Server failed to process your request.');
    }
}

function createProject(user, event) {
    console.info('Creating Project from request');
    let viewModel;
    try {
        viewModel = JSON.parse(event.body);
    } catch(err) {
        throw Errors.MALFORMED_JSON_BODY;
    }
    
    let project = new Project(user, viewModel);
    
    console.info('Validating Project');
    let validationResults = project.validate();
    if (validationResults) {
        console.info('Validation failed.');
        return new Response(422, validationResults, 'Validation failed on the given model.');
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
    await dynamoDbClient.put(postParameters).promise();
    console.info('Write complete');
}