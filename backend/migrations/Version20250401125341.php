<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250401125341 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE user ADD pinned_tweet_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE user ADD CONSTRAINT FK_8D93D649E775ECFF FOREIGN KEY (pinned_tweet_id) REFERENCES post (id)');
        $this->addSql('CREATE INDEX IDX_8D93D649E775ECFF ON user (pinned_tweet_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE user DROP FOREIGN KEY FK_8D93D649E775ECFF');
        $this->addSql('DROP INDEX IDX_8D93D649E775ECFF ON user');
        $this->addSql('ALTER TABLE user DROP pinned_tweet_id');
    }
}
