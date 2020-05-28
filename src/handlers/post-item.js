let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));
// AWSXRay.setContextMissingStrategy("LOG_ERROR");

const { CommandFactory, CommandTypes } = require('../commands/command-factory');
const { CommandParser } = require('../commands/command-parser');
const Response = require('../shared/response');

let commandParser = new CommandParser();
let commandFactory = new CommandFactory();
    
exports.postItemHandler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return new Response(404, null, `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }

    let command;
    // let segment = AWSXRay.getSegment();
    // let appSegment = segment.addNewSubsegment('postItemHandler.command-parse');
    
    try {
        let desiredCommand = commandParser.getCommandFromLambda(event);
        command = commandFactory.fromCommand(desiredCommand);
    } catch(err) {
        return new Response(404, {}, err.message);
    }
    
    // We only allow CREATE command types when you perform a POST.
    if (command.type !== CommandTypes.CREATE) {
        return new Response(404, null, `The '${command.command}' command can not be used with HTTP POST.`);
    }
    
    console.info('Executing the command');
    try {
        let response = await command.execute(event);
        console.info(response);
        return response;
    } catch(err) {
        console.info(err.message);
        return new Response(400, null, 'Server failed to process request');
    }
}
