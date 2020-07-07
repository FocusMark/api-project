const AWS = require('aws-sdk');

// Shared models
const Configuration = require('../shared/configuration');

class QueryStore {
    constructor() {
        this.dynamoDbClient = new AWS.DynamoDB.DocumentClient();
        this.configuration = new Configuration();
    }
    
    async saveProject(project) {
        console.info(`Persisting Project ${project.projectId} to the read-only query store.`);
        let newRecord = project;
        newRecord.updatedAt = Date.now();
        
        let putParameters = {
            TableName: this.configuration.data.dynamodb_projectTable,
            Item: newRecord,
        };
        
        await this.dynamoDbClient.put(putParameters).promise();
    }
}

module.exports = QueryStore;