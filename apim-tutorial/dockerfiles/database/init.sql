CREATE DATABASE IF NOT EXISTS RailCoEmployeeDB;
USE RailCoEmployeeDB;

DROP TABLE IF EXISTS `employees`;

CREATE TABLE employees ( 
EMPLOYEE_ID int NOT NULL AUTO_INCREMENT, 
FIRST_NAME varchar(20) DEFAULT NULL, 
LAST_NAME varchar(25) NOT NULL, 
EMAIL varchar(25) NOT NULL UNIQUE,
JOB_TITLE varchar(25) NOT NULL,
PRIMARY KEY (EMPLOYEE_ID)  
)ENGINE=InnoDB;

# insert dummy data for employees table
INSERT INTO `employees` VALUES (1,'Ahmed','Cartwright','ipfannerstill@example.org','supervisor'),(2,'Savion','Bechtelar','dibbert.wiley@example.org','assistant-manager'),(3,'Jayne','Upton','amara.kuhlman@example.com','driver'),(4,'Shanelle','Larson','skiles.harley@example.org','janitor'),(5,'Merritt','McClure','caterina.o\'kon@example.or','security-guard'),(6,'Nyah','Renner','qhintz@example.net','security-guard'),(7,'Camden','Halvorson','kbednar@example.com','clerk'),(8,'Jaren','Kilback','tito.harber@example.org','clerk'),(9,'Prince','Wilderman','estrella06@example.net','accountant'),(10,'Johathan','Mann','terry94@example.com','manager'),(11,'Rachael','Kshlerin','weston03@example.org','assistant-manager'),(12,'Darwin','Will','evert52@example.org','accountant'),(13,'Ransom','Hane','ari.wintheiser@example.or','accountant'),(14,'Ila','Rowe','charity92@example.net','accountant'),(15,'Cicero','Hahn','dorcas13@example.com','clerk'),(16,'Roger','Davis','veum.ottilie@example.org','manager'),(17,'Jalon','Kuvalis','laron.crooks@example.com','security-guard'),(18,'Kurt','Glover','zetta92@example.net','assistant-manager'),(19,'Jameson','Effertz','altenwerth.barton@example','security-guard'),(20,'Gunner','Cartwright','loyal00@example.com','assistant-manager'),(21,'Lenny','Labadie','welch.berry@example.net','security-guard'),(22,'Cordell','Rodriguez','jewel.parisian@example.ne','security-guard'),(23,'Antonia','Bergstrom','hegmann.kaylah@example.or','driver'),(24,'Donnell','Friesen','ulangosh@example.net','janitor'),(25,'Jacinthe','Thiel','dhilll@example.org','janitor'),(26,'Eileen','Stamm','mathew.hane@example.net','assistant-manager'),(27,'Yazmin','Von','mac98@example.org','assistant-manager'),(28,'Rudolph','Haley','larue56@example.net','security-guard'),(29,'Robyn','Corkery','madonna91@example.com','janitor'),(30,'Brenda','Abernathy','jbrekke@example.net','driver'),(31,'Wilson','Greenholt','kohler.lori@example.com','accountant'),(32,'Cody','Schmitt','haylie16@example.com','security-guard'),(33,'Mable','Romaguera','mbeatty@example.org','driver'),(34,'Lyric','Rice','cormier.nigel@example.org','accountant'),(35,'Tad','Koss','walter.jamison@example.ne','assistant-manager'),(36,'Leonel','Mante','xcassin@example.com','manager'),(37,'Maiya','Rolfson','jast.mariam@example.com','security-guard'),(38,'Sabina','Lemke','joyce06@example.net','janitor'),(39,'Euna','O\'Kon','hcollier@example.net','supervisor'),(40,'Loyal','Crist','hipolito49@example.net','clerk'),(41,'Dessie','Cartwright','browe@example.com','driver'),(42,'Cristina','Christiansen','xfranecki@example.org','security-guard'),(43,'Carlotta','Nitzsche','walsh.myrna@example.org','supervisor'),(44,'Roselyn','Johns','madisen.kerluke@example.c','assistant-manager'),(45,'Shirley','Considine','bergstrom.elyse@example.n','accountant'),(46,'Arnulfo','Satterfield','nolan.sanford@example.com','assistant-manager'),(47,'Tiara','Jacobson','greenholt.edward@example.','driver'),(48,'Corbin','Cummings','fadel.concepcion@example.','clerk'),(49,'Florian','Leffler','cristina94@example.com','driver'),(50,'Audra','Muller','trenton.macejkovic@exampl','security-guard'),(51,'Alessia','Wunsch','gabriel.d\'amore@example.c','accountant'),(52,'Vita','Bartoletti','alene68@example.com','security-guard'),(53,'Faye','Mayer','edgardo.stiedemann@exampl','janitor'),(54,'Donavon','Paucek','burley.beier@example.com','manager'),(55,'Jacey','Daniel','stewart21@example.net','assistant-manager'),(56,'Freda','Trantow','okovacek@example.net','driver'),(57,'Bart','Gleichner','bridget93@example.org','janitor'),(58,'Eleonore','Kovacek','tbrekke@example.org','accountant'),(59,'Anne','Homenick','vbuckridge@example.net','assistant-manager'),(60,'Cali','Padberg','clement59@example.net','driver'),(61,'Twila','Russel','wgreenfelder@example.org','driver'),(62,'Emmitt','Bayer','dereck20@example.org','assistant-manager'),(63,'Josiane','Grimes','hoeger.lucienne@example.o','security-guard'),(64,'Madie','McDermott','eloisa.yost@example.com','accountant'),(65,'Alessandra','Ruecker','margarete10@example.net','driver'),(66,'Carissa','Boyle','merl.bayer@example.org','accountant'),(67,'Jeromy','Eichmann','zreichel@example.net','accountant'),(68,'Ardith','Bergstrom','mustafa.donnelly@example.','driver'),(69,'Lila','Prosacco','garry.hamill@example.org','accountant'),(70,'Jayne','Frami','thea45@example.org','supervisor'),(71,'Marjorie','Kling','stark.uriah@example.net','manager'),(72,'Tara','Kiehn','ugutmann@example.com','assistant-manager'),(73,'Hailey','Champlin','bryce02@example.com','security-guard'),(74,'Erwin','Schumm','aruecker@example.com','security-guard'),(75,'Major','Trantow','towne.earline@example.com','security-guard'),(76,'Rahul','Cummerata','goyette.frieda@example.ne','assistant-manager'),(77,'Gabe','Zboncak','xemard@example.org','security-guard'),(78,'Layla','Batz','elvis.sawayn@example.org','manager'),(79,'Cheyanne','Baumbach','olin.rath@example.com','driver'),(80,'Elinore','Waelchi','mtillman@example.org','security-guard'),(81,'Caleb','Prohaska','hschimmel@example.net','clerk'),(82,'Connie','Mayer','graciela.hammes@example.c','janitor'),(83,'Vincenza','Runte','lindsay.greenholt@example','janitor'),(84,'Cornelius','Rowe','mreynolds@example.com','driver'),(85,'Mable','Kertzmann','qwalsh@example.com','manager'),(86,'Marjolaine','VonRueden','xhettinger@example.com','security-guard'),(87,'Carole','Lubowitz','eondricka@example.org','manager'),(88,'Israel','Powlowski','schamberger.wilford@examp','supervisor'),(89,'Tomasa','Cartwright','botsford.john@example.net','driver'),(90,'Gabe','Ullrich','hermiston.kyler@example.n','janitor'),(91,'Toy','Harber','donny44@example.com','security-guard'),(92,'Nyasia','Corwin','yrice@example.net','accountant'),(93,'Eulalia','Huels','roscoe.murphy@example.org','driver'),(94,'Connie','Crist','bernier.cleta@example.org','clerk'),(95,'Xzavier','Stiedemann','lowe.elena@example.com','assistant-manager'),(96,'Dahlia','Rath','hansen.kaleb@example.net','driver'),(97,'Joana','Steuber','fausto.mcclure@example.co','janitor'),(98,'Macey','Koss','considine.rashad@example.','janitor'),(99,'Javonte','Tromp','ibrahim.barton@example.or','manager'),(100,'Marcia','Predovic','reinger.vernice@example.n','janitor');

CREATE DATABASE IF NOT EXISTS RailCoStoreDB;
USE RailCoStoreDB;

DROP TABLE IF EXISTS `CATERING_SERVICE_MESSAGE_STORE`;
DROP TABLE IF EXISTS `FAILOVER_MESSAGE_STORE`;

CREATE TABLE CATERING_SERVICE_MESSAGE_STORE(
            indexId BIGINT(20) NOT NULL AUTO_INCREMENT,
            msg_id VARCHAR(200) NOT NULL ,
            message BLOB NOT NULL ,
            PRIMARY KEY ( indexId )
            )ENGINE=InnoDB;

CREATE TABLE FAILOVER_MESSAGE_STORE(
            indexId BIGINT(20) NOT NULL AUTO_INCREMENT,
            msg_id VARCHAR(200) NOT NULL ,
            message BLOB NOT NULL ,
            PRIMARY KEY (indexId)
            )ENGINE=InnoDB;
           
          