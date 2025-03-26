<?php
// src/Controller/SecurityController.php

namespace App\Controller;

use App\Entity\User;
use App\Entity\ApiToken;
use App\Service\UserService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Exception\JsonException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class SecurityController extends AbstractController
{
    #[Route('/register', name: 'app_register', methods: ['POST'], defaults: ['_format' => 'json'])]
    public function register(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $em,
        UserService $userService
    ): JsonResponse {
        try {
            $data = $request->toArray();
        } catch (JsonException $e) {
            return $this->json(
                ['error' => 'Données JSON invalides.'],
                JsonResponse::HTTP_BAD_REQUEST
            );
        }
        
        $email = $data['email'] ?? null;
        $username = $data['username'] ?? null;
        $plainPassword = $data['password'] ?? null;

        if (!$email || !$username || !$plainPassword) {
            return $this->json(
                ['error' => 'Email, username et mot de passe sont requis.'],
                JsonResponse::HTTP_BAD_REQUEST
            );
        }
        
        // Vérifier si l'utilisateur existe déjà
        $existingUser = $em->getRepository(User::class)->findOneBy(['email' => $email]);
        if ($existingUser) {
            return $this->json(
                ['error' => 'Cet email est déjà utilisé.'],
                JsonResponse::HTTP_CONFLICT
            );
        }
        
        // Création du nouvel utilisateur
        $user = new User();
        $user->setEmail($email);
        $user->setUsername($username);
        $hashedPassword = $passwordHasher->hashPassword($user, $plainPassword);
        $user->setPassword($hashedPassword);
        
        $em->persist($user);
        $em->flush();
        
        // Génération et stockage du token pour l'utilisateur nouvellement inscrit
        $token = $userService->generateTokenForUser($user);
        
        return $this->json(
            [
                'message' => 'Inscription réussie.',
                'token'   => $token,
            ],
            JsonResponse::HTTP_CREATED
        );
    }
    
    #[Route('/login', name: 'app_login', methods: ['POST'], defaults: ['_format' => 'json'])]
    public function login(#[CurrentUser] ?User $user, UserService $userService): JsonResponse
    {
        // Si l'utilisateur n'est pas authentifié, on renvoie une erreur
        if (!$user) {
            return $this->json(
                ['error' => 'Identifiants invalides.'],
                JsonResponse::HTTP_UNAUTHORIZED
            );
        }
        
        // Génération et stockage du token en base pour l'utilisateur connecté
        $token = $userService->generateTokenForUser($user);
        
        return $this->json([
            'message' => 'Authentification réussie.',
            'token'   => $token,
            'expiration' => json_encode((new \DateTimeImmutable())->modify('+5 hour')),
        ]);
    }
    
    #[Route('/logout', name: 'app_logout', methods: ['DELETE'], defaults: ['_format' => 'json'])]
    public function logout(Request $request, EntityManagerInterface $em): JsonResponse
    {
        // Récupération de l'en-tête Authorization
        $authHeader = $request->headers->get('Authorization');
        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return $this->json(
                ['error' => 'Token not provided'],
                JsonResponse::HTTP_BAD_REQUEST
            );
        }
        $rawToken = $matches[1];
        $hashedToken = hash('sha256', $rawToken);

        // Recherche du token dans la base
        $apiToken = $em->getRepository(ApiToken::class)->findOneBy(['token' => $hashedToken]);
        if (!$apiToken) {
            return $this->json(
                ['error' => 'Token not found'],
                JsonResponse::HTTP_NOT_FOUND
            );
        }

        // Suppression du token
        $em->remove($apiToken);
        $em->flush();

        return $this->json(['message' => 'Déconnexion réussie.']);
    }
}
