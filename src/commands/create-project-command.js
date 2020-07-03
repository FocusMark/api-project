const AWS = require('aws-sdk');

const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Response = require('../shared/response');

class CreateProjectCommand {
    
    constructor(command, type, dynamoDbClient, sns) {
        this.command = command;
        this.type = type;
        this.configuration = new Configuration();
        this.dynamoDbClient = dynamoDbClient,
        this.sns = sns;
    }
    
    async execute(httpEvent) {
        let project = this.createProject(httpEvent);
        let validationResult = project.validate();
        if (validationResult) {
            console.info(validationResult);
            return new Response(422, null, validationResult);
        }
        
        return await this.publishWorkbook(project);
    }
    
    createProject(httpEvent) {
        console.info('Parsing request body');
        const requestBody = JSON.parse(httpEvent.body);
    
        console.info('Building command dependencies');
        let user = new JwtUser(httpEvent);
        let project = new ProjectModel(requestBody.title, user.userId);
        console.info(`Project ${project.projectId} created for user ${user.userId}`);
        return project;
    }
    
    async saveProject(project) {
        try {
            let dynamoDBParams = this.createDynamoDBParameters(project);
            
            await this.dynamoDbClient.put(dynamoDBParams).promise();
        } catch(err) {
            console.info(err);
            return new Response(400, null, err);
        }
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
    
    createPublishedMessageAttributes(userId) {
        return {
            Version: {
                DataType: 'String',
                StringValue: '2020-04-23',
            },
            DomainCommand: {
                DataType: 'String',
                StringValue: this.command,
            },
            RecordOwner: {
                DataType: 'String',
                StringValue: userId
            }
        };
    }
    
    async publishWorkbook(newProject) {

        let params = {
            Subject: this.command,
            Message: JSON.stringify(newProject),
            TopicArn: this.configuration.events.topic,
            MessageAttributes: this.createPublishedMessageAttributes(newProject.userId),
        };
        
        try {
            console.info(params);
            console.info(`Publishing Project to Topic ${params.TopicArn}`);
            
            await this.sns.publish(params).promise();
            return new Response(202, newProject.projectId, null, `/project/${newProject.projectId}`);
        } catch(err) {
            console.error(err);
            return new Response(500, null, 'Failed to create the Project', null);
        }
    }
}

module.exports = CreateProjectCommand;