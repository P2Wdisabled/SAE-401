<?php
// src/Controller/ProfileController.php

namespace App\Controller;

use App\Repository\UserRepository;
use App\Repository\PostRepository;
use App\Entity\User;
use App\Entity\Post;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ProfileController extends AbstractController
{
    // Endpoint pour afficher le profil complet
    #[Route('/api/posts', name: 'posts.index', methods: ['GET'], format: 'json')]
    public function index(Request $request, PostRepository $postRepository, UserRepository $userRepository): JsonResponse
    {
        $currentUser = $this->getUser();
        $currentUserId = ($currentUser instanceof \App\Entity\User) ? $currentUser->getId() : null;
    
        $page = $request->query->getInt('page', 1);
        $count = 50;
        $offset = max(0, ($page - 1) * $count);
    
        // Récupération des filtres
        $filter = $request->query->get('filter'); // Par exemple "following"
        $search = $request->query->get('search');
        $date = $request->query->get('date'); // Format YYYY-MM-DD
        $type = $request->query->get('type'); // "text" ou "media"
        $userFilter = $request->query->get('user'); // nom d'utilisateur
    
        $qb = $postRepository->createQueryBuilder('p')
                ->orderBy('p.createdAt', 'DESC');
    
        // Filtrer les posts des personnes suivies
        if ($filter === 'following' && $currentUser instanceof \App\Entity\User) {
            $followedUsers = $currentUser->getFollowing()->toArray();
            $followedUserIds = array_map(fn($user) => $user->getId(), $followedUsers);
            if (!empty($followedUserIds)) {
                $qb->andWhere('p.user IN (:followedUserIds)')
                   ->setParameter('followedUserIds', $followedUserIds);
            } else {
                return $this->json([
                    'posts' => [],
                    'previous_page' => null,
                    'next_page' => null,
                ]);
            }
        }
    
        // Recherche textuelle dans le contenu
        if ($search) {
            $qb->andWhere('p.content LIKE :search')
               ->setParameter('search', '%' . $search . '%');
        }
    
        // Filtrer par date
        if ($date) {
            $qb->andWhere("function('DATE', p.createdAt) = :date")
               ->setParameter('date', $date);
        }
    
        // Filtrer par type
        if ($type) {
            if ($type === 'text') {
                // Post sans médias
                $qb->andWhere('p.media IS NULL OR p.media = :empty')
                   ->setParameter('empty', '[]');
            } elseif ($type === 'media') {
                // Post avec médias
                $qb->andWhere("p.media IS NOT NULL AND p.media <> :empty")
                   ->setParameter('empty', '[]');
            }
        }
    
        // Filtrer par utilisateur (nom d'utilisateur)
        if ($userFilter) {
            $qb->join('p.user', 'u')
               ->andWhere('u.username = :usernameFilter')
               ->setParameter('usernameFilter', $userFilter);
        }
    
        $qb->setFirstResult($offset)
           ->setMaxResults($count);
    
        $postsResult = $qb->getQuery()->getResult();
    
        // Pour la pagination, ici on compte le nombre de résultats retournés (pour simplifier)
        $totalPostsCount = count($postsResult);
        $previousPage = $page > 1 ? $page - 1 : null;
        $nextPage = ($page * $count < $totalPostsCount) ? $page + 1 : null;
    
        $postsArray = [];
        foreach ($postsResult as $post) {
            if (!$post->getUser()) {
                continue;
            }
            if ($post->getCensored()) {
                // Post censuré
                $data = [
                    'id' => $post->getId(),
                    'username' => $post->getUser()->getUsername() ?? "Unnamed",
                    'content' => "Ce message enfreint les conditions d’utilisation de la plateforme",
                    'createdAt' => $post->getCreatedAt()->format('Y-m-d H:i:s'),
                    'likeCount' => 0,
                    'liked' => false,
                    'profilePicture' => $post->getUser()->getProfilePicture() ?? 'default-profile.png',
                    'media' => [],
                    'replies' => [],
                    'censored' => true,
                ];
            } else {
                $liked = false;
                if ($currentUserId !== null) {
                    foreach ($post->getLikes() as $like) {
                        if ($like->getUser()->getId() === $currentUserId) {
                            $liked = true;
                            break;
                        }
                    }
                }
                $data = [
                    'id' => $post->getId(),
                    'username' => $post->getUser()->getUsername() ?? "Unnamed",
                    'content' => $post->getUser()->getBlocked() 
                                  ? "Ce compte a été bloqué pour non respect des conditions d’utilisation" 
                                  : $post->getContent(),
                    'createdAt' => $post->getCreatedAt()->format('Y-m-d H:i:s'),
                    'likeCount' => $post->getUser()->getBlocked() ? 0 : $post->getLikesCount(),
                    'liked' => $post->getUser()->getBlocked() ? false : $liked,
                    'profilePicture' => $post->getUser()->getProfilePicture() ?? 'default-profile.png',
                    'media' => $post->getMedia() ?: [],
                    'censored' => false,
                ];
                $repliesArray = [];
                foreach ($post->getReplies() as $reply) {
                    $repliesArray[] = [
                        'id' => $reply->getId(),
                        'username' => $reply->getUser()->getUsername() ?? "Unnamed",
                        'content' => $reply->getContent(),
                        'createdAt' => $reply->getCreatedAt()->format('Y-m-d H:i:s'),
                        'profilePicture' => $reply->getUser()->getProfilePicture() ?? 'default-profile.png',
                        'media' => $reply->getMedia() ?: [],
                    ];
                }
                $data['replies'] = $repliesArray;
            }
            $postsArray[] = $data;
        }
    
        return $this->json([
            'posts' => $postsArray,
            'previous_page' => $previousPage,
            'next_page' => $nextPage,
        ]);
    }

    // Endpoint pour récupérer le profil de l'utilisateur connecté pour édition
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

    // Endpoint pour suivre/désabonner un utilisateur
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
        if ($targetUser->getBlockedUsers()->contains($currentUser)) {
            return $this->json(
                ['error' => 'Vous ne pouvez pas suivre cet utilisateur car il vous a bloqué.'],
                JsonResponse::HTTP_FORBIDDEN
            );
        }
        $action = "";
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

    // Endpoint pour bloquer/débloquer un utilisateur
    #[Route('/api/profile/{username}/block', name: 'api_profile_toggle_block', methods: ['POST'])]
    public function toggleBlock(string $username, UserRepository $userRepository, EntityManagerInterface $em): JsonResponse
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
        if ($currentUser->getBlockedUsers()->contains($targetUser)) {
            $currentUser->unblock($targetUser);
            $action = 'unblocked';
        } else {
            $currentUser->block($targetUser);
            if ($currentUser->getFollowing()->contains($targetUser)) {
                $currentUser->unfollow($targetUser);
                $targetUser->unfollow($currentUser);
            }
            $action = 'blocked';
        }
        $em->flush();
        return $this->json([
            'message' => "Utilisateur {$action} avec succès.",
            'blockedUsers' => $currentUser->getBlockedUsers()->map(fn($user) => $user->getUsername())->toArray(),
        ]);
    }

    #[Route('/api/profile/blocked', name: 'api_profile_blocked_list', methods: ['GET'])]
    public function blockedList(): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        $blockedUsers = $currentUser->getBlockedUsers()->map(function(User $user) {
            return [
                'username' => $user->getUsername(),
                'profilePicture' => $user->getProfilePicture(),
            ];
        })->toArray();
        return $this->json(['blockedUsers' => $blockedUsers]);
    }

    // Endpoints pour récupérer et mettre à jour les paramètres de l'utilisateur
    #[Route('/api/profile/settings', name: 'api_profile_settings_get', methods: ['GET'])]
    public function getSettings(): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        return $this->json([
            'readOnly' => method_exists($currentUser, 'getReadOnly') ? $currentUser->getReadOnly() : false,
            'private' => method_exists($currentUser, 'getPrivate') ? $currentUser->getPrivate() : false,
        ]);
    }

    #[Route('/api/profile/settings', name: 'api_profile_settings_update', methods: ['PUT'])]
    public function updateSettings(Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        $data = json_decode($request->getContent(), true);
        if (isset($data['readOnly'])) {
            $currentUser->setReadOnly((bool)$data['readOnly']);
        }
        if (isset($data['private'])) {
            $currentUser->setPrivate((bool)$data['private']);
        }
        $em->flush();
        return $this->json(['message' => 'Paramètres mis à jour avec succès.']);
    }

    // Nouveaux endpoints pour gérer l'épinglage des tweets
    #[Route('/api/profile/{username}/pin/{tweetId}', name: 'api_profile_pin_tweet', methods: ['POST'])]
    public function pinTweet(
        string $username,
        int $tweetId,
        UserRepository $userRepository,
        PostRepository $postRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        // Seul le propriétaire du profil peut épingler un tweet
        if ($currentUser->getUsername() !== $username) {
            return $this->json(['error' => 'Accès non autorisé.'], JsonResponse::HTTP_FORBIDDEN);
        }
        $post = $postRepository->find($tweetId);
        if (!$post) {
            return $this->json(['error' => 'Tweet non trouvé.'], JsonResponse::HTTP_NOT_FOUND);
        }
        // Vérifier que le tweet appartient au profil courant
        if ($post->getUser()->getId() !== $currentUser->getId()) {
            return $this->json(['error' => 'Ce tweet ne vous appartient pas.'], JsonResponse::HTTP_FORBIDDEN);
        }
        $currentUser->setPinnedTweet($post);
        $em->flush();
        return $this->json([
            'message' => 'Tweet épinglé avec succès.',
            'pinnedTweet' => $post->getId(),
        ]);
    }

    #[Route('/api/profile/{username}/unpin', name: 'api_profile_unpin_tweet', methods: ['POST'])]
    public function unpinTweet(
        string $username,
        UserRepository $userRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        if ($currentUser->getUsername() !== $username) {
            return $this->json(['error' => 'Accès non autorisé.'], JsonResponse::HTTP_FORBIDDEN);
        }
        $currentUser->setPinnedTweet(null);
        $em->flush();
        return $this->json(['message' => 'Tweet désépinglé avec succès.']);
    }
}
