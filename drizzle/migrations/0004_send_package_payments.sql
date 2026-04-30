CREATE TABLE IF NOT EXISTS "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_phone" text NOT NULL,
	"recipient_id" uuid,
	"recipient_type" text DEFAULT 'guest' NOT NULL,
	"recipient_name" text,
	"category" text DEFAULT 'parcel' NOT NULL,
	"weight_class" text DEFAULT 'light' NOT NULL,
	"is_fragile" boolean DEFAULT false NOT NULL,
	"description" text,
	"pickup_address" text NOT NULL,
	"pickup_latitude" numeric(10, 7),
	"pickup_longitude" numeric(10, 7),
	"dropoff_address" text NOT NULL,
	"dropoff_latitude" numeric(10, 7),
	"dropoff_longitude" numeric(10, 7),
	"tracking_token" text NOT NULL,
	"scheduled_for" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"proof_url" text,
	"submitted_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"status" text DEFAULT 'PENDING_REVIEW' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "default_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_type" text DEFAULT 'food' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_priority" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "restaurant_id" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "packages" ADD CONSTRAINT "packages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "packages" ADD CONSTRAINT "packages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "packages" ADD CONSTRAINT "packages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "packages_order_id_uidx" ON "packages" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "packages_sender_id_idx" ON "packages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "packages_recipient_phone_idx" ON "packages" USING btree ("recipient_phone");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "packages_tracking_token_uidx" ON "packages" USING btree ("tracking_token");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bank_transfers_payment_id_uidx" ON "bank_transfers" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bank_transfers_order_id_idx" ON "bank_transfers" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bank_transfers_status_idx" ON "bank_transfers" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_phone_number_idx" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_order_type_idx" ON "orders" USING btree ("order_type");
