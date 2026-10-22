<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);echo json_encode(['ok'=>false,'error'=>'Method Not Allowed']);exit;}
$cfg=require __DIR__.'/../config/config.php';
$in=json_decode(file_get_contents('php://input'),true);
$name=trim((string)($in['name']??''));$contact=trim((string)($in['contact']??''));$consent=!empty($in['consent']);
if($name===''||$contact===''||!$consent){http_response_code(400);echo json_encode(['ok'=>false,'error'=>'Не заполнены обязательные данные или отсутствует согласие'],JSON_UNESCAPED_UNICODE);exit;}
$to=$cfg['lead_email']??'';
if(!$to){echo json_encode(['ok'=>true,'saved'=>false,'message'=>'Контакты не отправлены: lead_email не настроен.'],JSON_UNESCAPED_UNICODE);exit;}
$subject='KONTURSCAN — новый контакт';
$body="Имя: ".$name."\nКонтакт: ".$contact."\nДата: ".date('c')."\nИсточник: KONTURSCAN";
$headers="Content-Type: text/plain; charset=UTF-8\r\n";
$sent=mail($to,$subject,$body,$headers);
echo json_encode(['ok'=>true,'saved'=>$sent],JSON_UNESCAPED_UNICODE);
