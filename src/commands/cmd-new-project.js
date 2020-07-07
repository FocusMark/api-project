const Command = require('./cmd');
const Response = require('../shared/response');

class CommandCreateProject extends Command {
    constructor(command, domainEvent) {
        super(command, domainEvent);
    }
    
    async run() {
        console.info('Attempting to create a new Project');
        return new Response(202, {});
    }
}

module.exports = CommandCreateProject;