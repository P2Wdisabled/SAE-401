<?php
// src/Controller/ProfileController.php

namespace App\Controller;

use App\Repository\UserRepository;
use App\Repository\PostRepository;
use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Doctrine\ORM\EntityManagerInterface;
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
        $isFollowed = false;
        if ($currentUser && $currentUser instanceof User) {
            $isOwner = $currentUser->getId() === $user->getId();
            // Si ce n'est pas le profil de l'utilisateur connecté, on vérifie s'il suit le profil affiché
            if (!$isOwner) {
                $isFollowed = $currentUser->getFollowing()->contains($user);
            }
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
                'editable'   => $isOwner, // Le tweet est éditable uniquement si c'est le profil de l'utilisateur connecté
            ];
        }

        // Préparation des données de profil.
        // Utilisez les méthodes existantes de votre entité User pour récupérer la bio, la localisation et le site web, ou définissez des valeurs par défaut.
        $profileData = [
            'username'       => $user->getUsername(),
            'bio'            => method_exists($user, 'getBio') ? $user->getBio() : '', 
            'profilePicture' => $user->getProfilePicture(), 
            'banner'         => $user->getProfileBanner(),  
            'location'       => method_exists($user, 'getLocation') ? $user->getLocation() : '', 
            'website'        => method_exists($user, 'getWebsite') ? $user->getWebsite() : '', 
            'editable'       => $isOwner,   // Indique si le profil peut être édité
            'followed'       => $isFollowed // Indique si l'utilisateur connecté suit ce profil
        ];

        return $this->json([
            'profile' => $profileData,
            'tweets'  => $tweets,
        ]);
    }

    #[Route('/api/profile/{username}/follow', name: 'api_profile_toggle_follow', methods: ['POST'])]
    public function toggleFollow(string $username, UserRepository $userRepository, EntityManagerInterface $em): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        $targetUser = $userRepository->findOneBy(['username' => $username]);
        if (!$targetUser) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], JsonResponse::HTTP_NOT_FOUND);
        }

        if ($currentUser->getFollowing()->contains($targetUser)) {
            $currentUser->unfollow($targetUser);
            $action = 'unfollowed';
        } else {
            $currentUser->follow($targetUser);
            $action = 'followed';
        }

        $em->flush();

        return $this->json([
            'message' => 'Action effectuée: ' . $action,
            'following' => $currentUser->getFollowing()->map(fn($user) => $user->getUsername())->toArray(),
        ]);
    }
}
