// Shared model
const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const Response = require('../shared/response');
const Errors = require('../shared/errors');
const ProjectModel = require('../shared/project-model');

// Commands, Events & Data
const { EventFactory } = require('../events/event-factory');
const EventStore = require('../events/event-store');

class Command {
    constructor(command, domainEvent, payloadTemplate) {
        this.command = command;
        this.domainEvent = domainEvent;
        this.payloadTemplate = payloadTemplate;
        console.info(`Command Instantiated for domain event ${domainEvent} from the ${command.name} command.`);
        
        this.configuration = new Configuration();
        this.eventFactory = new EventFactory();
        this.eventStore = new EventStore();
    }
    
    async execute(httpEvent) {
        this.request = httpEvent;
        if (httpEvent.body) {
            console.info('Parsing HTTP body.');
            this.requestBody = JSON.parse(httpEvent.body)
        } else if (this.payloadTemplate) {
            this.requestBody = this.payloadTemplate;
        }
        
        console.info('Parsing Access Token');
        this.user = new JwtUser(httpEvent);
        
        // Initialize after the Command has parsed the event contents
        // so all of the data typically needed is available. Then run.
        try {
            await this.init();
            return await this.run();
        } catch(err) {
            console.info(err);
            return this.handleErrors(err);
        }
    }
    
    async init() {
        console.info('Initializing base Command');
        if (this.request.httpMethod === 'PUT' && Object.keys(this.payloadTemplate).length != Object.keys(this.requestBody).length) {
            throw Errors.MALFORMED_BODY;
        }
        
        await this.setProject();
        
        let validationResult = this.project.validate();
        if (validationResult) {
            console.info(`Validation failed for Project ${this.project.projectId}.`);
            console.info(validationResult);
            throw Errors.PROJECT_VALIDATION_FAILED;
        }
        console.info('Initialization completed');
    }
    
    async run() {
        // TODO: Need to solve for producing a command based on current body or 'intent' (bodyless request).
        // Each event at the moment is just re-saving the same project data. - TEST THIS
        console.info('Running Command');
        
        let eventPayload = {
            projectId: this.project.projectId,
            userId: this.user.userId,
        };
        
        // Loop through each property in the template and pull the corresponding value
        // out of the project and stuff it into the event payload for saving/publishing.
        for(const field in this.payloadTemplate) {
            if (!this.project.hasOwnProperty(field)) {
                throw Errors.MALFORMED_BODY;
            } else if (this.request.httpMethod === 'PUT' && !this.requestBody.hasOwnProperty(field)) {
                throw Errors.MALFORMED_BODY;
            }
            
            // Transfer the field from our project model to the event payload.
            // We are just transfering the values that are allowed to be
            // changed as part of the command executing - defined by the payloadTemplate.
            eventPayload[field] = this.project[field];
        }
        
        console.info('Generating new event');
        let newEvent = this.eventFactory.fromCommand(this.domainEvent, eventPayload);
        console.info(eventPayload);

        try {
            await this.eventStore.saveEvent(newEvent);
            return new Response(202, this.project, null, this.project.projectId);
        } catch(err) {
            console.info(err);
            return new Response(500, null, 'Failed to create the Project.');
        }
    }
    
    async setProject() {
        this.project = new ProjectModel();
        this.project.userId = this.user.userId;
        
        if (this.request.httpMethod === 'PUT') {
            if (!this.request.pathParameters && !this.request.pathParameters.projectId) {
                throw Errors.PROJECT_ID_MISSING;
            }
            
            this.project = await this.eventStore.getEventsForProject(this.request.pathParameters.projectId, this.user.userId);
            if (!this.project) {
                throw Errors.PROJECT_ID_MISSING;
            }
        }
        
        this.buildProject(this.project);
    }
    
    buildProject(project) {
        console.info(`Mapping new ProjectId (${this.project.projectId}) for user ${this.project.userId} to request body`);
        
        if (this.requestBody.title) {
            project.setTitle(this.requestBody.title);   
        }
        if (this.requestBody.status) {
            project.setStatus(this.requestBody.status);
        }
        if (this.requestBody.path) {
            this.project.setPathOrAssignDefault(this.requestBody.path);
        }
        if (this.requestBody.color) {
            this.project.setColorOrAssignDefault(this.requestBody.color);
        }
        if (this.requestBody.kind) {
            this.project.setMethodologyOrAssignDefault(this.requestBody.kind);
        }
        if (this.requestBody.startDate) {
            this.project.setStartDateOrAssignDefault(this.requestBody.startDate);
        }
        if (this.requestBody.targetDate) {
            this.project.setTargetDateOrAssignDefault(this.requestBody.targetDate);
        }
        
        console.info(`New project mapped: ${JSON.stringify(this.project)}`);
    }
    
    handleErrors(err) {
        switch(err.code) {
            case Errors.PROJECT_ID_MISSING.code:
                return new Response(404, null);
            case Errors.PROJECT_VALIDATION_FAILED.code:
                return new Response(422, null, err.message);
            case Errors.MALFORMED_BODY.code:
                return new Response(422, null, err.message);
            default:
                return new Response(500, null);
        }
    }
}

module.exports = Command;