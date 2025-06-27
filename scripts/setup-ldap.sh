#!/bin/bash
set -e

echo "🚀 Setting up Tasmota LDAP Authentication..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing LDAP containers..."
docker-compose down ldap phpldapadmin 2>/dev/null || true

# Remove old volumes (optional - uncomment if you want clean slate)
# echo "🗑️  Removing old LDAP data..."
# docker volume rm tasmo-admin_ldap_data tasmo-admin_ldap_config 2>/dev/null || true

# Build and start LDAP server
echo "🔨 Building custom LDAP container..."
docker-compose build ldap

echo "▶️  Starting LDAP services..."
docker-compose up -d ldap phpldapadmin

# Wait for LDAP to be ready
echo "⏳ Waiting for LDAP server to initialize..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker-compose exec -T ldap ldapwhoami -x -H ldap://localhost:389 -D "cn=admin,dc=tasmota,dc=local" -w admin >/dev/null 2>&1; then
        break
    fi
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "❌ LDAP server failed to start within 60 seconds"
    echo "📋 Check logs: docker-compose logs ldap"
    exit 1
fi

echo "✅ LDAP server is ready!"

# Test the setup
echo "🧪 Testing LDAP authentication..."
if docker-compose exec -T ldap ldapwhoami -x -H ldap://localhost:389 -D "uid=admin,ou=users,dc=tasmota,dc=local" -w admin >/dev/null 2>&1; then
    echo "✅ Admin authentication successful"
else
    echo "❌ Admin authentication failed"
    exit 1
fi

if docker-compose exec -T ldap ldapwhoami -x -H ldap://localhost:389 -D "uid=testuser,ou=users,dc=tasmota,dc=local" -w admin >/dev/null 2>&1; then
    echo "✅ Test user authentication successful"
else
    echo "❌ Test user authentication failed"
    exit 1
fi

echo ""
echo "🎉 Tasmota LDAP setup complete!"
echo ""
echo "📋 Connection Details:"
echo "   LDAP URL: ldap://localhost:389"
echo "   Base DN:  dc=tasmota,dc=local"
echo ""
echo "👥 Test Accounts:"
echo "   admin / admin (Administrator)"
echo "   testuser / admin (Test User)"
echo ""
echo "🌐 Admin Interface:"
echo "   phpLDAPadmin: http://localhost:8081"
echo "   Login DN: cn=admin,dc=tasmota,dc=local"
echo "   Password: admin"
echo ""
echo "🔄 Next steps:"
echo "   1. Copy .env.example to .env.local"
echo "   2. Run: npm run dev"
echo "   3. Go to: http://localhost:3000"
echo "" 