const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Response = require('../shared/response');

class CreateProjectCommand {
    
    constructor(command, type) {
        this.command = command;
        this.type = type;
    }
    
    async execute(httpEvent) {
        let user = new JwtUser(httpEvent);
        let project = new ProjectModel();
        
        return new Response(202, null, null, project.projectId);
    }
}

module.exports = CreateProjectCommand;