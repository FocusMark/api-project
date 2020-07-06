const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Response = require('../shared/response');
const Methodologies = require('../shared/methodologies');
const Status = require('../shared/status');
const { EventFactory } = require('../event-factory');


class CreateProjectCommand {
    
    constructor(command, commandType, domainEvent, dynamoDbClient, sns) {
        this.domainEvent = domainEvent;
        this.command = command;
        this.commandType = commandType;
        this.configuration = new Configuration();
        this.dynamoDbClient = dynamoDbClient,
        this.sns = sns;
        this.eventFactory = new EventFactory();
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
        let newEvent = await this.saveToEventStore(project);
        if (newEvent === null) {
            console.info(`Failed to save Project ${project.projectId} to the Event Store`);
            return new Response(500, null, 'System unavailable');
        }
        
        console.info(`Publishing Project ${project.projectId} to SNS for subscribers.`);
        return await this.publishWorkbook(newEvent);
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
            let newEvent = this.eventFactory.getProjectCreatedEvent(project)
            let dynamoDBParams = this.createDynamoDBParameters(newEvent);
            await this.dynamoDbClient.put(dynamoDBParams).promise();
            
            return newEvent;
        } catch(err) {
            console.info(err);
            return null;
        }
    }
    
    createDynamoDBParameters(newEvent) {
        return {
            TableName: this.configuration.data.dynamodb_projectEventSourceTable,
            Item: newEvent,
        };
    }
    
    createPublishedMessageAttributes(userId) {
        return {
            Version: {
                DataType: 'String',
                StringValue: '2020-04-23',
            },
            DomainEvent: {
                DataType: 'String',
                StringValue: this.domainEvent,
            }
        };
    }
    
    async publishWorkbook(newEvent) {
        let payload = newEvent.payload;
        console.info(`Creating publish parameters for Project ${payload.projectId}`);
        
        let params = {
            Subject: this.domainEvent,
            Message: JSON.stringify(newEvent),
            TopicArn: this.configuration.events.topic,
            MessageAttributes: this.createPublishedMessageAttributes(),
        };
        
        
        try {
            console.info(`Publishing Project ${payload.projectId} to Topic ${params.TopicArn}`);
            await this.sns.publish(params).promise();
            console.info(`Publish completed for Project ${payload.projectId}.`);
            return new Response(202, payload.projectId, null, `/project/${payload.projectId}`);
        } catch(err) {
            console.error(err);
            return new Response(500, null, 'Failed to create the Project', null);
        }
    }
}

module.exports = CreateProjectCommand;