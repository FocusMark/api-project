const Command = require ('./command');

const ProjectModel = require('../shared/project-model');

class CreateCommand extends Command {
    constructor(command, domainEvent) {
        super(command, domainEvent);
    }
    
    async init() {
        console.info('Initializing Create Command');
        this.project = new ProjectModel();
        this.project.userId = this.user.userId;
        
        console.info(`Mapping new ProjectId (${this.project.projectId}) for user ${this.project.userId} to request body`);
        
        this.project.setTitle(this.payload.title);
        this.project.setPathOrAssignDefault(this.payload.path);
        this.project.setColorOrAssignDefault(this.payload.color);
        this.project.setMethodologyOrAssignDefault(this.payload.kind);
        this.project.setTargetDateOrAssignDefault(this.payload.targetDate);
        this.project.setStartDateOrAssignDefault(this.payload.startDate);

        console.info(`New project mapped: ${JSON.stringify(this.project)}`);
        await super.init();
    }
}

module.exports = CreateCommand;