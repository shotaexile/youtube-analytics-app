CREATE TABLE `channel_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelName` varchar(255) NOT NULL DEFAULT 'ViewCore',
	`channelUrl` varchar(512) DEFAULT '',
	`channelId` varchar(128) DEFAULT '',
	`iconUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channel_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `csv_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadedBy` varchar(64),
	`videoCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `csv_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthly_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`month` varchar(7) NOT NULL,
	`views` bigint NOT NULL DEFAULT 0,
	`revenue` float NOT NULL DEFAULT 0,
	`videoCount` int NOT NULL DEFAULT 0,
	`subscriberChange` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthly_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `monthly_stats_month_unique` UNIQUE(`month`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`title` varchar(512) NOT NULL,
	`publishedAt` varchar(32) NOT NULL,
	`publishedDate` date NOT NULL,
	`duration` int NOT NULL DEFAULT 0,
	`views` bigint NOT NULL DEFAULT 0,
	`estimatedRevenue` float NOT NULL DEFAULT 0,
	`impressions` bigint NOT NULL DEFAULT 0,
	`ctr` float NOT NULL DEFAULT 0,
	`avgViewRate` float NOT NULL DEFAULT 0,
	`likeRate` float NOT NULL DEFAULT 0,
	`subscriberChange` int NOT NULL DEFAULT 0,
	`isShort` boolean NOT NULL DEFAULT false,
	`isPrivate` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `videos_videoId_unique` UNIQUE(`videoId`)
);
