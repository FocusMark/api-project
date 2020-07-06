const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Response = require('../shared/response');
const Methodologies = require('../shared/methodologies');
const Status = require('../shared/status');

class CreateProjectCommand {
    
    constructor(command, type, dynamoDbClient, sns) {
        this.command = command;
        this.type = type;
        this.configuration = new Configuration();
        this.dynamoDbClient = dynamoDbClient,
        this.sns = sns;
    }
    
    // /project endpoint
    async execute(httpEvent) {
        console.info('Creating project from HTTP request');
        let project = this.createProject(httpEvent);
        
        console.info(`Validating project ${project.projectId}`);
        let validationResult = project.validate();
        if (validationResult) {
            console.info(`Validation failed for Project ${project.projectId}.`);
            console.info(validationResult);
            return new Response(422, null, validationResult);
        }
        
        console.info(`Saving Project ${project.projectId} to the Event Store`);
        let eventStoreResponse = await this.saveToEventStore(project);
        if (eventStoreResponse.statusCode != 200) {
            console.info(`Failed to save Project ${project.projectId} to the Event Store`);
            console.info(eventStoreResponse.errors);
            return new Response(500, null, 'System unavailable');
        }
        
        console.info(`Publishing Project ${project.projectId} to SNS for subscribers.`);
        return await this.publishWorkbook(project);
    }
    
    createProject(httpEvent) {
        console.info('Parsing request body');
        const requestBody = JSON.parse(httpEvent.body);
    
        console.info('Parsing user');
        let user = new JwtUser(httpEvent);
        
        console.info('Building Project model');
        let project = new ProjectModel();
        project.userId = user.userId;
        this.mapRequestToProject(requestBody, project);
        
        console.info(`Project ${project.projectId} created for user ${user.userId}`);
        return project;
    }
    
    mapRequestToProject(request, project) {
        console.info(`Mapping new ProjectId (${project.projectId}) for user ${project.userId} to request body`);
        project.setTitle(request.title);
        project.setPathOrAssignDefault(request.path);
        project.setColorOrAssignDefault(request.color);
        project.setMethodologyOrAssignDefault(request.kind);
        project.setTargetDateOrAssignDefault(request.targetDate);
        project.setStartDateOrAssignDefault(request.startDate);
        project.setStatus(Status.PLANNING);
        console.info(`New project mapped: ${JSON.stringify(project)}`);
    }
    
    async saveToEventStore(project) {
        try {
            console.info(`Creating Event Store parameters for project ${project.projectId} and Event Store Table ${this.configuration.data.dynamodb_projectEventSourceTable}`);
            let dynamoDBParams = this.createDynamoDBParameters(project);
            await this.dynamoDbClient.put(dynamoDBParams).promise();
            
            return new Response(200, project, null);
        } catch(err) {
            console.info(err);
            return new Response(400, null, err);
        }
    }
    
    createDynamoDBParameters(newProject) {
        return {
            TableName: this.configuration.data.dynamodb_projectEventSourceTable,
            Item: {
                event: this.command,
                eventTime: Date.now(),
                userId_ProjectId: `${newProject.userId}_${newProject.projectId}`,
                eventId: uuidv4(),
                eventRecord: {
                    title: newProject.title,
                    path: newProject.path,
                    color: newProject.color,
                    kind: newProject.kind,
                    status: newProject.status,
                    startDate: newProject.startDate,
                    targetDate: newProject.targetDate,
                    createdAt: newProject.createdAt,
                    updatedAt: newProject.updatedAt,
                },
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
        console.info(`Creating publish parameters for Project ${newProject.projectId}`);
        let params = {
            Subject: this.command,
            Message: JSON.stringify(newProject),
            TopicArn: this.configuration.events.topic,
            MessageAttributes: this.createPublishedMessageAttributes(newProject.userId),
        };
        
        try {
            console.info(`Publishing Project ${newProject.projectId} to Topic ${params.TopicArn}`);
            await this.sns.publish(params).promise();
            return new Response(202, newProject.projectId, null, `/project/${newProject.projectId}`);
        } catch(err) {
            console.error(err);
            return new Response(500, null, 'Failed to create the Project', null);
        }
    }
}

module.exports = CreateProjectCommand;