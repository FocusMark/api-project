echo Deploying into the $deployed_environment environment.
npm install

# Execute the SAM CLI Deploy command to upload the Lambdas to S3 and deploy them
sam_stack_name=focusmark-"$deployed_environment"-sam-api-project
sam_template_file='template.sam'
sam_s3_bucket_name=focusmark-$deployed_environment-s3-deployments

echo Deploying the $sam_stack_name stack.
sam deploy \
  --template-file $sam_template_file \
  --stack-name $sam_stack_name \
  --parameter-overrides TargetEnvironment=$deployed_environment \
  --s3-bucket $sam_s3_bucket_name \
  --s3-prefix focusmark-$deployed_environment-sam-api_project \
  --capabilities CAPABILITY_NAMED_IAM

# Execute the CloudFormation template needed to map the API Gateway associated with the above SAM tempalte
# to the existing custom domain deployed with the core infrastructure
cf_stack_name=focusmark-"$deployed_environment"-cf-apiProjectDomainMapping
cf_template_file='domain-mapping.yaml'

echo Deploying the $cf_stack_name stack.
aws cloudformation deploy \
  --template-file $cf_template_file \
  --stack-name $cf_stack_name \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides TargetEnvironment=$deployed_environment