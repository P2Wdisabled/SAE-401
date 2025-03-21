<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Exception\JsonException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

class AuthController extends AbstractController
{
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $em,
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        try {
            $data = $request->toArray();
        } catch (JsonException $e) {
            return $this->json(
                ['error' => 'Données JSON invalides.'],
                Response::HTTP_BAD_REQUEST
            );
        }
        $username = $data['username'] ?? null;
        $email = $data['email'] ?? null;
        $plainPassword = $data['password'] ?? null;

        if (!$email || !$plainPassword) {
            return $this->json(
                ['error' => 'Email et mot de passe sont requis.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Vérifier l'unicité de l'email
        if ($userRepository->findOneBy(['email' => $email])) {
            return $this->json(
                ['error' => 'Cet email est déjà utilisé.'],
                Response::HTTP_CONFLICT
            );
        }

        // Création de l'utilisateur
        $user = new User();
        $user->setEmail($email);
        $hashedPassword = $passwordHasher->hashPassword($user, $plainPassword);
        $user->setPassword($hashedPassword);
        $user->setUsername($username);

        $em->persist($user);
        $em->flush();

        // Génération d'un token JWT pour l’utilisateur
        $token = $jwtManager->create($user);

        return $this->json(
            [
                'message' => 'Inscription réussie.',
                'token'   => $token,
            ],
            Response::HTTP_CREATED
        );
    }

    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        try {
            $data = $request->toArray();
        } catch (JsonException $e) {
            return $this->json(
                ['error' => 'Données JSON invalides.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $email = $data['email'] ?? null;
        $plainPassword = $data['password'] ?? null;

        if (!$email || !$plainPassword) {
            return $this->json(
                ['error' => 'Email et mot de passe sont requis.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Chercher l'utilisateur par email
        $user = $userRepository->findOneBy(['email' => $email]);
        if (!$user) {
            return $this->json(
                ['error' => 'Identifiants invalides (email).'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        // Vérifier le mot de passe
        if (!$passwordHasher->isPasswordValid($user, $plainPassword)) {
            return $this->json(
                ['error' => 'Identifiants invalides (mot de passe).'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        // Génération d'un token JWT
        $token = $jwtManager->create($user);

        return $this->json([
            'message' => 'Authentification réussie.',
            'token'   => $token,
        ]);
    }
}
