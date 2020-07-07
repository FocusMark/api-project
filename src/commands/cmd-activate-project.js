const AWS = require('aws-sdk');

const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const Response = require('../shared/response');
const Status = require('../shared/status');
const { EventFactory } = require('../events/event-factory');

// /project/{projectId} endpoint
class ActivateProjectCommand {
    constructor(command, commandType, domainEvent, dynamoDbClient, sns) {
        this.domainEvent = domainEvent;
        this.command = command;
        this.commandType = commandType;
        this.configuration = new Configuration();
        this.dynamoDbClient = dynamoDbClient,
        this.sns = sns;
    }
    
    async execute(httpEvent) {
        console.info('Fetching projectId from pathParameters');
        let projectId = httpEvent.pathParameters.projectId;
        if (!projectId) {
            return new Response(404, null);
        }
        
        console.info('Parsing user');
        let user = new JwtUser(httpEvent);
        let projectExists = await this.verifyProjectExists(user.userId, projectId)
        
        console.info(`Building payload for new event`);
        let payload = {
            projectId: projectId,
            userId: user.userId,
            status: Status.ACTIVE,
        };
        
        let newEvent = await this.saveToEventStore(payload);
        if (!newEvent) {
            return new Response(500, null, 'Failed to update the Project');
        }
        
        await this.publishEvent(newEvent);
        return new Response(202);
    }
    
    async saveToEventStore(payload) {
        let eventFactory = new EventFactory();
        let newEvent = eventFactory.getProjectActivatedEvent(payload);
        console.info(`New event for ${payload.projectId} created`);
        
        console.info(`Saving Project event to event store`);
        let newEventParams = this.createSaveEventParams(newEvent);
        try {
            await this.dynamoDbClient.put(newEventParams).promise();
        } catch(err) {
            console.err(err);
            return null;
        }
        
        console.info(`New event saved to the event store for Project ${payload.projectId}`);
        return newEvent;
    }
    
    async publishEvent(newEvent) {
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
    
    createSaveEventParams(newEvent) {
        return {
            TableName: this.configuration.data.dynamodb_projectEventSourceTable,
            Item: newEvent,
        }
    }
    
    async verifyProjectExists(userId, projectId) {
        let eventRecordId = `${userId}_${projectId}`;
        console.info(`Querying for ${eventRecordId}`);
        
        let parameters = this.createQueryParameters(userId, projectId);
        let results = await this.dynamoDbClient.query(parameters).promise();
        if (results.Items.length == 0) {
            console.info(`Project ${projectId} does not exist in the event store.`);
        } else {
            console.info(`Project ${projectId} exists and can be added to.`);
        }
        
        return results.Items.length > 0;
    }
    
    createQueryParameters(userId, projectId) {
        return {
            TableName: this.configuration.data.dynamodb_projectEventSourceTable,
            ExpressionAttributeValues: {
                ':upid': `${userId}_${projectId}`,
            },
            KeyConditionExpression: 'userId_ProjectId = :upid'
        };
    }
}

module.exports = ActivateProjectCommand;