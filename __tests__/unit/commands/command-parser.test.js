const { CommandParser, CommandParameterKey } = require('../../../src/commands/command-parser');

const chai = require('chai');

const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

describe('Test getCommandFromLambda', function() {
    it('should throw if missing Content-Type header', () => {
        let parser = new CommandParser();
        let event = { headers: {} };
        should.throw(() => parser.getCommandFromLambda(event));
    });
    
    it('should throw if missing domain-command parameter', () => {
        let parser = new CommandParser();
        let event = { 
            headers: {
            'Content-Type': `application/json`,
            },
        };
        
        should.throw(() => parser.getCommandFromLambda(event));
    });
    
    it('should throw if missing domain-command value', () => {
        let parser = new CommandParser();
        let event = { 
            headers: {
            'Content-Type': `application/json;${CommandParameterKey}=`,
            },
        };
        
        should.throw(() => parser.getCommandFromLambda(event));
    });
    
    it('should provide Command from Header', () => {
        let parser = new CommandParser();
        let expectedCommand = 'FooBar';
        let event = { 
            headers: {
            'Content-Type': `application/json;${CommandParameterKey}=${expectedCommand}`,
            },
        };
        
        let returnedCommand = parser.getCommandFromLambda(event);
        returnedCommand.should.equal(expectedCommand);
    });
});