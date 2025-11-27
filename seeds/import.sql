SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `iso3166`.`country`;
SET FOREIGN_KEY_CHECKS=1;
 
INSERT INTO `iso3166`.`country`
    (`id`, `name`, `alt_names`, `code2`, `code3`)
SELECT
	c.iso_cc,
	c.country_name,
	NULLIF(c.alt_names, ''),
	c.code2,
	c.code3
FROM
	`iso3166`.`cdh_country_codes` c;
	
SHOW WARNINGS;

SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `iso3166`.`region`;
SET FOREIGN_KEY_CHECKS=1;

INSERT INTO `iso3166`.`region`
    (`id`, `country_id`, `name`, `alt_names`, `level`)
SELECT
	s.subdiv,
	c.id,
	s.subdiv_name,
	NULLIF(s.alt_names, ''),
	s.level_name
FROM
	`iso3166`.`cdh_state_codes` s
INNER JOIN
	`iso3166`.`country` c
	ON s.country_code_3 = c.code3;

SHOW WARNINGS;
