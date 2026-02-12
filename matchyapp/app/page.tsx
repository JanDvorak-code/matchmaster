"use client";

import React, { useState, useMemo } from "react";

// Pokud máš v projektu lucide-react, můžeš tento import odkomentovat
// a nahradit emoji v UI ikonami.
// import { Users, Sparkles, RefreshCw, Crown } from "lucide-react";

type User = {
  id: number;
  name: string;
  items: string[];
};

type MatchResult = {
  value: string; // normalizovaná hodnota
  original: string; // první původní text
  count: number;
};

const MIN_USERS = 2;
const MAX_USERS = 5;
const MIN_ITEMS = 5;
const MAX_ITEMS = 20;

type Phase = "setup" | "input" | "summary";

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export default function MatchMasterPage() {
  const [userCount, setUserCount] = useState<number>(3);
  const [itemCount, setItemCount] = useState<number>(10);
  const [phase, setPhase] = useState<Phase>("setup");
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [hasMatched, setHasMatched] = useState(false);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  const totalUsers = useMemo(() => users.length || userCount, [users, userCount]);

  const handleStart = () => {
    const clampedUsers = Math.min(Math.max(userCount, MIN_USERS), MAX_USERS);
    const clampedItems = Math.min(Math.max(itemCount, MIN_ITEMS), MAX_ITEMS);

    const initialUsers: User[] = Array.from({ length: clampedUsers }, (_, i) => ({
      id: i,
      name: `Osoba ${i + 1}`,
      items: Array.from({ length: clampedItems }, () => ""),
    }));

    setUserCount(clampedUsers);
    setItemCount(clampedItems);
    setUsers(initialUsers);
    setResults([]);
    setHasMatched(false);
    setCurrentUserIndex(0);
    setPhase("input");
  };

  const handleReset = () => {
    setPhase("setup");
    setUsers([]);
    setResults([]);
    setHasMatched(false);
    setCurrentUserIndex(0);
    setUserCount(3);
    setItemCount(10);
  };

  const handleUserNameChange = (id: number, name: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, name } : u))
    );
  };

  const handleItemChange = (userId: number, index: number, value: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newItems = [...u.items];
        newItems[index] = value;
        return { ...u, items: newItems };
      })
    );
  };

  const handleMatch = () => {
    const frequency = new Map<
      string,
      {
        count: number;
        original: string;
      }
    >();

    users.forEach((user) => {
      const seenForUser = new Set<string>();
      user.items.forEach((raw) => {
        const normalized = normalizeText(raw);
        if (!normalized) return;
        if (seenForUser.has(normalized)) return; // stejná položka u jednoho člověka se počítá jen jednou
        seenForUser.add(normalized);
        const existing = frequency.get(normalized);
        if (existing) {
          frequency.set(normalized, {
            ...existing,
            count: existing.count + 1,
          });
        } else {
          frequency.set(normalized, {
            count: 1,
            original: raw.trim(),
          });
        }
      });
    });

    const resultArray: MatchResult[] = Array.from(frequency.entries())
      .map(([value, data]) => ({
        value,
        original: data.original || value,
        count: data.count,
      }))
      .sort((a, b) => {
        // primárně podle počtu (desc), sekundárně abecedně
        if (b.count !== a.count) return b.count - a.count;
        return a.value.localeCompare(b.value);
      });

    setResults(resultArray);
    setHasMatched(true);
  };

  const getBadgeClasses = (count: number): string => {
    if (count === totalUsers) {
      return "text-sky-900 bg-sky-100 border border-sky-300";
    }
    if (count >= 2) {
      return "text-blue-900 bg-blue-100 border border-blue-300";
    }
    return "text-slate-900 bg-slate-200 border border-slate-400";
  };

  const getBadgeLabel = (count: number): string => {
    if (count === totalUsers) return "Všichni 🎯";
    if (count >= 2) return "Shoda ✨";
    return "Unikát 🧩";
  };

  const disableMatch = users.length === 0;

  const currentUser = phase === "input" ? users[currentUserIndex] : null;

  const handleConfirmAndNext = () => {
    if (!currentUser) return;
    if (currentUserIndex < userCount - 1) {
      setCurrentUserIndex((prev) => prev + 1);
    } else {
      setPhase("summary");
    }
  };

  return (
    <main className="min-h-screen bg-sky-50 text-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-sky-200 text-xs font-medium text-slate-700 mb-3">
            <span role="img" aria-label="sparkles">
              ✨
            </span>
            Matchovací nástroj pro skupiny
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 mb-2">
            MatchMaster
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Zadejte položky pro každého člověka a zjistěte, co máte společné,
            co sdílí jen někteří a co je úplně unikátní.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
          {/* Left side – setup + users */}
          <section className="space-y-6">
            {/* Setup panel */}
            <div className="rounded-2xl border border-sky-200 bg-white backdrop-blur-sm p-5 sm:p-6 shadow-lg shadow-sky-100">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                  <span role="img" aria-label="users">
                    👥
                  </span>
                  Nastavení
                </h2>
                <span className="text-xs text-slate-500">
                  {phase !== "setup"
                    ? `Lidé: ${userCount}, položek na osobu: ${itemCount}`
                    : "Nejprve zvolte parametry"}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">
                    Počet lidí
                    <span className="ml-1 text-slate-500">
                      ({MIN_USERS}-{MAX_USERS})
                    </span>
                  </label>
                  <input
                    type="number"
                    min={MIN_USERS}
                    max={MAX_USERS}
                    value={userCount}
                    disabled={phase !== "setup"}
                    onChange={(e) =>
                      setUserCount(
                        Number.isNaN(parseInt(e.target.value, 10))
                          ? MIN_USERS
                          : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">
                    Položek na osobu
                    <span className="ml-1 text-slate-500">
                      ({MIN_ITEMS}-{MAX_ITEMS})
                    </span>
                  </label>
                  <input
                    type="number"
                    min={MIN_ITEMS}
                    max={MAX_ITEMS}
                    value={itemCount}
                    disabled={phase !== "setup"}
                    onChange={(e) =>
                      setItemCount(
                        Number.isNaN(parseInt(e.target.value, 10))
                          ? MIN_ITEMS
                          : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 justify-between">
                <button
                  type="button"
                  onClick={handleStart}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-400/40 hover:bg-sky-500 active:bg-sky-700 transition"
                >
                  <span role="img" aria-label="start">
                    🚀
                  </span>
                  Start
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition"
                >
                  <span role="img" aria-label="reset">
                    🔄
                  </span>
                  Resetovat
                </button>
              </div>
            </div>

            {/* Users inputs – diskrétní režim */}
            {phase === "input" && currentUser && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <h2 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      <span role="img" aria-label="people">
                        🧑‍🤝‍🧑
                      </span>
                      Na řadě: {currentUser.name || `Uživatel ${currentUser.id + 1}`}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Vyplň své položky. Po potvrzení už je ostatní neuvidí.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-sky-700 rounded-full bg-sky-100 px-3 py-1 border border-sky-200">
                    Hráč {currentUserIndex + 1} z {userCount}
                  </span>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-md shadow-sky-100">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={currentUser.name}
                      onChange={(e) =>
                        handleUserNameChange(currentUser.id, e.target.value)
                      }
                      className="w-full rounded-md border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                    />
                    <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                      #{currentUser.id + 1}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {currentUser.items.map((item, index) => (
                      <input
                        key={index}
                        type="text"
                        value={item}
                        placeholder={`Položka ${index + 1}`}
                        onChange={(e) =>
                          handleItemChange(currentUser.id, index, e.target.value)
                        }
                        className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmAndNext}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold shadow-md bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700 shadow-sky-300/70 transition"
                  >
                    <span role="img" aria-label="next">
                      ✅
                    </span>
                    {currentUserIndex < userCount - 1
                      ? "Potvrdit a předat dalšímu"
                      : "Potvrdit posledního hráče"}
                  </button>
                </div>
              </div>
            )}

            {phase === "summary" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <h2 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      <span role="img" aria-label="summary">
                        🎉
                      </span>
                      Všichni hotovo
                    </h2>
                    <p className="text-xs text-slate-500">
                      Všichni hráči vyplnili své položky. Připraveni na velké
                      finále?
                    </p>
                  </div>
                  <span className="text-xs font-medium text-sky-700 rounded-full bg-sky-100 px-3 py-1 border border-sky-200">
                    {userCount} hráčů · {itemCount} položek / osobu
                  </span>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleMatch}
                    disabled={disableMatch}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-semibold shadow-lg transition ${
                      disableMatch
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 active:bg-emerald-600 shadow-emerald-300/80"
                    }`}
                  >
                    <span role="img" aria-label="match">
                      💘
                    </span>
                    Zobrazit společné výsledky
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Right side – results */}
          <section className="rounded-2xl border border-sky-200 bg-white backdrop-blur-sm p-5 sm:p-6 shadow-lg shadow-sky-100 min-h-[260px] flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                  <span role="img" aria-label="results">
                    📊
                  </span>
                  Výsledky
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Zobrazení všech unikátních položek a toho, kolik lidí je
                  zadalo.
                </p>
              </div>
              {hasMatched && (
                <span className="text-[11px] px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  {results.length} unikátních položek
                </span>
              )}
            </div>

            {!hasMatched && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl py-10 px-4">
                <div className="mb-3 text-3xl" aria-hidden="true">
                  🧠
                </div>
                <p className="font-medium text-slate-800 mb-1">
                  Výsledky se zobrazí až na konci
                </p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Až každý hráč vyplní své položky a kliknete na{" "}
                  <span className="font-semibold text-emerald-500">
                    Zobrazit společné výsledky
                  </span>
                  , objeví se tady velké finále.
                </p>
              </div>
            )}

            {hasMatched && results.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl py-10 px-4">
                <div className="mb-3 text-3xl" aria-hidden="true">
                  🤷‍♂️
                </div>
                <p className="font-medium text-slate-800 mb-1">
                  Žádné platné položky
                </p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Vypadá to, že v polích nejsou žádné nenulové hodnoty po
                  normalizaci. Zkuste doplnit data a znovu kliknout na MATCH.
                </p>
              </div>
            )}

            {hasMatched && results.length > 0 && (
              <div className="flex-1 space-y-3 overflow-y-auto pr-1 mt-1 custom-scrollbar">
                {results.map((item) => {
                  const badgeClasses = getBadgeClasses(item.count);
                  const label = getBadgeLabel(item.count);

                  return (
                    <div
                      key={item.value}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm transition hover:border-sky-300 hover:bg-sky-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeClasses}`}
                        >
                          {item.count === totalUsers ? "👑" : null}
                          <span className={item.count === totalUsers ? "ml-1" : ""}>
                            {label}
                          </span>
                        </div>
                        <span className="truncate text-slate-900">
                          {item.original}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-500 shrink-0">
                        {item.count}/{totalUsers}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Custom scrollbar styling via tailwind-compatible classes */}
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(148 163 184) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(59, 130, 246, 0.6);
          border-radius: 999px;
        }
      `}</style>
    </main>
  );
}

