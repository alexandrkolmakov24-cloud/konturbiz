let cache;
export async function loadQuestions(){if(cache)return cache;cache=fetch('data/questions.json').then(r=>r.json());return cache}
export function visibleQuestions(questions,answers){return questions.filter(q=>{if(!q.showIf)return true;return q.showIf.split('|').includes(answers.business_type)})}
