const { v4: uuidv4 } = require('uuid');
const { DomainEvents } = require('./event-factory');

class ProjectDomainEvent {
    constructor(payload, domainEvent) {
        this.event = domainEvent;
        this.eventTime = Date.now();
        this.userId_ProjectId = `${payload.userId}_${payload.projectId}`;
        this.eventId = uuidv4();
        this.payload = payload;
    }
}

module.exports = ProjectDomainEvent;