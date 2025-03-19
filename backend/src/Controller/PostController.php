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

class PostController extends AbstractController
{
    #[Route('/posts', name: 'posts.index', methods: ['GET'], format: 'json')]
    public function index(Request $request, PostRepository $postRepository): Response
    {
        $page = $request->query->getInt('page', 1);
        $count = 50;
        $offset = ($page - 1) * $count;

        $paginator = $postRepository->paginateAllOrderedByLatest($offset, $count);

        $previousPage = $page > 1 ? $page - 1 : null;
        $totalPostsCount = $paginator->count();
        $nextPage = (($page * $count) < $totalPostsCount) ? $page + 1 : null;

        return $this->json([
            'posts'         => $paginator,
            'previous_page' => $previousPage,
            'next_page'     => $nextPage,
        ]);
    }

    #[Route('/posts', name: 'posts.create', methods: ['POST'], format: 'json')]
    public function create(
        Request $request, 
        ValidatorInterface $validator, 
        PostService $postService,
        UserRepository $userRepository // Injection du UserRepository pour chercher l'utilisateur par token
    ): Response {
        // Récupération de l'en-tête Authorization et extraction du token
        $authHeader = $request->headers->get('Authorization');
        if (!$authHeader || 0 !== strpos($authHeader, 'Bearer ')) {
            return $this->json(['error' => 'Token manquant ou invalide'], Response::HTTP_UNAUTHORIZED);
        }
        $token = substr($authHeader, 7);
    
        // Recherche de l'utilisateur dont la colonne "api_token" correspond au token fourni
        $user = $userRepository->findOneBy(['apiToken' => $token]);
        if (!$user) {
            return $this->json(['error' => 'Token invalide'], Response::HTTP_UNAUTHORIZED);
        }
    
        // Traitement du contenu du post
        $data = json_decode($request->getContent(), true);
        $payload = new CreatePostPayload();
        $payload->setContent($data['content'] ?? null);
    
        $errors = $validator->validate($payload);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json($errorMessages, Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    
        // Création du post en liant l'utilisateur trouvé
        $postService->create($payload, $user);
    
        return new Response('', Response::HTTP_CREATED);
    }

}
