import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import DesignerGrid from "../components/DesignerGrid";
import DraggableItem from "../components/DraggableItem";
import { api } from "../api";

/**
 * Designer.jsx
 * - Step driven UI similar to your HTML
 * - Budget checks on each selection + before advancing
 * - Drag & drop via DesignerGrid & DraggableItem
 * - Power check in StepPower
 */
const ITEMS = {
  satellites: [
    { code: "S01", name: "CubeSat (1U)", cost: 5000, grid_size: 4, max_batteries: 1, desc: "Small, low-cost platform. Limited space." },
    { code: "S02", name: "Mini Satellite", cost: 25000, grid_size: 6, max_batteries: 2, desc: "Good capacity for multiple sensors." },
    { code: "S03", name: "Medium Satellite", cost: 60000, grid_size: 8, max_batteries: 3, desc: "Versatile, medium payload capacity." },
    { code: "S04", name: "Large Satellite", cost: 100000, grid_size: 10, max_batteries: 4, desc: "High power and large payload capacity." },
  ],
  orbits: [
    { code: "O01", name: "Low Earth Orbit (LEO)", cost: 5000, base_power: 10, desc: "Excellent resolution, high revisit rate." },
    { code: "O02", name: "Medium Earth Orbit (MEO)", cost: 15000, base_power: 25, desc: "Balanced resolution and access." },
    { code: "O03", name: "Geostationary Orbit (GEO)", cost: 40000, base_power: 50, desc: "Fixed target view, low resolution." },
    { code: "O04", name: "Highly Elliptical Orbit (HEO)", cost: 25000, base_power: 35, desc: "Excellent polar coverage." },
  ],
  sensors: [
    { code: "E01", name: "Infrared Camera", cost: 20000, draw: 50, grid_span: 2, desc: "Detects heat and surface patterns." },
    { code: "E02", name: "High-Res Optical Cam", cost: 35000, draw: 80, grid_span: 4, desc: "Captures fine image details." },
    { code: "E03", name: "Spectrometer", cost: 15000, draw: 40, grid_span: 2, desc: "Analyzes vegetation & materials." },
    { code: "E04", name: "Radio Dish (external)", cost: 20000, draw: 50, grid_span: 1, desc: "Handles communication and data relay (external mount)." },
    {code:  "E05", name: "SAR Radar",  cost: 45000, draw: 120, grid_span: 4, desc: "Penetrates marine weed and provides all-weather imaging." },
    {code:  "E06", name: "Veg Spectrometer",  cost: 15000, draw: 40,  grid_span: 2,  desc: "Detailed spectral analysis of marine matter." },
    {code:"E07", name: "Electrometer (LTD)", cost: 8000, draw: 10,  grid_span: 2, desc: "Detects faint magnetic fields (metallic debris)." },
    {code:"E08", name: "Mid-Res Optical Cam", cost: 10000, draw: 25, grid_span: 2, desc: "Standard visible light image capture." },
    {code:"E09", name: "Low-Res Veg Cam",  cost: 5000, draw: 15, grid_span: 2, desc: "Detects chlorophyll/marine growth." },
    {code:"E10",name: "Atomic Clock", cost: 1000, draw: 5,  grid_span: 2, desc: "Improves data timing accuracy." },

  ],
  power: {
    solar: [
      { code: "P01", name: "Body Mounted Solar Array", cost: 5000, max_power: 100 },
      { code: "P02", name: "Deployable Solar Array", cost: 15000, max_power: 500 },
      { code: "P03", name: "Huge Solar Array", cost: 40000, max_power: 1200 }
    ],
    batteries: [
      { code: "B01", name: "Standard Battery (100Wh)", cost: 5000, storage: 100 },
      { code: "B02", name: "High Capacity Battery (500Wh)", cost: 20000, storage: 500 },
    ]
  }
};

export default function Designer({ team, setTeam }) {
  // Lock if design already submitted
  if (team?.stage3?.design) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <h2 className="text-3xl font-semibold text-red-500 mb-3">
          🚫 Design Already Submitted
        </h2>
        <p className="text-gray-400 max-w-md">
          Your team has already submitted a design for this stage.<br />
          Please contact the coordinators if you need to make changes.
        </p>
      </div>
    );
  }
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(0);              // original coins/budget
  const [remaining, setRemaining] = useState(0);        // budget - committed cost
  const [selected, setSelected] = useState({           // committed selections (not yet submitted)
    satellite: null,
    orbit: null,
    solar: null,
    batteries: [],    // array of battery objects
  });
  const [placed, setPlaced] = useState([]);            // placed sensors on grid (each: { code,name,cost,draw,grid_span,r,c })
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // load team budget (coins)
  useEffect(() => {
    if (!team?._id) return;
    fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?._id]);

  async function fetchTeam() {
    try {
      const res = await api.get(`/api/team/${team._id}`);
      const coins = res.data.team.stage3?.coins || 0;
      setBudget(coins);
      setRemaining(coins);
      // refresh provided team in parent if available
      if (setTeam && res.data.team) setTeam(res.data.team);
    } catch (err) {
      console.error("fetchTeam error", err);
    }
  }

  // compute total committed cost (satellite/orbit/solar/batteries + placed sensors)
  const totalCommittedCost = useCallback(() => {
    let cost = 0;
    if (selected.satellite) cost += selected.satellite.cost;
    if (selected.orbit) cost += selected.orbit.cost;
    if (selected.solar) cost += selected.solar.cost;
    selected.batteries.forEach(b => (cost += b.cost));
    placed.forEach(p => (cost += p.cost || 0));
    return cost;
  }, [selected, placed]);

  // compute power draw (orbit base_power + sensors)
  const totalPowerDraw = useCallback(() => {
    let draw = 0;
    if (selected.orbit) draw += selected.orbit.base_power || 0;
    placed.forEach(p => (draw += p.draw || 0));
    return draw;
  }, [selected, placed]);

  // compute battery storage
  const totalStorage = useCallback(() => {
    return selected.batteries.reduce((s, b) => s + (b.storage || 0), 0);
  }, [selected.batteries]);

  // update remaining whenever selections/placements change
  useEffect(() => {
    const committed = totalCommittedCost();
    setRemaining(budget - committed);
  }, [budget, selected, placed, totalCommittedCost]);

  // helper: try to select an item, with budget guard
  function trySelect(key, itemOrArray) {
    // compute cost delta if changed
    const currentCost = totalCommittedCost();
    let newCost = currentCost;

    if (key === "satellite") {
      const old = selected.satellite;
      newCost = currentCost - (old?.cost || 0) + (itemOrArray?.cost || 0);
    } else if (key === "orbit") {
      const old = selected.orbit;
      newCost = currentCost - (old?.cost || 0) + (itemOrArray?.cost || 0);
    } else if (key === "solar") {
      const old = selected.solar;
      newCost = currentCost - (old?.cost || 0) + (itemOrArray?.cost || 0);
    } else if (key === "battery_add") {
      newCost = currentCost + (itemOrArray?.cost || 0);
    } else if (key === "battery_remove") {
      newCost = currentCost - (itemOrArray?.cost || 0);
    } else {
      newCost = currentCost;
    }

    if (newCost > budget) {
      setMsg("⚠️ Insufficient budget for this selection.");
      return false;
    }
    setMsg("");
    return true;
  }

  // Satellite / Orbit / Solar selection handlers
  function selectSatellite(s) {
    // choosing a satellite resets placed sensors (grid size change) — confirm budget first
    if (!trySelect("satellite", s)) return;
    setSelected(prev => ({ ...prev, satellite: s }));
    setPlaced([]); // drop existing placements (platform changed)
    setMsg("");
  }
  function selectOrbit(o) {
    if (!trySelect("orbit", o)) return;
    setSelected(prev => ({ ...prev, orbit: o }));
    setMsg("");
  }
  function selectSolar(s) {
    if (!trySelect("solar", s)) return;
    setSelected(prev => ({ ...prev, solar: s }));
    setMsg("");
  }

  // battery toggle (add / remove)
  function toggleBattery(b) {
    const presentCount = selected.batteries.filter(x => x.code === b.code).length;
    if (presentCount > 0) {
      // remove one instance
      if (!trySelect("battery_remove", b)) return; // usually allowed
      setSelected(prev => ({ ...prev, batteries: prev.batteries.filter(x => x.code !== b.code) }));
    } else {
      if (!trySelect("battery_add", b)) return;
      // enforce satellite battery capacity if satellite selected
      const maxAllowed = selected.satellite?.max_batteries ?? 10;
      if (selected.batteries.length + 1 > maxAllowed) {
        setMsg(`⚠️ Satellite supports max ${maxAllowed} battery packs.`);
        return;
      }
      setSelected(prev => ({ ...prev, batteries: [...prev.batteries, b] }));
    }
    setMsg("");
  }

  // when DesignerGrid reports placed items changed, handle budget validation & accept/reject
  function handleGridPlace(newPlaced) {
    // compute new placed cost
    const placedCost = newPlaced.reduce((s, p) => s + (p.cost || 0), 0);

    // other cost
    let otherCost = 0;
    if (selected.satellite) otherCost += selected.satellite.cost;
    if (selected.orbit) otherCost += selected.orbit.cost;
    if (selected.solar) otherCost += selected.solar.cost;
    selected.batteries.forEach(b => otherCost += b.cost);

    const totalIfPlaced = otherCost + placedCost;
    if (totalIfPlaced > budget) {
      setMsg("⚠️ Cannot place items — would exceed budget.");
      return false;
    }

    setPlaced(newPlaced);
    setMsg("");
    return true;
  }

  // Step navigation gating
  function canAdvanceTo(nextStep) {
    // Step index mapping:
    // 0 Auth, 1 Instructions, 2 Satellite, 3 Orbit, 4 Sensors/Placement, 5 Power, 6 Summary
    if (nextStep === 2) { // from instructions -> satellite: no gate (but budget must be >0)
      if (budget <= 0) { setMsg("⚠️ No coins available to start the designer. Update coins in DB."); return false; }
      return true;
    }
    if (nextStep === 3) { // after satellite selection
      if (!selected.satellite) { setMsg("Pick a satellite platform first."); return false; }
      return true;
    }
    if (nextStep === 4) { // after orbit selection
      if (!selected.orbit) { setMsg("Pick an orbit first."); return false; }
      return true;
    }
    if (nextStep === 5) { // moving to power: must have at least one placed sensor or external mount etc.
      if (placed.length === 0) { setMsg("Place at least one sensor on the payload grid before continuing."); return false; }
      // ensure cost still within budget
      if (totalCommittedCost() > budget) { setMsg("⚠️ Committed cost exceeds budget."); return false; }
      return true;
    }
    if (nextStep === 6) { // moving to summary from power: we require solar + at least one battery and power checks
      if (!selected.solar || selected.batteries.length === 0) { setMsg("Select solar array and at least one battery pack."); return false; }
      const draw = totalPowerDraw();
      const maxCharge = selected.solar?.max_power || 0;
      if (draw > maxCharge) { setMsg(`⚠️ Power draw (${draw}W) exceeds solar max (${maxCharge}W).`); return false; }
      const storage = totalStorage();
      const runtime = storage / Math.max(draw, 1); // hours
      if (runtime < 3) { setMsg(`⚠️ Battery storage gives only ${runtime.toFixed(2)}h runtime (<3h target).`); return false; }
      return true;
    }
    return true;
  }

  function next() {
    const newStep = step + 1;
    if (!canAdvanceTo(newStep)) return;
    setStep(newStep);
    setMsg("");
  }
  function prev() { if (step > 0) setStep(step - 1); }

  // Submit design -> backend
  async function submitDesign() {
    // final verification
    if (totalCommittedCost() > budget) { setMsg("⚠️ Committed cost exceeds budget. Cannot submit."); return; }
    if (!selected.satellite) { setMsg("Pick a satellite platform."); return; }

    setLoading(true);
    try {
      const payload = {
        teamId: team._id,
        teamName: team.teamName,
        platformSize: selected.satellite.grid_size,
        orbit: selected.orbit?.name, 
        solar: selected.solar?.name,
        batteries: selected.batteries.map(b=>b.name),
        components: placed.map(p=>({
          code: p.code, name:p.name,r: p.r, c: p.c, grid_span: p.grid_span, cost: p.cost, power: p.draw
        }))
      };

      const res = await api.post("/api/design/submit", payload);
      
      // backend should respond with remainingCoins
      setMsg("Design submitted successfully.");
      // refresh team and budget
      await fetchTeam();
      setPlaced([]);
      setSelected({ satellite: null, orbit: null, solar: null, batteries: [] });
      setStep(0);
    } catch (err) {
      console.error("submitDesign error", err);
      setMsg(err.response?.data?.message || "Submission failed.");
    }
    setLoading(false);
  }

  // small helpers for UI text
  const format = (n) => n?.toLocaleString?.() ?? n;

  // Steps components (kept inline for clarity)
  const StepAuth = () => (
    <div className="text-center space-y-6">
      <h3 className="text-4xl font-bold text-blue-600">Stage - 3 - Satellite Design Challenge</h3>
      <h2 className="text-3xl font-semibold text-blue-400">Welcome to Mission SatQuest</h2>
      <h1 className="text-2xl font-medium text-slate-200">Your Team Code for the Mission: <span className="text-yellow-300">{team.teamCode}</span></h1>
      <p className="text-slate-300">Budget (coins): <strong>{format(budget)}</strong> SC</p>
      {budget <= 0 ? (
        <p className="text-red-400 font-semibold"> No coins available for now. Contact organisers to start your mission </p>
      ) : (
        <button className="btn-primary bg-emerald-500 px-6 py-3 rounded" onClick={() => setStep(1)}>Start Mission →</button>
      )}
      {msg && <div className="text-yellow-300 mt-2">{msg}</div>}
    </div>
  );

  const StepInstructions = () => (
    <div className="space-y-4 text-slate-300">
      <h2 className="text-2xl font-bold text-primary-color">MISSION BRIEFING</h2>
      <p>In 2025, OceanTech, a startup spun from NIT Rourkela's ocean engineering lab, faced a maritime crisis: The SS Indira, a colonial-era cargo ship sunk off Odisha's coast in 1942, lay hidden under dense mangrove thickets.</p>
      <p>Design a satellite to locate & analyse the shipwreck beneath heavy marine vegetation.</p>
      <ul className="list-disc list-inside ml-4">
        <li>High-resolution imaging</li>
        <li>Vegetation penetration</li>
        <li>Debris detection & tracking</li>
        <li>Power & data constraints</li>
      </ul>
      <div className="flex gap-3">
        <button className="btn-secondary px-4 py-2" onClick={() => prev()}>Back</button>
        <button className="btn-primary px-4 py-2" onClick={() => next()}>Begin Design →</button>
      </div>
    </div>
  );

  const StepSatellites = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-400">1. Platform</h2>
        <div className="text-sm text-yellow-300">Remaining: {format(remaining)} / {format(budget)} SC</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {ITEMS.satellites.map(s => (
          <div key={s.code} onClick={() => selectSatellite(s)}
               className={`p-4 rounded-lg border-2 cursor-pointer ${selected.satellite?.code === s.code ? "border-emerald-400 bg-emerald-900/30" : "border-slate-700 bg-slate-800"}`}>
            <h3 className="font-bold text-lg">{s.name}</h3>
            <p className="text-sm text-slate-400">{s.desc}</p>
            <p className="text-sm mt-1">Cost: {format(s.cost)} SC | Grid: {s.grid_size}×{s.grid_size}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <button className="btn-secondary" onClick={prev}>Back</button>
        <button className="btn-primary" disabled={!selected.satellite} onClick={() => next()}>Next →</button>
      </div>
      {msg && <div className="text-yellow-300 mt-2">{msg}</div>}
    </div>
  );

  const StepOrbit = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-400">2. Orbit</h2>
        <div className="text-sm text-yellow-300">Remaining: {format(remaining)} / {format(budget)} SC</div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {ITEMS.orbits.map(o => (
          <div key={o.code} onClick={() => selectOrbit(o)}
               className={`p-4 rounded-lg border-2 cursor-pointer ${selected.orbit?.code === o.code ? "border-emerald-400 bg-emerald-900/30" : "border-slate-700 bg-slate-800"}`}>
            <h3 className="font-bold text-lg">{o.name}</h3>
            <p className="text-sm text-slate-400">{o.desc}</p>
            <p className="text-sm mt-1">Cost: {format(o.cost)} SC</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <button className="btn-secondary" onClick={prev}>Back</button>
        <button className="btn-primary" disabled={!selected.orbit} onClick={() => next()}>Next →</button>
      </div>
      {msg && <div className="text-yellow-300 mt-2">{msg}</div>}
    </div>
  );

  const StepSensors = () => {
    const gridSize = selected.satellite?.grid_size || 4;
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-emerald-400">3. Payload & Placement</h2>
          <div className="text-sm text-yellow-300">Remaining: {format(remaining)} / {format(budget)} SC</div>
        </div>

        <div className="md:flex md:space-x-6">
          <div className="md:w-1/3">
            <h3 className="font-semibold text-yellow-300 mb-2">Available Sensors</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {ITEMS.sensors.map(s => (
                <DraggableItem key={s.code} item={{
                  ...s,
                  // ensure cost stored
                  cost: s.cost
                }}
                onMobileSelect={(item) => {
                if (window.matchMedia("(max-width: 768px)").matches) {
                  // mobile select mode — pass to grid
                  document.dispatchEvent(new CustomEvent("mobileItemSelect", { detail: item }));
                }
              }}
   />
              ))}
            </div>
            <div className="mt-4 text-sm text-slate-400">
              Click a sensor to drop or drag it into the grid.
            </div>
          </div>

          <div className="md:w-2/3">
            <DesignerGrid
              gridSize={gridSize}
              items={ITEMS.sensors.map(s => ({ ...s, cost: s.cost }))}
              placed={placed}
              onPlaceChange={(newPlaced) => {
                // DesignerGrid will call onPlaceChange with final placed array
                // we validate budget inside handleGridPlace
                const ok = handleGridPlace(newPlaced);
                if (!ok) {
                  // if rejected, do nothing (DesignerGrid should remain unchanged)
                }
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={prev}>Back</button>
          <button className="btn-primary" disabled={placed.length === 0} onClick={() => next()}>Next →</button>
        </div>
        {msg && <div className="text-yellow-300 mt-2">{msg}</div>}
      </div>
    );
  };

  const StepPower = () => {
    const draw = totalPowerDraw();
    const storage = totalStorage();
    const runtime = storage / Math.max(draw, 1);
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-emerald-400">4. Power Systems</h2>
          <div className="text-sm text-yellow-300">Remaining: {format(remaining)} / {format(budget)} SC</div>
        </div>

        <h3 className="text-lg font-semibold text-yellow-300">Select Solar Panel</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {ITEMS.power.solar.map(s => (
            <div key={s.code}
                 onClick={() => selectSolar(s)}
                 className={`p-4 rounded-lg border-2 cursor-pointer ${selected.solar?.code === s.code ? "border-emerald-400 bg-emerald-900/30" : "border-slate-700 bg-slate-800"}`}>
              <h3 className="font-bold">{s.name}</h3>
              <p className="text-sm text-slate-400">Cost: {format(s.cost)} SC | Max: {s.max_power}W</p>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-yellow-300">Select Batteries</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {ITEMS.power.batteries.map(b => {
            const selectedCount = selected.batteries.filter(x => x.code === b.code).length;
            return (
              <div key={b.code} onClick={() => toggleBattery(b)}
                   className={`p-4 rounded-lg border-2 cursor-pointer ${selectedCount ? "border-emerald-400 bg-emerald-900/30" : "border-slate-700 bg-slate-800"}`}>
                <h3 className="font-bold">{b.name}</h3>
                <p className="text-sm text-slate-400">Cost: {format(b.cost)} SC | {b.storage}Wh</p>
                {selectedCount > 0 && <p className="text-xs text-emerald-300">Selected</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-slate-800 rounded">
          <p><strong>Total Power Draw:</strong> {draw} W</p>
          <p><strong>Total Battery Storage:</strong> {storage} Wh</p>
          <p><strong>Estimated runtime in darkness:</strong> {runtime.toFixed(2)} h (target ≥ 3h)</p>
          <p className="text-sm text-slate-400 mt-2">Solar selected will provide charging up to its max power; ensure draw ≤ solar max and runtime ≥ 3h.</p>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={prev}>Back</button>
          <button className="btn-primary" disabled={!selected.solar || selected.batteries.length === 0} onClick={() => next()}>Analyze →</button>
        </div>
        {msg && <div className="text-yellow-300 mt-2">{msg}</div>}
      </div>
    );
  };

  const StepSummary = () => {
    const draw = totalPowerDraw();
    const storage = totalStorage();
    const runtime = storage / Math.max(draw, 1);
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-emerald-400">Summary & Submit</h2>
          <div className="text-sm text-yellow-300">Remaining: {format(remaining)} / {format(budget)} SC</div>
        </div>

        <div className="space-y-2 text-slate-300">
          <p><b>Platform:</b> {selected.satellite?.name}</p>
          <p><b>Orbit:</b> {selected.orbit?.name}</p>
          <p><b>Sensors placed:</b> {placed.map(p => p.name).join(", ") || "—"}</p>
          <p><b>Solar:</b> {selected.solar?.name}</p>
          <p><b>Batteries:</b> {selected.batteries.map(b => b.name).join(", ")}</p>
          <p><b>Power draw:</b> {draw} W | <b>Storage:</b> {storage} Wh | <b>Runtime:</b> {runtime.toFixed(2)} h</p>
          <p><b>Final cost:</b> {format(totalCommittedCost())} SC</p>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={prev}>Back</button>
          <button className="btn-primary bg-green-600" onClick={submitDesign} disabled={loading}>
            {loading ? "Submitting..." : "Submit Final Design"}
          </button>
        </div>

        {msg && <div className="text-yellow-300 mt-2">{msg}</div>}
      </div>
    );
  };

  const steps = [
    StepAuth,
    StepInstructions,
    StepSatellites,
    StepOrbit,
    StepSensors,
    StepPower,
    StepSummary
  ];
  const StepComponent = steps[step];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-slate-900 rounded-xl shadow-lg text-white max-w-6xl mx-auto">
      <StepComponent />
    </motion.div>
  );
}
