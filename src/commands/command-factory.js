const AWS = require('aws-sdk');

const { DomainEvents } = require('../events/event-factory');
const Configuration = require('../shared/configuration');
const Status = require('../shared/status');

const CreateCommand = require('./command-create');
const UpdateCommand = require('./command-update');


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
                return new CreateCommand(DomainCommands.CREATE_PROJECT, DomainEvents.PROJECT_CREATED);
            case DomainCommands.ACTIVATE_PROJECT.name:
                console.info(`Command is identified as the ${DomainCommands.ACTIVATE_PROJECT.name} command. Instantiating the associated Command.`);
                return new UpdateCommand(DomainCommands.ACTIVATE_PROJECT, DomainEvents.PROJECT_ACTIVATED, { projectId: '', userId: '', status: Status.ACTIVE });
            case DomainCommands.MOVE_PROJECT.name:
                console.info(`Command is identified as the ${DomainCommands.MOVE_PROJECT.name} command. Instantiating the associated Command.`);
                return new UpdateCommand(DomainCommands.MOVE_PROJECT, DomainEvents.PROJECT_MOVED);
        }
    }
}

module.exports = { CommandFactory, DomainCommands, CommandTypes }