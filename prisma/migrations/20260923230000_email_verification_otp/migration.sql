ALTER TABLE "email_verification_tokens"
ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
