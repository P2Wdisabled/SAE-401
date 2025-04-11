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

        // Retrieve parameters
        // You can set page=0 by default if you want pagination to start at 0
        $page = $request->query->getInt('page', 0);
        $count = 50;
        $offset = max(0, $page * $count);

        $filter = $request->query->get('filter');
        $search = $request->query->get('search'); // search within content
        $date = $request->query->get('date');     // filter by date (format YYYY-MM-DD)
        $type = $request->query->get('type');     // filter by type ("text" or "media")
        $userParam = $request->query->get('user');  // filter by user

        if ($filter === 'following' && $currentUser instanceof \App\Entity\User) {
            /** @var \App\Entity\User $currentUser */
            $followedUsers = $currentUser->getFollowing()->toArray();
            $followedUserIds = array_map(fn($user) => $user->getId(), $followedUsers);
            $paginator = $postRepository->paginatePostsByUsers(
                $followedUserIds,
                $offset,
                $count,
                $search,
                $date,
                $type,
                $userParam
            );
        } else {
            $paginator = $postRepository->paginateAllOrderedByLatest(
                $offset,
                $count,
                $search,
                $date,
                $type,
                $userParam
            );
        }

        $totalPostsCount = $paginator->count();
        $previousPage = $page > 0 ? $page - 1 : null;
        $nextPage = (($page + 1) * $count < $totalPostsCount) ? $page + 1 : null;

        // Retrieve and format posts for the JSON response
        $postsArray = [];
        foreach ($paginator as $post) {
            $author = $post->getUser();
            if (!$author) {
                continue;
            }
            // Handling private accounts and other restrictions...
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
                    'content'        => "This message violates the platform's terms of use",
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
                                        ? "This account has been blocked for failing to comply with the platform's terms of use"
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
            return $this->json(['error' => 'Unauthenticated user.'], Response::HTTP_UNAUTHORIZED);
        }
        
        $postOwner = $post->getUser();
        if ($postOwner && $postOwner->getBlockedUsers()->contains($user)) {
            return $this->json(
                ['error' => 'You cannot interact with this post because this user has blocked you.'],
                Response::HTTP_FORBIDDEN
            );
        }
        if ($user->getBlocked()) {
            return $this->json(
                ['error' => 'Your account is currently blocked; you cannot interact with other users.'],
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
            $notification->setContent($user->getUsername() . " liked your post.");
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
            return $this->json(['error' => 'Unauthenticated user.'], Response::HTTP_UNAUTHORIZED);
        }
        if ($user->getBlocked()) {
            return $this->json(['error' => 'Your account is blocked and you cannot interact with posts.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $content = $data['content'] ?? null;
        $media = $data['media'] ?? [];
        // Retrieve the lock option
        $locked = $data['locked'] ?? false;

        if (!$content || trim($content) === '') {
            return $this->json(['error' => 'The post content cannot be empty.'], Response::HTTP_BAD_REQUEST);
        }

        $payload = new CreatePostPayload();
        $payload->setContent($content);
        $payload->setMedia($media);
        $payload->setLocked($locked); // New field in the payload

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
                    $notification->setContent($user->getUsername() . " mentioned you in a post.");
                    $notification->setRecipient($mentionedUser);
                    $em->persist($notification);
                }
            }
            $em->flush();
        }

        return $this->json(['message' => 'Post created successfully.'], Response::HTTP_CREATED);
    }
    
    #[Route('/api/posts/{id}', name: 'api_post_delete', methods: ['DELETE'])]
    public function delete(Post $post, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthenticated user.'], Response::HTTP_UNAUTHORIZED);
        }
        if (!$user instanceof \App\Entity\User) {
            throw new \LogicException('The user must be an instance of App\Entity\User.');
        }
        if ($post->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'You are not authorized to delete this post.'], Response::HTTP_FORBIDDEN);
        }

        foreach ($post->getLikes() as $like) {
            $em->remove($like);
        }
        $this->removeRepliesRecursively($post, $em);
        $em->remove($post);
        $em->flush();

        return $this->json(['message' => 'Post deleted successfully.'], Response::HTTP_OK);
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
            return $this->json(['error' => 'Unauthenticated user.'], Response::HTTP_UNAUTHORIZED);
        }
        // Check if the post is locked and prevent adding a reply
        if ($post->isLocked()) {
            return $this->json(['error' => 'Replies are locked for this post.'], Response::HTTP_FORBIDDEN);
        }
        $postOwner = $post->getUser();
        // If the author has restricted comments to followers and the commenter is not a follower (unless it is their own)
        if ($postOwner->getLimited() && $user->getId() !== $postOwner->getId() && !$postOwner->getFollowers()->contains($user)) {
            return $this->json(['error' => 'Comments are restricted to followers of this profile.'], Response::HTTP_FORBIDDEN);
        }
        if ($postOwner && $postOwner->getBlockedUsers()->contains($user)) {
            return $this->json(
                ['error' => 'You cannot interact with this post because this user has blocked you.'],
                Response::HTTP_FORBIDDEN
            );
        }
        if ($postOwner && method_exists($postOwner, 'getReadOnly') && $postOwner->getReadOnly()) {
            return $this->json(
                ['error' => 'This account is in read-only mode; you cannot comment or reply.'],
                Response::HTTP_FORBIDDEN
            );
        }
        if ($user->getBlocked()) {
            return $this->json(['error' => 'Your account is blocked and you cannot interact with posts.'], Response::HTTP_FORBIDDEN);
        }
        
        $data = json_decode($request->getContent(), true);
        $content = $data['content'] ?? null;
        $media = $data['media'] ?? [];

        if (!$content || trim($content) === '') {
            return $this->json(['error' => 'The reply content cannot be empty.'], Response::HTTP_BAD_REQUEST);
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
            $notification->setContent($user->getUsername() . " replied to your post.");
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
            return $this->json(['error' => 'Unauthenticated user.'], Response::HTTP_UNAUTHORIZED);
        }
        if ($post->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'You are not authorized to update this post.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $content = $data['content'] ?? null;
        $media = $data['media'] ?? null;

        if (!$content || trim($content) === '') {
            return $this->json(['error' => 'The post content cannot be empty.'], Response::HTTP_BAD_REQUEST);
        }

        $post->setContent($content);
        if ($media !== null) {
            $post->setMedia($media);
        }

        $em->flush();

        return $this->json([
            'message' => 'Post updated successfully.',
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
            return $this->json(['error' => 'Unauthenticated user.'], Response::HTTP_UNAUTHORIZED);
        }

        if ($post->getUser()->getPrivate()) {
            return $this->json(['error' => "Content from a private account cannot be retweeted."], Response::HTTP_FORBIDDEN);
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
            $notification->setContent($user->getUsername() . " retweeted your post.");
            $notification->setRecipient($originalOwner);
            $em->persist($notification);
        }
        $em->flush();
        
        return $this->json([
            'message' => 'Post retweeted successfully.',
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
    
    // *************** Locking Routes ****************
    #[Route('/api/posts/{id}/lock', name: 'api_post_lock', methods: ['POST'])]
    public function lock(Post $post, EntityManagerInterface $em): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthenticated user.'], Response::HTTP_UNAUTHORIZED);
        }
        if ($post->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'You are not authorized to lock this post.'], Response::HTTP_FORBIDDEN);
        }
        if ($post->isLocked()) {
            return $this->json(['message' => 'The post is already locked.'], Response::HTTP_BAD_REQUEST);
        }
        $post->setLocked(true);
        $em->flush();
        return $this->json(['message' => 'Post locked successfully.', 'locked' => true], Response::HTTP_OK);
    }

    #[Route('/api/posts/{id}/unlock', name: 'api_post_unlock', methods: ['POST'])]
    public function unlock(Post $post, EntityManagerInterface $em): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthenticated user.'], Response::HTTP_UNAUTHORIZED);
        }
        if ($post->getUser()->getId() !== $user->getId()) {
            return $this->json(['error' => 'You are not authorized to unlock this post.'], Response::HTTP_FORBIDDEN);
        }
        if (!$post->isLocked()) {
            return $this->json(['message' => 'The post is already unlocked.'], Response::HTTP_BAD_REQUEST);
        }
        $post->setLocked(false);
        $em->flush();
        return $this->json(['message' => 'Post unlocked successfully.', 'locked' => false], Response::HTTP_OK);
    }
    // **********************************************************


    #[Route('/api/hashtag/{tag}', name: 'api_hashtag_search', methods: ['GET'])]
    public function searchByHashtag(string $tag, PostRepository $postRepository): Response
    {
        if (!$tag) {
            return $this->json(['error' => 'No hashtag provided.'], Response::HTTP_BAD_REQUEST);
        }

        
        $currentUser = $this->getUser();
        $currentUserId = ($currentUser instanceof \App\Entity\User) ? $currentUser->getId() : null;
        
        // Use the findByHashtag method from the repository
        $posts = $postRepository->findByHashtag($tag);
        
        $postsArray = [];
        foreach ($posts as $post) {
            $author = $post->getUser();
            if (!$author) {
                continue;
            }
            // Check for private account
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
                    'content'        => "This message violates the platform's terms of use",
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
                                        ? "This account has been blocked for failing to comply with the platform's terms of use"
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
                    // If the post is locked, do not return replies
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
            'posts' => $postsArray
        ]);
    }

}
