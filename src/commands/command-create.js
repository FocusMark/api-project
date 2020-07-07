const Command = require ('./command');


class CreateCommand extends Command {
    constructor(command, domainEvent) {
        super(command, domainEvent);
    }
    
    async init() {
        console.info('Initializing Create Command');

        await super.init();
    }
}

module.exports = CreateCommand;