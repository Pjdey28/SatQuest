import React, { useState } from 'react';
import { api } from '../api';
import { motion } from 'framer-motion';

export default function Register({ setTeam }) {
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([{name:'',email:'',phone:''},{name:'',email:'',phone:''},{name:'',email:'',phone:''}]);
  const [msg, setMsg] = useState('');

  async function submit(e){
    e.preventDefault();
    try {
  const res = await api.post('/api/register', { teamName, members });
  if (res.data.teamId) {
    setMsg(`✅ Registered! Your team code: ${res.data.teamCode} (save this for login)`);
    // Save the team ID and code for later use
    localStorage.setItem("teamId", res.data.teamId);
    localStorage.setItem("teamCode", res.data.teamCode);
    setTeam({ teamName, teamCode: res.data.teamCode, _id: res.data.teamId });
  } else {
    setMsg("⚠️ Registration failed — please try again.");
  }
} catch (err) {
  console.error("Register error:", err);
  setMsg("❌ Server error during registration.");
}
  }
  function setMember(i, key, val){
    const m = members.slice(); m[i][key]=val; setMembers(m);
  }

  return (
    <motion.div className="card mb-6" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}}>
      <h2 className="text-2xl font-semibold mb-3">Register Team</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Team name" className="w-auto p-2 rounded border-2 border-black bg-white/2" required />
        {members.map((m,i)=>(
          <div key={i} className="flex-2 gap-2 sm:grid grid-cols-3">
            <input value={m.name} onChange={e=>setMember(i,'name',e.target.value)} placeholder={`Member ${i+1} Name`} className="w-auto  p-2 rounded border-2 border-black bg-white/2" required={i==0} />
            <input value={m.email} onChange={e=>setMember(i,'email',e.target.value)} placeholder="Email" className="w-auto p-2 my-2 rounded border-2 border-black bg-white/2" required={i==0} />
            <input value={m.phone} onChange={e=>setMember(i,'phone',e.target.value)} placeholder="Phone" className="w-auto p-2 rounded border-2 border-black bg-white/2" required={i==0} />
          </div>
        ))}
        <button className="px-4 py-2 bg-blue-600 rounded">Register</button>
        <div className="text-sm text-green-300">{msg}</div>
      </form>
    </motion.div>
  );
}
