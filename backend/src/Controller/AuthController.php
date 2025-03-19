<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthController extends AbstractController
{
    #[Route('/register', name: 'user.register', methods: ['POST'], format: 'json')]
    public function register(
        Request $request, 
        ValidatorInterface $validator, 
        UserPasswordHasherInterface $passwordHasher, 
        EntityManagerInterface $entityManager
    ): Response {
        $data = json_decode($request->getContent(), true);

        $user = new User();
        $user->setEmail($data['email'] ?? '');
        $user->setUsername($data['username'] ?? '');
        $user->setPassword($data['password'] ?? '');

        $errors = $validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json($errorMessages, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Hachage du mot de passe
        $hashedPassword = $passwordHasher->hashPassword($user, $user->getPassword());
        $user->setPassword($hashedPassword);

        $entityManager->persist($user);
        $entityManager->flush();

        return new Response('', Response::HTTP_CREATED);
    }

    #[Route('/login', name: 'user.login', methods: ['POST'], format: 'json')]
public function login(
    Request $request, 
    UserRepository $userRepository, 
    UserPasswordHasherInterface $passwordHasher,
    JWTTokenManagerInterface $JWTManager,
    EntityManagerInterface $entityManager // injection de l'EntityManager
): Response {
    $data = json_decode($request->getContent(), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    $user = $userRepository->findOneBy(['email' => $email]);
    if (!$user || !$passwordHasher->isPasswordValid($user, $password)) {
        return $this->json(['error' => 'Identifiants invalides'], Response::HTTP_UNAUTHORIZED);
    }

    // Création du token JWT pour l'utilisateur connecté
    $token = $JWTManager->create($user);
    
    // Enregistrement du token dans la colonne "api_token" de l'utilisateur
    $user->setApiToken($token);
    $entityManager->persist($user);
    $entityManager->flush();
    
    return $this->json(['token' => $token]);
}

}
