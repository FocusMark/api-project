const FMErrors = {
    MISSING_AUTHORIZATION: {
        code: 4011,
        message: 'Not authorized'
    },
    INVALID_ROUTE: {
        code: 4041,
        message: 'Invalid API route requested.'
    },
    JSON_MALFORMED: {
        code: 4221,
        message: 'Json given is malformed.'
    },
    JSON_INVALID_FIELDS: {
        code: 4222,
        message: 'Invalid field(s) found in the JSON for this request.'
    },
    JSON_MISSING_FIELDS: {
        code: 4223,
        message: 'Missing field(s) in the JSON for this request.'
    },
};

const AWSErrors = {
    DYNAMO_NEW_PUT_FAILED: {
        code: 1001,
        message: 'Failed to create the record'
    },
    DYNAMO_UPDATE_PUT_FAILED: {
        code: 1002,
        message: 'Failed to update the record'
    },
    DYNAMO_GET_FAILED: {
        code: 4041,
        message: 'Not found'
    },
}

module.exports = { FMErrors, AWSErrors };