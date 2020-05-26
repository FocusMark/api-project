const CreateProjectCommand = require('../commands/create-project');

/** Represents a valid and supported set of Domain commands. **/
const DomainCommands = {
    CREATE_WORKBOOK: 'create-workbook',
};

const CommandTypes = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
};

class CommandFactory {
    
    constructor() {
        console.info('Instantiating Commandfactory. Creating list of allowed Commands');
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
            throw 'Unknown domain command provided.';
        }
        
        switch(command) {
            case DomainCommands.CREATE_WORKBOOK:
                console.info(`Command is identified as the ${DomainCommands.CREATE_WORKBOOK} command. Instantiating the associated Command.`);
                return new CreateProjectCommand(command, CommandTypes.CREATE);
        }
    }
}

module.exports = { CommandFactory, DomainCommands, CommandTypes }