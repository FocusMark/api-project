const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Response = require('../shared/response');

class CreateProjectCommand {
    
    constructor(command, type) {
        this.command = command;
        this.type = type;
    }
    
    async execute(httpEvent, requestBody) {
        let user = new JwtUser(httpEvent);
        
        let project = new ProjectModel(requestBody.title, user.userId);
        
        return new Response(202, null, null, project.projectId);
    }
}

module.exports = CreateProjectCommand;