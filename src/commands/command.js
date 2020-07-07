// Shared model
const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const Response = require('../shared/response');
const Errors = require('../shared/errors');

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
            this.payload = JSON.parse(httpEvent.body)
        } else if (this.payloadTemplate) {
            this.payload = this.payloadTemplate;
        }
        
        console.info('Parsing Access Token');
        this.user = new JwtUser(httpEvent);
        
        // Initialize after the Command has parsed the event contents
        // so all of the data typically needed is available. Then run.
        try {
            await this.init();
        } catch(err) {
            console.info(err);
            return this.handleInitErrors(err);
        }
        
        // Now that we have everything configured and ready for use, run the command.
        return await this.run();
    }
    
    async init() {
        console.info('Initializing base Command');
        if (!this.project) {
            throw Error('Sub-classed command did not assign `this.project` to a type of ProjectModel');
        }
        
        let validationResult = this.project.validate();
        if (validationResult) {
            console.info(`Validation failed for Project ${this.project.projectId}.`);
            console.info(validationResult);
            throw Errors.PROJECT_VALIDATION_FAILED;
        }
    }
    
    async run() {
        // TODO: Need to solve for producing a command based on current body or 'intent' (bodyless request).
        // Each event at the moment is just re-saving the same project data.
        console.info('Running base Command');
        let newEvent = this.eventFactory.fromCommand(this.domainEvent, this.project);

        try {
            await this.eventStore.saveEvent(newEvent);
            return new Response(202, this.project.projectId);
        } catch(err) {
            console.info(err);
            return new Response(500, null, 'Failed to create the Project.');
        }
    }
    
    handleInitErrors(err) {
        switch(err.code) {
            case Errors.PROJECT_ID_MISSING.code:
                return new Response(404, null);
            case Errors.PROJECT_VALIDATION_FAILED.code:
                return new Response(422, null, err.message);
            default:
                return new Response(500, null);
        }
    }
}

module.exports = Command;