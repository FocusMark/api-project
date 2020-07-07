const ProjectDomainEvent = require('./project-domain-event');

const DomainEvents = {
    PROJECT_CREATED: 'project-created',
    PROJECT_STATUS_CHANGED: 'project-status-changed',
    PROJECT_MOVED: 'project-moved',
    PROJECT_RENAMED: 'project-renamed',
};

class EventFactory {
    fromCommand(domainEvent, payload, project) {
        return new ProjectDomainEvent(payload, domainEvent);
    }
}

module.exports = { DomainEvents, EventFactory };