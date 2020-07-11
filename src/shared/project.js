const { v4: uuidv4 } = require('uuid');
const validate = require("validate.js");
const Status = require('../shared/status');
const Methodologies = require('../shared/methodologies');
const { FMErrors } = require('../shared/errors');

class Project {
    constructor(user, viewModel) {
        this.projectId = uuidv4();
        this.userId = user.userId;
        
        this.title = null;
        this.status = Status.PLANNING;
        this.path = '/';
        this.kind = Methodologies.KANBAN;
        
        // Generate random hex color
        this.color = Math.floor(Math.random()*16777215).toString(16);
        
        this.targetDate = null;
        this.startDate = null;
        
        this.mapViewModel(viewModel);
    }
    
    mapViewModel(viewModel) {
        for(const vmField in viewModel) {
            if (this[vmField] === undefined) {
                console.info(`Client sent the field ${vmField} which is not allowd on the model.`);
                throw FMErrors.JSON_INVALID_FIELDS;
            }
        }
        console.info(viewModel);
        for(const field in this) {
            if (field === 'projectId' || field === 'userId' || field === 'createdAt' || field === 'updatedAt') {
                continue;
            }

            if (viewModel[field] !== undefined) {
                console.info(`Mapping field '${field}' to Project`);
                this[field] = viewModel[field];
            } else {
                console.info(`Client sent a request body with the ${field} field missing.`);
                throw FMErrors.JSON_MISSING_FIELDS;
            }
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

module.exports = Project;