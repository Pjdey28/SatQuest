import React from 'react';
export default function Navbar({ team, setTeam }) {
  return (
    <div className="py-4 px-6 flex items-center justify-between">
      <div className="text-2xl font-bold">SATQUEST</div>
      <div>
        {team ? (
          <div className="flex items-center gap-4">
            <div className="text-sm">Team: <strong>{team.teamName}</strong></div>
            <button onClick={() => { localStorage.removeItem('team'); setTeam(null); }} className="px-3 py-1 rounded bg-red-600">Logout</button>
          </div>
        ) : (
          <div className="text-sm">Scan QR to open this page</div>
        )}
      </div>
    </div>
  );
}
