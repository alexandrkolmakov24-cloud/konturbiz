<?php
/* Серверный посредник к API Новаторикса.
   Действия:
     ?action=search&inn=…            — подбор по ИНН
     ?action=search&okved=…&region=… — подбор вручную
     ?action=options                 — списки ОКВЭД и регионов
*/
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$BASE = 'https://xn--80adtilgcqlf.com/api/gov-support';
$action = $_GET['action'] ?? 'search';

function callApi($method, $url, $payload = null) {
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER         => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
    ];
    $headers = ['Accept: application/json'];
    if ($payload !== null) {
        $headers[] = 'Content-Type: application/json';
        $opts[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
    $opts[CURLOPT_HTTPHEADER] = $headers;
    curl_setopt_array($ch, $opts);
    $response = curl_exec($ch);
    if ($response === false) {
        $err = curl_error($ch);
        curl_close($ch);
        return [502, '', json_encode(['error' => 'curl: ' . $err], JSON_UNESCAPED_UNICODE)];
    }
    $hs   = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $hdrs = substr($response, 0, $hs);
    $body = substr($response, $hs);
    curl_close($ch);
    if (preg_match('/^X-Lsh:\s*(.+)$/mi', $hdrs, $m)) {
        header('X-Lsh-Upstream: ' . trim($m[1]));
    }
    return [$code, $hdrs, $body];
}

if ($action === 'options') {
    list($code, , $body) = callApi('GET', $BASE . '/options');
    http_response_code($code ?: 502);
    echo $body;
    exit;
}

// search
$payload = [];
if (!empty($_GET['inn'])) {
    $inn = preg_replace('/\D/', '', $_GET['inn']);
    if (!preg_match('/^\d{10}(\d{2})?$/', $inn)) {
        http_response_code(400);
        echo json_encode(['error' => 'inn must be 10 or 12 digits'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $payload['inn'] = $inn;
} elseif (!empty($_GET['okved']) && !empty($_GET['region'])) {
    $payload['okved']  = preg_replace('/[^0-9.]/', '', $_GET['okved']);
    $payload['region'] = preg_replace('/\D/', '', $_GET['region']);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'provide inn or okved+region'], JSON_UNESCAPED_UNICODE);
    exit;
}

list($code, , $body) = callApi('POST', $BASE . '/search', $payload);
http_response_code($code ?: 502);
echo $body;