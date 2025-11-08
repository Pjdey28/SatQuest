import React, { useState, useEffect } from 'react';
import './App.css';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
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
            <Landing />
            <Register setTeam={setTeam} />
            <Login setTeam={setTeam} />
          </>
        ) : (
          <>
          {/*  <Dashboard team={team} /> */}
           {/* <Crossword team={team} setTeam={setTeam} /> */}
            <DndProvider backend={HTML5Backend}>
  <Designer team={team} />
</DndProvider>
</>
        )}
      </div>
    </div>
  );
}
