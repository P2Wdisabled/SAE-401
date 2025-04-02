<?php

namespace App\Dto\Payload;

use phpDocumentor\Reflection\Types\Boolean;
use Symfony\Component\Validator\Constraints as Assert;

class CreatePostPayload
{
    /**
     * @Assert\NotBlank(message="Le contenu ne peut pas être vide.")
     * @Assert\Length(
     *      max = 280,
     *      maxMessage = "Le contenu ne peut pas dépasser {{ limit }} caractères."
     * )
     */
    private ?string $content = null;
    private ?array $media = [];
    private ?bool $locked = false;

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): self
    {
        $this->content = $content;
        return $this;
    }

    
    public function getMedia(): ?array {
        return $this->media;
    }

    public function setMedia(?array $media): self {
        $this->media = $media;
        return $this;
    }
    
    public function getLocked(?bool $locked): self {
        $this->locked = $locked;
        return $this;
    }

    public function setLocked(?bool $locked): self {
        $this->locked = $locked;
        return $this;
    }
}
