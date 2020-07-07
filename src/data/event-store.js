const AWS = require('aws-sdk');

// Commands & Events
const { DomainEvents } = require('../command-factory');

// Shared models
const Configuration = require('../shared/configuration');
const ProjectModel = require('../shared/project-model');

class EventStore {
    constructor() {
        this.sns = new AWS.SNS();
        this.dynamoDbClient = new AWS.DynamoDB.DocumentClient();
        this.configuration = new Configuration();
    }
    
    async getEventsForProject(projectId, userId) {
        let params = {
            TableName: this.configuration.data.dynamodb_projectEventSourceTable,
            ExpressionAttributeValues: {
                ':upid': `${userId}_${projectId}`,
            },
            KeyConditionExpression: 'userId_ProjectId = :upid'
        };
        
        let queryResults = await this.dynamoDbClient.query(params).promise();
        console.info(JSON.stringify(queryResults.Items));
        return this.aggregateEvents(queryResults.Items, userId, projectId);
    }
    
    aggregateEvents(events, userId, projectId) {
        console.info(`Aggregating ${events.length} events for Project ${projectId}`);
        let sortedEvents = events
            .filter(item => item.userId_ProjectId === `${userId}_${projectId}`)
    		.sort((item1, item2) => item1.eventTime - item2.eventTime);
    	
    	console.info(`Preparing final aggregated view model for Project ${projectId}`);
    	var finalModel = new ProjectModel();
    	finalModel.userId = userId;
    	finalModel.projectId = projectId;
    	this.applyEventsToProject(finalModel, sortedEvents);
    	
    	// TODO: Should validate model but not sure on how best to handle failed validation resulting in events not reflected in the viewmodel datastore.
    	return finalModel;
    }
    
    applyEventsToProject(emptyProject, events) {
        console.info(`Applying ${events.length} events to the view model for Project ${emptyProject.projectId}`);
        
        events.forEach(currentEvent => {
            switch(currentEvent.event) {
                case DomainEvents.PROJECT_CREATED:
                    console.info(`Applying ${DomainEvents.PROJECT_CREATED} event to Project ${emptyProject.projectId}`);
                    this.applyCreateCommand(emptyProject, currentEvent.payload);
                    break;
                case DomainEvents.PROJECT_ACTIVATED:
                    console.info(`Applying ${DomainEvents.PROJECT_ACTIVATED} event to Project ${emptyProject.projectId}`);
                    this.applyActivatecommand(emptyProject, currentEvent.payload);
                    break;
                default:
                    console.info(`Unknown domain event of ${currentEvent.event} found and skipped.`);
                    break;
                case DomainEvents.PROJECT_MOVED:
                    console.info(`Applying #{DomainEvents.PROJECT_MOVED} event to the Project ${emptyProject.projectId}`);
                    this.applyMoveProjectCommand(emptyProject, currentEvent.payload);
                    break;
            }
        })
    }
    
    applyCreateCommand(project, event) {
        project.setTitle(event.title);
        project.setPathOrAssignDefault(event.path);
        project.setTargetDateOrAssignDefault(event.targetDate);
        project.setStartDateOrAssignDefault(event.startDate);
        project.setStatus(event.status);
        project.setColorOrAssignDefault(event.color);
        project.setMethodologyOrAssignDefault(event.kind);
    }
    
    applyActivatecommand(project, event) {
        project.setStatus(event.status);
    }
    
    applyMoveProjectCommand(project, event) {
        project.setPathOrAssignDefault(event.path);
    }
}

module.exports = EventStore;