const Response = require('../../../src/shared/response');
const { v4: uuidv4 } = require('uuid');

const chai = require('chai');

const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

describe('Test constructor', function() {
    
    it('should assign statusCode', () => {
        let statusCode = 200;
        let response = new Response(statusCode);
        
        response.statusCode.should.equal(statusCode);
    });
    
    it('should assign data to body', () => {
        let data = {
            hello: 'world'
        };
        let response = new Response(200, data);
        
        expect(response.body).to.be.an('string');
        let body = JSON.parse(response.body);
        should.exist(body);
        body.data.hello.should.equal(data.hello);
    });
    
    it('should assign errors to body', () => {
        let errors = [
            'hello world'
        ];
        let response = new Response(200, null, errors);
        
        expect(response.body).to.be.an('string');
        let body = JSON.parse(response.body);
        should.exist(body);
        body.errors[0].should.equal(body.errors[0]);
    });
    
    it('should assign createdLocation to Header', () => {
        let id = uuidv4();
        let response = new Response(200, {hello:'world'}, null, id);
        
        should.exist(response.headers);
        should.exist(response.headers['Location']);
        response.headers['Location'].should.equal(id);
    });
    
    it('should assign application/json Content-Type Header', () => {
        let response = new Response();
        
        should.exist(response.headers);
        should.exist(response.headers['Content-Type']);
        response.headers['Content-Type'].should.equal('application/json');
    });
});