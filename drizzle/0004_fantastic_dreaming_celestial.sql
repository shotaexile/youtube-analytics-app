CREATE TABLE `ai_daily_report` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportDate` date NOT NULL,
	`latestNews` text,
	`toolRankings` text,
	`videoAiTools` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_daily_report_id` PRIMARY KEY(`id`)
);
