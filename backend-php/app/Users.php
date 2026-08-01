<?php

declare(strict_types=1);

final class Users
{
    public static function findByFirebaseUid(string $uid): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM users WHERE firebase_uid = ? LIMIT 1');
        $stmt->execute([$uid]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function findByEmail(string $email): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function findById(int $id): ?array
    {
        $stmt = Database::pdo()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function requireByFirebaseUid(string $uid): array
    {
        $user = self::findByFirebaseUid($uid);
        if (!$user) {
            Api::error("User with Firebase UID {$uid} not found", 404);
        }
        return $user;
    }

    /** Create or reclaim by email if Firebase UID changed. */
    public static function createOrReclaim(array $data): array
    {
        $uid = $data['firebase_uid'] ?? '';
        $email = $data['email'] ?? '';

        $existingByUid = self::findByFirebaseUid($uid);
        if ($existingByUid) {
            return $existingByUid;
        }

        if ($email !== '') {
            $existingByEmail = self::findByEmail($email);
            if ($existingByEmail) {
                $stmt = Database::pdo()->prepare(
                    'UPDATE users SET firebase_uid = ?, updated_at = NOW() WHERE id = ?',
                );
                $stmt->execute([$uid, $existingByEmail['id']]);
                return self::findById((int) $existingByEmail['id']) ?? $existingByEmail;
            }
        }

        try {
            $stmt = Database::pdo()->prepare(
                'INSERT INTO users (firebase_uid, email, full_name, bio, city, favorite_genre, profile_image)
                 VALUES (?, ?, ?, ?, ?, ?, ?)',
            );
            $stmt->execute([
                $uid,
                $email,
                $data['full_name'] ?? null,
                $data['bio'] ?? null,
                $data['city'] ?? null,
                $data['favorite_genre'] ?? null,
                $data['profile_image'] ?? null,
            ]);
            return self::findById((int) Database::pdo()->lastInsertId());
        } catch (PDOException $e) {
            if ($email !== '') {
                $recovered = self::findByEmail($email);
                if ($recovered) {
                    $stmt = Database::pdo()->prepare(
                        'UPDATE users SET firebase_uid = ?, updated_at = NOW() WHERE id = ?',
                    );
                    $stmt->execute([$uid, $recovered['id']]);
                    return self::findById((int) $recovered['id']) ?? $recovered;
                }
            }
            Api::error('Email or Firebase UID already exists', 409);
        }
    }

    public static function ensureExists(string $firebaseUid, ?string $email = null): array
    {
        $user = self::findByFirebaseUid($firebaseUid);
        if ($user) {
            return $user;
        }

        if ($email) {
            $user = self::findByEmail($email);
            if ($user) {
                $stmt = Database::pdo()->prepare(
                    'UPDATE users SET firebase_uid = ?, updated_at = NOW() WHERE id = ?',
                );
                $stmt->execute([$firebaseUid, $user['id']]);
                return self::findById((int) $user['id']) ?? $user;
            }

            return self::createOrReclaim([
                'firebase_uid' => $firebaseUid,
                'email' => $email,
            ]);
        }

        Api::error('User profile not found. Please complete your profile first.', 400);
    }

    public static function update(int $id, array $data): array
    {
        if (!self::findById($id)) {
            Api::error("User with ID {$id} not found", 404);
        }

        $map = [
            'full_name' => $data['full_name'] ?? $data['fullName'] ?? null,
            'bio' => $data['bio'] ?? null,
            'city' => $data['city'] ?? null,
            'favorite_genre' => $data['favorite_genre'] ?? $data['favoriteGenre'] ?? null,
            'profile_image' => $data['profile_image'] ?? $data['profileImage'] ?? null,
        ];
        $provided = [
            'full_name' => array_key_exists('full_name', $data) || array_key_exists('fullName', $data),
            'bio' => array_key_exists('bio', $data),
            'city' => array_key_exists('city', $data),
            'favorite_genre' => array_key_exists('favorite_genre', $data) || array_key_exists('favoriteGenre', $data),
            'profile_image' => array_key_exists('profile_image', $data) || array_key_exists('profileImage', $data),
        ];

        $sets = [];
        $params = [];
        foreach ($provided as $col => $has) {
            if ($has) {
                $sets[] = "{$col} = ?";
                $params[] = $map[$col];
            }
        }

        if ($sets) {
            $params[] = $id;
            $sql = 'UPDATE users SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = ?';
            Database::pdo()->prepare($sql)->execute($params);
        }

        return self::findById($id);
    }
}
