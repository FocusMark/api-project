let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { CommandFactory, CommandTypes } = require('../commands/command-factory');
const { CommandParser } = require('../commands/command-parser');
const Response = require('../shared/response');

let commandParser = new CommandParser();
let commandFactory = new CommandFactory();
    
// Receives an HTTP POST with a project creation command. Produces a creation event and stores it in the event store, publishing to SNS when completed.
exports.putItemHandler = async (event, context) => {
    if (event.httpMethod !== 'PUT') {
        return new Response(404, null, `This endpoint only accepts PUT methods. You tried: ${event.httpMethod}`);
    }
    
    let command;
    let segment = AWSXRay.getSegment();
    let commandParseSegment = segment.addNewSubsegment('putItemHandler.command-parse');
    
    try {
        let desiredCommand = commandParser.getCommandFromLambda(event);
        command = commandFactory.fromCommand(desiredCommand);
    } catch(err) {
        return new Response(404, {}, err.message);
    }  finally {
        commandParseSegment.close();
    }
    
    // We never allow CREATE & DELETE with this handler.
    if (command.type === CommandTypes.CREATE || command.type === CommandTypes.DELETE) {
        return new Response(404, null, `The ${command.command} command can not be used wit HTTP PUT.`);
    }
    
    console.info('Executing the command');
    let commandExecuteSegment = segment.addNewSubsegment('putItemHandler.command-execute');
    let response;
    
    try {
        response = await command.execute(event);
    } catch(err) {
        console.info(err.message);
        response = new Response(400, null, 'Server failed to process request');
    }
    
    commandExecuteSegment.close();
    return response;
};