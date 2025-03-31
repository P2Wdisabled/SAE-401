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

        // Vérifier le paramètre de filtre pour afficher uniquement les posts des personnes suivies
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
            $liked = false;
            if ($currentUserId !== null) {
                foreach ($post->getLikes() as $like) {
                    if ($like->getUser()->getId() === $currentUserId) {
                        $liked = true;
                        break;
                    }
                }
            }
            $postsArray[] = [
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
            ];
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
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
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
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
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

    // Nouvelle route pour éditer un post via PUT
    #[Route('/api/posts/{id}', name: 'api_post_edit', methods: ['PUT'])]
    public function edit(Post $post, Request $request, ValidatorInterface $validator, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }
        $user = $this->getUser();
        /** @var \App\Entity\User $user */
        if ($post->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'Vous n\'êtes pas autorisé à modifier ce post.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $content = $data['content'] ?? null;
        $media = $data['media'] ?? [];

        if (!$content || trim($content) === '') {
            return $this->json(['error' => 'Le contenu du post ne peut pas être vide.'], Response::HTTP_BAD_REQUEST);
        }

        $post->setContent($content);
        $post->setMedia($media);

        $em->flush();

        return $this->json([
            'id'         => $post->getId(),
            'content'    => $post->getContent(),
            'media'      => $post->getMedia(),
            'likeCount'  => $post->getLikesCount(),
            'createdAt'  => $post->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }
}
