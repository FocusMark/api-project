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
        
        // The SAM Template defines an empty endpointUrl environment variable in
        // order to expose the dynamodb_endpointUrl to the Lambda when running
        // locally via SAM CLI. The host OS environment variables are not passed
        // threw to the local SAM session unless it is defined in the template.
        // If the blank Url is found we assume we're running in AWS and delete
        // the config property. If there is a value then we assume we are
        // running locally and leave it as-is.
        if (this.data.dynamodb_endpointUrl === '') {
            delete this.data.dynamodb_endpointUrl;
        }
    }
}

module.exports = Configuration;