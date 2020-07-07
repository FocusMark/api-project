const Command = require('./command');

const Errors = require('../shared/errors');

class UpdateCommand extends Command {
    constructor(command, domainEvent, payloadTemplate) {
        super(command, domainEvent, payloadTemplate);
    }
    
    async init() {
        console.info('Initializing Update Command');
        
        // We must have the projectId in order to query.
        if (!this.request.pathParameters || !this.request.pathParameters.projectId) {
            throw Errors.PROJECT_ID_MISSING;
        }
        
        let projectId = this.request.pathParameters.projectId;
        
        console.info(`Preparing parameters to query Event Store ${this.configuration.data.dynamodb_projectEventSourceTable} for events related to Project ${projectId} for user ${this.user.userId}`);
        this.project = await this.eventStore.getEventsForProject(projectId, this.user.userId);
        if (!this.project) {
            throw Errors.PROJECT_ID_MISSING;
        }
        
        // Update the project to reflect changes made from the requested .ayload
        for(const field in this.payload) {
            this.project[field] = this.payload[field];
        }
        
        await super.init();
    }
}

module.exports = UpdateCommand;