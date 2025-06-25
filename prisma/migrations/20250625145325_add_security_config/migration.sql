-- CreateTable
CREATE TABLE "security_config" (
    "id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "has_password" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT,
    "password_salt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_config_pkey" PRIMARY KEY ("id")
);
