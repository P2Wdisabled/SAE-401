<?php
// src/Controller/ProfileController.php

namespace App\Controller;

use App\Repository\UserRepository;
use App\Repository\PostRepository;
use App\Entity\User;
use App\Entity\Post;
use App\Entity\Notification;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Doctrine\ORM\EntityManagerInterface;
use App\Repository\NotificationRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ProfileController extends AbstractController
{
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
                // Vérifier si le suivi a été approuvé
                $isFollowed = $currentUser->getFollowing()->contains($user);
            }
        }
        
        // Si le compte est privé et que l'utilisateur n'est ni le propriétaire ni un abonné approuvé, renvoyer un message
        if ($user->getPrivate() && !$isOwner && !$isFollowed) {
            return $this->json([
                'profile' => [
                    'username'       => $user->getUsername(),
                    'bio'            => method_exists($user, 'getBio') ? $user->getBio() : '',
                    'profilePicture' => $user->getProfilePicture(),
                    'banner'         => $user->getProfileBanner(),
                    'location'       => method_exists($user, 'getLocation') ? $user->getLocation() : '',
                    'website'        => method_exists($user, 'getWebsite') ? $user->getWebsite() : '',
                    'editable'       => $isOwner,
                    'followed'       => $isFollowed,
                    'blocked'        => $user->getBlocked(),
                    'blockedUsers'   => false,
                    'readOnly'       => method_exists($user, 'getReadOnly') ? $user->getReadOnly() : false,
                    'private'        => method_exists($user, 'getPrivate') ? $user->getPrivate() : false,
                ],
                'pinnedTweet' => null,
                'tweets'  => [],
                'message' => "Ce compte est privé. Envoyez une demande de suivi pour voir les tweets."
            ]);
        }
        
        $currentUserId = ($currentUser instanceof User) ? $currentUser->getId() : null;
        $isBlocked = $user->getBlocked();
        $userBlocked = false;
        if ($currentUser instanceof User && !$isOwner) {
            $userBlocked = $currentUser->getBlockedUsers()->contains($user);
        }
        
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
            if ($post->getCensored()) {
                $tweets[] = [
                    'id'             => $post->getId(),
                    'content'        => "Ce message enfreint les conditions d’utilisation de la plateforme",
                    'createdAt'      => $post->getCreatedAt()->format('c'),
                    'likeCount'      => 0,
                    'liked'          => false,
                    'editable'       => $isOwner,
                    'media'          => [],
                    'replies'        => [],
                    'censored'       => true,
                    'locked'        => $post->isLocked(),
                ];
            } else if ($isBlocked) {
                $tweets[] = [
                    'id'             => $post->getId(),
                    'content'        => "Ce compte a été bloqué pour non respect des conditions d’utilisation",
                    'createdAt'      => $post->getCreatedAt()->format('c'),
                    'likeCount'      => 0,
                    'liked'          => false,
                    'retweetCount'   => $post->getRetweetCount(),
                    'editable'       => $isOwner,
                    'media'          => $post->getMedia() ?: [],
                    'censored'       => false,
                    'locked'        => $post->isLocked(),
                ];
            } else {
                $tweetData = [
                    'id'             => $post->getId(),
                    'content'        => $post->getContent(),
                    'createdAt'      => $post->getCreatedAt()->format('c'),
                    'likeCount'      => $post->getLikesCount(),
                    'liked'          => $liked,
                    'editable'       => $isOwner,
                    'retweetCount'   => $post->getRetweetCount(),
                    'media'          => $post->getMedia() ?: [],
                    'censored'       => false,
                    'locked'        => $post->isLocked(),
                ];
                $repliesArray = [];
                foreach ($post->getReplies() as $reply) {
                    $repliesArray[] = [
                        'id'             => $reply->getId(),
                        'username'       => $reply->getUser()->getUsername() ?? "Unnamed",
                        'content'        => $reply->getContent(),
                        'createdAt'      => $reply->getCreatedAt()->format('Y-m-d H:i:s'),
                        'profilePicture' => $reply->getUser()->getProfilePicture() ?? 'default-profile.png',
                        'media'          => $reply->getMedia() ?: [],
                        'locked'        => $post->isLocked(),
                    ];
                }
                $tweetData['replies'] = $repliesArray;
                $tweets[] = $tweetData;
            }
        }
        
        $pinnedTweet = null;
        if ($user->getPinnedTweet()) {
            $pt = $user->getPinnedTweet();
            $pinnedTweet = [
                'id' => $pt->getId(),
                'content' => $pt->getContent(),
                'createdAt' => $pt->getCreatedAt()->format('c'),
                'likeCount' => $pt->getLikesCount(),
                'retweetCount'   => $pt->getRetweetCount(),
                'liked' => false,
                'media' => $pt->getMedia() ?: [],
                'censored' => $pt->getCensored(),
            ];
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
            'blockedUsers'   => $userBlocked,
            'readOnly'       => method_exists($user, 'getReadOnly') ? $user->getReadOnly() : false,
            'private'        => method_exists($user, 'getPrivate') ? $user->getPrivate() : false,
        ];
        return $this->json([
            'profile' => $profileData,
            'pinnedTweet' => $pinnedTweet,
            'tweets'  => $tweets,
        ]);
    }

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
        if ($targetUser->getBlockedUsers()->contains($currentUser)) {
            return $this->json(
                ['error' => 'Vous ne pouvez pas suivre cet utilisateur car il vous a bloqué.'],
                JsonResponse::HTTP_FORBIDDEN
            );
        }
        // Si le compte est privé, gérer la demande d'abonnement
        if ($targetUser->getPrivate()) {
            // Si l'utilisateur est déjà un abonné (suivi approuvé), permettre l'unfollow
            if ($targetUser->getFollowers()->contains($currentUser)) {
                $currentUser->unfollow($targetUser);
                $em->flush();
                return $this->json([
                    'message' => 'Action effectuée: unfollowed',
                    'following' => $currentUser->getFollowing()->map(fn($user) => $user->getUsername())->toArray(),
                ]);
            } else {
                // Sinon, si aucune demande n'est en attente, ajouter le demandeur dans pending et notifier le propriétaire du compte
                if (!$targetUser->getPendingFollowRequests()->contains($currentUser)) {
                    $targetUser->addPendingFollowRequest($currentUser);
                    $em->flush();

                    $notification = new Notification();
                    $notification->setContent($currentUser->getUsername() . " a envoyé une demande de suivi.");
                    $notification->setRecipient($targetUser);
                    $em->persist($notification);
                    $em->flush();

                    return $this->json([
                        'message' => 'Demande de suivi envoyée. En attente d\'approbation.'
                    ], JsonResponse::HTTP_OK);
                } else {
                    return $this->json([
                        'message' => 'Vous avez déjà envoyé une demande de suivi.'
                    ], JsonResponse::HTTP_OK);
                }
            }
        }
        // Pour un compte public, établir directement la relation de suivi
        $action = "";
        if ($currentUser->getFollowing()->contains($targetUser)) {
            $currentUser->unfollow($targetUser);
            $action = 'unfollowed';
        } else {
            $currentUser->follow($targetUser);
            $action = 'followed';
        }
        $em->flush();
        
        // Envoi de notification en cas de suivi effectif
        if ($action === 'followed' && $currentUser !== $targetUser) {
            $notification = new Notification();
            $notification->setContent($currentUser->getUsername() . " a commencé à vous suivre.");
            $notification->setRecipient($targetUser);
            $em->persist($notification);
            $em->flush();
        }
        
        return $this->json([
            'message' => 'Action effectuée: ' . $action,
            'following' => $currentUser->getFollowing()->map(fn($user) => $user->getUsername())->toArray(),
        ]);
    }

    #[Route('/api/profile/pending', name: 'api_profile_pending', methods: ['GET'])]
    public function getPendingFollowRequests(): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        $pending = [];
        foreach ($currentUser->getPendingFollowRequests() as $pendingUser) {
            $pending[] = [
                'username' => $pendingUser->getUsername(),
                'profilePicture' => $pendingUser->getProfilePicture(),
            ];
        }
        return $this->json(['pendingFollowRequests' => $pending]);
    }

    #[Route('/api/profile/pending/{followerUsername}/accept', name: 'api_profile_pending_accept', methods: ['POST'])]
    public function acceptFollowRequest(string $followerUsername, UserRepository $userRepository, EntityManagerInterface $em): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        $follower = $userRepository->findOneBy(['username' => $followerUsername]);
        if (!$follower) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], JsonResponse::HTTP_NOT_FOUND);
        }
        if (!$currentUser->getPendingFollowRequests()->contains($follower)) {
            return $this->json(['error' => 'Aucune demande de suivi de cet utilisateur.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        // Supprimer la demande pending et établir la relation de suivi
        $currentUser->removePendingFollowRequest($follower);
        $follower->follow($currentUser);

        // Créer une notification pour informer le demandeur
        $notification = new Notification();
        $notification->setContent("Votre demande de suivi a été ACCEPTÉE par " . $currentUser->getUsername() . ".");
        $notification->setRecipient($follower);
        $em->persist($notification);
        $em->flush();

        return $this->json(['message' => 'Demande de suivi acceptée.']);
    }

    #[Route('/api/profile/pending/{followerUsername}/decline', name: 'api_profile_pending_decline', methods: ['POST'])]
    public function declineFollowRequest(string $followerUsername, UserRepository $userRepository, EntityManagerInterface $em): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        $follower = $userRepository->findOneBy(['username' => $followerUsername]);
        if (!$follower) {
            return $this->json(['error' => 'Utilisateur non trouvé.'], JsonResponse::HTTP_NOT_FOUND);
        }
        if (!$currentUser->getPendingFollowRequests()->contains($follower)) {
            return $this->json(['error' => 'Aucune demande de suivi de cet utilisateur.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        $currentUser->removePendingFollowRequest($follower);

        // Créer une notification pour informer le demandeur
        $notification = new Notification();
        $notification->setContent("Votre demande de suivi a été REFUSÉE par " . $currentUser->getUsername() . ".");
        $notification->setRecipient($follower);
        $em->persist($notification);
        $em->flush();

        return $this->json(['message' => 'Demande de suivi refusée.']);
    }

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
        if ($currentUser->getUsername() !== $username) {
            return $this->json(['error' => 'Accès non autorisé.'], JsonResponse::HTTP_FORBIDDEN);
        }
        $post = $postRepository->find($tweetId);
        if (!$post) {
            return $this->json(['error' => 'Tweet non trouvé.'], JsonResponse::HTTP_NOT_FOUND);
        }
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

    #[Route('/api/notifications', name: 'api_notifications', methods: ['GET'])]
    public function index(NotificationRepository $notificationRepository): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        
        // Récupérer les notifications du destinataire, triées par date décroissante
        $notifications = $notificationRepository->findBy(['recipient' => $user], ['createdAt' => 'DESC']);
        
        $data = [];
        foreach ($notifications as $notification) {
            $data[] = [
                'id' => $notification->getId(),
                'content' => $notification->getContent(),
                'createdAt' => $notification->getCreatedAt()->format('c'),
                'isRead' => $notification->isRead(),
            ];
        }
        
        return $this->json(['notifications' => $data]);
    }

    #[Route('/api/notifications/read', name: 'api_notifications_mark_read', methods: ['PUT'])]
    public function markAllAsRead(NotificationRepository $notificationRepository, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }
        
        // Marquer comme lues toutes les notifications non lues pour l'utilisateur connecté
        $notifications = $notificationRepository->findBy(['recipient' => $user, 'isRead' => false]);
        foreach ($notifications as $notification) {
            $notification->setIsRead(true);
        }
        $em->flush();
        
        return $this->json(['message' => 'Notifications marquées comme lues.']);
    }

    #[Route('/api/profile/toggle-comments-limit', name: 'api_profile_limits', methods: ['POST'])]
public function toggleLimit(EntityManagerInterface $em): JsonResponse
{
    /** @var User|null $currentUser */
    $currentUser = $this->getUser();
    if (!$currentUser) {
        return $this->json(['error' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
    }
    // Inverser l'état actuel
    $currentUser->setLimited(!$currentUser->getLimited());
    // Persister la modification en base de données
    $em->flush();
    return $this->json([
        'message' => $currentUser->getLimited()
            ? 'Les commentaires ont été limités aux abonnés'
            : 'Les commentaires ne sont plus limités aux abonnés'
    ]);
}


    #[Route('/api/profile/limit', name: 'api_profile_limit', methods: ['GET'])]
    public function isLimited(): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();
        $data[] = [
            'limited' => $currentUser->getLimited(),
        ];
    
    return $this->json(['limit' => $data]);
    }
}
