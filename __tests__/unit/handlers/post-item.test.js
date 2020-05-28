const lambda = require('../../../src/handlers/post-item.js'); 
const { DomainCommands } = require('../../../src/commands/command-factory');
const { CommandParameterKey } = require('../../../src/commands/command-parser');

const dynamodb = require('aws-sdk/clients/dynamodb'); 
const { v4: uuidv4 } = require('uuid');
const chai = require('chai');

const expect = chai.expect;
const should = chai.should();

// This includes all tests for putItemHandler() 
describe('Test putItemHandler', function () { 
    let principle = { sub: uuidv4(), username: 'testuser' };
    let principleJson = JSON.stringify(principle);
    let buffer = Buffer.from(principleJson).toString('base64');
    let token = `abc.${buffer}.efg`;
    
    let putSpy; 
 
    // Test one-time setup and teardown, see more in https://jestjs.io/docs/en/setup-teardown 
    beforeAll(() => { 
        // Mock dynamodb get and put methods 
        // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname 
        putSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'put'); 
    }); 
 
    // Clean up mocks 
    afterAll(() => { 
        putSpy.mockRestore(); 
    }); 
 
    // This test invokes putItemHandler() and compare the result  
    it('should add return 202 status code', async () => {
 
        // Return the specified value whenever the spied put function is called 
        putSpy.mockReturnValue({ 
            promise: () => Promise.resolve({}) 
        }); 
 
        const event = { 
            httpMethod: 'POST', 
            body: JSON.stringify({
                title: 'hello world', 
            }),
            headers: {
                'Content-Type': `application/json;${CommandParameterKey}=${DomainCommands.CREATE_PROJECT}`,
                Authorization: token
            }
        }; 
     
        // Invoke postItemHandler() 
        const result = await lambda.postItemHandler(event);
        let body = JSON.parse(result.body);

        // Compare the result with the expected result 
        expect(body.data).to.not.exist;
    }); 
}); 
 