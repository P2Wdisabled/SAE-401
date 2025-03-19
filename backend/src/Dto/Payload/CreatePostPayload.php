<?php

namespace App\Dto\Payload;

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

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): self
    {
        $this->content = $content;
        return $this;
    }
}
