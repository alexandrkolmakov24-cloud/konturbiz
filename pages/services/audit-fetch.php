<?php
/**
 * KONTURBIZ · proxy для демо SEO/AEO/GEO сканера одной страницы.
 * Кладётся на тот же домен, что и страница аудита (same-origin для JS).
 *
 * Пример: /pages/services/audit-fetch.php?url=https://example.ru/
 *
 * Защита: только http/https, порты 80/443, без private/localhost IP (в т.ч. после DNS),
 * IP закрепляется через CURLOPT_RESOLVE (защита от DNS-rebinding),
 * лимит размера и времени, ручная обработка редиректов с повторной проверкой каждого хопа,
 * простое ограничение частоты запросов по IP.
 *
 * Требования: PHP 8.0+, расширения curl и mbstring (mbstring желателен, без него — iconv).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

const MAX_URL_LEN = 2000;
const MAX_BYTES = 1_500_000;      // ~1.5 MB HTML
const TIMEOUT_SEC = 12;
const MAX_REDIRECTS = 5;
const RATE_LIMIT = 30;            // запросов
const RATE_WINDOW = 600;          // за 10 минут с одного IP

function fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

/** Мягкий лимит запросов по IP. Если нет доступа к tmp — просто пропускаем. */
function rate_limit(): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if ($ip === '') return;
    $file = rtrim(sys_get_temp_dir(), '/\\') . '/kb_audit_rl_' . md5($ip) . '.json';
    $now = time();
    $hits = [];
    $fp = @fopen($file, 'c+');
    if (!$fp) return;
    if (@flock($fp, LOCK_EX)) {
        $raw = stream_get_contents($fp);
        $data = $raw ? json_decode($raw, true) : [];
        if (is_array($data)) {
            foreach ($data as $t) {
                if (is_int($t) && $t > $now - RATE_WINDOW) $hits[] = $t;
            }
        }
        $blocked = count($hits) >= RATE_LIMIT;
        if (!$blocked) $hits[] = $now;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($hits));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        if ($blocked) fail(429, 'Слишком много проверок. Подождите несколько минут и повторите.');
        return;
    }
    fclose($fp);
}

function is_public_ip(string $ip): bool {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        return (bool) filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        return (bool) filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_IPV6 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
    }
    return false;
}

/**
 * Возвращает список публичных IP хоста или null, если хост небезопасен/не резолвится.
 * Если среди адресов есть хоть один приватный — null.
 */
function resolve_public_ips(string $host): ?array {
    $host = strtolower(trim($host, '[]'));
    if ($host === '' || $host === 'localhost' || str_ends_with($host, '.localhost') || str_ends_with($host, '.local')) {
        return null;
    }
    if (filter_var($host, FILTER_VALIDATE_IP)) {
        return is_public_ip($host) ? [$host] : null;
    }
    $ips = [];
    $records = @dns_get_record($host, DNS_A + DNS_AAAA);
    if ($records) {
        foreach ($records as $r) {
            if (!empty($r['ip'])) $ips[] = $r['ip'];
            if (!empty($r['ipv6'])) $ips[] = $r['ipv6'];
        }
    }
    if (!$ips) {
        $ips = @gethostbynamel($host) ?: [];
    }
    if (!$ips) return null;
    foreach ($ips as $ip) {
        if (!is_public_ip($ip)) return null;
    }
    return array_values(array_unique($ips));
}

function normalize_url(string $raw): string {
    $raw = trim($raw);
    if ($raw === '' || strlen($raw) > MAX_URL_LEN) {
        fail(400, 'Некорректный адрес.');
    }
    if (!preg_match('#^[a-z][a-z0-9+.-]*://#i', $raw)) {
        $raw = 'https://' . $raw;
    }
    $p = parse_url($raw);
    if (!$p || empty($p['scheme']) || empty($p['host'])) {
        fail(400, 'Некорректный адрес.');
    }
    $scheme = strtolower($p['scheme']);
    if ($scheme !== 'http' && $scheme !== 'https') {
        fail(400, 'Только http и https.');
    }
    if (!empty($p['user']) || !empty($p['pass'])) {
        fail(400, 'Адрес не должен содержать логин и пароль.');
    }
    $port = $p['port'] ?? ($scheme === 'https' ? 443 : 80);
    if ($port !== 80 && $port !== 443) {
        fail(400, 'Разрешены только порты 80 и 443.');
    }
    $host = strtolower($p['host']);
    // Кириллические домены (.рф и др.) → punycode
    if (preg_match('/[^\x20-\x7e]/', $host) && function_exists('idn_to_ascii')) {
        $ascii = @idn_to_ascii($host, IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46);
        if ($ascii) $host = $ascii;
    }
    if (resolve_public_ips($host) === null) {
        fail(400, 'Этот адрес недоступен для проверки.');
    }
    $path = $p['path'] ?? '/';
    $query = isset($p['query']) ? ('?' . $p['query']) : '';
    return $scheme . '://' . $host . ($port !== 80 && $port !== 443 ? ':' . $port : '') . $path . $query;
}

function fetch_once(string $url): array {
    if (!function_exists('curl_init')) {
        fail(500, 'Сервис временно недоступен (на сервере нет cURL).');
    }
    $p = parse_url($url);
    $host = (string) ($p['host'] ?? '');
    $port = (int) ($p['port'] ?? (($p['scheme'] ?? 'https') === 'https' ? 443 : 80));

    // Закрепляем проверенный IP, чтобы cURL не резолвил имя повторно (DNS-rebinding)
    $ips = resolve_public_ips($host);
    if ($ips === null) {
        fail(400, 'Этот адрес недоступен для проверки.');
    }
    $resolve = [];
    if (!filter_var($host, FILTER_VALIDATE_IP)) {
        foreach ($ips as $ip) {
            $resolve[] = $host . ':' . $port . ':' . (str_contains($ip, ':') ? '[' . $ip . ']' : $ip);
        }
    }

    $buf = '';
    $truncated = false;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_TIMEOUT => TIMEOUT_SEC,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
        CURLOPT_USERAGENT => 'KonturbizAuditDemo/1.0 (+https://konturbiz.ru/pages/services/seo-aeo-geo-audit.html)',
        CURLOPT_HTTPHEADER => [
            'Accept: text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
            'Accept-Language: ru,en;q=0.8',
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_ENCODING => '',
        // Жёсткий лимит размера и для ответов без Content-Length
        CURLOPT_WRITEFUNCTION => function ($c, string $chunk) use (&$buf, &$truncated): int {
            $len = strlen($chunk);
            if (strlen($buf) + $len > MAX_BYTES) {
                $buf .= substr($chunk, 0, MAX_BYTES - strlen($buf));
                $truncated = true;
                return -1; // прервать загрузку
            }
            $buf .= $chunk;
            return $len;
        },
    ]);
    if ($resolve) {
        curl_setopt($ch, CURLOPT_RESOLVE, $resolve);
    }
    curl_exec($ch);
    $errno = curl_errno($ch);
    $err = curl_error($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $ctype = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $redir = (string) curl_getinfo($ch, CURLINFO_REDIRECT_URL);
    curl_close($ch);

    // Обрезка по лимиту — это не ошибка
    if ($errno && !($truncated && $errno === CURLE_WRITE_ERROR)) {
        return ['ok' => false, 'error' => 'Не удалось подключиться к сайту: ' . ($err ?: 'ошибка запроса'), 'code' => $code];
    }
    return [
        'ok' => true,
        'code' => $code,
        'ctype' => $ctype,
        'body' => $buf,
        'redirect' => $redir,
    ];
}

/** Приводит HTML к UTF-8 (windows-1251, koi8-r и т.п.), иначе json_encode вернёт false. */
function to_utf8(string $html, string $ctype): string {
    $charset = '';
    if (preg_match('/charset\s*=\s*["\']?([\w\-:.]+)/i', $ctype, $m)) {
        $charset = strtolower($m[1]);
    }
    if ($charset === '' && preg_match('/<meta[^>]+charset\s*=\s*["\']?([\w\-:.]+)/i', substr($html, 0, 4096), $m)) {
        $charset = strtolower($m[1]);
    }
    if ($charset !== '' && $charset !== 'utf-8' && $charset !== 'utf8') {
        $conv = false;
        try {
            if (function_exists('mb_convert_encoding')) {
                $conv = mb_convert_encoding($html, 'UTF-8', $charset);
            } elseif (function_exists('iconv')) {
                $conv = iconv($charset, 'UTF-8//IGNORE', $html);
            }
        } catch (\Throwable $e) {
            $conv = false; // неизвестная кодировка — оставляем как есть
        }
        if (is_string($conv) && $conv !== '') {
            // чтобы клиентский DOMParser не «переопределил» кодировку
            $html = preg_replace('/(<meta[^>]+charset\s*=\s*["\']?)[\w\-:.]+/i', '${1}utf-8', $conv, 1) ?? $conv;
        }
    }
    if (function_exists('mb_check_encoding') && !mb_check_encoding($html, 'UTF-8')) {
        try {
            $html = mb_convert_encoding($html, 'UTF-8', 'UTF-8'); // выкинуть битые последовательности
        } catch (\Throwable $e) {
            // json_encode ниже всё равно подставит замену через JSON_INVALID_UTF8_SUBSTITUTE
        }
    }
    return $html;
}

// --- main ---
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Метод не поддерживается.');
}

$raw = $_GET['url'] ?? $_POST['url'] ?? '';
if (is_array($raw)) {
    fail(400, 'Некорректный адрес.');
}

rate_limit();

$url = normalize_url((string) $raw);
$current = $url;
$html = '';
$final = $url;
$code = 0;
$ctype = '';

for ($i = 0; $i <= MAX_REDIRECTS; $i++) {
    // повторная проверка каждого хопа (SSRF)
    $current = normalize_url($current);
    $res = fetch_once($current);
    if (empty($res['ok'])) {
        fail(502, $res['error'] ?? 'Не удалось загрузить страницу.');
    }
    $code = (int) $res['code'];
    if (in_array($code, [301, 302, 303, 307, 308], true)) {
        $next = trim((string) ($res['redirect'] ?? ''));
        if ($next === '') {
            fail(502, 'Редирект без адреса.');
        }
        if (!preg_match('#^https?://#i', $next)) {
            $base = parse_url($current);
            $origin = ($base['scheme'] ?? 'https') . '://' . ($base['host'] ?? '');
            if (str_starts_with($next, '//')) {
                $next = ($base['scheme'] ?? 'https') . ':' . $next;
            } elseif (str_starts_with($next, '/')) {
                $next = $origin . $next;
            } else {
                $next = $origin . '/' . $next;
            }
        }
        $current = $next;
        if ($i === MAX_REDIRECTS) {
            fail(502, 'Слишком много редиректов.');
        }
        continue;
    }
    if ($code < 200 || $code >= 400) {
        fail(502, 'Страница вернула HTTP ' . $code);
    }
    $html = (string) $res['body'];
    $ctype = (string) ($res['ctype'] ?? '');
    $final = $current;
    break;
}

if ($html === '') {
    fail(502, 'Пустой ответ сервера.');
}

// Не HTML (PDF, изображения, JSON и т.п.)
if ($ctype !== '' && !preg_match('#text/html|application/xhtml|text/plain|application/xml|text/xml#i', $ctype)) {
    fail(422, 'По этому адресу не HTML-страница (' . substr($ctype, 0, 60) . ').');
}
if (!preg_match('/<html|<body|<title|<meta|<div/i', $html)) {
    fail(422, 'Ответ не похож на HTML-страницу.');
}

$html = to_utf8($html, $ctype);

$json = json_encode([
    'ok' => true,
    'url' => $final,
    'requested' => $url,
    'status' => $code,
    'length' => strlen($html),
    'html' => $html,
], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);

if ($json === false) {
    fail(500, 'Не удалось обработать ответ сайта (кодировка).');
}
echo $json;
