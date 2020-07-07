// Shared model
const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Response = require('../shared/response');
const Errors = require('../shared/errors');

// Commands, Events & Data
const { EventFactory } = require('../event-factory');
const { CommandTypes, DomainCommands } = require('../command-factory');
const EventStore = require('../data/event-store');

class Command {
    constructor(command, domainEvent) {
        this.command = command;
        this.domainEvent = domainEvent;
        console.info(`Command Instantiated for domain event ${domainEvent} from the ${command.name} command.`);
        
        this.configuration = new Configuration();
        this.eventFactory = new EventFactory();
        this.eventStore = new EventStore();
    }
    
    async execute(httpEvent) {
        this.httpMethod = httpEvent.httpMethod;
        if (httpEvent.body) {
            console.info('Parsing HTTP body.');
            this.payload = JSON.parse(httpEvent.body)
            this.pathParameters = httpEvent.pathParameters;
        }
        
        console.info('Parsing Access Token');
        this.user = new JwtUser(httpEvent);
        
        // Initialize after the Command has parsed the event contents
        // so all of the data typically needed is available. Then run.
        try {
            await this.init();
        } catch(err) {
            console.info(err);
             if (err.code === Errors.PROJECT_ID_MISSING.code) {
                 return new Response(404, null);
             } else if (err.code === Errors.PROJECT_VALIDATION_FAILED.code) {
                 return new Response(422, null, err.message);
             } else {
                 return new Response(500, null);
             }
        }
        
        return await this.run();
    }
    
    async init() {
        // If this is a Create style command then we need to build a default Project model
        if (this.httpMethod === 'POST') {
            console.info('Command will create a new model.');
            this.project = this.createProjectFromPayload();
            
        // If this is an Update command then we need to restore the model from the event store.
        // This allows us to run validation against it before publishing event changes.
        } else if (this.httpMethod === 'PUT' || this.httpMethod === 'DELETE') {
            console.info('Command will update existing model.');
            this.project = await this.restoreProject();
        }
        
        let validationResult = this.project.validate();
        if (validationResult) {
            console.info(`Validation failed for Project ${this.project.projectId}.`);
            console.info(validationResult);
            throw Errors.PROJECT_VALIDATION_FAILED;
        }
    }
    
    async run() {
        // Stubbed
    }
    
    createProjectFromPayload() {
        let project = new ProjectModel();
        project.userId = this.user.userId;
        
        console.info(`Mapping new ProjectId (${project.projectId}) for user ${project.userId} to request body`);
        
        project.setTitle(this.payload.title);
        project.setPathOrAssignDefault(this.payload.path);
        project.setColorOrAssignDefault(this.payload.color);
        project.setMethodologyOrAssignDefault(this.payload.kind);
        project.setTargetDateOrAssignDefault(this.payload.targetDate);
        project.setStartDateOrAssignDefault(this.payload.startDate);

        console.info(`New project mapped: ${JSON.stringify(project)}`);
        return project;
    }
    
    async restoreProject() {
        // We must have the projectId in order to query.
        if (!this.pathParameters || !this.pathParameters.projectId) {
            throw Errors.PROJECT_ID_MISSING;
        }
        
        let projectId = this.pathParameters.projectId;
        console.info(`Preparing parameters to query Event Store ${this.configuration.data.dynamodb_projectEventSourceTable} for events related to Project ${projectId} for user ${this.user.userId}`);
        return await this.eventStore.getEventsForProject(projectId, this.user.userId);
    }
}

module.exports = Command;