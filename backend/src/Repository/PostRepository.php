<?php

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
            ->select('p', 'u') // Sélectionne le post et l'utilisateur lié
            ->innerJoin('p.user', 'u') // Jointure sur la relation user (ManyToOne)
            ->orderBy('p.createdAt', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($count)
            ->getQuery();
    
        return new Paginator($query);
    }
    
}
