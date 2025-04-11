<?php
// src/Service/UserService.php

namespace App\Service;

use App\Entity\User;
use App\Entity\ApiToken;
use Doctrine\ORM\EntityManagerInterface;

class UserService
{
    public function __construct(private EntityManagerInterface $em) {}

    public function generateTokenForUser(User $user): string
    {
        // Generate a raw token
        $rawToken = bin2hex(random_bytes(32));
        
        // Hash the token for storage (it will not be retrievable once stored in the database)
        $hashedToken = hash('sha256', $rawToken);
        
        // Create the ApiToken entity
        $apiToken = new ApiToken();
        $apiToken->setToken($hashedToken);
        // For example, expires in 5 hour
        $apiToken->setExpiresAt((new \DateTimeImmutable())->modify('+5 hour'));
        $apiToken->setUser($user);
        
        $this->em->persist($apiToken);
        $this->em->flush();
        
        // The raw token is returned to the frontend
        return $rawToken;
    }
}
