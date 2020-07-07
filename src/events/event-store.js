const AWS = require('aws-sdk');

// Commands & Events
const ProjectDomainEvent = require('./project-domain-event');

// Shared models
const Configuration = require('../shared/configuration');
const ProjectModel = require('../shared/project-model');

class EventStore {
    constructor() {
        this.sns = new AWS.SNS();
        this.dynamoDbClient = new AWS.DynamoDB.DocumentClient();
        this.configuration = new Configuration();
    }
    
    async saveEvent(event) {
        await this.storeEventInTable(event);
        await this.publishEventNotification(event);
    }
    
    async getEventsForProject(projectId, userId) {
        console.info(`Fetching existing events for Project ${projectId}`);
        let params = {
            TableName: this.configuration.data.dynamodb_projectEventSourceTable,
            ExpressionAttributeValues: {
                ':upid': `${userId}_${projectId}`,
            },
            KeyConditionExpression: 'userId_ProjectId = :upid'
        };
        
        let queryResults = await this.dynamoDbClient.query(params).promise();
        if (queryResults.Items.length === 0) {
            return null;
        }
        
        console.info(`Fetched ${queryResults.Items.length} records. Converting them to Project Domain Events.`);
        let domainEvents = queryResults.Items.map(item => {
            let newEvent = new ProjectDomainEvent(item.payload, item.event);
            newEvent.eventTime = item.eventTime;
            newEvent.userId_ProjectId = item.userId_ProjectId;
            newEvent.eventId = item.eventId;
            return newEvent;
        })
        
        return this.aggregateEvents(domainEvents, userId, projectId);
    }
    
    async storeEventInTable(event) {
        console.info(`Creating persistance parameters for Project ${event.payload.projectId}`);
        let dynamoDbParams = {
            TableName: this.configuration.data.dynamodb_projectEventSourceTable,
            Item: event,
        };
        
        console.info(`Putting Project ${event.payload.projectId} to Table ${dynamoDbParams.TableName}`);
        await this.dynamoDbClient.put(dynamoDbParams).promise();
        console.info(`Put completed for Project ${event.payload.projectId}.`);
    }
    
    async publishEventNotification(message) {
        console.info(`Creating publish parameters for Project ${message.payload.projectId}`);
        let eventAttributes = {
            Version: { DataType: 'String', StringValue: '2020-04-23', },
            DomainEvent: { DataType: 'String', StringValue: message.event, }
        };
        
        let snsParams = {
            Subject: message.event,
            Message: JSON.stringify(message),
            TopicArn: this.configuration.events.topic,
            MessageAttributes: eventAttributes,
        };
        
        console.info(`Publishing Project ${message.payload.projectId} to Topic ${snsParams.TopicArn}`);
        await this.sns.publish(snsParams).promise();
        console.info(`Publish completed for Project ${message.payload.projectId}.`);
    }
    
    aggregateEvents(events, userId, projectId) {
        console.info(`Aggregating ${events.length} events for Project ${projectId}`);
        let sortedEvents = events.sort((item1, item2) => item1.eventTime - item2.eventTime);
        console.info(`Events sorted by the time they were created.`);
        
    	var finalModel = new ProjectModel();
    	finalModel.userId = userId;
    	finalModel.projectId = projectId;
    	
    	//this.applyEventsToProject(finalModel, sortedEvents);
    	sortedEvents.forEach(item => item.applyOnProject(finalModel));
    	
    	// TODO: Should validate model but not sure on how best to handle failed validation resulting in events not reflected in the viewmodel datastore.
    	return finalModel;
    }
}

module.exports = EventStore;