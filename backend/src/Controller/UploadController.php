<?php
// src/Controller/UploadController.php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class UploadController extends AbstractController
{
    #[Route('/api/upload', name: 'api_upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $file = $request->files->get('file');
        if (!$file) {
            return $this->json(['error' => 'Aucun fichier fourni.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        
        // Vérifier si la taille du fichier dépasse 100 Mo (100 * 1024 * 1024 octets)
        if ($file->getSize() > 104857600) {
            return $this->json([
                'error' => 'Fichier trop volumineux. La taille maximale autorisée est de 100 Mo.'
            ], JsonResponse::HTTP_REQUEST_ENTITY_TOO_LARGE);
        }
        
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads';
        $newFilename = uniqid() . '.' . $file->guessExtension();
        
        try {
            $file->move($uploadDir, $newFilename);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Erreur lors de l’upload.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
        
        $url = $request->getSchemeAndHttpHost() . '/uploads/' . $newFilename;
        
        return $this->json(['url' => $url]);
    }
}
