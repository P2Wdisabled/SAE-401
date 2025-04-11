<?php
// src/Entity/Notification.php

namespace App\Entity;

use App\Repository\NotificationRepository;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\User;

#[ORM\Entity(repositoryClass: NotificationRepository::class)]
class Notification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    
    #[ORM\Column(type: "text")]
    private string $content;
    
    #[ORM\Column(type: "datetime")]
    private \DateTimeInterface $createdAt;
    
    #[ORM\Column(name: "is_read", type: "boolean")]
    private bool $isRead = false;
    
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $recipient = null;
    
    public function __construct() {
        $this->createdAt = new \DateTime();
    }
    
    public function getId(): ?int {
        return $this->id;
    }
    
    public function getContent(): string {
        return $this->content;
    }
    
    public function setContent(string $content): self {
        $this->content = $content;
        return $this;
    }
    
    public function getCreatedAt(): \DateTimeInterface {
        return $this->createdAt;
    }
    
    public function isRead(): bool {
        return $this->isRead;
    }
    
    public function setIsRead(bool $isRead): self {
        $this->isRead = $isRead;
        return $this;
    }
    
    public function getRecipient(): ?User {
        return $this->recipient;
    }
    
    public function setRecipient(User $recipient): self {
        $this->recipient = $recipient;
        return $this;
    }
}
