<?php
// src/Controller/AdminController.php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Post;
use App\Repository\UserRepository;
use App\Repository\PostRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

class AdminController extends AbstractController
{
    /**
     * Vérifie que l'utilisateur est connecté et est admin.
     */
    private function ensureAdmin(): ?Response
    {
        $currentUser = $this->getUser();
        if (!$currentUser) {
            return $this->json(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }
        if (!in_array('ROLE_ADMIN', $currentUser->getRoles())) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }
        return null;
    }

    #[Route('/users/Accounts', name: 'users.AccountList', methods: ['GET'], format: 'json')]
    public function index(Request $request, UserRepository $userRepository): Response
    {
        if ($response = $this->ensureAdmin()) {
            return $response;
        }
        
        $page = $request->query->getInt('page', 1);
        $count = 50;
        $offset = max(0, ($page - 1) * $count);

        $paginator = $userRepository->paginateUsers($offset, $count);
        $totalUsersCount = $paginator->count();
        $previousPage = $page > 1 ? $page - 1 : null;
        $nextPage = (($page * $count) < $totalUsersCount) ? $page + 1 : null;

        $usersArray = [];
        foreach ($paginator as $user) {
            $usersArray[] = [
                'id'       => $user->getId(),
                'username' => $user->getUsername() ?? "Unnamed",
                'email'    => $user->getEmail(),
                'blocked'  => $user->getBlocked(), // Statut de blocage
            ];
        }

        return $this->json([
            'users'         => $usersArray,
            'previous_page' => $previousPage,
            'next_page'     => $nextPage,
        ]);
    }

    #[Route('/users/{id}', name: 'users.show', methods: ['GET'], format: 'json')]
    public function show(int $id, UserRepository $userRepository): Response
    {
        if ($response = $this->ensureAdmin()) {
            return $response;
        }
        
        $user = $userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id'       => $user->getId(),
            'username' => $user->getUsername(),
            'email'    => $user->getEmail(),
        ]);
    }

    #[Route('/users/{id}', name: 'users.update', methods: ['PUT'], format: 'json')]
    public function update(
        int $id,
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher
    ): Response {
        if ($response = $this->ensureAdmin()) {
            return $response;
        }
        
        $user = $userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (!isset($data['username']) || !isset($data['email'])) {
            return $this->json(['error' => 'Missing parameters'], Response::HTTP_BAD_REQUEST);
        }

        $user->setUsername($data['username']);
        $user->setEmail($data['email']);

        if (isset($data['password']) && !empty($data['password'])) {
            $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
            $user->setPassword($hashedPassword);
        }

        $em->persist($user);
        $em->flush();

        return $this->json([
            'id'       => $user->getId(),
            'username' => $user->getUsername(),
            'email'    => $user->getEmail(),
        ]);
    }

    #[Route('/admin/verify', name: 'admin.verify', methods: ['GET'], format: 'json')]
    public function verify(): Response
    {
        if ($response = $this->ensureAdmin()) {
            return $response;
        }
        
        return $this->json(['admin' => true]);
    }
    
    #[Route('/infos', name: 'admin.infos', methods: ['GET'])]
    public function infos(): Response
    {
        ob_start();
        phpinfo();
        $content = ob_get_clean();

        return new Response($content, 200, ['Content-Type' => 'text/html']);
    }

    #[Route('/admin/users/{id}/toggle-block', name: 'admin_toggle_block', methods: ['POST'], format: 'json')]
    public function toggleBlock(int $id, UserRepository $userRepository, EntityManagerInterface $em): Response
    {
        if ($response = $this->ensureAdmin()) {
            return $response;
        }
        
        $user = $userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found'], Response::HTTP_NOT_FOUND);
        }
        
        // Inverse l'état de blocage
        $user->setBlocked(!$user->getBlocked());
        $em->flush();
        
        return $this->json([
            'id'      => $user->getId(),
            'blocked' => $user->getBlocked(),
            'message' => $user->getBlocked() ? "Compte bloqué pour non respect des conditions d'utilisation." : "Compte débloqué."
        ]);
    }

    #[Route('/admin/posts/{id}/toggle-censor', name: 'admin_toggle_censor', methods: ['POST'], format: 'json')]
    public function toggleCensor(
        int $id,
        PostRepository $postRepository,
        EntityManagerInterface $em
    ): Response {
        // Vérification des droits admin
        $currentUser = $this->getUser();
        if (!$currentUser || !in_array('ROLE_ADMIN', $currentUser->getRoles())) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }
        
        $post = $postRepository->find($id);
        if (!$post) {
            return $this->json(['error' => 'Post not found'], Response::HTTP_NOT_FOUND);
        }
        
        // Basculer l'état censuré
        $post->setCensored(!$post->getCensored());
        $em->flush();
        
        return $this->json([
            'id' => $post->getId(),
            'censored' => $post->getCensored(),
            'message' => $post->getCensored() ? "Contenu censuré." : "Contenu débloqué."
        ]);
    }

    // Nouvelle route pour récupérer les posts à modérer par l'admin (pour le dashboard de censure)
    #[Route('/admin/posts', name: 'admin_posts', methods: ['GET'], format: 'json')]
public function getPosts(Request $request, PostRepository $postRepository): Response
{
    if ($response = $this->ensureAdmin()) {
        return $response;
    }
    
    $search = $request->query->get('search', '');
    
    // Récupérer tous les posts. Pour une version de production, pensez à paginer et optimiser la requête.
    $posts = $postRepository->findAll();

    // Filtrer par recherche si besoin
    if ($search) {
        $posts = array_filter($posts, function($post) use ($search) {
            return stripos($post->getContent(), $search) !== false;
        });
    }

    $postsArray = array_map(function($post) {
        return [
            'id'        => $post->getId(),
            'username'  => $post->getUser() ? $post->getUser()->getUsername() : 'Unknown',
            'content'   => $post->getContent(),
            'censored'  => $post->getCensored(),
            'likeCount' => $post->getLikesCount(), // Assurez-vous que cette méthode est définie
            'media'     => $post->getMedia(),       // Cette méthode doit retourner un tableau (par exemple d'URLs)
            // Pour éviter la référence circulaire, on mappe manuellement les réponses
            'replies'   => array_map(function($reply) {
                return [
                    'id'        => $reply->getId(),
                    'content'   => $reply->getContent(),
                    'createdAt' => $reply->getCreatedAt()->format('Y-m-d H:i:s'),
                    'username'  => $reply->getUser() ? $reply->getUser()->getUsername() : 'Unknown',
                ];
            }, $post->getReplies()->toArray()),
            'retweets'  => method_exists($post, 'getRetweetsCount') ? $post->getRetweetsCount() : 0,
        ];
    }, $posts);

    return $this->json([
        'posts' => array_values($postsArray)
    ]);
}

#[Route('/admin/posts/{id}', name: 'admin_delete_post', methods: ['DELETE'], format: 'json')]
public function deletePost(
    int $id,
    PostRepository $postRepository,
    EntityManagerInterface $em
): Response {
    // Vérifier que l'utilisateur est admin
    $currentUser = $this->getUser();
    if (!$currentUser || !in_array('ROLE_ADMIN', $currentUser->getRoles())) {
        return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
    }
    
    $post = $postRepository->find($id);
    if (!$post) {
        return $this->json(['error' => 'Post not found'], Response::HTTP_NOT_FOUND);
    }
    
    // Supprimer tous les likes associés au post
    foreach ($post->getLikes() as $like) {
        $em->remove($like);
    }
    
    // Supprimer récursivement tous les commentaires (réponses) et leurs likes associés
    $this->removeRepliesRecursively($post, $em);
    
    // Supprimer le post lui-même
    $em->remove($post);
    $em->flush();
    
    return $this->json(['message' => 'Post et ses likes/réponses ont été supprimés avec succès']);
}

/**
 * Supprime récursivement tous les commentaires (réponses) d'un post,
 * ainsi que les likes associés à chacun d'eux.
 */
private function removeRepliesRecursively(Post $post, EntityManagerInterface $em): void
{
    foreach ($post->getReplies() as $reply) {
        // Supprimer les likes du commentaire
        foreach ($reply->getLikes() as $like) {
            $em->remove($like);
        }
        // Appel récursif pour supprimer les réponses imbriquées
        $this->removeRepliesRecursively($reply, $em);
        // Supprimer le commentaire lui-même
        $em->remove($reply);
    }
}

}
