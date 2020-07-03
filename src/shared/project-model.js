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
        this.updatedAt = Date.now();
    }
    
    validate() {
        let constraints = this.createValidationConstraints();
        let validationResult = validate(this, constraints);
        return validationResult;
    }
    
    createValidationConstraints() {
        return {
            title: this.createTitleValidator(),
            userId: this.createUserValidator(),
            status: this.createStatusValidator(),
        }
    }
    
    createTitleValidator() {
        return {
            presence: { allowEmpty: false },
            length: { 
                minimum: 1, 
                maximum: 100,
                message: 'Must be at least 6 characters in length and no more than 100'
            },
            type: 'string'
        };
    }
    
    createStatusValidator() {
        // Construct a list of all allowed Status from the object itself and constrain to that list.
        let allowedStatus = [];
        for(const property in Status) {
            let value = Status[property];
            allowedStatus.push(value);
        }
        
        return {
            presence: { allowEmpty: false },
            type: 'string',
            inclusion: { 
                within: allowedStatus, 
                message: "'%{value}' is not allowed"
            }
        }
    }
    
    createUserValidator() {
        return {
            presence: { allowEmpty: false },
            type: 'string'
        }
    }
}

module.exports = ProjectModel;