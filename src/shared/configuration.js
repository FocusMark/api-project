class Configuration {
    /**
     * 
     * @constructor
     * Creates a new instance of a configuration object for message bus event services and AWS region.
     * 
     */
    constructor() {
        this.awsRegion = process.env.AWS_REGION;
        this.deployed_environment = process.env.deployed_environment;
        
        this.events = {
            topic: process.env.sns_create_project_topic,
        };
        
        this.data = {
            dynamodb_projectTable: process.env.dynamodb_projectTable,
            dynamodb_endpointUrl: process.env.dynamodb_endpointUrl
        };
        
        // Force the environment to be 'local' if nothing is set to prevent
        // accidental work in other environments, such as prod.
        if (!this.deployed_environment) {
            this.deployed_environment = 'local';
        }
    }
}

module.exports = Configuration;