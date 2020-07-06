const AWS = require('aws-sdk');

const { DomainEvents, EventFactory } = require('./event-factory');
const Configuration = require('./shared/configuration');
const CreateProjectCommand = require('./commands/cmd-create-project');
const ActivateProjectCommand = require('./commands/cmd-activate-project');
const MoveProjectCommand = require('./commands/cmd-move-project');

/** Represents a valid and supported set of Domain commands. **/
const DomainCommands = {
    CREATE_PROJECT: 'create-project',
    ACTIVATE_PROJECT: 'activate-project',
    MOVE_PROJECT: 'move-project',
};

const CommandTypes = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
};

class CommandFactory {
    
    constructor() {
        console.info('Instantiating Commandfactory. Creating list of allowed Commands');
        this.configuration = new Configuration();
        this.allowedCommands = [];
        for(const property in DomainCommands) {
            this.allowedCommands.push(DomainCommands[property]);
        }
    }
    
    isCommandAllowed(command) {
        let isAllowed = this.allowedCommands.includes(command);
        return isAllowed;
    }
    
    fromCommand(command) {
        if (!this.isCommandAllowed(command)) {
            console.info(`The ${command} provided is not allowed.`);
            throw Error('Unknown domain command provided.');
        }
        
        switch(command) {
            // Make sure that if additional commands are added that the command-factory.test.js is updated.
            case DomainCommands.CREATE_PROJECT:
                console.info(`Command is identified as the ${DomainCommands.CREATE_PROJECT} command. Instantiating the associated Command.`);
                return this.getCreateProjectCommand(command, DomainEvents.PROJECT_CREATED, CommandTypes.CREATE);
            case DomainCommands.ACTIVATE_PROJECT:
                console.info(`Command is identified as the ${DomainCommands.ACTIVATE_PROJECT} command. Instantiating the associated Command.`);
                return this.getActivateProjectCommand(command, DomainEvents.PROJECT_ACTIVATED, CommandTypes.UPDATE);
            case DomainCommands.MOVE_PROJECT:
                console.info(`Command is identified as the ${DomainCommands.MOVE_PROJECT} command. Instantiating the associated Command.`);
                return this.getMoveProjectCommand(command, DomainEvents.PROJECT_MOVED, CommandTypes.UPDATE);
        }
    }
    
    getCreateProjectCommand(command, domainEvent, commandType) {
        let dynamoDbClient = new AWS.DynamoDB.DocumentClient();
        let sns = new AWS.SNS();
        return new CreateProjectCommand(command, commandType, domainEvent, dynamoDbClient, sns);
    }
    
    getActivateProjectCommand(command, domainEvent, commandType) {
        let dynamoDbClient = new AWS.DynamoDB.DocumentClient();
        let sns = new AWS.SNS();
        return new ActivateProjectCommand(command, commandType, domainEvent, dynamoDbClient, sns);
    }
    
    getMoveProjectCommand(command, domainEvent, commandType) {
        let dynamoDbClient = new AWS.DynamoDB.DocumentClient();
        let sns = new AWS.SNS();
        return new MoveProjectCommand(command, commandType, domainEvent, dynamoDbClient, sns);
    }
}

module.exports = { CommandFactory, DomainCommands, CommandTypes }