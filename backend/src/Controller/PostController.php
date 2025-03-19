<?php

namespace App\Controller;

use App\Dto\Payload\CreatePostPayload;
use App\Repository\PostRepository;
use App\Service\PostService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class PostController extends AbstractController
{
    // GET existant (n’oubliez pas d’ajouter format: 'json' si ce n'est pas déjà fait)
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

    // Nouvelle route pour créer un post
    #[Route('/posts', name: 'posts.create', methods: ['POST'], format: 'json')]
    public function create(Request $request, ValidatorInterface $validator, PostService $postService): Response
    {
        // Récupération des données JSON envoyées
        $data = json_decode($request->getContent(), true);

        // Mapping dans le DTO
        $payload = new CreatePostPayload();
        $payload->setContent($data['content'] ?? null);

        // Déclenche la validation
        $errors = $validator->validate($payload);
        if (count($errors) > 0) {
            // Construction d'un tableau d'erreurs
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json($errorMessages, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Débogage : décommentez la ligne ci-dessous pour vérifier le mapping
        // dd($payload);

        // Création du post via le service
        $postService->create($payload);

        // Retour d'une réponse vide avec le code HTTP 201
        return new Response('', Response::HTTP_CREATED);
    }
}
