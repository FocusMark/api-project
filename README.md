The FocusMark Project API repository contains all of the AWS CloudFormation templates used to deploy the supporting resources that the FocusMark Project Microservice API.

This represents a single API service out of several. The diagram below shows the high-level microservice design for the API. This repository contains the Project Microservice.

![Architecture](/docs/api-architecture.jpeg)

The repository consists of bash scripts, JavaScript Lambdas and CloudFormation templates. It has been built and tested in a Linux environment. There should be very little work needed to deploy from macOS; deploying from Windows is not supported at this time but could be done with a little effort.

# Requirements

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv1.html)
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

### Environment Variables

In order to run the deployment script you must have your environment set up with a few environment variables. The following table outlines the environment variables required with example values.

| Key                  | Value Type | Description | Examples                                           |
|----------------------|------------|-------------|----------------------------------------------------|
| deployed_environment | string     | The name of the environment you are deploying into | dev or prod |
| focusmark_productname | string | The name of the product. You _must_ use the name of a Domain that you own. | SuperTodo |


In Linux or macOS environments you can set this in your `.bash_profile` file.

```
export deployed_environment=dev
export focusmark_productname=supertodo

PATH=$PATH:$HOME/.local/bin:$HOME/bin
```

once your `.bash_profile` is set you can refresh the environment

```
$ source ~/.bash_profile
```

The `deployed_environment` and `focusmark_productname` environment variables will be used in all of the names of the resources provisioned during deployment. Using the `prod` environment and `supertodo` as the product name for example, the DynamoDB Table created to store Project records will be created as `supertodo-prod-dynamodb-projectstore`.

# Infrastructure

The core infrastructure in this repository consists of the following:

- DynamoDB Table for storing Project records owned by this Microservice API
- 3 NodeJS Lambdas - one for HTTP POST, PUT and DELETE.
- 2 NodeJS Lambdas - for for HTTP GET (to retrieve all records) and one for HTTP GET by Id
- 5 IAM Roles, one per Lambda.
- SNS Topic for Project record change notification
- API Gateway bound to the Custom Domain created by the [API Infrastructure Repository](https://github.com/focusmark/api-infrastructure).

![Architecture](/docs/api-architecture-resources.jpeg)

# Deployment

In order to deploy the infrastructure you just need to execute the bash script included in the root directory from a terminal:

```
$ sh deploy.sh
```

This will deploy the Serverless Application Model (SAM) CloudFormation Stack first followed by a traditional CloudFormation Stack second.

The following diagram shows the deployment order required to successfully deploy from this repository.

![Deployment](/docs/api-architecture-deployment.jpeg)

# Usage

The repository deploys the complete Project Microservic API. Each of the endpoints deployed requires authorization via Bearer Acess Tokens in the `Authorization` header. The tokens must come from a valid Cognito instance as the API Gateway deployed in this repository will validate the token against that instance. The instance must be discoverable via CloudFormation with an export of `{productname}-{TargetEnvironment}-customeruserpoolarn`. You will need to replace the `productname` and the `TargetEnvironment` elements with what you provide as environment variables above for `deployed_environment` and `focusmark_productname`. For instance, if `focusmark_productname` was **supertodo** and the `deployed_environment` was **prod** then your export must be `supertodo-prod-customeruserpoolarn`.

> To learn how to generate an Access Token you can refer to the deployment documentation in the [Auth Infrastructure Repository](https://github.com/focusmark/auth-infrastructure).

The response body will typically include the following object, hydrated.

```
{
    "data": {},
    "error": {},
    "isSuccessful": true,
    "pagination": {
        "additionalDataAvailable": false,
        "lastId": "None",
        "pageSize": 1
    }
}
```

Errors in the response are always a single error. If the request encounters an error it immediately ends the request and returns the following error object. If your request is multiple errors you will not know until you have fixed the first error and made a follow-up request.

```
{
    "data": {},
    "error": {
        "code" 1234,
        "message": "helpful error message here"
    },
    "isSuccessful": false,
}
```

### Create a Project

This API endpoint will create a new Project record and return a `Location` header with the URL route to fetch the resource by Id. It will also include the `projectId` in the response body.

#### Route

`POST /project`

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `title` |`string`| The title, or name, of the Project |
| `path` | `string` | The folder path that the Project will live under |
| `status` | `string` | The current status of the Project. Allowed values can be `Planning`, `Active`, `Archived` and `Deleted` |
| `kind` | `string` | The kind of project methodology used by the Project. Currently only `Kanban` is supported. |
| `color` | `hex string` | The hexidecimal value representing a color used to represent the project. |
| `targetDate` | `number` | A date/time value since epoch representing the date that the Project is targeting for completion |
| `startDate` | `number` | A date/time value since epoch representing the date that the Project started. |

#### Examples

```
{
	"title":"Foo Bar!",
	"path": "/Home",
	"status": "Active",
	"kind": "Kanban",
	"color": "1eb850",
	"targetDate": null,
	"startDate": null
}
```

#### Response

```
Status: 201 Created
Location: https://api.focusmark.app/projects/ebb2bcf8-7660-4013-b978-ac48f190a7dd
```
```
{
    "data": {
        "projectId": "3c19039b-3e69-4254-a37a-a3aa33dae8d5"
    },
    "error": {},
    "isSuccessful": true
}
```

### Update a Project

This API endpoint will update an existing Project record. The response body will include the `ProjectId`.

#### Route

`PUT /project/{projectId}`

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `title` |`string`| The title, or name, of the Project |
| `path` | `string` | The folder path that the Project will live under |
| `status` | `string` | The current status of the Project. Allowed values can be `Planning`, `Active`, `Archived` and `Deleted` |
| `kind` | `string` | The kind of project methodology used by the Project. Currently only `Kanban` is supported. |
| `color` | `hex string` | The hexidecimal value representing a color used to represent the project. |
| `targetDate` | `number` | A date/time value since epoch representing the date that the Project is targeting for completion |
| `startDate` | `number` | A date/time value since epoch representing the date that the Project started. |

#### Examples

```
{
	"title":"Foo Bar!",
	"path": "/Home",
	"status": "Active",
	"kind": "Kanban",
	"color": "1eb850",
	"targetDate": null,
	"startDate": null
}
```

#### Response

```
Status: 200 OK
```
```
{
    "data": {
        "projectId": "3c19039b-3e69-4254-a37a-a3aa33dae8d5"
    },
    "error": {},
    "isSuccessful": true
}
```

### Delete a Project

This API endpoint will delete an existing Project record.

#### Route

`DELETE /project/{projectId}`

#### Response

```
Status: 200 OK
```
```
{
    "data": {},
    "error": {},
    "isSuccessful": true
}
```

### Get all Projects

This API endpoint will return a paged collection of Projects for the user. 

The response body will include a `pagination` field with a property of `lastId` included. If the value is `None` then there aren't enough records to page. If a `ProjectId` is provided in the `lastId` property then you will need to make a follow-up request to access the second page of records. This can be done by adding `lastId={projectId}` to the request Query String. The ProjectId given in the query string must be the ProjectId provided in the `lastId` property.

#### Route

`GET /project`

`GET /project?lastId={pagination.lastId}`

#### Response

```
Status: 200 OK
```
```
{
    "data": [
        {
            "projectId": "02595049-ae68-4f4d-b66d-9b1c1323d136",
            "path": "/Work",
            "kind": "Kanban",
            "status": "Planning",
            "startDate": 1594848696,
            "color": "1eb450",
            "targetDate": 1594848696,
            "title": "Hello World"
        },
        {
            "projectId": "f9cdeb13-adcd-41ac-950b-0737ff656940",
            "path": "/Home",
            "kind": "Kanban",
            "status": "Active",
            "startDate": null,
            "color": "1eb850",
            "targetDate": null,
            "title": "Foo Bar!"
        }
    ],
    "error": {},
    "isSuccessful": true,
    "pagination": {
        "additionalDataAvailable": false,
        "lastId": "None",
        "pageSize": 2
    }
}
```

### Get a Project by Id

This API endpoint will return a single record representing the ProjectId provided in the route path.

#### Route

`GET /project/{projectId}`

#### Response

```
Status: 200 OK
```
```
{
    "data": {
        "projectId": "f9cdeb13-adcd-41ac-950b-0737ff656940",
        "path": "/Home",
        "kind": "Kanban",
        "status": "Active",
        "startDate": null,
        "color": "1eb850",
        "targetDate": null,
        "title": "Foo Bar!"
    },
    "error": {},
    "isSuccessful": true,
    "pagination": {
        "additionalDataAvailable": false,
        "lastId": "None",
        "pageSize": 1
    }
} }
}
```
