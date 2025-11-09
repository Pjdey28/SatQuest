import React from 'react';

export default function Navbar({ team, setTeam }) {
  return (
    <div className="py-4 px-6 flex items-center justify-between bg-white/2 text-white z-50 fixed w-full">
      <div className="text-xl md:text-2xl font-bold">SATQUEST</div> {/* Responsive text size */}
      <div>
        {team ? (
          <div className="flex items-center gap-4">
            <div className="text-sm md:text-base">Team: <strong>{team.teamName}</strong></div> {/* Responsive text size */}
            <button 
              onClick={() => { 
                localStorage.removeItem('team'); 
                setTeam(null); 
              }} 
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="text-sm md:text-base"></div> 
        )}
      </div>
    </div>
  );
}
