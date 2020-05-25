const { v4: uuidv4 } = require('uuid');
const Validator = require('jsonschema').Validator;
const validate = require("validate.js");
const Status = require('../shared/status');

class ProjectModel {
    
    constructor(title, userId) {
        this.userId = userId;
        this.projectId = uuidv4();
        
        this.setTitle(title);
        this.setStatus(Status.PLANNING);
        
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }
    
    setTitle(title) {
        this.title = title;
        this.updatedAt = Date.now();
    }
    
    setStatus(status) {
        this.status = status;
    }
    
    validate() {
        let validationConstraints = this.createValidationConstraints();
        let validationResult = validate(this, validationConstraints);
        console.info(validationResult);
        return validationResult;
    }
    
    createValidationConstraints() {
        let constraints = {
            title: this.createTitleValidator(),
            userId: this.createUserValidator(),
        }
    }
    
    createTitleValidator() {
        return {
            presence: true,
            length: { minimum: 1, maximum: 100 },
            type: 'string',
        }
    }
    
    createTitleValidator() {
        return {
            presence: true,
            type: 'string',
            format: '/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i'
        }
    }
}

module.exports = ProjectModel;