<?php
// src/Repository/PostRepository.php

namespace App\Repository;

use App\Entity\Post;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\Tools\Pagination\Paginator;

class PostRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Post::class);
    }

    public function paginateAllOrderedByLatest(int $offset, int $count): Paginator
    {
        $query = $this->createQueryBuilder('p')
            ->select('p', 'u')
            ->innerJoin('p.user', 'u')
            ->where('p.parent IS NULL')
            ->orderBy('p.createdAt', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($count)
            ->getQuery();

        return new Paginator($query);
    }

    public function paginatePostsByUsers(array $userIds, int $offset, int $count): Paginator
    {
        $query = $this->createQueryBuilder('p')
            ->select('p', 'u')
            ->innerJoin('p.user', 'u')
            ->where('p.parent IS NULL')
            ->andWhere('p.user IN (:userIds)')
            ->setParameter('userIds', $userIds)
            ->orderBy('p.createdAt', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($count)
            ->getQuery();

        return new Paginator($query);
    }
    /**
     * Recherche les posts dont le contenu contient le hashtag spécifié.
     *
     * @param string $tag Le hashtag (sans le symbole #)
     * @return Post[]
     */
    public function findByHashtag(string $tag): array
    {
        $pattern = '%#' . $tag . '%';
        return $this->createQueryBuilder('p')
            ->where('p.content LIKE :pattern')
            ->setParameter('pattern', $pattern)
            ->orderBy('p.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
