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
        // Génération d'un token brut
        $rawToken = bin2hex(random_bytes(32));
        
        // Hachage du token pour le stockage (il ne sera plus récupérable une fois inséré en base)
        $hashedToken = hash('sha256', $rawToken);
        
        // Création de l'entité ApiToken
        $apiToken = new ApiToken();
        $apiToken->setToken($hashedToken);
        // Par exemple, expiration dans 1 heure
        $apiToken->setExpiresAt((new \DateTimeImmutable())->modify('+5 hour'));
        $apiToken->setUser($user);
        
        $this->em->persist($apiToken);
        $this->em->flush();
        
        // Le token brut est renvoyé au front
        return $rawToken;
    }
}
