<?php
// src/Controller/ProfileController.php

namespace App\Controller;

use App\Repository\UserRepository;
use App\Repository\PostRepository;
use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ProfileController extends AbstractController
{
    // Endpoint pour afficher le profil complet (déjà en place)
    #[Route('/profile/{username}', name: 'profile_show', methods: ['GET'])]
    public function show(
        string $username,
        UserRepository $userRepository,
        PostRepository $postRepository
    ): JsonResponse {
        $user = $userRepository->findOneBy(['username' => $username]);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], 404);
        }
        
        $currentUser = $this->getUser();
        $isOwner = false;
        $isFollowed = false;
        if ($currentUser && $currentUser instanceof User) {
            $isOwner = $currentUser->getId() === $user->getId();
            if (!$isOwner) {
                $isFollowed = $currentUser->getFollowing()->contains($user);
            }
        }
        
        $currentUserId = ($currentUser instanceof User) ? $currentUser->getId() : null;
        $isBlocked = $user->getBlocked();
        $posts = $user->getPosts()->toArray();
        usort($posts, function ($a, $b) {
            return $a->getCreatedAt() <=> $b->getCreatedAt();
        });
        $tweets = [];
        foreach ($posts as $post) {
            $liked = false;
            if ($currentUserId !== null) {
                foreach ($post->getLikes() as $like) {
                    if ($like->getUser()->getId() === $currentUserId) {
                        $liked = true;
                        break;
                    }
                }
            }
            // Ajout du champ 'media' dans le tableau de données du tweet
            $media = $post->getMedia() ?: [];
            if ($isBlocked) {
                $tweets[] = [
                    'id'             => $post->getId(),
                    'content'        => "Ce compte a été bloqué pour non respect des conditions d’utilisation",
                    'createdAt'      => $post->getCreatedAt()->format('c'),
                    'likeCount'      => 0,
                    'liked'          => false,
                    'editable'       => $isOwner,
                    'media'          => $media,
                ];
            } else {
                $tweets[] = [
                    'id'             => $post->getId(),
                    'content'        => $post->getContent(),
                    'createdAt'      => $post->getCreatedAt()->format('c'),
                    'likeCount'      => $post->getLikesCount(),
                    'liked'          => $liked,
                    'editable'       => $isOwner,
                    'media'          => $media,
                ];
            }
        }
        $profileData = [
            'username'       => $user->getUsername(),
            'bio'            => method_exists($user, 'getBio') ? $user->getBio() : '',
            'profilePicture' => $user->getProfilePicture(),
            'banner'         => $user->getProfileBanner(),
            'location'       => method_exists($user, 'getLocation') ? $user->getLocation() : '',
            'website'        => method_exists($user, 'getWebsite') ? $user->getWebsite() : '',
            'editable'       => $isOwner,
            'followed'       => $isFollowed,
            'blocked'        => $isBlocked,
        ];
        return $this->json([
            'profile' => $profileData,
            'tweets'  => $tweets,
        ]);
    }

    // Endpoint pour récupérer les informations du profil de l'utilisateur connecté pour édition
    #[Route('/api/profile/edit', name: 'api_profile_get_edit', methods: ['GET'])]
    public function getProfileEdit(): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        $profileData = [
            'username'       => $currentUser->getUsername(),
            'bio'            => $currentUser->getBio(),
            'profilePicture' => $currentUser->getProfilePicture(),
            'banner'         => $currentUser->getProfileBanner(),
            'location'       => $currentUser->getLocation(),
            'website'        => $currentUser->getWebsite(),
        ];
        return $this->json(['profile' => $profileData]);
    }

    // Endpoint pour mettre à jour le profil de l'utilisateur connecté
    #[Route('/api/profile/edit', name: 'api_profile_edit', methods: ['PUT'])]
    public function updateProfile(Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        $data = json_decode($request->getContent(), true);
        if (isset($data['bio'])) {
            $currentUser->setBio($data['bio']);
        }
        if (isset($data['profilePicture'])) {
            $currentUser->setProfilePicture($data['profilePicture']);
        }
        if (isset($data['banner'])) {
            $currentUser->setProfileBanner($data['banner']);
        }
        if (isset($data['location'])) {
            $currentUser->setLocation($data['location']);
        }
        if (isset($data['website'])) {
            $currentUser->setWebsite($data['website']);
        }
        $em->flush();
        return $this->json(['message' => 'Profil mis à jour avec succès.']);
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
