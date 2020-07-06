let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { CommandFactory, CommandTypes } = require('../command-factory');
const { CommandParser } = require('../command-parser');
const Response = require('../shared/response');

let commandParser = new CommandParser();
let commandFactory = new CommandFactory();
    
// Receives an HTTP POST with a project creation command. Produces a creation event and stores it in the event store, publishing to SNS when completed.
exports.postItemHandler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return new Response(404, null, `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
 
    let command;
    let segment = AWSXRay.getSegment();
    let commandParseSegment = segment.addNewSubsegment('postItemHandler.command-parse');
    
    try {
        let desiredCommand = commandParser.getCommandFromLambda(event);
        command = commandFactory.fromCommand(desiredCommand);
    } catch(err) {
        return new Response(404, {}, err.message);
    } finally {
        commandParseSegment.close();
    }
    
    // We only allow CREATE command types when you perform a POST.
    if (command.commandType !== CommandTypes.CREATE) {
        return new Response(404, null, `The '${command.command}' command can not be used with HTTP POST.`);
    }
    
    console.info('Executing the command');
    let commandExecuteSegment = segment.addNewSubsegment('postItemHandler.command-execute');
    let response;
    
    try {
        response = await command.execute(event);
    } catch(err) {
        console.info(err.message);
        response = new Response(400, null, 'Server failed to process request');
    }
    
    commandExecuteSegment.close();
    return response;
}
