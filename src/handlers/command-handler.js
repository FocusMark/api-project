let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const Errors = require('../shared/errors');
const { CommandFactory, CommandTypes } = require('../commands/command-factory');
const { CommandParser } = require('../commands/command-parser');
const Response = require('../shared/response');

let commandParser = new CommandParser();
let commandFactory = new CommandFactory();

exports.commandHandler = async (event, context) => {
    let command = getCommand(event);
    
    try {
        console.info('Executing the requested command.');
        return await command.execute(event);
    } catch(err) {
        return new Response(400, null, `${err.code}: ${err.message}`);
    }
}

function getCommand(event) {
    try {
        // TODO: Ensure POST is used for CREATE types and PUT is used for UPDATE types
        console.info('Discovering command to execute');
        let desiredCommand = commandParser.getCommandFromLambda(event);

        if (!commandFactory.isCommandAllowed(desiredCommand, event.httpMethod)) {
            return new Response(404, {}, 'Command not allowed.');
        }
        
        console.info(`Request contained ${desiredCommand} command. Attempting to instantiate.`);
        return commandFactory.fromCommand(desiredCommand);
    } catch(err) {
        console.error(err);
        return new Response(404, {}, `Command missing or not supported.`);
    }
}