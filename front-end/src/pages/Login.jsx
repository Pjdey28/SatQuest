import React, { useState } from 'react';
import { api } from '../api';

export default function Login({ setTeam }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  async function submit(e){
    e.preventDefault();
    try {
      const res = await api.post('/api/login', { teamCode: code.trim().toUpperCase() });
      if(res.data.ok) {
        setTeam(res.data.team);
      } else setMsg('Invalid');
    } catch(err){ setMsg('Invalid code'); }
  }
  return (
    <div className="card mb-6">
      <h3 className="text-xl font-semibold mb-2">Login with Team Code</h3>
      <form onSubmit={submit} >
        <input value={code} onChange={e=>setCode(e.target.value)} placeholder="TEAMCODE" className="w-auto p-2 rounded border-2 border-black bg-white/2" />
        <button className="px-3 py-2 mx-2 my-2 bg-green-600 rounded">Login</button>
      </form>
      <div className="text-sm text-yellow-300 mt-2">{msg}</div>
    </div>
  );
}
