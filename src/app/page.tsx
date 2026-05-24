"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Player = {
  id: number;
  name: string;
  nickname: string | null;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  mvpCount: number;
  mvpDates: string[];
  totalFines: number;
  unpaidFines: number;
  hasInjury: boolean;
};

type Match = {
  id: number;
  date: string;
  location: string | null;
  teamAScore: number;
  teamBScore: number;
  result: string;
  mvp: { id: number; name: string } | null;
  players: { team: string; player: { id: number; name: string } }[];
};

type Fine = {
  id: number;
  amount: number;
  reason: string;
  paid: boolean;
  date: string;
  player: { id: number; name: string };
};

type Injury = {
  id: number;
  description: string;
  recovered: boolean;
  date: string;
  player: { id: number; name: string };
};

type Tab = "players" | "matches" | "fines" | "injuries";

function LoginModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const login = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) { onLogin(); onClose(); }
    else setError("비밀번호가 틀렸습니다.");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-lg font-bold mb-1">관리자 로그인</h2>
        <p className="text-gray-400 text-sm mb-4">관리자만 데이터를 추가·수정·삭제할 수 있습니다.</p>
        <input
          ref={inputRef}
          type="password"
          className="bg-gray-700 rounded-lg px-4 py-3 w-full outline-none focus:ring-2 ring-green-500 mb-3"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={login} disabled={loading} className="bg-green-600 hover:bg-green-500 flex-1 py-2.5 rounded-lg font-medium disabled:opacity-50">
            {loading ? "확인 중..." : "로그인"}
          </button>
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-lg text-sm">취소</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("players");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const loadPlayers = useCallback(() => {
    setPlayersLoading(true);
    fetch("/api/players").then((r) => r.json()).then((data) => { setPlayers(data); setPlayersLoading(false); });
  }, []);

  useEffect(() => {
    loadPlayers();
    fetch("/api/auth").then((r) => r.json()).then((d) => setIsAdmin(d.isAdmin));
  }, [loadPlayers]);

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setIsAdmin(false);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "players", label: "📊 통계" },
    { key: "matches", label: "🏆 경기" },
    { key: "fines", label: "💸 벌금" },
    { key: "injuries", label: "🩹 부상" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={() => setIsAdmin(true)} />}

      <header className="bg-green-700 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚽</span>
            <div>
              <h1 className="text-2xl font-bold">덕원고 풋살모임</h1>
              <p className="text-green-200 text-sm">팀 기록 & 통계</p>
            </div>
          </div>
          <div>
            {isAdmin ? (
              <button onClick={logout} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg text-sm font-medium">
                🔓 <span>관리자</span><span className="text-green-200 text-xs ml-1">로그아웃</span>
              </button>
            ) : (
              <button onClick={() => setShowLogin(true)} className="flex items-center gap-1.5 bg-green-800 hover:bg-green-700 px-3 py-1.5 rounded-lg text-sm">
                🔒 관리자 로그인
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-green-500 text-green-400" : "border-transparent text-gray-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "players" && <PlayersTab players={players} loading={playersLoading} onRefresh={loadPlayers} isAdmin={isAdmin} />}
        {tab === "matches" && <MatchesTab players={players} onRefresh={loadPlayers} isAdmin={isAdmin} />}
        {tab === "fines" && <FinesTab players={players} isAdmin={isAdmin} />}
        {tab === "injuries" && <InjuriesTab players={players} isAdmin={isAdmin} />}
      </main>
    </div>
  );
}

type SortKey = "matches" | "winRate" | "wins";

/* ───────── 통계 탭 ───────── */
function PlayersTab({ players, loading, onRefresh, isAdmin }: { players: Player[]; loading: boolean; onRefresh: () => void; isAdmin: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("matches");

  const addPlayer = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), nickname: nickname.trim() || null }),
    });
    setName(""); setNickname(""); setShowForm(false);
    onRefresh();
    setSaving(false);
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim() || saving) return;
    setSaving(true);
    await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), nickname: editNickname.trim() || null }),
    });
    setEditId(null);
    onRefresh();
    setSaving(false);
  };

  const deletePlayer = async (id: number, pName: string) => {
    if (!confirm(`"${pName}" 선수를 삭제할까요?\n관련 경기 기록도 함께 삭제됩니다.`)) return;
    await fetch(`/api/players/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const winRate = (p: Player) =>
    p.totalMatches === 0 ? 0 : Math.round((p.wins / p.totalMatches) * 100);

  const sorted = [...players].sort((a, b) => {
    if (sortKey === "matches") return b.totalMatches - a.totalMatches;
    if (sortKey === "wins") return b.wins - a.wins;
    return winRate(b) - winRate(a);
  });

  const sortBtns: { key: SortKey; label: string }[] = [
    { key: "matches", label: "경기수" },
    { key: "winRate", label: "승률" },
    { key: "wins", label: "승리" },
  ];

  const rankIcon = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `${i + 1}위`;
  };

  if (loading) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold">선수 통계 ({players.length}명)</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 정렬 버튼 */}
          <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
            {sortBtns.map(({ key, label }) => (
              <button key={key} onClick={() => setSortKey(key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${sortKey === key ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium">
              + 선수 등록
            </button>
          )}
        </div>
      </div>

      {/* 선수 등록 폼 */}
      {isAdmin && showForm && (
        <div className="bg-gray-800 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">새 선수 등록</h3>
          <div className="flex gap-3 flex-wrap">
            <input className="bg-gray-700 rounded-lg px-3 py-2 flex-1 min-w-32 outline-none focus:ring-2 ring-green-500" placeholder="이름 *" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPlayer()} />
            <input className="bg-gray-700 rounded-lg px-3 py-2 flex-1 min-w-32 outline-none focus:ring-2 ring-green-500" placeholder="닉네임 (선택)" value={nickname} onChange={(e) => setNickname(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPlayer()} />
            <button onClick={addPlayer} disabled={saving} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "저장 중..." : "등록"}</button>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white px-3 py-2 text-sm">취소</button>
          </div>
        </div>
      )}

      {players.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><div className="text-5xl mb-3">👥</div><p>선수를 등록해보세요!</p></div>
      ) : (
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div key={p.id} className="bg-gray-800 rounded-xl overflow-hidden">
              {editId === p.id ? (
                <div className="p-4 space-y-2">
                  <input className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500 text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="이름" />
                  <input className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500 text-sm" value={editNickname} onChange={(e) => setEditNickname(e.target.value)} placeholder="닉네임" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(p.id)} disabled={saving} className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg text-sm flex-1 disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
                    <button onClick={() => setEditId(null)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm flex-1">취소</button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* 순위 */}
                    <div className="text-lg w-8 text-center shrink-0">{rankIcon(i)}</div>

                    {/* 이름 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold">{p.name}</span>
                        {p.nickname && <span className="text-gray-400 text-xs">({p.nickname})</span>}
                        {p.hasInjury && <span title="부상 중" className="text-sm">🩹</span>}
                        {p.unpaidFines > 0 && <span title="미납 벌금" className="text-sm">💸</span>}
                      </div>
                      {/* MVP 날짜 */}
                      {p.mvpCount > 0 && (
                        <div className="text-xs text-yellow-400 mt-0.5">
                          🏅 MVP {p.mvpCount}회
                          <span className="text-yellow-600 ml-1">
                            ({p.mvpDates.map((d) => d.slice(5).replace("-", "/")).join(", ")})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 스탯 */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center hidden sm:block">
                        <div className="text-xs text-gray-400">경기</div>
                        <div className="font-bold">{p.totalMatches}</div>
                      </div>
                      <div className="flex gap-1 text-sm font-medium">
                        <span className="text-green-400">{p.wins}승</span>
                        <span className="text-gray-500">{p.draws}무</span>
                        <span className="text-red-400">{p.losses}패</span>
                      </div>
                      {/* 승률 바 */}
                      <div className="text-right w-16">
                        <div className="text-sm font-bold text-white">
                          {p.totalMatches === 0 ? "-" : `${winRate(p)}%`}
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-0.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${winRate(p)}%` }}
                          />
                        </div>
                      </div>

                      {/* 관리자 버튼 */}
                      {isAdmin && (
                        <div className="flex gap-1 ml-1">
                          <button onClick={() => { setEditId(p.id); setEditName(p.name); setEditNickname(p.nickname ?? ""); }} className="text-gray-500 hover:text-white p-1 text-xs">✏️</button>
                          <button onClick={() => deletePlayer(p.id, p.name)} className="text-gray-500 hover:text-red-400 p-1 text-xs">🗑️</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── 경기 탭 ───────── */
function MatchesTab({ players, onRefresh, isAdmin }: { players: Player[]; onRefresh: () => void; isAdmin: boolean }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [teamA, setTeamA] = useState<number[]>([]);
  const [teamB, setTeamB] = useState<number[]>([]);
  const [mvpId, setMvpId] = useState<number | "">("");
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [editTeamA, setEditTeamA] = useState<number[]>([]);
  const [editTeamB, setEditTeamB] = useState<number[]>([]);

  const load = useCallback(() => {
    setMatchesLoading(true);
    fetch("/api/matches").then((r) => r.json()).then((data) => { setMatches(data); setMatchesLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const addMatch = async () => {
    if (!date || saving) return;
    setSaving(true);
    await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, location, teamAScore, teamBScore, teamA, teamB, mvpId: mvpId || null }),
    });
    setShowForm(false);
    setDate(new Date().toISOString().split("T")[0]);
    setLocation(""); setTeamAScore(0); setTeamBScore(0); setTeamA([]); setTeamB([]); setMvpId("");
    load(); onRefresh();
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editMatch || saving) return;
    setSaving(true);
    await fetch(`/api/matches/${editMatch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: editMatch.date.split("T")[0],
        location: editMatch.location,
        teamAScore: editMatch.teamAScore,
        teamBScore: editMatch.teamBScore,
        mvpId: editMatch.mvp?.id || null,
        teamA: editTeamA,
        teamB: editTeamB,
      }),
    });
    setEditMatch(null);
    load(); onRefresh();
    setSaving(false);
  };

  const cycleEditTeam = (id: number) => {
    const inA = editTeamA.includes(id);
    const inB = editTeamB.includes(id);
    if (!inA && !inB) setEditTeamA((prev) => [...prev, id]);
    else if (inA) { setEditTeamA((prev) => prev.filter((x) => x !== id)); setEditTeamB((prev) => [...prev, id]); }
    else setEditTeamB((prev) => prev.filter((x) => x !== id));
  };

  const openEdit = (m: Match) => {
    setEditMatch(m);
    setEditTeamA(m.players.filter((p) => p.team === "A").map((p) => p.player.id));
    setEditTeamB(m.players.filter((p) => p.team === "B").map((p) => p.player.id));
  };

  const deleteMatch = async (id: number) => {
    if (!confirm("이 경기 기록을 삭제할까요?")) return;
    await fetch(`/api/matches/${id}`, { method: "DELETE" });
    load(); onRefresh();
  };

  const cycleTeam = (id: number) => {
    const inA = teamA.includes(id);
    const inB = teamB.includes(id);
    if (!inA && !inB) setTeamA((prev) => [...prev, id]);
    else if (inA) { setTeamA((prev) => prev.filter((x) => x !== id)); setTeamB((prev) => [...prev, id]); }
    else setTeamB((prev) => prev.filter((x) => x !== id));
  };

  const resultLabel = (m: Match) => {
    if (m.result === "draw") return <span className="text-gray-400 text-sm">무승부</span>;
    if (m.result === "A") return <span className="text-green-400 text-sm">A팀 승</span>;
    return <span className="text-blue-400 text-sm">B팀 승</span>;
  };

  const allInMatch = [...teamA, ...teamB];

  return (
    <div>
      {/* 경기 수정 모달 */}
      {editMatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 py-6">
          <div className="bg-gray-800 rounded-2xl p-5 w-full max-w-md shadow-xl space-y-4 max-h-full overflow-y-auto">
            <h3 className="font-bold text-lg">경기 수정</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">날짜</label>
                <input type="date" className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500"
                  value={editMatch.date.split("T")[0]}
                  onChange={(e) => setEditMatch({ ...editMatch, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">장소</label>
                <input className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500"
                  value={editMatch.location ?? ""}
                  onChange={(e) => setEditMatch({ ...editMatch, location: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-green-400 mb-1 block">A팀 점수</label>
                <input type="number" min={0} className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500 text-xl font-bold text-center"
                  value={editMatch.teamAScore}
                  onChange={(e) => setEditMatch({ ...editMatch, teamAScore: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs text-blue-400 mb-1 block">B팀 점수</label>
                <input type="number" min={0} className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500 text-xl font-bold text-center"
                  value={editMatch.teamBScore}
                  onChange={(e) => setEditMatch({ ...editMatch, teamBScore: Number(e.target.value) })} />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                선수 팀 배정 — 클릭: 없음 → <span className="text-green-400">A팀</span> → <span className="text-blue-400">B팀</span> → 없음
              </label>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => {
                  const inA = editTeamA.includes(p.id);
                  const inB = editTeamB.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => cycleEditTeam(p.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${inA ? "bg-green-700 border-green-500 text-white" : inB ? "bg-blue-700 border-blue-500 text-white" : "bg-gray-700 border-gray-600 text-gray-400"}`}>
                      {p.name}{inA ? " A" : inB ? " B" : ""}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                A팀 {editTeamA.length}명 · B팀 {editTeamB.length}명
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">MVP</label>
              <select className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500"
                value={editMatch.mvp?.id ?? ""}
                onChange={(e) => setEditMatch({ ...editMatch, mvp: e.target.value ? { id: Number(e.target.value), name: "" } : null })}>
                <option value="">없음</option>
                {players.filter((p) => editTeamA.includes(p.id) || editTeamB.includes(p.id)).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving} className="bg-green-600 hover:bg-green-500 flex-1 py-2 rounded-lg font-medium disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
              <button onClick={() => setEditMatch(null)} className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg text-sm">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">경기 기록 ({matches.length}경기)</h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium">
            + 경기 추가
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="bg-gray-800 rounded-xl p-5 mb-4 space-y-4">
          <h3 className="font-medium text-gray-300">새 경기 기록</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">날짜</label>
              <input type="date" className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">장소</label>
              <input className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500" placeholder="예: 덕원고 운동장" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">팀 구성 — 클릭: 없음 → <span className="text-green-400">A팀</span> → <span className="text-blue-400">B팀</span> → 없음</label>
            {players.length === 0 ? (
              <p className="text-gray-500 text-sm">선수를 먼저 등록해주세요.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {players.map((p) => {
                  const inA = teamA.includes(p.id);
                  const inB = teamB.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => cycleTeam(p.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${inA ? "bg-green-700 border-green-500 text-white" : inB ? "bg-blue-700 border-blue-500 text-white" : "bg-gray-700 border-gray-600 text-gray-400"}`}>
                      {p.name}{inA ? " A" : inB ? " B" : ""}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">A팀 {teamA.length}명 · B팀 {teamB.length}명 · 총 {allInMatch.length}명 참가</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-green-400 mb-1 block">A팀 점수</label>
              <input type="number" min={0} className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500 text-xl font-bold text-center" value={teamAScore} onChange={(e) => setTeamAScore(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-blue-400 mb-1 block">B팀 점수</label>
              <input type="number" min={0} className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500 text-xl font-bold text-center" value={teamBScore} onChange={(e) => setTeamBScore(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">MVP</label>
            <select className="bg-gray-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-2 ring-green-500" value={mvpId} onChange={(e) => setMvpId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">없음</option>
              {players.filter((p) => allInMatch.includes(p.id)).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={addMatch} disabled={saving} className="bg-green-600 hover:bg-green-500 flex-1 py-2 rounded-lg font-medium disabled:opacity-50">
              {saving ? "저장 중..." : "경기 저장"}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg text-sm">취소</button>
          </div>
        </div>
      )}

      {matchesLoading ? (
        <div className="text-center py-20 text-gray-400">로딩 중...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><div className="text-5xl mb-3">🏆</div><p>경기 기록이 없습니다.</p></div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <div key={m.id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{new Date(m.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</span>
                    {m.location && <span className="text-gray-400 text-sm">· {m.location}</span>}
                  </div>
                  <div className="flex gap-3 text-sm text-gray-400 flex-wrap">
                    <span><span className="text-green-400">A</span> {m.players.filter((p) => p.team === "A").map((p) => p.player.name).join(", ") || "-"}</span>
                    <span><span className="text-blue-400">B</span> {m.players.filter((p) => p.team === "B").map((p) => p.player.name).join(", ") || "-"}</span>
                  </div>
                  {m.mvp && <div className="text-sm text-yellow-400 mt-1">🌟 MVP: {m.mvp.name}</div>}
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="text-2xl font-bold">{m.teamAScore} : {m.teamBScore}</div>
                  {resultLabel(m)}
                  {isAdmin && (
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => openEdit(m)} className="text-gray-500 hover:text-white text-xs">✏️ 수정</button>
                      <button onClick={() => deleteMatch(m.id)} className="text-gray-600 hover:text-red-400 text-xs">🗑️ 삭제</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── 벌금 탭 ───────── */
function FinesTab({ players, isAdmin }: { players: Player[]; isAdmin: boolean }) {
  const [fines, setFines] = useState<Fine[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playerId, setPlayerId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    fetch("/api/fines").then((r) => r.json()).then(setFines);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addFine = async () => {
    if (!playerId || !amount || !reason.trim() || saving) return;
    setSaving(true);
    await fetch("/api/fines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, amount: Number(amount), reason: reason.trim() }),
    });
    setShowForm(false); setPlayerId(""); setAmount(""); setReason("");
    load();
    setSaving(false);
  };

  const togglePaid = async (id: number, paid: boolean) => {
    await fetch("/api/fines", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, paid: !paid }) });
    load();
  };

  const deleteFine = async (id: number) => {
    if (!confirm("벌금 기록을 삭제할까요?")) return;
    await fetch(`/api/fines/${id}`, { method: "DELETE" });
    load();
  };

  const total = fines.reduce((s, f) => s + f.amount, 0);
  const unpaid = fines.filter((f) => !f.paid).reduce((s, f) => s + f.amount, 0);

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">벌금 관리</h2>
          <div className="flex gap-3 text-sm mt-1">
            <span className="text-gray-400">총 {total.toLocaleString()}원</span>
            <span className="text-green-400">납부 {(total - unpaid).toLocaleString()}원</span>
            <span className="text-red-400">미납 {unpaid.toLocaleString()}원</span>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium">+ 벌금 추가</button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="bg-gray-800 rounded-xl p-4 mb-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-400">벌금 기록 추가</h3>
          <div className="flex gap-3 flex-wrap">
            <select className="bg-gray-700 rounded-lg px-3 py-2 flex-1 min-w-36 outline-none focus:ring-2 ring-green-500" value={playerId} onChange={(e) => setPlayerId(Number(e.target.value))}>
              <option value="">선수 선택 *</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" min={0} className="bg-gray-700 rounded-lg px-3 py-2 w-36 outline-none focus:ring-2 ring-green-500" placeholder="금액 (원) *" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <input className="bg-gray-700 rounded-lg px-3 py-2 flex-1 min-w-40 outline-none focus:ring-2 ring-green-500" placeholder="사유 * (예: 지각, 노쇼)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={addFine} disabled={saving} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white px-3 py-2 text-sm">취소</button>
          </div>
        </div>
      )}

      {fines.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><div className="text-5xl mb-3">💸</div><p>벌금 기록이 없습니다.</p></div>
      ) : (
        <div className="space-y-2">
          {fines.map((f) => (
            <div key={f.id} className={`bg-gray-800 rounded-xl p-4 flex justify-between items-center gap-3 ${f.paid ? "opacity-60" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{f.player.name}</span>
                  <span className={`font-bold ${f.paid ? "text-gray-400 line-through" : "text-yellow-400"}`}>{f.amount.toLocaleString()}원</span>
                </div>
                <div className="text-sm text-gray-400 truncate">{f.reason} · {new Date(f.date).toLocaleDateString("ko-KR")}</div>
              </div>
              {isAdmin ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => togglePaid(f.id, f.paid)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${f.paid ? "bg-gray-700 text-gray-400 hover:bg-gray-600" : "bg-yellow-700 text-yellow-200 hover:bg-yellow-600"}`}>
                    {f.paid ? "납부완료" : "미납"}
                  </button>
                  <button onClick={() => deleteFine(f.id)} className="text-gray-600 hover:text-red-400 text-sm">🗑️</button>
                </div>
              ) : (
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${f.paid ? "bg-gray-700 text-gray-400" : "bg-yellow-900 text-yellow-300"}`}>
                  {f.paid ? "납부완료" : "미납"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── 부상 탭 ───────── */
function InjuriesTab({ players, isAdmin }: { players: Player[]; isAdmin: boolean }) {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playerId, setPlayerId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState("");

  const load = useCallback(() => {
    fetch("/api/injuries").then((r) => r.json()).then(setInjuries);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addInjury = async () => {
    if (!playerId || !description.trim() || saving) return;
    setSaving(true);
    await fetch("/api/injuries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, description: description.trim() }),
    });
    setShowForm(false); setPlayerId(""); setDescription("");
    load();
    setSaving(false);
  };

  const toggleRecovered = async (id: number, recovered: boolean) => {
    await fetch("/api/injuries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, recovered: !recovered }) });
    load();
  };

  const saveEdit = async (id: number) => {
    if (!editDesc.trim() || saving) return;
    setSaving(true);
    await fetch("/api/injuries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, description: editDesc.trim() }) });
    setEditId(null);
    load();
    setSaving(false);
  };

  const deleteInjury = async (id: number) => {
    if (!confirm("부상 기록을 삭제할까요?")) return;
    await fetch(`/api/injuries/${id}`, { method: "DELETE" });
    load();
  };

  const active = injuries.filter((i) => !i.recovered);
  const recovered = injuries.filter((i) => i.recovered);

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold">부상 관리</h2>
          {active.length > 0 && <p className="text-sm text-red-400 mt-1">부상 중 {active.length}명</p>}
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium">+ 부상 기록</button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="bg-gray-800 rounded-xl p-4 mb-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-400">부상 기록 추가</h3>
          <div className="flex gap-3 flex-wrap">
            <select className="bg-gray-700 rounded-lg px-3 py-2 flex-1 min-w-36 outline-none focus:ring-2 ring-green-500" value={playerId} onChange={(e) => setPlayerId(Number(e.target.value))}>
              <option value="">선수 선택 *</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="bg-gray-700 rounded-lg px-3 py-2 flex-1 min-w-48 outline-none focus:ring-2 ring-green-500" placeholder="부상 내용 * (예: 오른쪽 발목 염좌)" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={addInjury} disabled={saving} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white px-3 py-2 text-sm">취소</button>
          </div>
        </div>
      )}

      {injuries.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><div className="text-5xl mb-3">🩹</div><p>부상 기록이 없습니다.</p></div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-400 mb-2">부상 중</h3>
              <div className="space-y-2">
                {active.map((i) => (
                  <InjuryCard key={i.id} injury={i} isAdmin={isAdmin}
                    editId={editId} editDesc={editDesc} saving={saving}
                    onEdit={(id, desc) => { setEditId(id); setEditDesc(desc); }}
                    onSaveEdit={saveEdit} onCancelEdit={() => setEditId(null)}
                    onEditDescChange={setEditDesc}
                    onToggle={toggleRecovered} onDelete={deleteInjury} />
                ))}
              </div>
            </div>
          )}
          {recovered.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">회복 완료</h3>
              <div className="space-y-2">
                {recovered.map((i) => (
                  <InjuryCard key={i.id} injury={i} isAdmin={isAdmin}
                    editId={editId} editDesc={editDesc} saving={saving}
                    onEdit={(id, desc) => { setEditId(id); setEditDesc(desc); }}
                    onSaveEdit={saveEdit} onCancelEdit={() => setEditId(null)}
                    onEditDescChange={setEditDesc}
                    onToggle={toggleRecovered} onDelete={deleteInjury} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InjuryCard({ injury: i, isAdmin, editId, editDesc, saving, onEdit, onSaveEdit, onCancelEdit, onEditDescChange, onToggle, onDelete }: {
  injury: Injury; isAdmin: boolean; editId: number | null; editDesc: string; saving: boolean;
  onEdit: (id: number, desc: string) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onEditDescChange: (v: string) => void;
  onToggle: (id: number, recovered: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const isEditing = editId === i.id;

  return (
    <div className={`bg-gray-800 rounded-xl p-4 ${i.recovered ? "opacity-60" : ""}`}>
      {isEditing ? (
        <div className="flex gap-2 flex-wrap">
          <input className="bg-gray-700 rounded-lg px-3 py-2 flex-1 min-w-48 outline-none focus:ring-2 ring-green-500 text-sm" value={editDesc} onChange={(e) => onEditDescChange(e.target.value)} />
          <button onClick={() => onSaveEdit(i.id)} disabled={saving} className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
          <button onClick={onCancelEdit} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm">취소</button>
        </div>
      ) : (
        <div className="flex justify-between items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{i.player.name}</span>
              {!i.recovered && <span>🩹</span>}
            </div>
            <div className="text-sm text-gray-400 truncate">{i.description} · {new Date(i.date).toLocaleDateString("ko-KR")}</div>
          </div>
          {isAdmin ? (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => onToggle(i.id, i.recovered)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${i.recovered ? "bg-gray-700 text-gray-400 hover:bg-gray-600" : "bg-red-800 text-red-200 hover:bg-red-700"}`}>
                {i.recovered ? "회복완료" : "부상 중"}
              </button>
              <button onClick={() => onEdit(i.id, i.description)} className="text-gray-500 hover:text-white text-sm">✏️</button>
              <button onClick={() => onDelete(i.id)} className="text-gray-600 hover:text-red-400 text-sm">🗑️</button>
            </div>
          ) : (
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${i.recovered ? "bg-gray-700 text-gray-400" : "bg-red-900 text-red-300"}`}>
              {i.recovered ? "회복완료" : "부상 중"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
