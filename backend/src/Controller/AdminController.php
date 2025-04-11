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
     * Checks that the user is logged in and is an admin.
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
                'blocked'  => $user->getBlocked(), // Blocking status
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
        
        // Toggle the block status
        $user->setBlocked(!$user->getBlocked());
        $em->flush();
        
        return $this->json([
            'id'      => $user->getId(),
            'blocked' => $user->getBlocked(),
            'message' => $user->getBlocked() ? "Account blocked for non-compliance with terms of use." : "Account unblocked."
        ]);
    }

    #[Route('/admin/posts/{id}/toggle-censor', name: 'admin_toggle_censor', methods: ['POST'], format: 'json')]
    public function toggleCensor(
        int $id,
        PostRepository $postRepository,
        EntityManagerInterface $em
    ): Response {
        // Verify admin rights
        $currentUser = $this->getUser();
        if (!$currentUser || !in_array('ROLE_ADMIN', $currentUser->getRoles())) {
            return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
        }
        
        $post = $postRepository->find($id);
        if (!$post) {
            return $this->json(['error' => 'Post not found'], Response::HTTP_NOT_FOUND);
        }
        
        // Toggle the censored state
        $post->setCensored(!$post->getCensored());
        $em->flush();
        
        return $this->json([
            'id' => $post->getId(),
            'censored' => $post->getCensored(),
            'message' => $post->getCensored() ? "Content censored." : "Content uncensored."
        ]);
    }

    // New route to retrieve posts to be moderated by the admin (for the censor dashboard)
    #[Route('/admin/posts', name: 'admin_posts', methods: ['GET'], format: 'json')]
public function getPosts(Request $request, PostRepository $postRepository): Response
{
    if ($response = $this->ensureAdmin()) {
        return $response;
    }
    
    $search = $request->query->get('search', '');
    
    // Retrieve all posts. For a production version, consider paginating and optimizing the query.
    $posts = $postRepository->findAll();

    // Filter by search if needed
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
            'likeCount' => $post->getLikesCount(), // Make sure this method is defined
            'media'     => $post->getMedia(),       // This method should return an array (e.g., of URLs)
            // To avoid circular reference, we manually map the replies
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
    // Verify that the user is an admin
    $currentUser = $this->getUser();
    if (!$currentUser || !in_array('ROLE_ADMIN', $currentUser->getRoles())) {
        return $this->json(['error' => 'Access denied'], Response::HTTP_FORBIDDEN);
    }
    
    $post = $postRepository->find($id);
    if (!$post) {
        return $this->json(['error' => 'Post not found'], Response::HTTP_NOT_FOUND);
    }
    
    // Remove all likes associated with the post
    foreach ($post->getLikes() as $like) {
        $em->remove($like);
    }
    
    // Recursively remove all comments (replies) and their associated likes
    $this->removeRepliesRecursively($post, $em);
    
    // Remove the post itself
    $em->remove($post);
    $em->flush();
    
    return $this->json(['message' => 'Post and its likes/replies have been deleted successfully']);
}

/**
 * Recursively remove all comments (replies) of a post,
 * as well as the likes associated with each.
 */
private function removeRepliesRecursively(Post $post, EntityManagerInterface $em): void
{
    foreach ($post->getReplies() as $reply) {
        // Remove the likes of the comment
        foreach ($reply->getLikes() as $like) {
            $em->remove($like);
        }
        // Recursive call to remove nested replies
        $this->removeRepliesRecursively($reply, $em);
        // Remove the comment itself
        $em->remove($reply);
    }
}

}
