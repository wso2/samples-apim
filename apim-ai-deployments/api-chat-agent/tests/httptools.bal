// Copyright (c) 2024, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 Inc. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein is strictly forbidden, unless permitted by WSO2 in accordance with
// the WSO2 Commercial License available at http://wso2.com/licenses.
// For specific language governing the permissions and limitations under
// this license, please see the license as well as any agreement you’ve
// entered into with WSO2 governing the purchase of this software and any
import wso2/ai.agent;

agent:HttpTool[] booksServiceTools = [
    {
        "name": "GET-booksByYear",
        "description": "Retrieve a list of books published in a specific year.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/booksByYear",
        "parameters": {
            "year": {
                "location": "query",
                "required": true,
                "schema": {
                    "type": "integer"
                }
            }
        }
    },
    {
        "name": "GET-countBooks",
        "description": "Get the total count of books available.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/countBooks"
    },
    {
        "name": "GET-books",
        "description": "Get a list of all available books.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/books"
    },
    {
        "name": "GET-book",
        "description": "Retrieve a specific book by its ID.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/book/id",
        "parameters": {
            "bookId": {
                "location": "query",
                "required": true,
                "schema": {
                    "type": "integer"
                }
            }
        }
    },
    {
        "name": "POST-book",
        "description": "Create a new book entry.. This tool invokes a HTTP POST resource",
        "method": "POST",
        "path": "/book",
        "requestBody": {
            "mediaType": "application/json",
            "schema": {
                "type": "object",
                "required": [
                    "author",
                    "isbn",
                    "title",
                    "year"
                ],
                "properties": {
                    "title": {
                        "type": "string"
                    },
                    "author": {
                        "type": "object",
                        "required": [
                            "name",
                            "nationality"
                        ],
                        "properties": {
                            "name": {
                                "type": "string"
                            },
                            "nationality": {
                                "type": "string"
                            }
                        }
                    },
                    "year": {
                        "type": "integer"
                    },
                    "isbn": {
                        "type": "string"
                    }
                }
            }
        }
    },
    {
        "name": "PUT-book",
        "description": "Update a specific book by its ID.. This tool invokes a HTTP PUT resource",
        "method": "PUT",
        "path": "/book/updateBook",
        "parameters": {
            "bookId": {
                "location": "query",
                "required": true,
                "schema": {
                    "type": "integer"
                }
            }
        },
        "requestBody": {
            "mediaType": "application/json",
            "schema": {
                "type": "object",
                "required": [
                    "author",
                    "isbn",
                    "title",
                    "year"
                ],
                "properties": {
                    "title": {
                        "type": "string"
                    },
                    "author": {
                        "type": "object",
                        "required": [
                            "name",
                            "nationality"
                        ],
                        "properties": {
                            "name": {
                                "type": "string"
                            },
                            "nationality": {
                                "type": "string"
                            }
                        }
                    },
                    "year": {
                        "type": "integer"
                    },
                    "isbn": {
                        "type": "string"
                    }
                }
            }
        }
    },
    {
        "name": "DELETE-book",
        "description": "Delete a specific book by its ID.. This tool invokes a HTTP DELETE resource",
        "method": "DELETE",
        "path": "/book/delete",
        "parameters": {
            "bookId": {
                "location": "query",
                "required": true,
                "schema": {
                    "type": "integer"
                }
            }
        }
    },
    {
        "name": "GET-hasBook",
        "description": "Check if a book with a given title exists.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/hasBook",
        "parameters": {
            "bookTitle": {
                "location": "query",
                "required": true,
                "schema": {
                    "type": "string"
                }
            }
        }
    },
    {
        "name": "GET-booksByTitle",
        "description": "Retrieve a list of books with a specific title.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/booksByTitle",
        "parameters": {
            "bookTitle": {
                "location": "query",
                "required": true,
                "schema": {
                    "type": "string"
                }
            }
        }
    },
    {
        "name": "GET-booksByAuthor",
        "description": "Retrieve a list of books written by a specific author.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/booksByAuthor",
        "parameters": {
            "authorName": {
                "location": "query",
                "required": true,
                "schema": {
                    "type": "string"
                }
            }
        }
    }
];

agent:HttpTool[] petStoreTools = [
    {
        "name": "GET-pet_findByStatus",
        "description": "This API endpoint allows users to find pets based on their status. Multiple status values can be provided as comma-separated strings.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/pet/findByStatus",
        "parameters": {
            "status": {
                "location": "query",
                "description": "Status values that need to be considered for filter",
                "required": false,
                "explode": true,
                "schema": {
                    "type": "string",
                    "enum": [
                        "available",
                        "pending",
                        "sold"
                    ],
                    "default": "available"
                }
            }
        }
    },
    {
        "name": "POST-user_createWithList",
        "description": "This API endpoint allows users to create a list of users using an input array.. This tool invokes a HTTP POST resource",
        "method": "POST",
        "path": "/user/createWithList",
        "requestBody": {
            "mediaType": "application/json",
            "schema": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "integer"
                        },
                        "username": {
                            "type": "string"
                        },
                        "firstName": {
                            "type": "string"
                        },
                        "lastName": {
                            "type": "string"
                        },
                        "email": {
                            "type": "string"
                        },
                        "password": {
                            "type": "string"
                        },
                        "phone": {
                            "type": "string"
                        },
                        "userStatus": {
                            "type": "integer"
                        }
                    }
                }
            }
        }
    },
    {
        "name": "GET-store_inventory",
        "description": "This API endpoint returns the inventory of pets in the store, represented as a map of status codes to quantities.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/store/inventory"
    },
    {
        "name": "GET-user_login",
        "description": "This API endpoint allows users to log into the system using their username and password.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/user/login",
        "parameters": {
            "username": {
                "location": "query",
                "description": "The user name for login",
                "required": false,
                "schema": {
                    "type": "string"
                }
            },
            "password": {
                "location": "query",
                "description": "The password for login in clear text",
                "required": false,
                "schema": {
                    "type": "string"
                }
            }
        }
    },
    {
        "name": "POST-pet",
        "description": "This API endpoint allows users to add a new pet to the store.. This tool invokes a HTTP POST resource",
        "method": "POST",
        "path": "/pet",
        "requestBody": {
            "mediaType": "application/json",
            "schema": {
                "type": "object",
                "required": [
                    "id",
                    "name",
                    "photoUrls",
                    "category",
                    "tags",
                    "status"

                ],
                "properties": {
                    "id": {
                        "type": "integer"
                    },
                    "name": {
                        "type": "string"
                    },
                    "category": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "integer"
                            },
                            "name": {
                                "type": "string"
                            }
                        }
                    },
                    "photoUrls": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    },
                    "tags": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "integer"
                                },
                                "name": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "status": {
                        "type": "string",
                        "enum": [
                            "available",
                            "pending",
                            "sold"
                        ]
                    }
                }
            }
        }
    },
    {
        "name": "PUT-pet",
        "description": "This API endpoint allows users to update an existing pet in the store by its ID.. This tool invokes a HTTP PUT resource",
        "method": "PUT",
        "path": "/pet",
        "requestBody": {
            "mediaType": "application/json",
            "schema": {
                "type": "object",
                "required": [
                    "id",
                    "name",
                    "photoUrls",
                    "category",
                    "tags",
                    "status"

                ],
                "properties": {
                    "id": {
                        "type": "integer"
                    },
                    "name": {
                        "type": "string"
                    },
                    "category": {
                        "type": "object",
                        "properties": {
                            "id": {
                                "type": "integer"
                            },
                            "name": {
                                "type": "string"
                            }
                        }
                    },
                    "photoUrls": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    },
                    "tags": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "integer"
                                },
                                "name": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "status": {
                        "type": "string",
                        "enum": [
                            "available",
                            "pending",
                            "sold"
                        ]
                    }
                }
            }
        }
    },
    {
        "name": "POST-user",
        "description": "This API endpoint allows users to create a new user. This action can only be performed by a logged-in user.. This tool invokes a HTTP POST resource",
        "method": "POST",
        "path": "/user",
        "requestBody": {
            "mediaType": "application/json",
            "schema": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer"
                    },
                    "username": {
                        "type": "string"
                    },
                    "firstName": {
                        "type": "string"
                    },
                    "lastName": {
                        "type": "string"
                    },
                    "email": {
                        "type": "string"
                    },
                    "password": {
                        "type": "string"
                    },
                    "phone": {
                        "type": "string"
                    },
                    "userStatus": {
                        "type": "integer"
                    }
                }
            }
        }
    },
    {
        "name": "GET-user_username",
        "description": "This API endpoint allows users to retrieve a user by their username.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/user/{username}",
        "parameters": {
            "username": {
                "location": "path",
                "description": "The name that needs to be fetched. Use user1 for testing. ",
                "required": true,
                "schema": {
                    "type": "string"
                }
            }
        }
    },
    {
        "name": "PUT-user_username",
        "description": "This API endpoint allows users to update a user by their username. This action can only be performed by the logged-in user.. This tool invokes a HTTP PUT resource",
        "method": "PUT",
        "path": "/user/{username}",
        "parameters": {
            "username": {
                "location": "path",
                "description": "name that needs to be updated",
                "required": true,
                "schema": {
                    "type": "string"
                }
            }
        },
        "requestBody": {
            "mediaType": "application/json",
            "schema": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer"
                    },
                    "username": {
                        "type": "string"
                    },
                    "firstName": {
                        "type": "string"
                    },
                    "lastName": {
                        "type": "string"
                    },
                    "email": {
                        "type": "string"
                    },
                    "password": {
                        "type": "string"
                    },
                    "phone": {
                        "type": "string"
                    },
                    "userStatus": {
                        "type": "integer"
                    }
                }
            }
        }
    },
    {
        "name": "DELETE-user_username",
        "description": "This API endpoint allows users to delete a user by their username. This action can only be performed by the logged-in user.. This tool invokes a HTTP DELETE resource",
        "method": "DELETE",
        "path": "/user/{username}",
        "parameters": {
            "username": {
                "location": "path",
                "description": "The name that needs to be deleted",
                "required": true,
                "schema": {
                    "type": "string"
                }
            }
        }
    },
    {
        "name": "GET-pet_findByTags",
        "description": "This API endpoint allows users to find pets based on their tags. Multiple tags can be provided as comma-separated strings.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/pet/findByTags",
        "parameters": {
            "tags": {
                "location": "query",
                "description": "Tags to filter by",
                "required": false,
                "explode": true,
                "schema": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            }
        }
    },
    {
        "name": "POST-store_order",
        "description": "This API endpoint allows users to place an order for a pet in the store.. This tool invokes a HTTP POST resource",
        "method": "POST",
        "path": "/store/order",
        "requestBody": {
            "mediaType": "application/json",
            "schema": {
                "type": "object",
                "required": [
                    "id",
                    "petId",
                    "quantity",
                    "shipDate",
                    "status",
                    "complete"
                ],
                "properties": {
                    "id": {
                        "type": "integer"
                    },
                    "petId": {
                        "type": "integer"
                    },
                    "quantity": {
                        "type": "integer"
                    },
                    "shipDate": {
                        "type": "string",
                        "format": "date-time",
                        "pattern": "yyyy-MM-dd'T'HH:mm:ssZ"
                    },
                    "status": {
                        "type": "string",
                        "enum": [
                            "placed",
                            "approved",
                            "delivered"
                        ]
                    },
                    "complete": {
                        "type": "boolean"
                    }
                }
            }
        }
    },
    {
        "name": "GET-user_logout",
        "description": "This API endpoint allows the current logged-in user to log out of their session.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/user/logout"
    },
    {
        "name": "GET-pet_petId",
        "description": "This API endpoint allows users to retrieve a pet by its ID.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/pet/getPet/{petId}",
        "parameters": {
            "petId": {
                "location": "path",
                "description": "ID of pet to return",
                "required": true,
                "schema": {
                    "type": "integer"
                }
            }
        }
    },
    {
        "name": "PUT-pet_petId",
        "description": "This API endpoint allows users to update a pet in the store using form data.. This tool invokes a HTTP POST resource",
        "method": "PUT",
        "path": "/pet/{petId}",
        "parameters": {
            "petId": {
                "location": "path",
                "description": "ID of pet that needs to be updated",
                "required": true,
                "schema": {
                    "type": "integer"
                }
            },
            "name": {
                "location": "query",
                "description": "Name of pet that needs to be updated",
                "schema": {
                    "type": "string"
                }
            },
            "status": {
                "location": "query",
                "description": "Status of pet that needs to be updated",
                "schema": {
                    "type": "string"
                }
            }
        }
    },
    {
        "name": "DELETE-pet_petId",
        "description": "This API endpoint allows users to delete a pet by its ID.. This tool invokes a HTTP DELETE resource",
        "method": "DELETE",
        "path": "/pet/{petId}",
        "parameters": {
            "petId": {
                "location": "path",
                "description": "Pet id to delete",
                "required": true,
                "schema": {
                    "type": "integer"
                }
            }
        }
    },
    {
        "name": "GET-store_order_orderId",
        "description": "This API endpoint allows users to retrieve a purchase order by its ID.. This tool invokes a HTTP GET resource",
        "method": "GET",
        "path": "/store/order/{orderId}",
        "parameters": {
            "orderId": {
                "location": "path",
                "description": "ID of order that needs to be fetched",
                "required": true,
                "schema": {
                    "type": "integer"
                }
            }
        }
    },
    {
        "name": "DELETE-store_order_orderId",
        "description": "This API endpoint allows users to delete a purchase order by its ID.. This tool invokes a HTTP DELETE resource",
        "method": "DELETE",
        "path": "/store/order/{orderId}",
        "parameters": {
            "orderId": {
                "location": "path",
                "description": "ID of the order that needs to be deleted",
                "required": true,
                "schema": {
                    "type": "integer"
                }
            }
        }
    }
];
