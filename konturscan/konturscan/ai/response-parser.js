export function parseAI(text){try{return JSON.parse(text)}catch(e){const m=text.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);throw new Error('AI returned invalid JSON')}}
