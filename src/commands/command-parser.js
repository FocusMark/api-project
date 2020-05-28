const Response = require('../shared/response');
const CommandParameterKey = 'domain-command';

class CommandParser {
    getCommandFromLambda(event) {
        console.info('Getting the Command from the Lambda event.');
        let headerValue = this.getHeaderValue(event);
        let parameter = this.getParameter(headerValue);
        let requestedCommand = this.getCommandFromParameter(parameter);
        
        return requestedCommand;
    }
    
    getCommandFromParameter(parameter) {
        console.info('Looking for the command within the Header parameter.');
        let parameterParts = parameter.split('=');
        
        if (parameterParts.length !== 2 || !parameterParts[1].trim()) {
            throw Error(`Command not specified on the ${CommandParameterKey} Content-Type parameter`);
        }
        
        let command = parameterParts[1];
        console.info(`Found ${command} and returning it.`);
        return command;
    }
    
    getParameter(headerValue) {
        let valueParts = headerValue.split(';')
            .filter(element => element.includes(`${CommandParameterKey}=`));
        
        console.info(`${valueParts} discovered.`);
        if (valueParts.length === 0) {
            throw Error(`${CommandParameterKey} parameter is required on Content-Type`);
        }
        
        return valueParts[0].trim();
    }
    
    getHeaderValue(event) {
        console.info('Evaluating Headers');
        if (!event.headers) {
            throw Error(`Malformed request - no headers present.`);
        }
        
        if (!event.headers['Content-Type'] && !event.headers['content-type']) {
            console.info('Failed to find Content-Type header');
            throw Error(`Content-Type with a ${CommandParameterKey} parameter is required.`);
        }
        
        // We know from above we have PascalCasing or lowercasing.
        // So we check for both. API Gateway will force lowercasing in some cases.
        let headerValue = event.headers['Content-Type'];
        if (!headerValue) {
            headerValue = event.headers['content-type'];
        }
        
        console.info(`Found header and pulled value of '${headerValue}' out.`)
        return headerValue;
    }
}

module.exports = { CommandParser, CommandParameterKey }