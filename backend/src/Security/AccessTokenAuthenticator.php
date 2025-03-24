<?php
// src/Security/AccessTokenAuthenticator.php

namespace App\Security;

use App\Entity\ApiToken;
use App\Repository\ApiTokenRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Doctrine\ORM\EntityManagerInterface;

class AccessTokenAuthenticator extends AbstractAuthenticator
{
    public function __construct(private EntityManagerInterface $em, private ApiTokenRepository $apiTokenRepository) {}

    public function supports(Request $request): ?bool
    {
        // On cherche le header Authorization contenant "Bearer {token}"
        return $request->headers->has('Authorization') && 0 === strpos($request->headers->get('Authorization'), 'Bearer ');
    }

    public function authenticate(Request $request): SelfValidatingPassport
    {
        $authHeader = $request->headers->get('Authorization');
        $rawToken = substr($authHeader, 7); // Supprime "Bearer "
        $hashedToken = hash('sha256', $rawToken);
        
        // Recherche du token en base
        $apiToken = $this->apiTokenRepository->findOneBy(['token' => $hashedToken]);
        if (!$apiToken) {
            throw new CustomUserMessageAuthenticationException('Token invalide.');
        }
        
        // Vérification de l'expiration
        if ($apiToken->getExpiresAt() < new \DateTimeImmutable()) {
            throw new CustomUserMessageAuthenticationException('Token expiré.');
        }
        
        // Retourne un Passport avec le UserBadge qui utilisera, par exemple, l'email comme identifiant
        return new SelfValidatingPassport(new UserBadge($apiToken->getUser()->getEmail()));
    }

    public function onAuthenticationSuccess(Request $request, $token, string $firewallName): ?Response
    {
        // En cas de succès, la requête continue normalement
        return null;
    }

    public function onAuthenticationFailure(Request $request, \Throwable $exception): ?Response
    {
        return new Response('Accès refusé : ' . $exception->getMessage(), Response::HTTP_UNAUTHORIZED);
    }
}
