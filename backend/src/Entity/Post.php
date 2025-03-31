<?php

namespace App\Entity;

use App\Repository\PostRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: PostRepository::class)]
class Post
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['post:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 280)]
    #[Groups(['post:read'])]
    private ?string $content = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['post:read'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'posts')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(type: "json", nullable: true)]
    #[Groups(['post:read'])]
    private ?array $media = [];

    
#[ORM\OneToMany(mappedBy: 'post', targetEntity: PostLike::class, cascade: ["remove"])]
private Collection $likes;

public function __construct() {
    $this->likes = new ArrayCollection();
}

public function getMedia(): ?array
    {
        return $this->media;
    }

    public function setMedia(?array $media): self
    {
        $this->media = $media;
        return $this;
    }

public function getLikes(): Collection
{
    return $this->likes;
}

public function getLikesCount(): int
{
    return $this->likes->count();
}

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }
}
