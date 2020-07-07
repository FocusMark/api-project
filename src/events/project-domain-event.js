const { v4: uuidv4 } = require('uuid');

class ProjectDomainEvent {
    constructor(payload, domainEvent) {
        this.event = domainEvent;
        this.payload = payload;
        this.userId_ProjectId = `${payload.userId}_${payload.projectId}`;
        
        this.eventTime = Date.now();
        this.eventId = uuidv4();
    }
    
    applyOnProject(project) {
        console.info(`Applying ${this.event} event to project.`);
        for(const field in this.payload) {
            project[field] = this.payload[field];
        }
    }
}

module.exports = ProjectDomainEvent;