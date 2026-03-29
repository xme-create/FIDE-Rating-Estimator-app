import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  RefreshCw, 
  Trophy, 
  Hash, 
  Search,
  Activity,
  UserCircle,
  Info
} from 'lucide-react';
import { 
  calculateExpectedScore, 
  calculateRatingChange, 
  getDynamicK, 
  determineKFactor 
} from './utils/fide';

function App() {
  const [fideId, setFideId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [startRating, setStartRating] = useState('');
  const [kFactor, setKFactor] = useState(40);
  const [loading, setLoading] = useState(false);
  const [numGamesInput, setNumGamesInput] = useState(1);
  const [showKInfo, setShowKInfo] = useState(false);

  // Games State
  const [games, setGames] = useState([
    { id: 1, opponentRating: '', score: 1 }
  ]);

  const lookupPlayer = async (e) => {
    e?.preventDefault();
    if (!fideId || !/^\d+$/.test(fideId)) return;
    
    setLoading(true);
    const apiBase = `/api`;
    try {
      const res = await fetch(`${apiBase}/player/${fideId}`);
      const result = await res.json();
      if (result.success) {
        setPlayerName(result.data.name);
        setStartRating(result.data.rating || '');
        const k = determineKFactor(result.data.rating, result.data.birthYear, result.data.title);
        setKFactor(k);
      }
    } catch (err) {
      console.error("Lookup Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyNumGames = () => {
    const count = parseInt(numGamesInput, 10);
    if (isNaN(count) || count < 0 || count > 100) return;
    const newGames = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      opponentRating: '',
      score: 0.5
    }));
    setGames(newGames);
  };

  const addGame = () => {
    setGames([...games, { id: Date.now(), opponentRating: '', score: 0.5 }]);
    setNumGamesInput(games.length + 1);
  };

  const removeGame = (id) => {
    const nextGames = games.filter(g => g.id !== id);
    setGames(nextGames);
    setNumGamesInput(nextGames.length);
  };

  const updateGame = (id, field, value) => {
    setGames(games.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  // Calculations
  const nominalK = kFactor;
  const effectiveK = getDynamicK(nominalK, games.length);
  
  let totalRatingChange = 0;
  const gameDetails = games.map(g => {
    const pr = parseFloat(startRating) || 0;
    const or = parseFloat(g.opponentRating) || 0;
    if (pr > 0 && or > 0) {
      const expected = calculateExpectedScore(pr, or);
      const change = calculateRatingChange(g.score, expected, effectiveK);
      totalRatingChange += change;
      return { ...g, change };
    }
    return { ...g, change: 0 };
  });

  const finalRatingResult = (parseFloat(startRating) || 0) + totalRatingChange;

  return (
    <div className="container" style={{ paddingTop: '0' }}>
      {/* Header Area */}
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }} className="mobile-text-center mobile-stack">
        <div style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', overflow: 'hidden', maxWidth: '100%' }}>
            <Trophy size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span className="badge" style={{ fontSize: '0.55rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>OFFICIAL FIDE 8.1.1 &amp; 8.1.2 - MAR 2024</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: 'white' }} className="mobile-h1">
            FIDE Rating Estimator
          </h1>
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600 }} className="mobile-hide">
          DASHBOARD v2.1
        </div>
      </header>

      <div className="dashboard-layout">
        
        {/* Sidebar: Profile & Live Summary */}
        <aside className="sidebar-sticky">
          
          {/* Player Identity Section */}
          <section className="section-card" style={{ padding: '1.25rem' }}>
            <h2 className="title-sm" style={{ borderBottom: '1.5px solid var(--border)', paddingBottom: '0.6rem', marginBottom: '1rem', fontSize: '0.95rem' }}>
              <UserCircle size={18} color="var(--primary)" /> 
              Player Profile
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <div className="label-xs" style={{ fontSize: '0.55rem' }}>FIDE ID (Optional)</div>
              <form onSubmit={lookupPlayer} style={{ display: 'flex', gap: '0.4rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="Search id..." 
                    value={fideId} 
                    onChange={e => setFideId(e.target.value)}
                    style={{ paddingLeft: '1.8rem', height: '36px', fontSize: '0.85rem' }}
                  />
                  <Hash size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>
                <button type="submit" className="btn" disabled={loading} style={{ width: '36px', height: '36px', padding: 0 }}>
                  {loading ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
                </button>
              </form>
            </div>

            {playerName && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.6rem', border: '1.5px solid var(--primary)' }}>
                <div className="label-xs" style={{ marginBottom: '0.1rem', color: 'var(--primary)', fontSize: '0.6rem' }}>Confirmed Profile</div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>{playerName}</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="mobile-grid-stack">
              <div>
                <div className="label-xs" style={{ fontSize: '0.55rem' }}>Start Rating</div>
                <input 
                  type="number" 
                  placeholder="0"
                  value={startRating} 
                  onChange={e => setStartRating(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', textAlign: 'center', height: '42px' }}
                />
              </div>
              <div>
                <div className="label-xs" style={{ fontSize: '0.55rem' }}>Base K</div>
                <input 
                  type="number" 
                  value={kFactor} 
                  onChange={e => setKFactor(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)', textAlign: 'center', height: '42px' }}
                />
              </div>
            </div>

            <button 
              onClick={() => setShowKInfo(!showKInfo)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '0.7rem', marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600, opacity: 0.8 }}
            >
              <Info size={12} /> Help: What's your K?
            </button>
            
            {showKInfo && (
              <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.3)', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: '1.6', border: '1.5px solid var(--border)' }}>
                <strong>Standard Rules (2024):</strong>
                <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem' }}>
                  <li><strong>K=40:</strong> Juniors (&lt;18) or &lt;30 games.</li>
                  <li><strong>K=20:</strong> Established adult players.</li>
                  <li><strong>K=10:</strong> Ever reached 2400 rating.</li>
                  <li><strong>700 Rule:</strong> If games * K &gt; 700, K = floor(700/count).</li>
                </ul>
              </div>
            )}
          </section>

          {/* Performance Summary Card */}
          <section className="summary-highlight" style={{ padding: '1.5rem' }}>
             <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="label-xs" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.6rem' }}>Projected Gain</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                   <div style={{ fontSize: '2.8rem', fontWeight: 900 }}>
                     {totalRatingChange >= 0 ? `+${totalRatingChange.toFixed(1)}` : totalRatingChange.toFixed(1)}
                   </div>
                   <Activity size={32} color="rgba(255,255,255,0.4)" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1.5px solid rgba(255,255,255,0.25)', paddingTop: '1rem' }}>
                   <div>
                      <div className="label-xs" style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.6rem' }}>Target Rating</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{Math.round(finalRatingResult) || '-'}</div>
                   </div>
                   <div>
                      <div className="label-xs" style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.6rem' }}>Effective K</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{effectiveK}</div>
                   </div>
                </div>
             </div>
          </section>
        </aside>

        {/* Main Content: Tournament Game History */}
        <main className="section-card" style={{ flex: 1, padding: '1.5rem' }}>
          <div className="games-section-header">
             <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
               <Calculator size={18} color="var(--primary)" className="mobile-hide" />
               Tournament Games
             </h3>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.75rem', borderRadius: '0.75rem', border: '1.5px solid var(--border)', flexShrink: 0 }}>
                <span className="label-xs" style={{ margin: 0, fontSize: '0.6rem', whiteSpace: 'nowrap' }}>Games:</span>
                <input 
                  type="number" 
                  value={numGamesInput} 
                  onChange={e => setNumGamesInput(e.target.value)}
                  style={{ width: '40px', padding: '0.2rem', height: '26px', fontSize: '0.9rem', textAlign: 'center' }}
                />
                <button onClick={applyNumGames} className="btn" style={{ height: '26px', padding: '0 0.75rem', fontSize: '0.7rem' }}>Set</button>
             </div>
          </div>

          {/* Tournament Games Header - Fixed for overlap prevention */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '0 0.75rem', marginBottom: '0.75rem', opacity: 0.6, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }} className="tablet-grid-stack">
             <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '25px' }}>#</div>
                <div style={{ flex: 1 }}>Opponent</div>
                <div style={{ width: '90px', textAlign: 'center' }}>Result</div>
                <div style={{ width: '50px', textAlign: 'right' }}>&#177;</div>
                <div style={{ width: '20px' }}></div>
             </div>
             <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} className="tablet-hide">
                <div style={{ width: '25px' }}>#</div>
                <div style={{ flex: 1 }}>Opponent</div>
                <div style={{ width: '90px', textAlign: 'center' }}>Result</div>
                <div style={{ width: '50px', textAlign: 'right' }}>&#177;</div>
                <div style={{ width: '20px' }}></div>
             </div>
          </div>

          <div className="games-grid">
            {gameDetails.map((game, index) => (
              <div key={game.id} className="game-tile">
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dim)', width: '25px' }}>{index+1}</div>
                
                <div style={{ flex: 1, minWidth: '80px' }}>
                  <input 
                    type="number" 
                    value={game.opponentRating} 
                    onChange={e => updateGame(game.id, 'opponentRating', e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
                    placeholder="Rating"
                    style={{ fontWeight: 800, fontSize: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1.2px solid var(--border)', height: '34px', minWidth: '80px' }}
                  />
                </div>

                <div className="result-pill-group">
                  <button className={`pill-btn win ${game.score === 1 ? 'active' : ''}`} onClick={() => updateGame(game.id, 'score', 1)}>1</button>
                  <button className={`pill-btn draw ${game.score === 0.5 ? 'active' : ''}`} onClick={() => updateGame(game.id, 'score', 0.5)}>&#189;</button>
                  <button className={`pill-btn loss ${game.score === 0 ? 'active' : ''}`} onClick={() => updateGame(game.id, 'score', 0)}>0</button>
                </div>

                <div className={`change-label ${game.change > 0 ? 'pos' : game.change < 0 ? 'neg' : 'neu'}`}>
                  {game.change >= 0 ? `+${game.change.toFixed(1)}` : game.change.toFixed(1)}
                </div>

                <button 
                  onClick={() => removeGame(game.id)}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button className="btn btn-secondary" onClick={addGame} style={{ width: '100%', marginTop: '1.25rem', borderStyle: 'dashed', padding: '1rem', fontSize: '1rem' }}>
            <Plus size={20} /> Add Individual Game
          </button>
        </main>

      </div>
    </div>
  );
}

export default App;
