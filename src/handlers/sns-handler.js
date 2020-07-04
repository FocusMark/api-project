const Response = require('../shared/response');

let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.handler = async (event, context) => {
    let segment = AWSXRay.getSegment();
    let commandParseSegment = segment.addNewSubsegment('postItemHandler.command-parse');
    
    let commandExecuteSegment = segment.addNewSubsegment('postItemHandler.command-execute');
    let response = new Response(200, {} );
    
    commandParseSegment.close();
    return response;
}
