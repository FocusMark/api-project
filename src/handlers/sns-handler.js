const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Methodologies = require('../shared/methodologies');
const Status = require('../shared/status');
const Response = require('../shared/response');

const { DomainCommands } = require('../commands/command-factory');

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
        let eventStoreParams = createEventStoreQueryParams(payload.projectId, payload.userId);
        eventStoreQueryResults = await eventStore.query(eventStoreParams).promise();
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
            userId: project.userId
        }
    };
}

function parseEvent(event) {
    console.info(`Parsing message for topic ${event.TopicArn} notification ${event.MessageId}`);
    let payload = JSON.parse(event.Message);
    let projectId = payload.projectId;
    let userId = event.MessageAttributes.RecordOwner.Value;
    
    if (payload.userId === userId) {
        console.info(`Parsing completed. Found Project ${payload.projectId} for user ${payload.userId}`);
        return {
            projectId: projectId,
            userId: userId,
            project: payload
        };
    } else {
        console.info(`Parsing topic ${event.TopicArn} notification ${event.MessageId} failed. Payload was not supported`);
        return null;
    }
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
	
	return finalModel;
}

function applyEventsToProject(project, events) {
    console.info(`Applying ${events.length} events to the view model for Project ${project.projectId}`);
    
    events.forEach(currentEvent => {
        switch(currentEvent.event) {
            case DomainCommands.CREATE_PROJECT:
                console.info(`Applying ${DomainCommands.CREATE_PROJECT} event to Project ${project.projectId}`);
                applyCreateCommand(project, currentEvent.eventRecord);
                break;
        }
    })
}

function applyCreateCommand(project, event) {
    project.setTitle(event.title);
    project.setPathOrAssignDefault(event.path);
    project.setTargetDateOrAssignDefault(project.targetDate);
    project.setStartDateOrAssignDefault(project.startDate);
    project.setStatus(project.status);
    project.setColorOrAssignDefault(project.color);
    project.setMethodologyOrAssignDefault(project.kind);
}