const Errors = {
    HTTP_METHOD_NOT_SUPPORTED: {
        code: 1,
        message: 'The HTTP method used is not supported'
    },
    PROJECT_ID_MISSING: {
        code: 2,
        message: 'The projectId was not provided in the URL path.'
    },
    PROJECT_VALIDATION_FAILED: {
        code: 3,
        message: 'Project is not valid'
    },
    MALFORMED_BODY: {
        code: 4,
        message: 'field is not supported.'
    },
    MALFORMED_PROJECT_EVENT: {
        code: 5,
        message: 'Expected event to contain a valid payload. It did not.'
    },
    PROJECT_DOES_NOT_EXIST: {
        code: 6,
        message: 'The given project does not exist.'
    },
    COMMAND_NOT_SUPPORTED: {
        code: 7,
        message: 'The command provided is not supported.'
    },
};

module.exports = Errors;