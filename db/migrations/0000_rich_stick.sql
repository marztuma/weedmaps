CREATE TABLE "admin_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" varchar(32) DEFAULT 'order' NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" text,
	"order_id" integer,
	"read_at" timestamp with time zone,
	"emailed_at" timestamp with time zone,
	"email_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"email" varchar(160) NOT NULL,
	"display_name" varchar(96) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(32) DEFAULT 'administrator' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor" varchar(96) NOT NULL,
	"action" varchar(48) NOT NULL,
	"entity" varchar(32) NOT NULL,
	"entity_id" varchar(64),
	"summary" text NOT NULL,
	"severity" varchar(16) DEFAULT 'info' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(96) NOT NULL,
	"name" varchar(96) NOT NULL,
	"kind" varchar(96),
	"blurb" text,
	"featured" boolean DEFAULT false NOT NULL,
	"logo_avif" text,
	"logo_webp" text,
	"banner_avif" text,
	"banner_webp" text,
	"logo_cloud_id" text,
	"banner_cloud_id" text,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(96),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(64) NOT NULL,
	"blurb" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_key" varchar(64) NOT NULL,
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"contact_email" varchar(254),
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" varchar(12) NOT NULL,
	"body" text NOT NULL,
	"intent" varchar(32),
	"status" varchar(12) DEFAULT 'sent' NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"author_id" integer,
	"author_name" varchar(96) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(160) NOT NULL,
	"phone" varchar(40),
	"address" text,
	"city" varchar(96),
	"state" varchar(2),
	"stage" varchar(32) DEFAULT 'lead' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"age_verified" boolean DEFAULT false NOT NULL,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"description" varchar(160),
	"kind" varchar(8) DEFAULT 'percent' NOT NULL,
	"value" integer NOT NULL,
	"min_subtotal_cents" integer DEFAULT 0 NOT NULL,
	"max_discount_cents" integer,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"per_customer_limit" integer DEFAULT 1 NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "discount_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_id" integer NOT NULL,
	"order_id" integer,
	"email" varchar(254),
	"amount_cents" integer NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(128) NOT NULL,
	"type" varchar(48) NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"template" varchar(48) NOT NULL,
	"recipient" varchar(254) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"status" varchar(16) DEFAULT 'queued' NOT NULL,
	"provider_id" varchar(64),
	"error" text,
	"idempotency_key" varchar(256) NOT NULL,
	"order_id" integer,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_log_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "email_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"resend_api_key" text,
	"mail_from" varchar(254),
	"admin_email" varchar(254),
	"resend_webhook_secret" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_suppressions" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"reason" varchar(32) NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_suppressions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"name_snapshot" varchar(160) NOT NULL,
	"brand_snapshot" varchar(96),
	"unit_price_cents" integer NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(24) NOT NULL,
	"customer_id" integer NOT NULL,
	"shop_id" integer,
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"delivery_fee_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"payment_method" varchar(32),
	"payment_status" varchar(24) DEFAULT 'awaiting_payment' NOT NULL,
	"payment_destination" text,
	"payment_reference" varchar(96),
	"payment_confirmed_at" timestamp with time zone,
	"payment_confirmed_by" varchar(96),
	"contact_email" varchar(160),
	"contact_phone" varchar(40),
	"delivery_address" text,
	"delivery_state" varchar(2),
	"discount_code_id" integer,
	"discount_code" varchar(32),
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"delivery_notes" text,
	CONSTRAINT "orders_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_id" integer NOT NULL,
	"path" varchar(256) NOT NULL,
	"referrer_host" varchar(128),
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"kind" varchar(16) NOT NULL,
	"label" varchar(64) NOT NULL,
	"network" varchar(48),
	"asset" varchar(24),
	"destination" text,
	"instructions" text,
	"confirmations" integer,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_methods_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" varchar(128) NOT NULL,
	"brand_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"subcategory_id" integer,
	"shop_id" integer NOT NULL,
	"strain_type" varchar(16) NOT NULL,
	"weight" varchar(24) NOT NULL,
	"thc" numeric(5, 2) NOT NULL,
	"cbd" numeric(5, 2) DEFAULT '0' NOT NULL,
	"price_cents" integer NOT NULL,
	"was_price_cents" integer,
	"distance_mi" numeric(4, 1) NOT NULL,
	"colorway" varchar(16) DEFAULT 'linen' NOT NULL,
	"image_avif" text,
	"image_webp" text,
	"image_alt" text,
	"image_cloud_id" text,
	"description" text,
	"effects" text[] DEFAULT '{}' NOT NULL,
	"flavors" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"stock_qty" integer,
	"low_stock_at" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"shop_id" integer,
	"rating" integer NOT NULL,
	"title" varchar(120),
	"body" text,
	"author_handle" varchar(48) NOT NULL,
	"author_location" varchar(96),
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"moderated_by" varchar(96),
	"moderated_at" timestamp with time zone,
	"seeded" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(96) NOT NULL,
	"name" varchar(96) NOT NULL,
	"state" varchar(2) DEFAULT 'CA' NOT NULL,
	"service_area" varchar(96) NOT NULL,
	"license" varchar(64) NOT NULL,
	"rating" numeric(2, 1) NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"delivering_now" boolean DEFAULT true NOT NULL,
	"window_label" varchar(64) NOT NULL,
	"eta_min_minutes" integer NOT NULL,
	"eta_max_minutes" integer NOT NULL,
	"min_order_cents" integer DEFAULT 0 NOT NULL,
	"delivery_fee_cents" integer DEFAULT 0 NOT NULL,
	"free_delivery_over_cents" integer,
	"menu_count" integer DEFAULT 0 NOT NULL,
	"deal" varchar(96),
	CONSTRAINT "shops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(64) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"name" varchar(96),
	"consented_at" timestamp with time zone,
	"consent_source" varchar(48),
	"status" varchar(16) DEFAULT 'subscribed' NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"unsubscribe_token" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_key" varchar(64) NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"page_views" integer DEFAULT 0 NOT NULL,
	"referrer_host" varchar(128),
	"landing_path" varchar(256),
	"country" varchar(2),
	"subscriber_id" integer,
	CONSTRAINT "visitors_visitor_key_unique" UNIQUE("visitor_key")
);
--> statement-breakpoint
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_code_id_discount_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."discount_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_notifications_unread_idx" ON "admin_notifications" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity");--> statement-breakpoint
CREATE INDEX "brands_name_idx" ON "brands" USING btree ("name");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "categories_sort_idx" ON "categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "chat_conversations_visitor_idx" ON "chat_conversations" USING btree ("visitor_key");--> statement-breakpoint
CREATE INDEX "chat_conversations_status_idx" ON "chat_conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "chat_conversations_last_idx" ON "chat_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "chat_messages_conversation_idx" ON "chat_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "chat_messages_status_idx" ON "chat_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "chat_messages_read_idx" ON "chat_messages" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "customer_notes_customer_idx" ON "customer_notes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customers_stage_idx" ON "customers" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "discount_codes_active_idx" ON "discount_codes" USING btree ("active");--> statement-breakpoint
CREATE INDEX "discount_redemptions_code_idx" ON "discount_redemptions" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX "discount_redemptions_email_idx" ON "discount_redemptions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_log_status_idx" ON "email_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_log_created_idx" ON "email_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_log_recipient_idx" ON "email_log" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_placed_idx" ON "orders" USING btree ("placed_at");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "page_views_visitor_idx" ON "page_views" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "page_views_path_idx" ON "page_views" USING btree ("path");--> statement-breakpoint
CREATE INDEX "page_views_at_idx" ON "page_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "payment_methods_active_idx" ON "payment_methods" USING btree ("active");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "products_shop_idx" ON "products" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "products_price_idx" ON "products" USING btree ("price_cents");--> statement-breakpoint
CREATE INDEX "products_deal_idx" ON "products" USING btree ("was_price_cents");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_shop_idx" ON "reviews" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_created_idx" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "shops_state_idx" ON "shops" USING btree ("state");--> statement-breakpoint
CREATE INDEX "shops_delivering_idx" ON "shops" USING btree ("delivering_now");--> statement-breakpoint
CREATE INDEX "shops_rating_idx" ON "shops" USING btree ("rating");--> statement-breakpoint
CREATE UNIQUE INDEX "subcategories_cat_slug_idx" ON "subcategories" USING btree ("category_id","slug");--> statement-breakpoint
CREATE INDEX "subcategories_category_idx" ON "subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "subscribers_status_idx" ON "subscribers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscribers_created_idx" ON "subscribers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "visitors_last_seen_idx" ON "visitors" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "visitors_subscriber_idx" ON "visitors" USING btree ("subscriber_id");