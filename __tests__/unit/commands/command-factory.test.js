const { CommandFactory, DomainCommands, CommandTypes } = require('../../../src/commands/command-factory');
const CreateProjectCommand = require('../../../src/commands/create-project-command');

const chai = require('chai');

const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

describe('Test constructor', function() {
        it('should assign allowed commands', () => {
        let factory = new CommandFactory();
        let commandCount = Object.keys(DomainCommands).length;
        
        factory.allowedCommands.length.should.equal(commandCount);
    });
});

describe('Test isCommandAllowed', function() {
    it('should return false if command is not allowed', () => {
        let factory = new CommandFactory();
        let invalidCommand = 'abcdefg';
        
        let result = factory.isCommandAllowed(invalidCommand);
        expect(result).to.be.false;
    });
    
    it('should return true if command is allowed', () => {
        let factory = new CommandFactory();
        let allowedCommands = factory.allowedCommands;
        let validCommand = allowedCommands[0];

        let result = factory.isCommandAllowed(validCommand);
        expect(result).to.be.true;
    });
    
    it('should return true if command is allowed', () => {
        let factory = new CommandFactory();
        let allowedCommands = factory.allowedCommands;
        let validCommand = allowedCommands[0];

        let result = factory.isCommandAllowed(validCommand);
        expect(result).to.be.true;
    });
    
    it('should return create-project command', () => {
        let factory = new CommandFactory();
        let allowedCommands = factory.allowedCommands;
        let validCommand = allowedCommands[0];

        let result = factory.isCommandAllowed(validCommand);
        expect(result).to.be.true;
    });
});

describe('Test fromCommand', function() {
    it('should throw if using an unsupported command', () => {
        let factory = new CommandFactory();
        let invalidCommand = 'abcdefg';
        
        should.throw(() => factory.fromCommand(invalidCommand));
    });
    
    it('should return create-project Command', () => {
        let factory = new CommandFactory();
        let command = DomainCommands.CREATE_PROJECT;
        
        let result = factory.fromCommand(command);
        
        expect(result).to.be.an.instanceof(CreateProjectCommand);
        expect(result.command).to.equal(command);
        expect(result.type).to.equal(CommandTypes.CREATE);
    });
});