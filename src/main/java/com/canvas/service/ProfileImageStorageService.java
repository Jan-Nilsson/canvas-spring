package com.canvas.service;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class ProfileImageStorageService {

    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;

    private final ConcurrentMap<Long, StoredProfileImage> images =
            new ConcurrentHashMap<>();

    public String store(Long userId, MultipartFile file) throws IOException {

        if (userId == null) {
            throw new IllegalArgumentException("Invalid user.");
        }

        if (file == null || file.isEmpty()) {
            return null;
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException(
                    "The image cannot exceed 5 MB."
            );
        }

        byte[] content = file.getBytes();

        String detectedType = detectImageType(content);

        if (detectedType == null) {
            throw new IllegalArgumentException(
                    "Please upload a valid JPG, PNG or WebP image."
            );
        }

        String declaredType = file.getContentType();

        if (!isCompatibleType(declaredType, detectedType)) {
            throw new IllegalArgumentException(
                    "The selected image format is not supported."
            );
        }

        images.put(
                userId,
                new StoredProfileImage(
                        content,
                        MediaType.parseMediaType(detectedType)
                )
        );

        return "/profile/image/" + userId;
    }

    public Optional<StoredProfileImage> findByUserId(Long userId) {

        return Optional.ofNullable(images.get(userId));
    }

    private String detectImageType(byte[] content) {

        // JPEG
        if (content.length >= 3
                && (content[0] & 0xFF) == 0xFF
                && (content[1] & 0xFF) == 0xD8
                && (content[2] & 0xFF) == 0xFF) {

            return "image/jpeg";
        }

        // PNG
        if (content.length >= 8
                && (content[0] & 0xFF) == 0x89
                && content[1] == 0x50
                && content[2] == 0x4E
                && content[3] == 0x47
                && content[4] == 0x0D
                && content[5] == 0x0A
                && content[6] == 0x1A
                && content[7] == 0x0A) {

            return "image/png";
        }

        // WebP
        if (content.length >= 12
                && content[0] == 'R'
                && content[1] == 'I'
                && content[2] == 'F'
                && content[3] == 'F'
                && content[8] == 'W'
                && content[9] == 'E'
                && content[10] == 'B'
                && content[11] == 'P') {

            return "image/webp";
        }

        return null;
    }

    private boolean isCompatibleType(
            String declaredType,
            String detectedType) {

        if (declaredType == null
                || declaredType.isBlank()
                || declaredType.equalsIgnoreCase("application/octet-stream")) {

            return true;
        }

        if (declaredType.equalsIgnoreCase("image/jpg")
                || declaredType.equalsIgnoreCase("image/pjpeg")) {

            return detectedType.equals("image/jpeg");
        }

        return declaredType.equalsIgnoreCase(detectedType);
    }

    public static class StoredProfileImage {

        private final byte[] content;
        private final MediaType mediaType;

        public StoredProfileImage(byte[] content, MediaType mediaType) {
            this.content = content.clone();
            this.mediaType = mediaType;
        }

        public byte[] getContent() {
            return content.clone();
        }

        public MediaType getMediaType() {
            return mediaType;
        }
    }
}