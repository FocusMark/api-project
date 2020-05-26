const { CommandFactory, CommandTypes } = require('../commands/command-factory');
const { CommandParser } = require('../commands/command-parser');
const Response = require('../shared/response');

exports.putItemHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return new Response(404, null, `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }

    // Get id and name from the body of the request
    console.info('Parsing request body');
    const body = JSON.parse(event.body);
    
    let commandParser = new CommandParser();
    let commandFactory = new CommandFactory();
    
    let desiredCommand = commandParser.getCommandFromLambda(event);
    let command;
    
    try {
        command = commandFactory.fromCommand(desiredCommand);
    } catch(err) {
        return new Response(404, null, err);
    }
    
    if (command.type !== CommandTypes.CREATE) {
        return new Response(404, null, `The '${command.command}' command can not be used with HTTP POST.`);
    }
    console.info('Executing the command');
    let response = await command.execute(event, body);

    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
