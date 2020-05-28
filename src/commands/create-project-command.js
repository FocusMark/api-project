let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Response = require('../shared/response');

class CreateProjectCommand {
    
    constructor(command, type) {
        this.command = command;
        this.type = type;
        this.configuration = new Configuration();

        if (this.configuration.data.dynamodb_endpointUrl) {
            AWS.config.update({endpoint: this.configuration.data.dynamodb_endpointUrl});
        }
    }
    
    async execute(httpEvent) {

        console.info('Parsing request body');
        const requestBody = JSON.parse(httpEvent.body);
    
        console.info('Building command dependencies');
        let dynamoDbClient = new AWS.DynamoDB.DocumentClient();
        let user = new JwtUser(httpEvent);
        let project = new ProjectModel(requestBody.title, user.userId);
        console.info(`Project ${project.projectId} created for user ${user.userId}`);

        let validationResult = project.validate();
        if (validationResult) {
            // TODO: Handle
            console.info(validationResult);
            return new Response(422, null, validationResult);
        }
        
        try {
            let dynamoDBParams = this.createDynamoDBParameters(project);
            let response = await dynamoDbClient.put(dynamoDBParams).promise();
            console.info(response);
        } catch(err) {
            console.info(err);
            return new Response(400, null, err);
        }
        
        console.info(project);
        return new Response(202, null, null, project.projectId);
    }
    
    createDynamoDBParameters(newProject) {
        return {
            TableName: this.configuration.data.dynamodb_projectTable,
            Item: {
                userId: newProject.userId,
                projectId: newProject.projectId,
                title: newProject.title,
                status: newProject.status,
                createdAt: newProject.createdAt,
                updatedAt: newProject.updatedAt,
            }
        };
    }
}

module.exports = CreateProjectCommand;