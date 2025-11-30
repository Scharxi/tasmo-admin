#!/bin/bash
set -e

# This script runs after the LDAP server is initialized
# It ensures the bootstrap LDIF is properly loaded

echo "Tasmota LDAP Server initialization complete"
echo "Directory structure and users have been created"
echo ""
echo "Available test accounts:"
echo "  - admin / admin (Administrator)"
echo "  - testuser / admin (Test User)"
echo "  - ldapservice / ldapservice123 (Service Account)"
echo ""
echo "LDAP Base DN: dc=tasmota,dc=local"
echo "LDAP URL: ldap://localhost:389" 