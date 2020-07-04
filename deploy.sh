sam_stack_name=focusmark-"$deployed_environment"-sam-api-project
sam_template_file='template.yaml'
sam_s3_bucket_name=focusmark-$deployed_environment-sam-deployments

cf_stack_name=focusmark-"$deployed_environment"-cf-apiProjectDomainMapping
cf_template_file='domain-mapping.yaml'



aws s3api create-bucket --acl private --bucket $sam_s3_bucket_name --region us-east-1

npm install

sam deploy \
  --template-file $sam_template_file \
  --stack-name $sam_stack_name \
  --parameter-overrides TargetEnvironment=$deployed_environment \
  --s3-bucket $sam_s3_bucket_name \
  --s3-prefix focusmark-$deployed_environment-sam-api_project \
  --capabilities CAPABILITY_NAMED_IAM
  
aws cloudformation deploy \
  --template-file $cf_template_file \
  --stack-name $cf_stack_name \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides TargetEnvironment=$deployed_environment