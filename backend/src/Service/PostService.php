<?php

namespace App\Service;

use App\Dto\Payload\CreatePostPayload;
use App\Entity\Post;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class PostService
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
         $this->entityManager = $entityManager;
    }

    public function create(CreatePostPayload $payload, User $user): Post
    {
         $post = new Post();
         $post->setContent($payload->getContent());
         $post->setCreatedAt(new \DateTimeImmutable());
         $post->setUser($user);
         
         $this->entityManager->persist($post);
         $this->entityManager->flush();

         return $post;
    }
}
