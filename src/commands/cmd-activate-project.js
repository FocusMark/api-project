const AWS = require('aws-sdk');

const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const Response = require('../shared/response');
const Status = require('../shared/status');

// /project/{projectId} endpoint
class ActivateProjectCommand {
    constructor(command, type, dynamoDbClient, sns) {
        this.command = command;
        this.type = type;
        this.configuration = new Configuration();
        this.dynamoDbClient = dynamoDbClient,
        this.sns = sns;
    }
    
    async execute(httpEvent) {
        console.info('Parsing request body');
        const requestBody = JSON.parse(httpEvent.body);
        
        console.info('Parsing user');
        let user = new JwtUser(httpEvent);
        
        // TODO Query event store to ensure the project exists.
        
        // TODO insert new event record
        
        // TODO Update cmd-create-project so it inserts project-created as an event instead of create-project
        
        // TODO Complete event-factory
        
        // TODO Publish via SNS
    }
}

module.exports = ActivateProjectCommand;