-- Chạy trong phpMyAdmin (database giay_database) nếu server vẫn báo thiếu cột
ALTER TABLE `users` ADD COLUMN `googleId` VARCHAR(255) NULL;
ALTER TABLE `users` MODIFY COLUMN `password` VARCHAR(255) NULL;
