// TODO: Possibly mimick our the Commands are simi-dynamic by evaluating Domaincommands.
// Can add a Queryparams that contains parameters we can filter off. Basic filtering.
// Compelx filtering will be handled by GraphQL. 
// For example const QueryParams = { IncludeArchived: 'included-archived' }
// Basic filtering will be limited to this service. No cross-service support. 
// For example - const QueryParams = { IncludeEmptyProjects: 'included-empty' } can't be done
// as this service would have to have knowledge of the other services and track their records. It won't.

const QueryType = {
    ALL_RECORDS: 'all-records',
    SPECIFIC_RECORD: 'single-record'
};

class QueryFactory {
    fromEvent(httpRequest) {
        
    }
}

module.exports = { QueryFactory, QueryType };