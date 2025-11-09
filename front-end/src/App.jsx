import React, { useState, useEffect } from 'react';
import './App.css';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import satellite from './assets/satellite.png';
import Dashboard from './pages/Dashboard';
import Crossword from './pages/Crossword';
import Designer from './pages/Designer';
import Navbar from './components/Navbar';
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";


export default function App() {
  const [team, setTeam] = useState(() => {
    const t = localStorage.getItem('team');
    return t ? JSON.parse(t) : null;
  });

  useEffect(()=> localStorage.setItem('team', JSON.stringify(team || null)), [team]);

  return (
    <div>
      <Navbar team={team} setTeam={setTeam} />
      <div className="container">
        {!team ? (
          <>
          <div
                className="fixed inset-0 z-0 bg-cover bg-center overflow-hidden"
                style={{ backgroundImage: `url(${satellite})` }}
              />
              {/* Overlay for readability */}
              <div className="fixed inset-0 z-10 bg-blue-950/2 backdrop-blur-sm" />
              {/* Main glassmorphism card */}
              <div className="relative z-20 flex items-center justify-center overflow-hidden ">
                <div className="w-full max-w-5xl mx-auto rounded-3xl bg-white/2 backdrop-blur-sm shadow-2xl border border-white/20 p-4 sm:p-8">
                  <Landing />
                  <Register setTeam={setTeam} />
                  <Login setTeam={setTeam} />
                </div>
              </div>

          </>
        ) : (
          <>
            {/*  <Dashboard team={team} /> */}
            {/* <Crossword team={team} setTeam={setTeam} /> */}
            <DndProvider backend={HTML5Backend}>
              <Designer team={team} setTeam={setTeam} />
            </DndProvider>
          </>
        )}
      </div>
    </div>
  );
}
