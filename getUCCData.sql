DELIMITER //

CREATE PROCEDURE GetUCCData(
    IN p_state VARCHAR(2),
    IN p_data_type VARCHAR(10),
    IN p_secured_parties TEXT,
    IN p_ucc_type VARCHAR(20),
    IN p_role VARCHAR(10)
)
BEGIN
    SET @sql = CONCAT('SELECT * FROM ', p_state);
    
    IF p_data_type = 'full' THEN
        SET @sql = CONCAT(@sql, ' LEFT JOIN ', p_state, '2 ON ', p_state, '.`Filing Number` = ', p_state, '2.`Filing Number`');
    END IF;
    
    SET @where = ' WHERE 1=1';
    
    IF p_secured_parties != 'all' THEN
        SET @where = CONCAT(@where, ' AND `Secured Party Name` IN (', p_secured_parties, ')');
    END IF;
    
    IF p_ucc_type = 'uccFiling' THEN
        SET @where = CONCAT(@where, ' AND `Filing Type` IN (''UCC-1'', ''Initial'')');
    END IF;
    
    IF p_data_type = 'full' AND p_role = 'owner' THEN
        SET @where = CONCAT(@where, ' AND (`Official Designation` LIKE ''%Owner%'' OR `Official Designation` LIKE ''%Founder%'' OR `Official Designation` IS NULL)');
    END IF;
    
    SET @sql = CONCAT(@sql, @where);
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //

DELIMITER ;