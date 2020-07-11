class QueryResponse {

    constructor(statusCode, data, errors, lastProjectId) {
        let body = {
            data: data,
            errors: errors,
            isSuccessful: errors ? false : true,
        };
        
        if (!body.data) {
            body.data = {};
        }
        if (!body.errors) {
            body.errors = [];
        }
        
        body.pagination = {};
        if (lastProjectId) {
            body.pagination.lastProjectId = lastProjectId;
            body.pagination.additionalDataAvailable = true;
        } else {
            body.pagination.additionalDataAvailable = false;
            body.pagination.lastProjectId = "None";
        }
        
        if (Array.isArray(data)) {
            body.pagination.pageSize = data.length;
        } else {
            body.pagination.pageSize = 1;
        }
        
        this.body = JSON.stringify(body);
        
        this.statusCode = statusCode;
        this.headers = {
            'Content-Type': 'application/json',
        };
    }
}

module.exports = QueryResponse;