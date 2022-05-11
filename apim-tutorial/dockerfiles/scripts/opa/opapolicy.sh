echo "+++++++++ Publishing opa policy to opa server +++++++++++"

rego_policy() {
    cat <<EOF
package employees

default allow = false

allow {
    is_get
    user_name_from_path == auth_context_username_without_td
}

allow {
    is_get
    is_admin
}

is_get {
    input.method = "GET"
}

user_name_from_path := user_name {
    path:=input.path
    startswith(path, "/employees/1.0.0/employees/contract/")
    user_name := substring(path, count("/employees/1.0.0/employees/contract/"), -1)
}

auth_context_username_without_td := username_without_td {
    username := input.apiContext.username
    tenant_domain := input.apiContext.subscriberTenantDomain
    contains(username, tenant_domain)
    username_without_td := substring(username,0,count(username)-count(tenant_domain)-1)
}

is_admin {
    auth_context_username_without_td == "admin"
}
EOF
}

response=$(curl -k -H "Content-Type: application/json" -X PUT --data-binary "$(rego_policy)" http://localhost:8181/v1/policies/employees)

if  [ $response == "{}" ];
then
    echo "OPA Policy published"
else
  echo "Error"
fi
