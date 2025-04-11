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
                ['error' => 'Invalid JSON data.'],
                JsonResponse::HTTP_BAD_REQUEST
            );
        }
        
        $email = $data['email'] ?? null;
        $username = $data['username'] ?? null;
        $plainPassword = $data['password'] ?? null;

        if (!$email || !$username || !$plainPassword) {
            return $this->json(
                ['error' => 'Email, username, and password are required.'],
                JsonResponse::HTTP_BAD_REQUEST
            );
        }
        
        $existingUser = $em->getRepository(User::class)->findOneBy(['email' => $email]);
        if ($existingUser) {
            return $this->json(
                ['error' => 'This email is already in use.'],
                JsonResponse::HTTP_CONFLICT
            );
        }
        
        $user = new User();
        $user->setEmail($email);
        $user->setUsername($username);
        $hashedPassword = $passwordHasher->hashPassword($user, $plainPassword);
        $user->setPassword($hashedPassword);
        
        $em->persist($user);
        $em->flush();
        
        $token = $userService->generateTokenForUser($user);
        
        return $this->json(
            [
                'message' => 'Registration successful.',
                'token'   => $token,
            ],
            JsonResponse::HTTP_CREATED
        );
    }
    
    #[Route('/login', name: 'app_login', methods: ['POST'], defaults: ['_format' => 'json'])]
    public function login(#[CurrentUser] ?User $user, UserService $userService): JsonResponse
    {
        // If the user is not authenticated, return an error
        if (!$user) {
            return $this->json(
                ['error' => 'Invalid credentials.'],
                JsonResponse::HTTP_UNAUTHORIZED
            );
        }
        
        // Check for blocked status
        if ($user->getBlocked()) {
            return $this->json(
                ['error' => 'Account blocked for non-compliance with terms of use.'],
                JsonResponse::HTTP_FORBIDDEN
            );
        }
        
        $token = $userService->generateTokenForUser($user);
        
        return $this->json([
            'message' => 'Authentication successful.',
            'token'   => $token,
            'expiration' => json_encode((new \DateTimeImmutable())->modify('+5 hour')),
        ]);
    }
    
    #[Route('/logout', name: 'app_logout', methods: ['DELETE'], defaults: ['_format' => 'json'])]
    public function logout(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $authHeader = $request->headers->get('Authorization');
        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return $this->json(
                ['error' => 'Token not provided'],
                JsonResponse::HTTP_BAD_REQUEST
            );
        }
        $rawToken = $matches[1];
        $hashedToken = hash('sha256', $rawToken);

        $apiToken = $em->getRepository(ApiToken::class)->findOneBy(['token' => $hashedToken]);
        if (!$apiToken) {
            return $this->json(
                ['error' => 'Token not found'],
                JsonResponse::HTTP_NOT_FOUND
            );
        }

        $em->remove($apiToken);
        $em->flush();

        return $this->json(['message' => 'Logout successful.']);
    }
}
