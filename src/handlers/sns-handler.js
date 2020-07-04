const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');
const ProjectModel = require('../shared/project-model');
const Methodologies = require('../shared/methodologies');
const Status = require('../shared/status');
const Response = require('../shared/response');

let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.handler = async (event, context) => {
    let segment = AWSXRay.getSegment();
    let eventParse = segment.addNewSubsegment('sns-handler.event-parse');
    
    
    
    let response = new Response(200, {} );
    
    eventParse.close();
    return response;
}
