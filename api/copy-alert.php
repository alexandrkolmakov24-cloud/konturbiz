<?php
// Оповещение: калькулятор запущен на чужом домене. Принимает POST (text/plain, JSON) от js/rc-calc-ui.js.
// Не отдаёт данных, пишет журнал и отправляет письмо не чаще раза в сутки на каждый чужой домен.
header('Content-Type: text/plain; charset=utf-8');
$raw = file_get_contents('php://input', false, null, 0, 2048);
$d = json_decode($raw, true);
if (!is_array($d)) { http_response_code(204); exit; }
$host = strtolower(substr(preg_replace('/[^a-zA-Z0-9.\-:]/', '', (string)($d['h'] ?? '')), 0, 100));
$url  = substr((string)filter_var((string)($d['u'] ?? ''), FILTER_SANITIZE_URL), 0, 300);
$ref  = substr((string)filter_var((string)($d['r'] ?? ''), FILTER_SANITIZE_URL), 0, 300);
$allowed = array('xn--b1aladcb5ablegayu2a.xn--p1ai', 'www.xn--b1aladcb5ablegayu2a.xn--p1ai', 'konturbiz.ru', 'www.konturbiz.ru');
if ($host === '' || in_array($host, $allowed, true)) { http_response_code(204); exit; }
$dir = __DIR__ . '/_log';
if (!is_dir($dir)) { @mkdir($dir, 0750, true); }
$flag = $dir . '/' . md5($host) . '.flag';
if (is_file($flag) && (time() - filemtime($flag)) < 86400) { http_response_code(204); exit; }
@touch($flag);
$ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '?';
$line = date('c') . " host=$host url=$url ref=$ref ip=$ip\n";
@file_put_contents($dir . '/copy-alerts.log', $line, FILE_APPEND | LOCK_EX);
@mail('info@konturbiz.ru', 'Калькулятор запущен на чужом домене: ' . $host, $line,
      "Content-Type: text/plain; charset=utf-8\r\nFrom: noreply@xn--b1aladcb5ablegayu2a.xn--p1ai");
http_response_code(204);
