# InformationAPI

> Version 2.0.0

## Path Details

***

### [GET]/trains

- Security  
default  

#### Responses

- 200 ok

***

### [GET]/sheds

- Security  
default  

#### Responses

- 200 ok

***

### [GET]/platforms

- Security  
default  

#### Responses

- 200 ok

## References

### #/components/securitySchemes/default

```ts
{
  "type": "oauth2",
  "flows": {
    "implicit": {
      "authorizationUrl": "https://test.com",
      "scopes": {}
    }
  }
}
```