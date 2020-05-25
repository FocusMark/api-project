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
        
    it('should assign userId to the model', () => {
        let project = new ProjectModel(title, userId);
        project.userId.should.equal(userId);
    });
    
    it('should assign title to the model', () => {
        let project = new ProjectModel(title, userId);
        project.title.should.equal(title);
    });
    
    it('should assign createdAt to the model', () => {
        let project = new ProjectModel(title, userId);
        expect(project.createdAt).to.exist;
    });
    
    it('should assign updatedAt to the model', () => {
        let project = new ProjectModel(title, userId);
        expect(project.updatedAt).to.exist;
    });
    
    it('should assign default status to the model', () => {
        let project = new ProjectModel(title, userId);
        project.status.should.equal(defaultStatus);
    });
});

describe('Test setTitle', function() {
    let title = 'hello world';
    let userId = uuidv4();
    
    it('should change updatedAt when title is changed', async () => {
        let newTitle = 'foobar';
        let project = new ProjectModel(title, userId);
        let currentUpdatedAt = project.updatedAt;

        await sleep(500);

        project.setTitle(newTitle);
        project.title.should.equal(newTitle);
        expect(project.updatedAt).to.be.above(currentUpdatedAt);
    });
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 