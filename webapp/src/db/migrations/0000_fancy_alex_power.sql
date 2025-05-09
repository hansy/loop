CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"did" text NOT NULL,
	"email_address" text,
	"wallet_address" text NOT NULL,
	CONSTRAINT "users_did_unique" UNIQUE("did"),
	CONSTRAINT "users_email_address_unique" UNIQUE("email_address"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
