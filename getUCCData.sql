DELIMITER //

CREATE PROCEDURE GetUCCData(
    IN p_state VARCHAR(2),
    IN p_data_type VARCHAR(10),
    IN p_secured_parties TEXT,
    IN p_ucc_type VARCHAR(20),
    IN p_role VARCHAR(10),
    IN p_filing_date_start DATE,
    IN p_filing_date_end DATE
)
BEGIN
    SET @sql = NULL;
    
    -- Construct the SELECT statement
    SET @sql = CONCAT('SELECT * FROM ', p_state);
    
    IF p_data_type = 'full' THEN
        SET @sql = CONCAT(@sql, ' LEFT JOIN ', p_state, '2 ON ', p_state, '.`Filing Number` = ', p_state, '2.`Filing Number`');
    END IF;
    
    SET @where = ' WHERE 1=1';
    
    -- Only add secured parties condition if not 'all'
    IF p_secured_parties != 'all' THEN
        SET @where = CONCAT(@where, ' AND `Secured Party Name` IN (', p_secured_parties, ')');
    END IF;
    
    IF p_ucc_type = 'uccFiling' THEN
        SET @where = CONCAT(@where, ' AND `Filing Type` IN (''UCC-1'', ''Initial'')');
    END IF;
    
    IF p_data_type = 'full' AND p_role = 'owner' THEN
        SET @where = CONCAT(@where, ' AND (`Official Designation` LIKE ''%Owner%'' OR `Official Designation` LIKE ''%Founder%'' OR `Official Designation` IS NULL)');
    END IF;

    IF p_filing_date_start IS NOT NULL THEN
        SET @where = CONCAT(@where, ' AND `Filing Date` >= ''', p_filing_date_start, '''');
    END IF;

    IF p_filing_date_end IS NOT NULL THEN
        SET @where = CONCAT(@where, ' AND `Filing Date` <= ''', p_filing_date_end, '''');
    END IF;
    
    SET @sql = CONCAT(@sql, @where);
    
    -- For debugging
    SET @debug_sql = @sql;
    
    -- Prepare and execute the statement
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- For debugging, return the SQL that was executed
    SELECT @debug_sql AS 'Generated SQL';
END //

DELIMITER ;