const Configuration = require('../shared/configuration');
const Response = require('../shared/response');
const JwtUser = require('../shared/jwt-user');

const AWS = require('aws-sdk');
let dynamoDbClient = new AWS.DynamoDB.DocumentClient();
let configuration = new Configuration();

exports.getAllItemsHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`This endpoint only accepts GET method, you tried: ${event.httpMethod}`);
    }
    console.info(configuration);
    let user = new JwtUser(event);
    var params = {
        TableName : configuration.data.dynamodb_projectTable,
        ExpressionAttributeValues: {
            ':uid': user.userId,
        },
        KeyConditionExpression: 'userId = :uid'
    };
    
    const data = await dynamoDbClient.query(params).promise();
    const items = data.Items;
    
    // No reason to include the userId in the response. It exists in the table to query by but it should not go with the data.
    // Client apps can use their id_token or access_token to get this if needed.
    items.forEach(item => delete item.userId);

    const response = {
        statusCode: 200,
        body: JSON.stringify(items)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
