// src/Controller/PostController.php
<?php
namespace App\Controller;

use App\Repository\PostRepository;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

#[Route('/posts', name: 'posts.')]
class PostController extends AbstractController
{
    #[Route('', name: 'index', methods: ['GET'], defaults: ['_format' => 'json'])]
    public function index(PostRepository $postRepository, Request $request): Response
    {
        // Récupération de la page depuis les query params (page 1 par défaut)
        $page = max(1, (int)$request->query->get('page', 1));
        $limit = 50;
        $offset = ($page - 1) * $limit;

        // Récupération des posts paginés
        $posts = $postRepository->findPostsPaginated($offset, $limit);

        // Comptage total des posts en base
        $totalPostsCount = $postRepository->count([]);

        // Calcul des pages précédente et suivante
        $previousPage = $page > 1 ? $page - 1 : null;
        $nextPage = ($offset + $limit < $totalPostsCount) ? $page + 1 : null;

        return $this->json([
            'posts' => $posts,
            'previous_page' => $previousPage,
            'next_page' => $nextPage
        ], Response::HTTP_OK, [], ['groups' => 'post']);
    }
}
