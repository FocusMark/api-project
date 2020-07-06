const { v4: uuidv4 } = require('uuid');

const ProjectDomainEvent = require('./project-domain-event');

const DomainEvents = {
    PROJECT_CREATED: 'project-created',
    PROJECT_ACTIVATED: 'project-activated',
    PROJECT_MOVED: 'project-moved'
};

class EventFactory {
    getProjectCreatedEvent(newProject) {
        return new ProjectDomainEvent(newProject, DomainEvents.PROJECT_CREATED);
    }
    
    getProjectActivatedEvent(eventData) {
        return new ProjectDomainEvent(eventData, DomainEvents.PROJECT_ACTIVATED);
    }
    
    getProjectMovedEvent(eventData) {
        return new ProjectDomainEvent(eventData, DomainEvents.PROJECT_MOVED);
    }
}

module.exports = { DomainEvents, EventFactory };