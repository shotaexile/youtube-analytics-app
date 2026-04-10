CREATE TABLE `video_early_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`timeWindow` enum('1h','24h','48h','1week') NOT NULL,
	`views` bigint NOT NULL DEFAULT 0,
	`impressions` bigint NOT NULL DEFAULT 0,
	`ctr` float NOT NULL DEFAULT 0,
	`avgViewRate` float NOT NULL DEFAULT 0,
	`likeRate` float NOT NULL DEFAULT 0,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_early_stats_id` PRIMARY KEY(`id`)
);
