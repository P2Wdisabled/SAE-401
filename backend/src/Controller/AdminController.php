<?php
// src/Controller/AdminController.php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

class AdminController extends AbstractController
{
    /**
     * Vérifie que l'utilisateur est connecté et est admin.
     */
    private function ensureAdmin(): ?Response
    {
        $currentUser = $this->getUser();
        if (!$currentUser) {
            return $this->json(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }
        if (!in_array('ROLE_ADMIN', $currentUser->getRoles())) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }
        return null;
    }

    #[Route('/users/Accounts', name: 'users.AccountList', methods: ['GET'], format: 'json')]
    public function index(Request $request, UserRepository $userRepository): Response
    {
        // Vérification de l'authentification et des droits admin
        if ($response = $this->ensureAdmin()) {
            return $response;
        }
        
        $page = $request->query->getInt('page', 1);
        $count = 50;
        $offset = max(0, ($page - 1) * $count);

        $paginator = $userRepository->paginateUsers($offset, $count);
        $totalUsersCount = $paginator->count();
        $previousPage = $page > 1 ? $page - 1 : null;
        $nextPage = (($page * $count) < $totalUsersCount) ? $page + 1 : null;

        $usersArray = [];
        foreach ($paginator as $user) {
            $usersArray[] = [
                'id'       => $user->getId(),
                'username' => $user->getUsername() ?? "Unnamed",
                'email'    => $user->getEmail(),
            ];
        }

        return $this->json([
            'users'         => $usersArray,
            'previous_page' => $previousPage,
            'next_page'     => $nextPage,
        ]);
    }

    #[Route('/users/{id}', name: 'users.show', methods: ['GET'], format: 'json')]
    public function show(int $id, UserRepository $userRepository): Response
    {
        // Vérification de l'authentification et des droits admin
        if ($response = $this->ensureAdmin()) {
            return $response;
        }
        
        $user = $userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id'       => $user->getId(),
            'username' => $user->getUsername(),
            'email'    => $user->getEmail(),
        ]);
    }

    #[Route('/users/{id}', name: 'users.update', methods: ['PUT'], format: 'json')]
    public function update(
        int $id,
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher
    ): Response {
        // Vérification de l'authentification et des droits admin
        if ($response = $this->ensureAdmin()) {
            return $response;
        }
        
        $user = $userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!isset($data['username']) || !isset($data['email'])) {
            return $this->json(['error' => 'Missing parameters'], Response::HTTP_BAD_REQUEST);
        }

        $user->setUsername($data['username']);
        $user->setEmail($data['email']);

        // Optionnel : mettre à jour le mot de passe s'il est fourni
        if (isset($data['password']) && !empty($data['password'])) {
            $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashedPassword);
        }

        $em->persist($user);
        $em->flush();

        return $this->json([
            'id'       => $user->getId(),
            'username' => $user->getUsername(),
            'email'    => $user->getEmail(),
        ]);
    }

    #[Route('/admin/verify', name: 'admin.verify', methods: ['GET'], format: 'json')]
    public function verify(): Response
    {
        // Vérification de l'authentification et des droits admin
        if ($response = $this->ensureAdmin()) {
            return $response;
        }
        
        return $this->json(['admin' => true]);
    }
}
