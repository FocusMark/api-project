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
    
    async getProjectsForUser(userId) {
        let params = {
            TableName: this.configuration.data.dynamodb_projectTable,
            ExpressionAttributeValues: {
                ':uid': userId,
            },
            KeyConditionExpression: 'userId = :uid'
        };
        
        let queryResults = await this.dynamoDbClient.query(params).promise();
        let projects = queryResults.Items;
        
        // No reason to include the userId in the response. It exists in the table to query by but it should not go with the data.
        // Client apps can use their id_token or access_token to get this if needed.
        projects.forEach(item => delete item.userId);
        return projects;
    }
}

module.exports = QueryStore;