const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Methodologies = require('../shared/methodologies');
const Status = require('../shared/status');
const Response = require('../shared/response');

const { DomainEvents } = require('../event-factory');

let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));
let configuration = new Configuration();

var eventStore = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
let segment = AWSXRay.getSegment();

exports.handler = async (event) => {
    let eventParse = segment.addNewSubsegment('sns-handler.event-parse');
    let payload = parseEvent(event.Records[0].Sns);
    eventParse.close();
    
    if (!payload) {
        return new Response(400, null, 'Unable to parse the event correctly');
    }
    
    let events = await getEvents(payload);
    if (events == null) {
        return new Response(500, 'Unable to discover events');
    }
    
    let projectViewModel = getProjectViewModel(events, payload.userId, payload.projectId);
    if (projectViewModel.status !== Status.ARCHIVED && projectViewModel.status !== Status.DELETED) {
        let saveResults = await saveProjectViewModel(projectViewModel);
        if (saveResults.statusCode != 200) {
            return saveResults;
        }
    } // TODO: Delete from data store if it is archived or deleted.
    
    return new Response(200, projectViewModel);
}

async function getEvents(payload) {
    let eventStoreQuerySegment = segment.addNewSubsegment('sns-handler.event-store-query');
    let eventStoreQueryResults;
    
    try {
        console.info(`Building query parameters for ${payload.projectId}`);
        let eventStoreParams = createEventStoreQueryParams(payload.projectId, payload.userId);
        eventStoreQueryResults = await eventStore.query(eventStoreParams).promise();
        console.info(`Query for existing events related to Project ${payload.projectId} completed.`);
    } catch (err) {
        console.info(err);
        return null;
    }
    eventStoreQuerySegment.close();
    return eventStoreQueryResults.Items;
}

function getProjectViewModel(events, userId, projectId) {
    let eventAggregationSegment = segment.addNewSubsegment('sns-handler.event-aggregation');
    
    let finalModel = aggregateEvents(events, userId, projectId);
    console.info(`Final model for Project ${projectId} constructed for user ${userId}`);
    eventAggregationSegment.close();
    return finalModel;
}

async function saveProjectViewModel(projectViewModel) {
    console.info(`Creating parameters for storing Project ${projectViewModel.projectId} into view data store.`);
    let projectTableParams = createProjectTableParameters(projectViewModel);
    
    console.info(`Persisting Project ${projectViewModel.projectId} into the data store.`);
    try {
        await eventStore.put(projectTableParams).promise();
    } catch (err) {
        console.info(err);
        return new Response(500, 'Failed to put object into Dynamo');
    }
    console.info(`Persistance of Project ${projectViewModel.projectId} completed.`);
    return new Response(200);
}

function createProjectTableParameters(project) {
    return {
        TableName: configuration.data.dynamodb_projectTable,
        Item: {
            title: project.title,
            path: project.path,
            color: project.color,
            kind: project.kind,
            status: project.status,
            startDate: project.startDate,
            targetDate: project.targetDate,
            projectId: project.projectId,
            userId: project.userId,
            updatedAt: Date.now(),
        }
    };
}

function parseEvent(event) {
    console.info(`Parsing message for topic ${event.TopicArn} notification ${event.MessageId}`);
    let domainEvent = JSON.parse(event.Message);

    let payload = domainEvent.payload
    let projectId = payload.projectId;
    let userId = payload.userId;
    
    console.info(`Parsing completed. Found Project ${payload.projectId} for user ${payload.userId}`);
    return {
        projectId: projectId,
        userId: userId,
        project: payload,
        event: domainEvent,
    };
}

function createEventStoreQueryParams(projectId, userId) {
    console.info(`Preparing parameters to query Event Store ${configuration.data.dynamodb_projectEventSourceTable} for events related to Project ${projectId} for user ${userId}`);
    return {
        TableName: configuration.data.dynamodb_projectEventSourceTable,
        ExpressionAttributeValues: {
            ':upid': `${userId}_${projectId}`,
        },
        KeyConditionExpression: 'userId_ProjectId = :upid'
    };
}

function aggregateEvents(events, userId, projectId) {
    console.info(`Aggregating ${events.length} events for Project ${projectId}`);
    let sortedEvents = events
        .filter(item => item.userId_ProjectId === `${userId}_${projectId}`)
		.sort((item1, item2) => item1.eventTime - item2.eventTime);
	
	console.info(`Preparing final aggregated view model for Project ${projectId}`);
	var finalModel = new ProjectModel(userId);
	finalModel.projectId = projectId;
	applyEventsToProject(finalModel, sortedEvents);
	
	// TODO: Should validate model but not sure on how best to handle failed validation resulting in events not reflected in the viewmodel datastore.
	return finalModel;
}

function applyEventsToProject(emptyProject, events) {
    console.info(`Applying ${events.length} events to the view model for Project ${emptyProject.projectId}`);
    
    events.forEach(currentEvent => {
        switch(currentEvent.event) {
            case DomainEvents.PROJECT_CREATED:
                console.info(`Applying ${DomainEvents.PROJECT_CREATED} event to Project ${emptyProject.projectId}`);
                applyCreateCommand(emptyProject, currentEvent.payload);
                break;
            case DomainEvents.PROJECT_ACTIVATED:
                console.info(`Applying ${DomainEvents.PROJECT_ACTIVATED} event to Project ${emptyProject.projectId}`);
                applyActivatecommand(emptyProject, currentEvent.payload);
                break;
            default:
                console.info(`Unknown domain event of ${currentEvent.event} found and skipped.`);
                break;
        }
    })
}

function applyCreateCommand(project, event) {
    project.setTitle(event.title);
    project.setPathOrAssignDefault(event.path);
    project.setTargetDateOrAssignDefault(event.targetDate);
    project.setStartDateOrAssignDefault(event.startDate);
    project.setStatus(event.status);
    project.setColorOrAssignDefault(event.color);
    project.setMethodologyOrAssignDefault(event.kind);
}

function applyActivatecommand(project, event) {
    project.setStatus(event.status);
}