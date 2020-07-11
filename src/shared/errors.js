const FMErrors = {
    MISSING_AUTHORIZATION: {
        code: 4011,
        message: 'Not authorized'
    },
    JSON_MALFORMED: {
        code: 4221,
        message: 'Json given is malformed.'
    },
    JSON_INVALID_FIELDS: {
        code: 4222,
        message: 'Invalid field found in the JSON for this request.'
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
}

module.exports = { FMErrors, AWSErrors };