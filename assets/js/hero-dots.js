/* Fixed, tangent dots with a diagonal, individually staggered fill-to-outline wave. */
(() => {
 const field=document.querySelector('.dot-field');if(!field)return;
 let last='';
 function build(){
  const width=field.clientWidth,height=field.clientHeight,cols=Math.ceil(width/30),rows=Math.ceil(height/30),key=cols+':'+rows;if(key===last)return;last=key;
  const fragment=document.createDocumentFragment();
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const dot=document.createElement('i');dot.className='hero-dot';dot.style.left=col*30+'px';dot.style.top=row*30+'px';
   const phase=(cols<2?0:(cols-1-col)/(cols-1))*.65+(rows<2?0:row/(rows-1))*.35;
   dot.style.animationDelay=(phase*3.8).toFixed(3)+'s';fragment.append(dot);
  }
  field.replaceChildren(fragment);
 }
 new ResizeObserver(build).observe(field);build();
})();
