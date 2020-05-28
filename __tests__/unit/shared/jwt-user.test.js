const JwtUser = require('../../../src/shared/jwt-user');

const { v4: uuidv4 } = require('uuid');
const chai = require('chai');

const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

describe('Test constructor', function() {
    let principle = { sub: uuidv4(), username: 'testuser' };
    let principleJson = JSON.stringify(principle);
    let buffer = Buffer.from(principleJson).toString('base64');
    let token = `abc.${buffer}.efg`;
    let validHeader = {
        'Authorization': `Bearer ${token}`
    };
    
    let httpEvent = { headers: validHeader };
    
    it('should throw if missing Authorization header', () => {
        should.throw(() => new JwtUser({headers: {}}));
    });
    
    it('should throw if missing Bearer', () => {
        let header = { 'Authorization': token };
        let event = { headers: header };
        should.throw(() => new JwtUser(event));
    });
    
    it('should throw if missing Jwt token', () => {
        let header = { 'Authorization': 'Bearer '};
        let event = { headers: header };
        should.throw(() => new JwtUser(event));
    });
    
    it('should assign userId', () => {
        let user = new JwtUser(httpEvent);
        user.userId.should.equal(principle.sub);
    });
    
    it('should assign username', () => {
        let user = new JwtUser(httpEvent);
        user.username.should.equal(principle.username);
    });
});