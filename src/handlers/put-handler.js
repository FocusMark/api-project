let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const Errors = require('../shared/errors');
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
            return new Response(422, null, 'not found');
        }
        
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
    console.info('Updating Project from request');
    let project; 
    try {
        project = new Project(user, JSON.parse(event.body));
    } catch(err) {
        throw Errors.MALFORMED_JSON_BODY;
    }
    
    project.projectId = event.pathParameters.projectId;
    
    console.info('Validating Project');
    let validationResults = project.validate();
    if (validationResults === null) {
        console.info('Validation failed.');
        return new Response(422, validationResults, 'Validation failed on the given model.');
    }
    
    console.info('Validation completed successfully.');
    return project;
}

async function getProject(project) {
    let params = {
        TableName: configuration.data.dynamodb_projectTable,
        Key: { userId: project.userId, projectId: project.projectId },
    };
    
    let fetchedProject = await dynamoDbClient.get(params).promise();
    if (Object.keys(fetchedProject).length === 0 || Object.keys(fetchedProject.Item).length == 0) {
        console.info('Project does not exist and can not be updated');
        return null;
    } else {
        console.info('Verified project exists');
        return fetchedProject.Item;
    }
}

async function saveProject(project) {
    console.info(`Persisting Project ${project.projectId} to the data store.`);
    let newRecord = project;
    newRecord.updatedAt = Date.now();
    newRecord.createdAt = Date.now()
    
    let postParameters = {
        TableName: configuration.data.dynamodb_projectTable,
        Item: newRecord,
        ConditionExpression: 'userId = :uid AND projectId = :pid',
        ExpressionAttributeValues: {
            ':uid': project.userId,
            ':pid': project.projectId
        }
    };
    
    console.info('Writing to table');
    let result = await dynamoDbClient.put(postParameters).promise();
    console.info(result);
    console.info('Write complete');
}