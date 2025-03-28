<?php
// src/Controller/ProfileController.php

namespace App\Controller;

use App\Repository\UserRepository;
use App\Repository\PostRepository;
use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class ProfileController extends AbstractController
{
    #[Route('/profile/{username}', name: 'profile_show', methods: ['GET'])]
    public function show(
        string $username,
        UserRepository $userRepository,
        PostRepository $postRepository
    ): JsonResponse {
        // Récupération de l'utilisateur par son username
        $user = $userRepository->findOneBy(['username' => $username]);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], 404);
        }
        
        // Vérification que l'utilisateur connecté est bien le propriétaire du profil affiché
        $currentUser = $this->getUser();
        $isOwner = false;
        if ($currentUser && $currentUser instanceof User) {
            $isOwner = $currentUser->getId() === $user->getId();
        }

        // Récupération des posts (tweets) de l'utilisateur
        $posts = $user->getPosts()->toArray();
        // Tri chronologique (du plus ancien au plus récent)
        usort($posts, function ($a, $b) {
            return $a->getCreatedAt() <=> $b->getCreatedAt();
        });

        $tweets = [];
        foreach ($posts as $post) {
            $tweets[] = [
                'id'         => $post->getId(),
                'content'    => $post->getContent(),
                'createdAt'  => $post->getCreatedAt()->format('c'),
                'likeCount'  => $post->getLikesCount(),
                'editable'   => $isOwner, // Le tweet est éditable (ou supprimable) uniquement si l'utilisateur connecté est le propriétaire du profil
            ];
        }

        // Préparation des données de profil.
        // Remplacez les valeurs par les champs réels de votre entité User si vous les avez (bio, photo, etc.)
        $profileData = [
            'username'       => $user->getUsername(),
            'bio'            => '',                    // Exemple: $user->getBio()
            'profilePicture' => $user->getProfilePicture(), // Exemple: $user->getProfilePicture()
            'banner'         => $user->getProfileBanner(),  // Exemple: $user->getBanner()
            'location'       => '',                    // Exemple: $user->getLocation()
            'website'        => '',                    // Exemple: $user->getWebsite()
            'editable'       => $isOwner,              // Indique si le profil peut être édité
        ];

        return $this->json([
            'profile' => $profileData,
            'tweets'  => $tweets,
        ]);
    }
}
