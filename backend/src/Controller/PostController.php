<?php
// src/Controller/PostController.php

namespace App\Controller;

use App\Dto\Payload\CreatePostPayload;
use App\Repository\PostRepository;
use App\Repository\UserRepository;
use App\Service\PostService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use App\Entity\Notification;
use Symfony\Component\HttpFoundation\JsonResponse;
use App\Entity\PostLike;
use App\Entity\Post;
use Doctrine\ORM\EntityManagerInterface;

class PostController extends AbstractController
{
    #[Route('/api/posts', name: 'posts.index', methods: ['GET'], format: 'json')]
    public function index(Request $request, PostRepository $postRepository): Response
    {
        $currentUser = $this->getUser();
        $currentUserId = ($currentUser instanceof \App\Entity\User) ? $currentUser->getId() : null;

        $page = $request->query->getInt('page', 1);
        $count = 50;
        $offset = max(0, ($page - 1) * $count);

        $filter = $request->query->get('filter');
        if ($filter === 'following' && $currentUser instanceof \App\Entity\User) {
            /** @var \App\Entity\User $currentUser */
            $followedUsers = $currentUser->getFollowing()->toArray();
            $followedUserIds = array_map(fn($user) => $user->getId(), $followedUsers);
            $paginator = $postRepository->paginatePostsByUsers($followedUserIds, $offset, $count);
        } else {
            $paginator = $postRepository->paginateAllOrderedByLatest($offset, $count);
        }

        $totalPostsCount = $paginator->count();
        $previousPage = $page > 1 ? $page - 1 : null;
        $nextPage = (($page * $count) < $totalPostsCount) ? $page + 1 : null;

        $postsArray = [];
        foreach ($paginator as $post) {
            $author = $post->getUser();
            if (!$author) {
                continue;
            }
            // Vérification du compte privé
            if ($author->getPrivate()) {
                if (
                    !$currentUser instanceof \App\Entity\User ||
                    ($currentUser->getId() !== $author->getId() && !$currentUser->getFollowing()->contains($author))
                ) {
                    continue;
                }
            }
            
            if ($post->getCensored()) {
                $tweetData = [
                    'id'             => $post->getId(),
                    'username'       => $author->getUsername() ?? "Unnamed",
                    'content'        => "Ce message enfreint les conditions d’utilisation de la plateforme",
                    'createdAt'      => $post->getCreatedAt()->format('Y-m-d H:i:s'),
                    'likeCount'      => 0,
                    'liked'          => false,
                    'profilePicture' => $author->getProfilePicture() ?? 'default-profile.png',
                    'media'          => [],
                    'replies'        => [],
                    'censored'       => true,
                    'locked'         => $post->isLocked(),
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
                $tweetData = [
                    'id'             => $post->getId(),
                    'username'       => $author->getUsername() ?? "Unnamed",
                    'content'        => $author->getBlocked()
                                        ? "Ce compte a été bloqué pour non respect des conditions d’utilisation"
                                        : $post->getContent(),
                    'createdAt'      => $post->getCreatedAt()->format('Y-m-d H:i:s'),
                    'likeCount'      => $author->getBlocked() ? 0 : $post->getLikesCount(),
                    'retweetCount'   => $post->getRetweetCount(),
                    'liked'          => $author->getBlocked() ? false : $liked,
                    'profilePicture' => $author->getProfilePicture() ?? 'default-profile.png',
                    'media'          => $post->getMedia() ?: [],
                    'censored'       => false,
                    'locked'         => $post->isLocked(),
                ];
                if ($post->isLocked()) {
                    // Si le tweet est verrouillé, ne pas renvoyer les réponses
                    $tweetData['replies'] = [];
                } else {
                    $repliesArray = [];
                    foreach ($post->getReplies() as $reply) {
                        $repliesArray[] = [
                            'id'             => $reply->getId(),
                            'username'       => $reply->getUser()->getUsername() ?? "Unnamed",
                            'content'        => $reply->getContent(),
                            'createdAt'      => $reply->getCreatedAt()->format('Y-m-d H:i:s'),
                            'profilePicture' => $reply->getUser()->getProfilePicture() ?? 'default-profile.png',
                            'media'          => $reply->getMedia() ?: [],
                        ];
                    }
                    $tweetData['replies'] = $repliesArray;
                }
            }
            $postsArray[] = $tweetData;
        }

        return $this->json([
            'posts'         => $postsArray,
            'previous_page' => $previousPage,
            'next_page'     => $nextPage,
        ]);
    }

    #[Route('/api/posts/{id}/like', name: 'api_post_toggle_like', methods: ['POST'])]
    public function toggleLike(Post $post, EntityManagerInterface $em): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        
        $postOwner = $post->getUser();
        if ($postOwner && $postOwner->getBlockedUsers()->contains($user)) {
            return $this->json(
                ['error' => 'Vous ne pouvez pas interagir avec ce post car cet utilisateur vous a bloqué.'],
                Response::HTTP_FORBIDDEN
            );
        }
        if ($user->getBlocked()) {
            return $this->json(
                ['error' => 'Votre compte est actuellement bloqué, vous ne pouvez pas interagir avec d\'autres utilisateurs'],
                Response::HTTP_FORBIDDEN
            );
        }

        $existingLike = $em->getRepository(PostLike::class)
                           ->findOneBy(['post' => $post, 'user' => $user]);

        if ($existingLike) {
            $em->remove($existingLike);
            $em->flush();
            $liked = false;
        } else {
            $like = new PostLike();
            $like->setPost($post);
            $like->setUser($user);
            $em->persist($like);
            $em->flush();
            $liked = true;
        }
        
        if ($postOwner !== $user && $liked) {
            $notification = new Notification();
            $notification->setContent($user->getUsername() . " a aimé votre tweet.");
            $notification->setRecipient($postOwner);
            $em->persist($notification);
            $em->flush();
        }

        return $this->json([
            'liked'     => $liked,
            'likeCount' => $post->getLikesCount(),
        ]);
    }

    #[Route('/api/posts', name: 'api_post_create', methods: ['POST'])]
    public function create(
        Request $request,
        ValidatorInterface $validator,
        PostService $postService,
        UserRepository $userRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        if ($user->getBlocked()) {
            return $this->json(['error' => 'Votre compte est bloqué et vous ne pouvez pas interagir avec les messages.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $content = $data['content'] ?? null;
        $media = $data['media'] ?? [];
        // Récupération de l'option de verrouillage
        $locked = $data['locked'] ?? false;

        if (!$content || trim($content) === '') {
            return $this->json(['error' => 'Le contenu du post ne peut pas être vide.'], Response::HTTP_BAD_REQUEST);
        }

        $payload = new CreatePostPayload();
        $payload->setContent($content);
        $payload->setMedia($media);
        $payload->setLocked($locked); // Nouveau champ dans le payload

        $errors = $validator->validate($payload);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $postService->create($payload, $user);

        if (preg_match_all('/@([a-zA-Z0-9_]+)/', $content, $matches)) {
            foreach ($matches[1] as $mentionedUsername) {
                $mentionedUser = $userRepository->findOneBy(['username' => $mentionedUsername]);
                if ($mentionedUser && $mentionedUser !== $user) {
                    $notification = new Notification();
                    $notification->setContent($user->getUsername() . " vous a mentionné dans un tweet.");
                    $notification->setRecipient($mentionedUser);
                    $em->persist($notification);
                }
            }
            $em->flush();
        }

        return $this->json(['message' => 'Post créé avec succès.'], Response::HTTP_CREATED);
    }
    
    #[Route('/api/posts/{id}', name: 'api_post_delete', methods: ['DELETE'])]
    public function delete(Post $post, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        if (!$user instanceof \App\Entity\User) {
            throw new \LogicException('L\'utilisateur doit être une instance de App\Entity\User.');
        }
        if ($post->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Vous n\'êtes pas autorisé à supprimer ce post.'], Response::HTTP_FORBIDDEN);
        }

        foreach ($post->getLikes() as $like) {
            $em->remove($like);
        }
        $this->removeRepliesRecursively($post, $em);
        $em->remove($post);
        $em->flush();

        return $this->json(['message' => 'Post supprimé avec succès.'], Response::HTTP_OK);
    }

    private function removeRepliesRecursively(Post $post, EntityManagerInterface $em): void
    {
        foreach ($post->getReplies() as $reply) {
            foreach ($reply->getLikes() as $like) {
                $em->remove($like);
            }
            $this->removeRepliesRecursively($reply, $em);
            $em->remove($reply);
        }
    }

    #[Route('/api/posts/{id}/reply', name: 'api_post_reply', methods: ['POST'])]
    public function reply(Post $post, Request $request, ValidatorInterface $validator, EntityManagerInterface $em): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        // Vérifier si le post est verrouillé et empêcher l'ajout d'une réponse
        if ($post->isLocked()) {
            return $this->json(['error' => 'Les réponses sont verrouillées pour ce post.'], Response::HTTP_FORBIDDEN);
        }
        $postOwner = $post->getUser();
        if ($postOwner && $postOwner->getBlockedUsers()->contains($user)) {
            return $this->json(
                ['error' => 'Vous ne pouvez pas interagir avec ce post car cet utilisateur vous a bloqué.'],
                Response::HTTP_FORBIDDEN
            );
        }
        if ($postOwner && method_exists($postOwner, 'getReadOnly') && $postOwner->getReadOnly()) {
            return $this->json(
                ['error' => 'Ce compte est en mode lecture seule, vous ne pouvez pas commenter ou répondre.'],
                Response::HTTP_FORBIDDEN
            );
        }
        if ($user->getBlocked()) {
            return $this->json(['error' => 'Votre compte est bloqué et vous ne pouvez pas interagir avec les messages.'], Response::HTTP_FORBIDDEN);
        }
        
        $data = json_decode($request->getContent(), true);
        $content = $data['content'] ?? null;
        $media = $data['media'] ?? [];

        if (!$content || trim($content) === '') {
            return $this->json(['error' => 'Le contenu de la réponse ne peut pas être vide.'], Response::HTTP_BAD_REQUEST);
        }

        $reply = new Post();
        $reply->setContent($content);
        $reply->setMedia($media);
        $reply->setCreatedAt(new \DateTime());
        $reply->setUser($user);
        $reply->setParent($post);

        $em->persist($reply);
        $em->flush();

        if ($postOwner !== $user) {
            $notification = new Notification();
            $notification->setContent($user->getUsername() . " a répondu à votre tweet.");
            $notification->setRecipient($postOwner);
            $em->persist($notification);
            $em->flush();
        }

        return $this->json([
            'id'             => $reply->getId(),
            'content'        => $reply->getContent(),
            'media'          => $reply->getMedia() ?: [],
            'createdAt'      => $reply->getCreatedAt()->format('Y-m-d H:i:s'),
            'author'         => $user->getUsername(),
            'profilePicture' => $user->getProfilePicture(),
        ], Response::HTTP_CREATED);
    }

    #[Route('/api/posts/{id}', name: 'api_post_update', methods: ['PUT'])]
    public function update(
        Post $post,
        Request $request,
        ValidatorInterface $validator,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        if ($post->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Vous n\'êtes pas autorisé à modifier ce post.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $content = $data['content'] ?? null;
        $media = $data['media'] ?? null;

        if (!$content || trim($content) === '') {
            return $this->json(['error' => 'Le contenu du post ne peut pas être vide.'], Response::HTTP_BAD_REQUEST);
        }

        $post->setContent($content);
        if ($media !== null) {
            $post->setMedia($media);
        }

        $em->flush();

        return $this->json([
            'message' => 'Post modifié avec succès.',
            'post' => [
                'id' => $post->getId(),
                'content' => $post->getContent(),
                'media' => $post->getMedia(),
                'createdAt' => $post->getCreatedAt()->format('Y-m-d H:i:s'),
            ]
        ], Response::HTTP_OK);
    }

    #[Route('/api/posts/{id}/retweet', name: 'api_post_retweet', methods: ['POST'])]
    public function retweet(Post $post, Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        if ($post->getUser()->getPrivate()) {
            return $this->json(['error' => "Les contenus d'un compte privé ne peuvent pas être retweetés."], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $comment = $data['comment'] ?? null;

        $retweet = new Post();
        $retweet->setContent($post->getContent());
        $retweet->setMedia($post->getMedia());
        $retweet->setCreatedAt(new \DateTime());
        $retweet->setUser($user);
        $retweet->setIsRetweet(true);

        $em->persist($retweet);

        $post->incrementRetweetCount();

        $retweetReply = null;
        if (!empty($comment)) {
            $reply = new Post();
            $reply->setContent($comment);
            $reply->setCreatedAt(new \DateTime());
            $reply->setUser($user);
            $reply->setParent($retweet);
            $em->persist($reply);
            $retweetReply = [
                'id' => $reply->getId(),
                'content' => $reply->getContent(),
                'createdAt' => $reply->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }
        $originalOwner = $post->getUser();
        if ($originalOwner !== $user) {
            $notification = new Notification();
            $notification->setContent($user->getUsername() . " a retweeté votre tweet.");
            $notification->setRecipient($originalOwner);
            $em->persist($notification);
        }
        $em->flush();
        
        return $this->json([
            'message' => 'Tweet retweeté avec succès.',
            'retweet' => [
                'id' => $retweet->getId(),
                'content' => $retweet->getContent(),
                'createdAt' => $retweet->getCreatedAt()->format('Y-m-d H:i:s'),
                'retweetCount' => $post->getRetweetCount(),
                'isRetweet' => $retweet->getIsRetweet(),
                'retweetedFrom' => $post->getId(),
                'reply' => $retweetReply,
            ]
        ], Response::HTTP_CREATED);
    }
    
    // *************** Routes de verrouillage ****************
    #[Route('/api/posts/{id}/lock', name: 'api_post_lock', methods: ['POST'])]
    public function lock(Post $post, EntityManagerInterface $em): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        if ($post->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Vous n\'êtes pas autorisé à verrouiller ce post.'], Response::HTTP_FORBIDDEN);
        }
        if ($post->isLocked()) {
            return $this->json(['message' => 'Le post est déjà verrouillé.'], Response::HTTP_BAD_REQUEST);
        }
        $post->setLocked(true);
        $em->flush();
        return $this->json(['message' => 'Post verrouillé avec succès.', 'locked' => true], Response::HTTP_OK);
    }

    #[Route('/api/posts/{id}/unlock', name: 'api_post_unlock', methods: ['POST'])]
    public function unlock(Post $post, EntityManagerInterface $em): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        if ($post->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Vous n\'êtes pas autorisé à déverrouiller ce post.'], Response::HTTP_FORBIDDEN);
        }
        if (!$post->isLocked()) {
            return $this->json(['message' => 'Le post est déjà déverrouillé.'], Response::HTTP_BAD_REQUEST);
        }
        $post->setLocked(false);
        $em->flush();
        return $this->json(['message' => 'Post déverrouillé avec succès.', 'locked' => false], Response::HTTP_OK);
    }
    // **********************************************************
}
