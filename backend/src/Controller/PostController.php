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
        if (!$post->getUser()) {
            continue;
        }
        if ($post->getCensored()) {
            // Post censuré: contenu de remplacement en italique et aucun média/réponses
            $tweetData = [
                'id'             => $post->getId(),
                'username'       => $post->getUser()->getUsername() ?? "Unnamed",
                'content'        => "Ce message enfreint les conditions d’utilisation de la plateforme",
                'createdAt'      => $post->getCreatedAt()->format('Y-m-d H:i:s'),
                'likeCount'      => 0,
                'liked'          => false,
                'profilePicture' => $post->getUser()->getProfilePicture() ?? 'default-profile.png',
                'media'          => [],
                'replies'        => [],
                'censored'       => true,
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
                'username'       => $post->getUser()->getUsername() ?? "Unnamed",
                'content'        => $post->getUser()->getBlocked()
                    ? "Ce compte a été bloqué pour non respect des conditions d’utilisation"
                    : $post->getContent(),
                'createdAt'      => $post->getCreatedAt()->format('Y-m-d H:i:s'),
                'likeCount'      => $post->getUser()->getBlocked() ? 0 : $post->getLikesCount(),
                'liked'          => $post->getUser()->getBlocked() ? false : $liked,
                'profilePicture' => $post->getUser()->getProfilePicture() ?? 'default-profile.png',
                'media'          => $post->getMedia() ?: [],
                'censored'       => false,
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
                ];
            }
            $tweetData['replies'] = $repliesArray;
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
    
    // Récupérer le propriétaire du post
    $postOwner = $post->getUser();
    // Vérifier si le propriétaire du post a bloqué l'utilisateur qui interagit
    if ($postOwner && $postOwner->getBlockedUsers()->contains($user)) {
        return $this->json(
            ['error' => 'Vous ne pouvez pas interagir avec ce post car cet utilisateur vous a bloqué.'],
            Response::HTTP_FORBIDDEN
        );
    }
    if ($user->getBlocked()) {
        return $this->json(
            ['error' => 'Votre compte est actuellement bloqué, vous ne pouvez pas interragir avec d\'autres utilisateurs'],
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

    return $this->json([
        'liked'     => $liked,
        'likeCount' => $post->getLikesCount(),
    ]);
}

    #[Route('/api/posts', name: 'api_post_create', methods: ['POST'])]
    public function create(
        Request $request,
        ValidatorInterface $validator,
        PostService $postService
    ): JsonResponse {
        
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        // Si l'utilisateur est bloqué, il ne peut pas créer de post
        if ($user->getBlocked()) {
            return $this->json(['error' => 'Votre compte est bloqué et vous ne pouvez pas interagir avec les messages.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $content = $data['content'] ?? null;
        $media = $data['media'] ?? [];

        if (!$content || trim($content) === '') {
            return $this->json(['error' => 'Le contenu du post ne peut pas être vide.'], Response::HTTP_BAD_REQUEST);
        }

        $payload = new CreatePostPayload();
        $payload->setContent($content);
        $payload->setMedia($media);

        $errors = $validator->validate($payload);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $postService->create($payload, $user);

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

        $em->remove($post);
        $em->flush();

        return $this->json(['message' => 'Post supprimé avec succès.'], Response::HTTP_OK);
    }

    #[Route('/api/posts/{id}/reply', name: 'api_post_reply', methods: ['POST'])]
public function reply(Post $post, Request $request, ValidatorInterface $validator, EntityManagerInterface $em): JsonResponse
{
    /** @var \App\Entity\User $user */
    $user = $this->getUser();
    if (!$user) {
        return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
    }
    $postOwner = $post->getUser();
    // Si le propriétaire du post a bloqué l'utilisateur qui interagit, refuser
    if ($postOwner && $postOwner->getBlockedUsers()->contains($user)) {
        return $this->json(
            ['error' => 'Vous ne pouvez pas interagir avec ce post car cet utilisateur vous a bloqué.'],
            Response::HTTP_FORBIDDEN
        );
    }
    // Vérifier si le propriétaire du post est en mode lecture seule
    if ($postOwner && method_exists($postOwner, 'getReadOnly') && $postOwner->getReadOnly()) {
        return $this->json(
            ['error' => 'Ce compte est en mode lecture seule, vous ne pouvez pas commenter ou répondre.'],
            Response::HTTP_FORBIDDEN
        );
    }
    // Vérifier si l'utilisateur lui-même est bloqué
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
    // Seul le propriétaire peut modifier le post
    if ($post->getUser()->getId() !== $user->getId()) {
        return $this->json(['error' => 'Vous n\'êtes pas autorisé à modifier ce post.'], Response::HTTP_FORBIDDEN);
    }

    $data = json_decode($request->getContent(), true);
    $content = $data['content'] ?? null;
    // On attend que le client envoie explicitement la nouvelle liste de médias
    // (qui peut être un tableau vide pour supprimer les médias existants)
    $media = $data['media'] ?? null;

    if (!$content || trim($content) === '') {
        return $this->json(['error' => 'Le contenu du post ne peut pas être vide.'], Response::HTTP_BAD_REQUEST);
    }

    // Ici, vous pouvez éventuellement utiliser un DTO ou le validateur pour valider le nouveau contenu.
    // Pour simplifier, nous mettons à jour directement le post.
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
#[Route('/api/hashtag/{tag}', name: 'api_hashtag_posts', methods: ['GET'], format: 'json')]
public function getHashtagPosts(string $tag, PostRepository $postRepository): Response
{
    // Récupérer les posts contenant le hashtag dans le contenu
    $posts = $postRepository->findByHashtag($tag);

    $postsArray = [];
    foreach ($posts as $post) {
        if (!$post->getUser()) {
            continue;
        }
        if ($post->getCensored()) {
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
            $data = [
                'id' => $post->getId(),
                'username' => $post->getUser()->getUsername() ?? "Unnamed",
                'content' => $post->getContent(),
                'createdAt' => $post->getCreatedAt()->format('Y-m-d H:i:s'),
                'likeCount' => $post->getLikesCount(),
                'liked' => false, // À adapter si besoin de vérifier pour l'utilisateur courant
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
        'posts' => array_values($postsArray)
    ]);
}
#[Route('/api/posts/{id}/retweet', name: 'api_post_retweet', methods: ['POST'])]
    public function retweet(Post $post, Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
    
        $data = json_decode($request->getContent(), true);
        $comment = $data['comment'] ?? null; // commentaire optionnel pour retweet
    
        // Création du retweet : une copie du tweet original
        $retweet = new Post();
        $retweet->setContent($post->getContent());
        $retweet->setMedia($post->getMedia());
        $retweet->setCreatedAt(new \DateTime());
        $retweet->setUser($user);
        $retweet->setIsRetweet(true);
        $retweet->setRetweetComment($comment);
        $retweet->setRetweetedFrom($post);
        $em->persist($retweet);
    
        // Incrémenter le compteur de retweets sur le tweet original
        $post->incrementRetweetCount();
    
        $em->flush();
    
        return $this->json([
            'message' => 'Tweet retweeté avec succès.',
            'retweet' => [
                'id' => $retweet->getId(),
                'content' => $retweet->getContent(),
                'retweetComment' => $retweet->getRetweetComment(),
                'createdAt' => $retweet->getCreatedAt()->format('Y-m-d H:i:s'),
                'retweetCount' => $post->getRetweetCount(),
            ]
        ], Response::HTTP_CREATED);
    }

}
