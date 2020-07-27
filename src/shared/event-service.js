const AWS = require('aws-sdk');

const Configuration = require('./configuration');

class EventService {
    constructor() {
        this.sns = new AWS.SNS();
        this.configuration = new Configuration();
    }
    
    async publishProjectCreated(project, userId) {
        const eventType = 'project-created';
        let eventAttributes = this.getEventAttributes(eventType, userId);
        
        await this.publish(project, eventType, eventAttributes);
    }
    
    async publishProjectUpdated(project, userId) {
        const eventType = 'project-updated';
        let eventAttributes = this.getEventAttributes(eventType, userId);
        
        await this.publish(project, eventType, eventAttributes);
    }
    
    async publishProjectDeleted(projectId, userId) {
        const eventType = 'project-deleted';
        let eventAttributes = this.getEventAttributes(eventType, userId);
        
        await this.publish({projectId: projectId}, eventType, eventAttributes);
    }
    
    async publish(message, subject, attributes) {
        this.cleanMessage(message);
        
        let snsParams = {
            Subject: subject,
            Message: JSON.stringify(message),
            TopicArn: this.configuration.events.topic,
            MessageAttributes: attributes,
        };
        
        console.info(`Publishing ${subject} event.`)
        await this.sns.publish(snsParams).promise();
        console.info('Publish completed.');
    }
    
    getEventAttributes(eventType, userId) {
        return {
            Version: {
                DataType: 'String',
                StringValue: '2020-04-23',
            },
            Event: {
                DataType: 'String',
                StringValue: eventType
            },
            Owner: {
                DataType: 'String',
                StringValue: userId
            }
        };
    }
    
    cleanMessage(project) {
        delete project.createdAt;
        delete project.updatedAt;
        delete project.userId;
        delete project.clientsUsed;
    }
}

module.exports = EventService;