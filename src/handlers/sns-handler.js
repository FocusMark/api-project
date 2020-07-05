const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Methodologies = require('../shared/methodologies');
const Status = require('../shared/status');
const Response = require('../shared/response');

let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));
let configuration = new Configuration();

var eventStore = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

exports.handler = async (event) => {
    let segment = AWSXRay.getSegment();
    let eventParse = segment.addNewSubsegment('sns-handler.event-parse');
    
    let payload = parseEvent(event.Records[0].Sns);
    if (!payload) {
        return new Response(400, null, 'Unable to parse the event correctly');
    }
    
    let eventStoreParams = createEventStoreQueryParams(payload.projectId, payload.userId);
    let eventStoreQuery = await eventStore.query(eventStoreParams).promise();
    let finalModel = aggregateEvents(eventStoreQuery.Items, payload.userId, payload.projectId);
    
    let response = new Response(200, finalModel);
    
    eventParse.close();
    return response;
}

function parseEvent(event) {
    let payload = JSON.parse(event.Message);
    let projectId = payload.projectId;
    let userId = event.MessageAttributes.RecordOwner.Value;
    
    if (payload.userId === userId) {
        return {
            projectId: projectId,
            userId: userId,
            project: payload
        };
    } else {
        return null;
    }
}

function createEventStoreQueryParams(projectId, userId) {
    return {
        TableName: configuration.data.dynamodb_projectEventSourceTable,
        ExpressionAttributeValues: {
            ':upid': `${userId}_${projectId}`,
        },
        KeyConditionExpression: 'userId_ProjectId = :upid'
    };
}

function aggregateEvents(events, userId, projectId) {
    let sortedEvents = events
        .filter(item => item.userId_ProjectId === `${userId}_${item.projectId}`)
		.sort((item1, item2) => item1.eventTime - item2.eventTime);
	
	console.info(JSON.stringify(sortedEvents));
	var finalModel;
	
	for(const event in sortedEvents) {
	    for(const property in event.eventRecord) {
	        finalModel[property] = event.eventRecord[property];
	    }
	}
	
	return finalModel;
}