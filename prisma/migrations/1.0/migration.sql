CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL,
    "brand" TEXT NOT NULL,
    "given_name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "password_hash" TEXT,
    "roles" TEXT[],

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "identity_provider_id" TEXT NOT NULL,
    "identifier_claim_value" TEXT NOT NULL,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_refresh_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "terminated_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "identity_provider_id" TEXT,
    "identity_provider_session_id" TEXT,
    "id_token" TEXT,
    "refresh_token" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_providers" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "issuer_url" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "identifier_claim_name" TEXT NOT NULL,
    "auth_settings_type" TEXT,
    "auth_settings_brand" TEXT,
    "auth_settings_client_id" TEXT,
    "auth_settings_client_secret" TEXT,
    "auth_settings_redirect_urls" TEXT[],
    "auth_settings_auto_link_users" BOOLEAN,
    "auth_settings_auto_create_users" BOOLEAN,

    CONSTRAINT "identity_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signing_keys" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "public_key" TEXT NOT NULL,
    "private_key" TEXT,

    CONSTRAINT "signing_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_brand_email_key" ON "users"("brand", "email");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_identity_provider_id_identifier_claim_value_key" ON "user_identities"("identity_provider_id", "identifier_claim_value");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_identity_provider_session_id_key" ON "sessions"("identity_provider_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "identity_providers_name_key" ON "identity_providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "identity_providers_issuer_url_audience_key" ON "identity_providers"("issuer_url", "audience");

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_identity_provider_id_fkey" FOREIGN KEY ("identity_provider_id") REFERENCES "identity_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_identity_provider_id_fkey" FOREIGN KEY ("identity_provider_id") REFERENCES "identity_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
