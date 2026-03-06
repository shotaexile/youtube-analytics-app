CREATE TABLE `admin_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(128) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `push_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(512) NOT NULL,
	`deviceName` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `push_tokens_token_unique` UNIQUE(`token`)
);
