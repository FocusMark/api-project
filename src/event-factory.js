const { v4: uuidv4 } = require('uuid');

const ProjectDomainEvent = require('./project-domain-event');

const DomainEvents = {
    PROJECT_CREATED: 'project-created',
    PROJECT_ACTIVATED: 'project-activated'
};

class EventFactory {
    getProjectCreatedEvent(newProject) {
        return new ProjectDomainEvent(newProject, DomainEvents.PROJECT_CREATED);
    }
    
    getProjectDueDateScheduledEvent(eventData) {
        return new ProjectDomainEvent(eventData, DomainEvents.PROJECT_ACTIVATED);
    }
}

module.exports = { DomainEvents, EventFactory };