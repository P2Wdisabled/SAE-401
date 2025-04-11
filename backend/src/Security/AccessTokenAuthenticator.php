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
        // Look for the Authorization header containing "Bearer {token}"
        return $request->headers->has('Authorization') && 0 === strpos($request->headers->get('Authorization'), 'Bearer ');
    }

    public function authenticate(Request $request): SelfValidatingPassport
    {
        $authHeader = $request->headers->get('Authorization');
        $rawToken = substr($authHeader, 7); // Remove "Bearer "
        $hashedToken = hash('sha256', $rawToken);
        
        // Search for the token in the database
        $apiToken = $this->apiTokenRepository->findOneBy(['token' => $hashedToken]);
        if (!$apiToken) {
            throw new CustomUserMessageAuthenticationException('Invalid token.');
        }
        
        // Check for expiration
        if ($apiToken->getExpiresAt() < new \DateTimeImmutable()) {
            throw new CustomUserMessageAuthenticationException('Expired token.');
        }
        
        // Return a Passport with the UserBadge that will use, for example, the email as the identifier
        return new SelfValidatingPassport(new UserBadge($apiToken->getUser()->getEmail()));
    }

    public function onAuthenticationSuccess(Request $request, $token, string $firewallName): ?Response
    {
        // On success, the request continues as normal
        return null;
    }

    public function onAuthenticationFailure(Request $request, \Throwable $exception): ?Response
    {
        return new Response('Access denied: ' . $exception->getMessage(), Response::HTTP_UNAUTHORIZED);
    }
}
