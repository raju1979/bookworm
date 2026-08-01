<?php

declare(strict_types=1);

/**
 * Verify Firebase ID tokens using Google's JWKS (no Composer).
 */
final class Auth
{
    private static ?array $currentUser = null;

    public static function requireUser(): array
    {
        if (self::$currentUser !== null) {
            return self::$currentUser;
        }

        $header = self::bearerToken();
        if ($header === null) {
            Api::error('No token provided', 401);
        }

        try {
            $payload = self::verifyFirebaseToken(
                $header,
                env('FIREBASE_PROJECT_ID', 'bookworm-6c9ec') ?? 'bookworm-6c9ec',
            );
        } catch (Throwable $e) {
            error_log('Auth error: ' . $e->getMessage());
            Api::error('Invalid token', 401);
        }

        self::$currentUser = [
            'sub' => $payload['sub'],
            'uid' => $payload['sub'],
            'email' => isset($payload['email']) && is_string($payload['email'])
                ? $payload['email']
                : null,
        ];

        return self::$currentUser;
    }

    public static function optionalUser(): ?array
    {
        try {
            $header = self::bearerToken();
            if ($header === null) {
                return null;
            }
            return self::requireUser();
        } catch (Throwable $e) {
            return null;
        }
    }

    private static function bearerToken(): ?string
    {
        $auth = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? null;

        if (!$auth && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $k => $v) {
                if (strcasecmp($k, 'Authorization') === 0) {
                    $auth = $v;
                    break;
                }
            }
        }

        if (!$auth || !preg_match('/^Bearer\s+(\S+)$/i', $auth, $m)) {
            return null;
        }

        return $m[1];
    }

    private static function verifyFirebaseToken(string $jwt, string $projectId): array
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            throw new RuntimeException('Malformed JWT');
        }

        [$h64, $p64, $s64] = $parts;
        $header = json_decode(self::b64urlDecode($h64), true);
        $payload = json_decode(self::b64urlDecode($p64), true);
        $signature = self::b64urlDecode($s64);

        if (!is_array($header) || !is_array($payload)) {
            throw new RuntimeException('Invalid JWT JSON');
        }

        if (($header['alg'] ?? '') !== 'RS256') {
            throw new RuntimeException('Unexpected alg');
        }

        $iss = "https://securetoken.google.com/{$projectId}";
        if (($payload['iss'] ?? '') !== $iss) {
            throw new RuntimeException('Invalid issuer');
        }
        if (($payload['aud'] ?? '') !== $projectId) {
            throw new RuntimeException('Invalid audience');
        }
        if (empty($payload['sub'])) {
            throw new RuntimeException('Invalid token - missing uid');
        }
        if (($payload['exp'] ?? 0) < time()) {
            throw new RuntimeException('Token expired');
        }

        $kid = $header['kid'] ?? null;
        if (!$kid) {
            throw new RuntimeException('Missing kid');
        }

        $jwk = self::findJwk($kid);
        $pem = self::jwkToPem($jwk);
        $signed = $h64 . '.' . $p64;
        $ok = openssl_verify($signed, $signature, $pem, OPENSSL_ALGO_SHA256);
        if ($ok !== 1) {
            throw new RuntimeException('Bad signature');
        }

        return $payload;
    }

    private static function findJwk(string $kid): array
    {
        $cacheFile = dirname(__DIR__) . '/tmp/firebase_jwks.json';
        $jwks = null;

        if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < 3600) {
            $jwks = json_decode((string) file_get_contents($cacheFile), true);
        }

        if (!is_array($jwks) || empty($jwks['keys'])) {
            $url = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
            $json = file_get_contents($url);
            if ($json === false) {
                throw new RuntimeException('Unable to fetch JWKS');
            }
            $jwks = json_decode($json, true);
            if (!is_dir(dirname($cacheFile))) {
                mkdir(dirname($cacheFile), 0775, true);
            }
            file_put_contents($cacheFile, $json);
        }

        foreach ($jwks['keys'] as $key) {
            if (($key['kid'] ?? '') === $kid) {
                return $key;
            }
        }

        // kid rotated — force refresh once
        @unlink($cacheFile);
        $json = file_get_contents(
            'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
        );
        $jwks = json_decode((string) $json, true);
        foreach (($jwks['keys'] ?? []) as $key) {
            if (($key['kid'] ?? '') === $kid) {
                file_put_contents($cacheFile, $json);
                return $key;
            }
        }

        throw new RuntimeException('JWKS key not found');
    }

    private static function jwkToPem(array $jwk): string
    {
        $n = self::b64urlDecode($jwk['n'] ?? '');
        $e = self::b64urlDecode($jwk['e'] ?? '');
        if ($n === '' || $e === '') {
            throw new RuntimeException('Invalid JWK');
        }

        $modulus = self::asn1Integer($n);
        $exponent = self::asn1Integer($e);
        $rsaPublicKey = self::asn1Sequence($modulus . $exponent);
        $algorithmIdentifier = hex2bin('300d06092a864886f70d0101010500');
        $subjectPublicKey = chr(0) . $rsaPublicKey;
        $bitString = chr(0x03) . self::asn1Length(strlen($subjectPublicKey)) . $subjectPublicKey;
        $spki = self::asn1Sequence($algorithmIdentifier . $bitString);

        return "-----BEGIN PUBLIC KEY-----\n"
            . chunk_split(base64_encode($spki), 64, "\n")
            . "-----END PUBLIC KEY-----\n";
    }

    private static function asn1Integer(string $bytes): string
    {
        if ($bytes === '' || (ord($bytes[0]) & 0x80)) {
            $bytes = "\x00" . $bytes;
        }
        return chr(0x02) . self::asn1Length(strlen($bytes)) . $bytes;
    }

    private static function asn1Sequence(string $der): string
    {
        return chr(0x30) . self::asn1Length(strlen($der)) . $der;
    }

    private static function asn1Length(int $length): string
    {
        if ($length < 0x80) {
            return chr($length);
        }
        $bin = ltrim(pack('N', $length), "\x00");
        return chr(0x80 | strlen($bin)) . $bin;
    }

    private static function b64urlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        $decoded = base64_decode(strtr($data, '-_', '+/'), true);
        return $decoded === false ? '' : $decoded;
    }
}
