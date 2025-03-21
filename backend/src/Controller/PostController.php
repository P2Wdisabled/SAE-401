<?php

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

class PostController extends AbstractController
{
    #[Route('/api/posts', name: 'posts.index', methods: ['GET'], format: 'json')]
public function index(Request $request, PostRepository $postRepository): Response
{
    // Page par défaut à 1
    $page = $request->query->getInt('page', 1);
    $count = 50;
    // Calcul de l'offset classique : (page - 1) * count
    $offset = max(0, ($page - 1) * $count);

    $paginator = $postRepository->paginateAllOrderedByLatest($offset, $count);

    $totalPostsCount = $paginator->count();
    $previousPage = $page > 1 ? $page - 1 : null;
    $nextPage = (($page * $count) < $totalPostsCount) ? $page + 1 : null;

    $postsArray = [];
    foreach ($paginator as $post) {
        // S'assurer que le post a bien un utilisateur
        if (!$post->getUser()) {
            continue;
        }
        $postsArray[] = [
            'username'  => $post->getUser()->getUsername() ?? "Unnamed",
            'content'   => $post->getContent(),
            'createdAt' => $post->getCreatedAt()->format('Y-m-d H:i:s'),
        ];
    }

    // Toujours inclure la clé "posts" même si elle est vide
    return $this->json([
        'posts'         => $postsArray,
        'previous_page' => $previousPage,
        'next_page'     => $nextPage,
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

    if (!$content || trim($content) === '') {
        return $this->json(['error' => 'Le contenu du post ne peut pas être vide.'], Response::HTTP_BAD_REQUEST);
    }

    $payload = new CreatePostPayload();
    $payload->setContent($content);

    $errors = $validator->validate($payload);
    if (count($errors) > 0) {
        $errorMessages = [];
        foreach ($errors as $error) {
            $errorMessages[$error->getPropertyPath()] = $error->getMessage();
        }
        return $this->json(['errors' => $errorMessages], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    // Enregistrement du post
    $postService->create($payload, $user);

    return $this->json(['message' => 'Post créé avec succès.'], Response::HTTP_CREATED);
}


}
