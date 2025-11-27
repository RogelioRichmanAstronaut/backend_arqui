Raw CSV data is made available by Common Data Hub here:

http://www.commondatahub.com/live/geography/state_province_region/iso_3166_2_state_codes

http://www.commondatahub.com/live/geography/country/iso_3166_country_codes

The table `cdh_state_codes` (see `cdh-schema.sql` below) is designed to hold the raw data, which should import readily using most common database tools, or directly into MySQL via LOAD DATA, e.g.:

    SET FOREIGN_KEY_CHECKS=0;
    TRUNCATE TABLE `iso3166`.`cdh_state_codes`;
    SET FOREIGN_KEY_CHECKS=1;
    
    LOAD DATA LOW_PRIORITY LOCAL INFILE '/temp/cdh_state_codes.txt'
        INTO TABLE `iso3166`.`cdh_state_codes`
        CHARACTER SET utf8
        FIELDS TERMINATED BY '\t'
        OPTIONALLY ENCLOSED BY '"'
        ESCAPED BY '"'
        LINES TERMINATED BY '\n'
        IGNORE 1 LINES
        (
            `country_name`, `subdiv`, `subdiv_name`, `level_name`, `alt_names`,
            `subdiv_star`, `subdiv_id`, `country_id`, `country_code_2`, `country_code_3`
        );
    
    SHOW WARNINGS;
    
    SET FOREIGN_KEY_CHECKS=0;
    TRUNCATE TABLE `iso3166`.`cdh_country_codes`;
    SET FOREIGN_KEY_CHECKS=1;
    
    LOAD DATA LOW_PRIORITY LOCAL INFILE '/temp/cdh_country_codes.txt'
        INTO TABLE `iso3166`.`cdh_country_codes`
    	CHARACTER SET utf8
    	FIELDS TERMINATED BY '\t'
    	OPTIONALLY ENCLOSED BY '"'
    	ESCAPED BY '"'
    	LINES TERMINATED BY '\n'
    	IGNORE 1 LINES
    	(
    		`country_name`, `alt_names`, `code2`, `code3`, `iso_cc`, `fips_code`,
    		`fips_country_name`, `un_region`, `un_subregion`, `cdh_id`, `comments`, `lat`, `lng`
    	);
    
    SHOW WARNINGS;

Due to inconsistencies in the CDH data, the country import will produce some warnings about missing columns - at the time of writing, certain download options on the CDH site do not work, including the option to escape with double-quotes; currently, you will need to open the files and fix extra newline characters in some entries in the files by hand. The `SHOW WARNINGS` statements above will reveal the line-numbers with problems - it should be fairly obvious how to fix these.

The list of states also contains a couple of duplicates, which will cause errors during import - these need to be removed by hand also.

If you just want something that works here and now, repaired copies of `cdh_country_codes.txt` and `cdh_state_codes.txt` are attached below. (Use of this data is subject to licensing terms for set forth by CDH.)

Be sure to use matching field and line terminators when downloading and importing.

Also note the user of `IGNORE 1 LINES`, meaning skip the column-names in the first row - if you downloaded the files without column-names, remove this line from the statement.

Run `import.sql` to populate the `country` and `region` entity-tables from the data in the flat `cdh_*` tables.

Once the entity-tables have been populated, you can drop the `cdh_*` tables if you like.
