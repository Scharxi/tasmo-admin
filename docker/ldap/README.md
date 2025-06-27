# Tasmota LDAP Server

Custom LDAP server setup for Tasmota authentication using OpenLDAP.

## Structure

```
docker/ldap/
├── Dockerfile          # Custom LDAP container build
├── bootstrap.ldif       # Initial directory structure and users
├── init-ldap.sh        # Initialization script
└── README.md           # This file
```

## Features

- **Pre-configured** with Tasmota organization structure
- **Test users** ready for authentication testing
- **Automatic initialization** on first startup
- **Health checks** integrated

## Directory Structure

```ldap
dc=tasmota,dc=local
├── ou=users
│   ├── uid=admin           (password: admin)
│   ├── uid=testuser        (password: admin)
│   └── uid=ldapservice     (password: ldapservice123)
└── ou=groups
    ├── cn=admins
    └── cn=users
```

## Test Accounts

| Username     | Password       | Description           |
|--------------|----------------|-----------------------|
| `admin`      | `admin`        | System Administrator  |
| `testuser`   | `admin`        | Test User Account     |
| `ldapservice`| `ldapservice123` | Service Account     |

## Usage

### Start the LDAP server:
```bash
docker-compose up -d ldap
```

### Test authentication:
```bash
ldapwhoami -x -H ldap://localhost:389 -D "uid=admin,ou=users,dc=tasmota,dc=local" -w admin
```

### Browse with phpLDAPadmin:
- URL: http://localhost:8081
- Login DN: `cn=admin,dc=tasmota,dc=local`
- Password: `admin`

## Configuration

The LDAP server is configured with:
- **Base DN**: `dc=tasmota,dc=local`
- **Admin DN**: `cn=admin,dc=tasmota,dc=local`
- **Port**: 389 (LDAP), 636 (LDAPS)
- **TLS**: Available but not enforced

## NextAuth Integration

The server is optimized for NextAuth LDAP authentication:
- Users can authenticate (BIND operation)
- Search operations work with admin credentials
- Standard object classes for compatibility 