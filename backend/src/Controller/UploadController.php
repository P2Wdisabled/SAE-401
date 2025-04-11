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
            return $this->json(['error' => 'No file provided.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        
        // Check if the file size exceeds 100 MB (100 * 1024 * 1024 bytes)
        if ($file->getSize() > 104857600) {
            return $this->json([
                'error' => 'File too large. The maximum allowed size is 100 MB.'
            ], JsonResponse::HTTP_REQUEST_ENTITY_TOO_LARGE);
        }
        
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads';
        $newFilename = uniqid() . '.' . $file->guessExtension();
        
        try {
            $file->move($uploadDir, $newFilename);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Error during upload.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
        
        $url = $request->getSchemeAndHttpHost() . '/uploads/' . $newFilename;
        
        return $this->json(['url' => $url]);
    }
}
