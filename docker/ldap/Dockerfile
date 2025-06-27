FROM osixia/openldap:1.5.0

# Environment variables for LDAP configuration
ENV LDAP_ORGANISATION="Tasmota Organization" \
    LDAP_DOMAIN="tasmota.local" \
    LDAP_ADMIN_PASSWORD="admin" \
    LDAP_CONFIG_PASSWORD="config" \
    LDAP_READONLY_USER="false" \
    LDAP_RFC2307BIS_SCHEMA="false" \
    LDAP_BACKEND="mdb" \
    LDAP_TLS="true" \
    LDAP_TLS_CRT_FILENAME="ldap.crt" \
    LDAP_TLS_KEY_FILENAME="ldap.key" \
    LDAP_TLS_DH_PARAM_FILENAME="dhparam.pem" \
    LDAP_TLS_CA_CRT_FILENAME="ca.crt" \
    LDAP_TLS_ENFORCE="false" \
    LDAP_TLS_CIPHER_SUITE="SECURE256:-VERS-SSL3.0" \
    LDAP_TLS_VERIFY_CLIENT="demand" \
    LDAP_REPLICATION="false" \
    KEEP_EXISTING_CONFIG="false" \
    LDAP_REMOVE_CONFIG_AFTER_SETUP="true" \
    LDAP_SSL_HELPER_PREFIX="ldap"

# Copy the bootstrap LDIF file
COPY bootstrap.ldif /container/service/slapd/assets/config/bootstrap/ldif/custom/bootstrap.ldif

# Ensure proper permissions
RUN chmod 644 /container/service/slapd/assets/config/bootstrap/ldif/custom/bootstrap.ldif

# Create a startup script to ensure proper initialization
COPY init-ldap.sh /container/service/slapd/assets/config/bootstrap/custom/init-ldap.sh
RUN chmod +x /container/service/slapd/assets/config/bootstrap/custom/init-ldap.sh

# Expose LDAP ports
EXPOSE 389 636

# Use the default entrypoint from the base image
CMD ["--copy-service"] 