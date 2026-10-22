<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'Method Not Allowed'],JSON_UNESCAPED_UNICODE); exit; }
$cfg=require __DIR__.'/../config/config.php';
if (($cfg['gemini_api_key'] ?? '') === 'PASTE_GEMINI_API_KEY_HERE' || !$cfg['gemini_api_key']) { http_response_code(503); echo json_encode(['ok'=>false,'error'=>'AI Core не настроен: укажите GEMINI_API_KEY в config/config.php'],JSON_UNESCAPED_UNICODE); exit; }
$raw=file_get_contents('php://input'); if(strlen($raw)>200000){http_response_code(413);echo json_encode(['ok'=>false,'error'=>'Payload too large'],JSON_UNESCAPED_UNICODE);exit;}
$payload=json_decode($raw,true); if(!is_array($payload)||!isset($payload['answers'])){http_response_code(400);echo json_encode(['ok'=>false,'error'=>'Некорректные данные диагностики'],JSON_UNESCAPED_UNICODE);exit;}
function kb(string $file): string { $p=__DIR__.'/../knowledge/'.$file; return is_file($p)?file_get_contents($p):''; }
$knowledge=implode("\n\n---\n\n",[
 kb('methodology/methodology.md'),kb('problems/problem-map.md'),kb('solutions/solution-policy.md'),kb('branding/branding.md'),kb('loyalty/loyalty.md'),kb('kontur/kontur-products.md')
]);
$system='Ты — AI Core KONTURSCAN. Интерпретируй только переданные факты. Не выдумывай данные, не обещай гарантированный финансовый результат, не добавляй продукты. Рекомендации уже выбраны движком и должны остаться ровно тремя: Лояльность и удержание клиентов, Брендинг, СКБ Контур. Сформируй ясный персональный отчёт на русском языке. Верни только JSON.';
$schema=[
 'type'=>'object','properties'=>[
  'headline'=>['type'=>'string'],'summary'=>['type'=>'string'],'main_problem'=>['type'=>'string'],'why_it_matters'=>['type'=>'string'],
  'strengths'=>['type'=>'array','items'=>['type'=>'string']], 'growth_points'=>['type'=>'array','items'=>['type'=>'string']],
  'next_steps'=>['type'=>'array','items'=>['type'=>'string']],
  'recommendation_notes'=>['type'=>'array','items'=>['type'=>'object','properties'=>['category'=>['type'=>'string'],'reason'=>['type'=>'string'],'action'=>['type'=>'string']],'required'=>['category','reason','action']]]
 ],'required'=>['headline','summary','main_problem','why_it_matters','strengths','growth_points','next_steps','recommendation_notes']
];
$prompt=$system."\n\nДАННЫЕ ДИАГНОСТИКИ:\n".json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)."\n\nБАЗА ЗНАНИЙ:\n".$knowledge;
$model=$cfg['gemini_model'];
$url='https://generativelanguage.googleapis.com/v1beta/models/'.rawurlencode($model).':generateContent';
$body=['systemInstruction'=>['parts'=>[['text'=>$system]]],'contents'=>[['role'=>'user','parts'=>[['text'=>$prompt]]]],'generationConfig'=>['temperature'=>$cfg['temperature'],'maxOutputTokens'=>$cfg['max_output_tokens'],'responseMimeType'=>'application/json','responseSchema'=>$schema]];
$ch=curl_init($url); curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_HTTPHEADER=>['Content-Type: application/json','x-goog-api-key: '.$cfg['gemini_api_key']],CURLOPT_POSTFIELDS=>json_encode($body,JSON_UNESCAPED_UNICODE),CURLOPT_TIMEOUT=>45]);
$res=curl_exec($ch); $status=curl_getinfo($ch,CURLINFO_HTTP_CODE); $curlErr=curl_error($ch); curl_close($ch);
if($res===false){http_response_code(502);echo json_encode(['ok'=>false,'error'=>'Ошибка соединения с AI Core'],JSON_UNESCAPED_UNICODE);exit;}
$gem=json_decode($res,true); if($status<200||$status>=300){http_response_code(502);$msg=$gem['error']['message']??'Gemini API error';echo json_encode(['ok'=>false,'error'=>$msg],JSON_UNESCAPED_UNICODE);exit;}
$text=$gem['candidates'][0]['content']['parts'][0]['text']??''; $result=json_decode($text,true);
if(!is_array($result)){http_response_code(502);echo json_encode(['ok'=>false,'error'=>'AI Core вернул некорректный JSON'],JSON_UNESCAPED_UNICODE);exit;}
echo json_encode(['ok'=>true,'result'=>$result],JSON_UNESCAPED_UNICODE);
