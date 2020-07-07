const { DomainEvents } = require('../events/event-factory');

const ProjectModel = require('../shared/project-model');

const Command = require('./command');


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
    CHANGE_PROJECT_STATUS: {
        name: 'change-project-status',
        type: CommandTypes.UPDATE,
    },
    MOVE_PROJECT: {
        name: 'move-project',
        type: CommandTypes.UPDATE,
    },
    RENAME_PROJECT: {
        name: 'rename-project',
        type: CommandTypes.UPDATE,
    },
};

class CommandFactory {
    
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
                return new Command(DomainCommands.CREATE_PROJECT, DomainEvents.PROJECT_CREATED, new ProjectModel());
            case DomainCommands.CHANGE_PROJECT_STATUS.name:
                console.info(`Command is identified as the ${DomainCommands.CHANGE_PROJECT_STATUS.name} command. Instantiating the associated Command.`);
                return new Command(DomainCommands.CHANGE_PROJECT_STATUS, DomainEvents.PROJECT_STATUS_CHANGED, { status: '' });
            case DomainCommands.MOVE_PROJECT.name:
                console.info(`Command is identified as the ${DomainCommands.MOVE_PROJECT.name} command. Instantiating the associated Command.`);
                return new Command(DomainCommands.MOVE_PROJECT, DomainEvents.PROJECT_MOVED, { path: '' });
            case DomainCommands.RENAME_PROJECT.name:
                console.info(`Command is identified as the ${DomainCommands.RENAME_PROJECT.name} command. Instantiating the associated Command.`);
                return new Command(DomainCommands.RENAME_PROJECT, DomainEvents.PROJECT_RENAMED, { title: '' });
        }
    }
}

module.exports = { CommandFactory, DomainCommands, CommandTypes }