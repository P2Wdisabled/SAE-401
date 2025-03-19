<?php

namespace App\Service;

use App\Dto\Payload\CreatePostPayload;
use App\Entity\Post;
use Doctrine\ORM\EntityManagerInterface;

class PostService
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
         $this->entityManager = $entityManager;
    }

    public function create(CreatePostPayload $payload): Post
    {
         $post = new Post();
         $post->setContent($payload->getContent());
         $post->setCreatedAt(new \DateTimeImmutable());
         
         $this->entityManager->persist($post);
         $this->entityManager->flush();

         return $post;
    }
}
