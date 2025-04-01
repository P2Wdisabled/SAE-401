<?php
// src/Entity/Post.php

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

    // Champ pour stocker les médias (images, vidéos, etc.)
    #[ORM\Column(type: "json", nullable: true)]
    #[Groups(['post:read'])]
    private ?array $media = [];

    // Relation pour les réponses (self-referencing)
    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'replies')]
    #[ORM\JoinColumn(name: "parent_id", referencedColumnName: "id", nullable: true)]
    private ?self $parent = null;

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    private Collection $replies;

    #[ORM\OneToMany(mappedBy: 'post', targetEntity: PostLike::class, cascade: ["remove"])]
    private Collection $likes;


    
#[ORM\Column(type: "boolean")]
private bool $censored = false;

#[ORM\Column(type: "integer")]
    #[Groups(['post:read'])]
    private int $retweetCount = 0;

    #[ORM\Column(type: "boolean")]
    #[Groups(['post:read'])]
    private bool $isRetweet = false;

    #[ORM\Column(type: "string", length: 280, nullable: true)]
    #[Groups(['post:read'])]
    private ?string $retweetComment = null;

    public function __construct() {
        $this->likes = new ArrayCollection();
        $this->replies = new ArrayCollection();
    }

    public function getRetweetCount(): int
    {
        return $this->retweetCount;
    }

    public function setRetweetCount(int $retweetCount): self
    {
        $this->retweetCount = $retweetCount;
        return $this;
    }

    public function incrementRetweetCount(): self
    {
        $this->retweetCount++;
        return $this;
    }

    public function getIsRetweet(): bool
    {
        return $this->isRetweet;
    }

    public function setIsRetweet(bool $isRetweet): self
    {
        $this->isRetweet = $isRetweet;
        return $this;
    }

    public function getRetweetComment(): ?string
    {
        return $this->retweetComment;
    }

    public function setRetweetComment(?string $retweetComment): self
    {
        $this->retweetComment = $retweetComment;
        return $this;
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

    public function getMedia(): ?array
    {
        return $this->media;
    }

    public function setMedia(?array $media): self
    {
        $this->media = $media;
        return $this;
    }

    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent): self
    {
        $this->parent = $parent;
        return $this;
    }

    /**
     * @return Collection|self[]
     */
    public function getReplies(): Collection
    {
        return $this->replies;
    }

    public function addReply(self $reply): self
    {
        if (!$this->replies->contains($reply)) {
            $this->replies[] = $reply;
            $reply->setParent($this);
        }
        return $this;
    }

    public function removeReply(self $reply): self
    {
        if ($this->replies->removeElement($reply)) {
            if ($reply->getParent() === $this) {
                $reply->setParent(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection|PostLike[]
     */
    public function getLikes(): Collection
    {
        return $this->likes;
    }

    public function getLikesCount(): int
    {
        return $this->likes->count();
    }

    public function getCensored(): bool
{
    return $this->censored;
}

public function setCensored(bool $censored): self
{
    $this->censored = $censored;
    return $this;
}
}
