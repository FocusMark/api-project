const Configuration = require('../shared/configuration');
const CreateProjectCommand = require('../commands/create-project-command');

const AWS = require('aws-sdk');

/** Represents a valid and supported set of Domain commands. **/
const DomainCommands = {
    CREATE_PROJECT: 'create-project',
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
                return this.getCreateProjectCommand(command, CommandTypes.CREATE);
        }
    }
    
    getCreateProjectCommand(command, type) {
        let dynamoDbClient = new AWS.DynamoDB.DocumentClient();
        let sns = new AWS.SNS();
        return new CreateProjectCommand(command, CommandTypes.CREATE, dynamoDbClient, sns);
    }
}

module.exports = { CommandFactory, DomainCommands, CommandTypes }