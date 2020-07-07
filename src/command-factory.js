const AWS = require('aws-sdk');

const { DomainEvents, EventFactory } = require('./event-factory');
const Configuration = require('./shared/configuration');
const CommandCreateProject = require('./commands/cmd-new-project');
const ActivateProjectCommand = require('./commands/cmd-activate-project');
const MoveProjectCommand = require('./commands/cmd-move-project');

/** Represents a valid and supported set of Domain commands. **/
const CommandTypes = {
    CREATE: 'POST',
    UPDATE: 'PUT',
    DELETE: 'DELETE',
};

const DomainCommands = {
    CREATE_PROJECT: {
        name: 'create-project',
        type: CommandTypes.CREATE
    },
    ACTIVATE_PROJECT: {
        name: 'activate-project',
        type: CommandTypes.UPDATE,
    },
    MOVE_PROJECT: {
        name: 'move-project',
        type: CommandTypes.UPDATE,
    },
};

class CommandFactory {
    
    constructor() {
        console.info('Instantiating Commandfactory. Creating list of allowed Commands');
        this.configuration = new Configuration();
    }
    
    isCommandAllowed(command, httpMethod) {
        console.info(`Checking if ${command} is compatible with the given ${httpMethod} verb.`);

        for(const supportedCommand in DomainCommands) {
            if (DomainCommands[supportedCommand].name === command) {
                console.info(`Command ${command} is compatible and accepted.`);
                return DomainCommands[supportedCommand].type === httpMethod;
            }
        }
        
        console.info(`Command ${command} is not allowed with the given verb.`);
        return false;
    }
    
    fromCommand(command) {
        switch(command) {
            // Make sure that if additional commands are added that the command-factory.test.js is updated.
            case DomainCommands.CREATE_PROJECT.name:
                console.info(`Command is identified as the ${DomainCommands.CREATE_PROJECT.name} command. Instantiating the associated Command.`);
                return this.getCreateProjectCommand(DomainCommands.CREATE_PROJECT, DomainEvents.PROJECT_CREATED, CommandTypes.CREATE);
            case DomainCommands.ACTIVATE_PROJECT.name:
                console.info(`Command is identified as the ${DomainCommands.ACTIVATE_PROJECT.name} command. Instantiating the associated Command.`);
                return this.getActivateProjectCommand(DomainCommands.ACTIVATE_PROJECT, DomainEvents.PROJECT_ACTIVATED, CommandTypes.UPDATE);
            case DomainCommands.MOVE_PROJECT.name:
                console.info(`Command is identified as the ${DomainCommands.MOVE_PROJECT.name} command. Instantiating the associated Command.`);
                return this.getMoveProjectCommand(DomainCommands.MOVE_PROJECT, DomainEvents.PROJECT_MOVED, CommandTypes.UPDATE);
        }
    }
    
    getCreateProjectCommand(command, domainEvent, commandType) {
        return new CommandCreateProject(command, domainEvent);
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