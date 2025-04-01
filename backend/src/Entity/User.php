<?php
// src/Entity/User.php

namespace App\Entity;

use App\Repository\UserRepository;
use App\Entity\Post;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_USERNAME', fields: ['username'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private ?string $username = null;

    #[ORM\Column(type: 'string', length: 180, unique: true)]
    private string $email;

    #[ORM\Column(type: 'json')]
    private array $roles = [];

    #[ORM\Column]
    private ?string $password = null;
    
    #[ORM\Column]
    private ?string $profilePicture = "https://vectorified.com/images/default-icon-16.png";
    
    #[ORM\Column]
    private ?string $profileAvatar = "https://static.vecteezy.com/system/resources/previews/000/701/690/large_2x/abstract-polygonal-banner-background-vector.jpg";

    // Nouveaux champs pour le profil
    #[ORM\Column(type: "text", nullable: true)]
    private ?string $bio = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $location = "unknown";

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $website = null;

    private ?string $plainPassword = null;

    // Définition de la relation OneToMany avec Post
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Post::class, orphanRemoval: true)]
    #[ORM\OrderBy(['createdAt' => 'DESC'])]
    private Collection $posts;
    
    #[ORM\Column(type: "boolean")]
    private bool $blocked = false;

    #[ORM\ManyToMany(targetEntity: self::class, inversedBy: 'followers')]
    #[ORM\JoinTable(name: 'user_following')]
    private Collection $following;

    #[ORM\ManyToMany(targetEntity: self::class, mappedBy: 'following')]
    private Collection $followers;

    #[ORM\Column(type: "boolean")]
private bool $readOnly = false;

#[ORM\Column(type: "boolean")]
private bool $private = false;

    
#[ORM\ManyToMany(targetEntity: self::class)]
#[ORM\JoinTable(name: 'user_blocked')]
private Collection $blockedUsers;


    
#[ORM\ManyToOne(targetEntity: Post::class)]
#[ORM\JoinColumn(nullable: true)]
private ?Post $pinnedTweet = null;

    public function __construct()
    {
        $this->posts = new ArrayCollection();
        $this->following = new ArrayCollection();
        $this->followers = new ArrayCollection();
        $this->blockedUsers = new ArrayCollection();
    }

    
    public function getPinnedTweet(): ?Post
{
    return $this->pinnedTweet;
}

public function setPinnedTweet(?Post $pinnedTweet): self
{
    $this->pinnedTweet = $pinnedTweet;
    return $this;
}

    
public function getBlockedUsers(): Collection
{
    return $this->blockedUsers;
}

public function block(self $user): self
{
    if (!$this->blockedUsers->contains($user)) {
        $this->blockedUsers[] = $user;
    }
    return $this;
}

public function unblock(self $user): self
{
    if ($this->blockedUsers->contains($user)) {
        $this->blockedUsers->removeElement($user);
    }
    return $this;
}
    public function getBlocked(): bool
    {
        return $this->blocked;
    }

    public function setBlocked(bool $blocked): self
    {
        $this->blocked = $blocked;
        return $this;
    }
    
    public function getProfileBanner(): ?string
    {
        return $this->profileAvatar;
    }

    public function setProfileBanner(?string $profileAvatar): self
    {
        $this->profileAvatar = $profileAvatar;
        return $this;
    }

    public function getProfilePicture(): ?string
    {
        return $this->profilePicture;
    }

    public function setProfilePicture(?string $profilePicture): self
    {
        $this->profilePicture = $profilePicture;
        return $this;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;
        return $this;
    }
    
    public function setEmail(string $email): self 
    {
        $this->email = $email;
        return $this;
    }
    
    public function getEmail(): string 
    {
        return $this->email;
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    /**
     * @return list<string>
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';
        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;
        return $this;
    }

    public function setPassword(string $password): self 
    {
        $this->password = $password;
        return $this;
    }
    
    public function getPassword(): string 
    {
        return $this->password;
    }

    public function setPlainPassword(?string $plainPassword): self 
    {
        $this->plainPassword = $plainPassword;
        return $this;
    }
    
    public function getPlainPassword(): ?string 
    {
        return $this->plainPassword;
    }

    public function eraseCredentials(): void
    {
        // $this->plainPassword = null;
    }

    /**
     * @return Collection|Post[]
     */
    public function getPosts(): Collection
    {
        return $this->posts;
    }

    public function addPost(Post $post): static
    {
        if (!$this->posts->contains($post)) {
            $this->posts[] = $post;
            $post->setUser($this);
        }
        return $this;
    }

    public function removePost(Post $post): static
    {
        if ($this->posts->removeElement($post)) {
            if ($post->getUser() === $this) {
                $post->setUser(null);
            }
        }
        return $this;
    }

    public function getFollowing(): Collection
    {
        return $this->following;
    }

    public function follow(self $user): self
    {
        if (!$this->following->contains($user)) {
            $this->following[] = $user;
        }
        return $this;
    }

    public function unfollow(self $user): self
    {
        if ($this->following->contains($user)) {
            $this->following->removeElement($user);
        }
        return $this;
    }

    public function getFollowers(): Collection
    {
        return $this->followers;
    }
    
    // Getters et setters pour les nouveaux champs

    public function getBio(): ?string
    {
        return $this->bio;
    }

    public function setBio(?string $bio): self
    {
        $this->bio = $bio;
        return $this;
    }

    public function getLocation(): ?string
    {
        return $this->location;
    }

    public function setLocation(?string $location): self
    {
        $this->location = $location;
        return $this;
    }

    public function getWebsite(): ?string
    {
        return $this->website;
    }

    public function setWebsite(?string $website): self
    {
        $this->website = $website;
        return $this;
    }

    public function getReadOnly(): bool {
        return $this->readOnly;
    }
    
    public function setReadOnly(bool $readOnly): self {
        $this->readOnly = $readOnly;
        return $this;
    }
    
    public function getPrivate(): bool {
        return $this->private;
    }
    
    public function setPrivate(bool $private): self {
        $this->private = $private;
        return $this;
    }
}
