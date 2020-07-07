const Errors = require('../shared/errors');
const Status = require('../shared/status');
const Response = require('../shared/response');

const EventStore = require('../events/event-store');
const QueryStore = require('../queries/query-store');

let eventStore = new EventStore();
let queryStore = new QueryStore();

exports.handler = async (event) => {
    console.info('Executing Project Event Subscription handler');
    let eventMessage = parseEvent(event.Records[0].Sns);
    
    let updatedProject = await getUpdatedProject(eventMessage);
    
    console.info('Validating replayed project');
    let validationResult = updatedProject.validate();
    if (validationResult) {
        console.info(`Validation failed for Project ${this.project.projectId}.`);
        console.info(validationResult);
        throw Errors.PROJECT_VALIDATION_FAILED;
    }
    
    if (updatedProject.status === Status.ARCHIVED || updatedProject.status === Status.DELETED) {
        // TODO: Delete from read-store. Leave in the EventStore.
    } else {
        await queryStore.saveProject(updatedProject);
    }
    
    return new Response(200);
}

function parseEvent(event) {
    console.info(`Parsing message for topic ${event.TopicArn} notification ${event.MessageId}`);
    let domainEvent = JSON.parse(event.Message);
    if (!domainEvent || !domainEvent.payload) {
        throw Errors.MALFORMED_PROJECT_EVENT;
    }
    
    console.info(`Parsing completed. Found Project ${domainEvent.payload.projectId} for user ${domainEvent.payload.userId}`);
    return {
        projectId: domainEvent.payload.projectId,
        userId: domainEvent.payload.userId,
        payload: domainEvent.payload,
        event: domainEvent,
    };
}

async function getUpdatedProject(eventMessage) {
    console.info('Replaying event history to update the model');
    let projectAggregate = await eventStore.getEventsForProject(eventMessage.projectId, eventMessage.userId);
    if (!projectAggregate) {
        throw Errors.PROJECT_DOES_NOT_EXIST;
    }
    
    for(const field in eventMessage.payload) {
        projectAggregate[field] = eventMessage.payload[field];
    }
    
    return projectAggregate;
}