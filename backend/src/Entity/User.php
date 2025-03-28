<?php

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
    private ?string $profilePicture = null;
    
    #[ORM\Column]
    private ?string $profileAvatar = null;

    private ?string $plainPassword = null;

    // Définition de la relation OneToMany avec Post
    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Post::class, orphanRemoval: true)]
    #[ORM\OrderBy(['createdAt' => 'DESC'])]
    private Collection $posts;

    public function __construct()
    {
        $this->posts = new ArrayCollection();
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

    /**
     * Renvoie l'identifiant de l'utilisateur.
     * Ici, si tu souhaites utiliser l'email comme identifiant pour l'authentification,
     * retourne l'email. Sinon, retourne le username.
     */
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
        // garantit que l'utilisateur a au moins ROLE_USER
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
        // Efface toute donnée temporaire sensible
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
}
