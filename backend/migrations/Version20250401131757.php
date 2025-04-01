<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250401131757 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE post ADD retweeted_from_id INT DEFAULT NULL, ADD retweet_count INT NOT NULL, ADD is_retweet TINYINT(1) NOT NULL, ADD retweet_comment VARCHAR(280) DEFAULT NULL');
        $this->addSql('ALTER TABLE post ADD CONSTRAINT FK_5A8A6C8D8BCEF275 FOREIGN KEY (retweeted_from_id) REFERENCES post (id)');
        $this->addSql('CREATE INDEX IDX_5A8A6C8D8BCEF275 ON post (retweeted_from_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE post DROP FOREIGN KEY FK_5A8A6C8D8BCEF275');
        $this->addSql('DROP INDEX IDX_5A8A6C8D8BCEF275 ON post');
        $this->addSql('ALTER TABLE post DROP retweeted_from_id, DROP retweet_count, DROP is_retweet, DROP retweet_comment');
    }
}
