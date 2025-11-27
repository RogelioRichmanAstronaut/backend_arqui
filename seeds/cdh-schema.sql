CREATE TABLE `cdh_state_codes` (
	`country_name` VARCHAR(50) NOT NULL,
	`subdiv` VARCHAR(10) NOT NULL,
	`subdiv_name` VARCHAR(100) NOT NULL,
	`level_name` VARCHAR(50) NOT NULL,
	`alt_names` VARCHAR(255) NULL DEFAULT NULL,
	`subdiv_star` VARCHAR(10) NOT NULL,
	`subdiv_id` INT(10) UNSIGNED NOT NULL,
	`country_id` INT(10) UNSIGNED NOT NULL,
	`country_code_2` CHAR(2) NOT NULL,
	`country_code_3` CHAR(3) NOT NULL
)
COMMENT='http://www.commondatahub.com/live/geography/state_province_region/iso_3166_2_state_codes'
COLLATE='utf8_general_ci'
ENGINE=InnoDB;

CREATE TABLE `cdh_country_codes` (
	`country_name` VARCHAR(50) NOT NULL,
	`alt_names` VARCHAR(255) NULL DEFAULT NULL,
	`code2` CHAR(10) NOT NULL,
	`code3` CHAR(3) NOT NULL,
	`iso_cc` INT UNSIGNED NULL,
	`fips_code` VARCHAR(10) NULL,
	`fips_country_name` VARCHAR(50) NULL,
	`un_region` VARCHAR(50) NULL,
	`un_subregion` VARCHAR(50) NULL,
	`cdh_id` INT UNSIGNED NULL,
	`comments` VARCHAR(255) NULL,
	`lat` VARCHAR(10) NULL,
	`lng` VARCHAR(10) NULL
)
COMMENT='http://www.commondatahub.com/live/geography/country/iso_3166_country_codes'
COLLATE='utf8_general_ci'
ENGINE=InnoDB;
