CREATE TABLE `info_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('youtube','x','website') NOT NULL DEFAULT 'website',
	`title` varchar(255) NOT NULL,
	`url` varchar(512) NOT NULL,
	`memo` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `info_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_daily_report` ADD `ledgeNews` text;