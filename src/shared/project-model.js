const { v4: uuidv4 } = require('uuid');
const Validator = require('jsonschema').Validator;
const validate = require("validate.js");
const Status = require('../shared/status');
const Methodologies = require('../shared/methodologies');

class ProjectModel {
    
    constructor(userId, title) {
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
    
    setPathOrAssignDefault(path) {
       if (!path) {
            this.path = '/';
        } else {
            if (path.startsWith('/')) {
                this.Path = path;
            } else {
                this.path = `/${path}`;
            }
        }
    }
    
    setTargetDateOrAssignDefault(targetDate) {
        if (targetDate) {
            if (!isNaN(targetDate)) {
                this.targetDate = Number(targetDate);
            } else {
                this.targetDate = null;
            }
        } else {
            this.targetDate = null;
        }
    }
    
    setStartDateOrAssignDefault(startDate) {
        if (startDate) {
            if (!isNaN(startDate)) {
                this.startDate = Number(startDate);
            } else {
                this.startDate = null;
            }
        } else {
            this.startDate = null;
        }
    }
    
    setStatus(status) {
        this.status = status;
        this.updatedAt = Date.now();
    }
    
    setColorOrAssignDefault(color) {
        if (color) {
            this.color = color;
        } else {
            // Generate random hex color
            this.color = Math.floor(Math.random()*16777215).toString(16);
        }
        
        this.updatedAt = Date.now();
    }
    
    setPath(path) {
        this.path = path;
        this.updatedAt = Date.now();
    }
    
    setMethodologyOrAssignDefault(kind) {
        if (kind) {
            this.kind = this.getProjectMethodology(kind);
        } else {
            this.kind = Methodologies.KANBAN;
        }
    }
    
    getProjectMethodology(methodology) {
        switch(methodology) {
            case Methodologies.KANBAN:
                return Methodologies.KANBAN;
            default: return Methodologies.KANBAN;
        }
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