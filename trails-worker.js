import { generateTrail } from './trails-generator.js';
self.onmessage=({data})=>{try{const existing=new Set(data.existing),puzzles=[];let sequence=data.start;
 for(let tries=0;tries<60&&puzzles.length<12;tries++,sequence++){try{const p=generateTrail(sequence,existing);existing.add(p.letters);puzzles.push(p);self.postMessage({progress:puzzles.length});}catch{/* Try another seed without returning an invalid or repeated board. */}}
 if(puzzles.length!==12)throw Error('Could not finish this pack. Please try again.');self.postMessage({puzzles});
}catch(error){self.postMessage({error:error.message});}};
