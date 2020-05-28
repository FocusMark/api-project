aws dynamodb create-table \
    --table-name focusmark-$deployed_environment-dynamodb-project \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
        AttributeName=projectId,KeyType=RANGE \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=projectId,AttributeType=S \
    --provisioned-throughput \
        ReadCapacityUnits=2,WriteCapacityUnits=2 \
    --endpoint-url http://localhost:8000