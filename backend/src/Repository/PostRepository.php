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

    public function paginateAllOrderedByLatest(
        int $offset, 
        int $count, 
        ?string $search = null, 
        ?string $date = null, 
        ?string $type = null, 
        ?string $userParam = null
    ): Paginator {
        $qb = $this->createQueryBuilder('p')
            ->select('p', 'u')
            ->innerJoin('p.user', 'u')
            ->where('p.parent IS NULL');
    
        // Text search in the content
        if ($search) {
            $qb->andWhere('p.content LIKE :search')
               ->setParameter('search', '%' . $search . '%');
        }
    
        // Filter by date for a given day
        if ($date) {
            try {
                $dateObj = new \DateTime($date);
                $dateEnd = (clone $dateObj)->modify('+1 day');
                $qb->andWhere('p.createdAt >= :dateStart')
                   ->andWhere('p.createdAt < :dateEnd')
                   ->setParameter('dateStart', $dateObj)
                   ->setParameter('dateEnd', $dateEnd);
            } catch (\Exception $e) {
                // In case of conversion error, ignore this filter
            }
        }
    
        // Type filter based on the length of the stored JSON string
        if ($type) {
            if ($type === 'media') {
                // Assumes that p.media contains at least one media if its length > 2 (example: '["..."]')
                $qb->andWhere('LENGTH(p.media) > 2');
            } elseif ($type === 'text') {
                // No media if there is only '[]' (length 2)
                $qb->andWhere('LENGTH(p.media) = 2');
            }
        }
    
        // Filter by user (search in the name)
        if ($userParam) {
            $qb->andWhere('u.username LIKE :username')
               ->setParameter('username', '%' . $userParam . '%');
        }
    
        $qb->orderBy('p.createdAt', 'DESC')
           ->setFirstResult($offset)
           ->setMaxResults($count);
    
        $query = $qb->getQuery();
    
        return new Paginator($query);
    }
    
    public function paginatePostsByUsers(
        array $userIds, 
        int $offset, 
        int $count, 
        ?string $search = null, 
        ?string $date = null, 
        ?string $type = null, 
        ?string $userParam = null
    ): Paginator {
        $qb = $this->createQueryBuilder('p')
            ->select('p', 'u')
            ->innerJoin('p.user', 'u')
            ->where('p.parent IS NULL')
            ->andWhere('p.user IN (:userIds)')
            ->setParameter('userIds', $userIds);
    
        if ($search) {
            $qb->andWhere('p.content LIKE :search')
               ->setParameter('search', '%' . $search . '%');
        }
    
        if ($date) {
            try {
                $dateObj = new \DateTime($date);
                $dateEnd = (clone $dateObj)->modify('+1 day');
                $qb->andWhere('p.createdAt >= :dateStart')
                   ->andWhere('p.createdAt < :dateEnd')
                   ->setParameter('dateStart', $dateObj)
                   ->setParameter('dateEnd', $dateEnd);
            } catch (\Exception $e) {
                // Ignore the date filter in case of an issue
            }
        }
    
        if ($type) {
            if ($type === 'media') {
                $qb->andWhere('LENGTH(p.media) > 2');
            } elseif ($type === 'text') {
                $qb->andWhere('LENGTH(p.media) = 2');
            }
        }
    
        if ($userParam) {
            $qb->andWhere('u.username LIKE :username')
               ->setParameter('username', '%' . $userParam . '%');
        }
    
        $qb->orderBy('p.createdAt', 'DESC')
           ->setFirstResult($offset)
           ->setMaxResults($count);
    
        $query = $qb->getQuery();
    
        return new Paginator($query);
    }
    /**
     * Search for posts whose content contains the specified hashtag.
     *
     * @param string $tag The hashtag (without the # symbol)
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
