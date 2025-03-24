<?php
// src/Entity/ApiToken.php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use App\Repository\ApiTokenRepository;

#[ORM\Entity(repositoryClass: ApiTokenRepository::class)]
class ApiToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    
    #[ORM\Column(length: 64, unique: true)]
    private ?string $token = null;
    
    #[ORM\Column]
    private ?\DateTimeImmutable $expiresAt = null;
    
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;
    
    public function getId(): ?int
    {
        return $this->id;
    }
    
    public function getToken(): ?string
    {
        return $this->token;
    }
    
    public function setToken(string $token): self
    {
        $this->token = $token;
        return $this;
    }
    
    public function getExpiresAt(): ?\DateTimeImmutable
    {
        return $this->expiresAt;
    }
    
    public function setExpiresAt(\DateTimeImmutable $expiresAt): self
    {
        $this->expiresAt = $expiresAt;
        return $this;
    }
    
    public function getUser(): ?User
    {
        return $this->user;
    }
    
    public function setUser(User $user): self
    {
        $this->user = $user;
        return $this;
    }
}
