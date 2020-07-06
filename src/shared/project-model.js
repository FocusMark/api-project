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
    }
    
    setTitle(title) {
        this.title = title;
    }
    
    setPathOrAssignDefault(path) {
       if (!path) {
            this.path = '/';
        } else {
            if (path.startsWith('/')) {
                this.path = path;
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
    }
    
    setColorOrAssignDefault(color) {
        if (color) {
            this.color = color;
        } else {
            // Generate random hex color
            this.color = Math.floor(Math.random()*16777215).toString(16);
        }
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
            kind: this.createMethodologyKindValidator(),
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
    
    createMethodologyKindValidator() {
        // Construct a list of all allowed Status from the object itself and constrain to that list.
        let allowedKind = [];
        for(const property in Methodologies) {
            let value = Methodologies[property];
            allowedKind.push(value);
        }
        
        return {
            presence: { allowEmpty: false },
            type: 'string',
            inclusion: { 
                within: allowedKind, 
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