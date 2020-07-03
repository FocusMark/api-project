# api-project
Project RESTful services for FocusMark

[![codebeat badge](https://codebeat.co/badges/09a38114-e0d9-4ebc-8e58-b654df741df2)](https://codebeat.co/projects/github-com-focusmark-api-project-feature-007-create-project)

This repository holds the source code needed for the FocusMark Project REST API Endpoint. The Project resource allows for creating projects that hold children resources related to projects within FocusMark.

The API adopts the Command Query Responsibility Segregation (CQRS) pattern. This repository contains several Lambdas, one per Command or Query that is supported by the service.

# Deployment

The deployment is handled using the [AWS Serverless Application Model (SAM)](https://aws.amazon.com/serverless/sam/). You can deploy the entire Project service from the `api-project` directory using the following set of CLI commands.

```
npm install

sam deploy \
  --template-file template.yaml \
  --stack-name focusmark-dev-sam-api-project \
  --parameter-overrides TargetEnvironment=dev \
  --s3-bucket aws-sam-cli-managed-default-samclisourcebucket-k4b4a4cnewcr \
  --s3-prefix focusmark-dev-sam-api_project \
  --capabilities CAPABILITY_NAMED_IAM
  
aws cloudformation deploy \
  --template-file domain-mapping.yaml \
  --stack-name focusmark-dev-cf-apiProjectDomainMapping \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides TargetEnvironment=dev
```