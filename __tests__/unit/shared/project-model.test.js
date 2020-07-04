const ProjectModel = require('../../../src/shared/project-model');
const Status = require('../../../src/shared/status');

const { v4: uuidv4 } = require('uuid');
const chai = require('chai');

const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

describe('Test constructor', function () {
    let userId = uuidv4();
    let title = 'test project';
    let defaultStatus = Status.PLANNING;
    
    it('should assign projectId to the model', () => {
        let project = new ProjectModel(userId, title);
        expect(project.projectId).to.exist;
    });
        
    it('should assign userId to the model', () => {
        let project = new ProjectModel(userId, title);
        project.userId.should.equal(userId);
    });
    
    it('should assign title to the model', () => {
        let project = new ProjectModel(userId, title);
        project.title.should.equal(title);
    });
    
    it('should assign createdAt to the model', () => {
        let project = new ProjectModel(userId, title);
        expect(project.createdAt).to.exist;
    });
    
    it('should assign updatedAt to the model', () => {
        let project = new ProjectModel(userId, title);
        expect(project.updatedAt).to.exist;
    });
    
    it('should assign default status to the model', () => {
        let project = new ProjectModel(userId, title);
        project.status.should.equal(defaultStatus);
    });
});

describe('Test setTitle', function() {
    let title = 'hello world';
    let userId = uuidv4();
    
    it('should change title when invoked', async () => {
        let newTitle = 'foobar';
        let project = new ProjectModel(userId, title);
        project.setTitle(newTitle);
        
        project.title.should.equal(newTitle);
    });
    
    it('should change updatedAt when title is changed', async () => {
        let newTitle = 'foobar';
        let project = new ProjectModel(userId, title);
        let currentUpdatedAt = project.updatedAt;

        await sleep(50);

        project.setTitle(newTitle);
        project.title.should.equal(newTitle);
        expect(project.updatedAt).to.be.above(currentUpdatedAt);
    });
});

describe('Test setStatus', function() {
    let title = 'hello world';
    let userId = uuidv4();
    let status = Status.PLANNING;
    
    it('should set status when invoked', async () => {
        let project = new ProjectModel(userId, title);
        project.setStatus(status);

        project.status.should.equal(status);
    });
    
    it('should change updatedAt when status is changed', async () => {
        let newStatus = Status.ACTIVE;
        let project = new ProjectModel(userId, title);
        let currentUpdatedAt = project.updatedAt;

        await sleep(50);

        project.setStatus(newStatus);
        expect(project.updatedAt).to.be.above(currentUpdatedAt);
    });
});

describe('Test validate', function() {
    let title = 'hello world';
    let userId = uuidv4();
    
    it('should fail when title is null', async () => {
        let project = new ProjectModel(userId, null);
        let validation = project.validate();

        expect(validation).to.exist;
        expect(validation.title).to.exist;
    });
    
    it('should fail when title is empty', async () => {
        let project = new ProjectModel(userId, "");
        let validation = project.validate();

        expect(validation).to.exist;
        expect(validation.title).to.exist;
    });
    
    it('should fail when title is whitespace', async () => {
        let project = new ProjectModel(userId, "   ");
        let validation = project.validate();

        expect(validation).to.exist;
        expect(validation.title).to.exist;
    });
    
    it('should fail when status is null', async () => {
        let project = new ProjectModel(userId, title);
        project.setStatus(null);
        let validation = project.validate();

        expect(validation).to.exist;
        expect(validation.status).to.exist;
    });
    
    it('should fail when status is empty', async () => {
        let project = new ProjectModel(userId, title);
        project.setStatus("");
        let validation = project.validate();

        expect(validation).to.exist;
        expect(validation.status).to.exist;
    });
    
    it('should fail when status is whitespace', async () => {
        let project = new ProjectModel(userId, title);
        project.setStatus(".  ");
        let validation = project.validate();

        expect(validation).to.exist;
        expect(validation.status).to.exist;
    });
    
    it('should fail when status is not supported value', async () => {
        let project = new ProjectModel(userId, title);
        project.setStatus('foobar');
        let validation = project.validate();

        expect(validation).to.exist;
        expect(validation.status).to.exist;
    });
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 