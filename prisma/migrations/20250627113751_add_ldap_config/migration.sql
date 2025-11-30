-- CreateTable
CREATE TABLE "ldap_config" (
    "id" TEXT NOT NULL,
    "ldap_url" TEXT NOT NULL,
    "base_dn" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ldap_config_pkey" PRIMARY KEY ("id")
);
