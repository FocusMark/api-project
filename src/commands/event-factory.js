const DomainEvents = {
    PROJECT_CREATED: 'project-created',
    PROJECT_DUEDATE_SCHEDULED: 'project-duedate-scheduled'
};

class EventFactory {
    getProjectCreatedEvent(projectId, userId, projectTitle, projectPath) {
        return {
            event: DomainEvents.PROJECT_CREATED,
            timestamp: Date.now(),
            payload: {
                userId: userId,
                projectId: projectId,
                title: projectTitle,
                path: projectPath,
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