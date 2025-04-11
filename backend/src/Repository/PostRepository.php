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
    
        // Recherche textuelle dans le contenu
        if ($search) {
            $qb->andWhere('p.content LIKE :search')
               ->setParameter('search', '%' . $search . '%');
        }
    
        // Filtrage par date sur une journée donnée
        if ($date) {
            try {
                $dateObj = new \DateTime($date);
                $dateEnd = (clone $dateObj)->modify('+1 day');
                $qb->andWhere('p.createdAt >= :dateStart')
                   ->andWhere('p.createdAt < :dateEnd')
                   ->setParameter('dateStart', $dateObj)
                   ->setParameter('dateEnd', $dateEnd);
            } catch (\Exception $e) {
                // En cas d'erreur de conversion, on ignore ce filtre
            }
        }
    
        // Filtre par type basé sur la longueur de la chaîne JSON stockée
        if ($type) {
            if ($type === 'media') {
                // Supposé que p.media contient au moins un média si sa longueur > 2 (exemple : '["..."]')
                $qb->andWhere('LENGTH(p.media) > 2');
            } elseif ($type === 'text') {
                // Aucun média s'il n'y a que '[]' (longueur 2)
                $qb->andWhere('LENGTH(p.media) = 2');
            }
        }
    
        // Filtre par utilisateur (recherche dans le nom)
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
                // Ignorer le filtre de date en cas de problème
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
