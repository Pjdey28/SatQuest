import React from 'react';

export default function CrosswordGrid({ grid, onChange, values }) {
  const n = grid.length;
  function handleChange(r,c,e){
    const ch = (e.target.value || '').slice(0,1).toUpperCase();
    onChange(r,c,ch);
  }
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, 36px)` }}>
      {grid.map((row,r)=> row.map((cell,c)=>{
        if(cell === null) return <div key={`${r}-${c}`} className="w-12 h-12 bg-white rounded" />;
        const val = (values?.[r]?.[c] || '');
        return (
          <input key={`${r}-${c}`} value={val} onChange={(e)=>handleChange(r,c,e)}
            className="w-9 h-9 text-center bg-black border-white rounded focus:outline-none" />
        );
      }))}
    </div>
  );
}
