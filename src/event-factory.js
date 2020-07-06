const { v4: uuidv4 } = require('uuid');

const DomainEvents = {
    PROJECT_CREATED: 'project-created',
    PROJECT_DUEDATE_SCHEDULED: 'project-duedate-scheduled'
};

class EventFactory {
    getProjectCreatedEvent(newProject) {
        return {
            event: DomainEvents.PROJECT_CREATED,
            eventTime: Date.now(),
            userId_ProjectId: `${newProject.userId}_${newProject.projectId}`,
            eventId: uuidv4(),
            payload: {
                title: newProject.title,
                path: newProject.path,
                color: newProject.color,
                kind: newProject.kind,
                status: newProject.status,
                startDate: newProject.startDate,
                targetDate: newProject.targetDate
            },
        };
    }
    
    getProjectDueDateScheduledEvent(projectId, userId, dueDate) {
        return {
            event: DomainEvents.PROJECT_DUEDATE_SCHEDULED,
            timestamp: Date.now(),
            payload: {
                userId: userId,
                projectId: projectId,
                dueDate: dueDate,
            },
        };
    }
}

module.exports = { DomainEvents, EventFactory };