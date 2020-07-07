const ProjectDomainEvent = require('./project-domain-event');

const DomainEvents = {
    PROJECT_CREATED: 'project-created',
    PROJECT_ACTIVATED: 'project-activated',
    PROJECT_MOVED: 'project-moved'
};

class EventFactory {
    fromCommand(domainEvent, payload) {
        return new ProjectDomainEvent(payload, domainEvent);
    }
}

module.exports = { DomainEvents, EventFactory };