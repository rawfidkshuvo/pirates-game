import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  increment,
} from "firebase/firestore";
import {
  Anchor,
  Skull,
  Sword,
  Shield,
  Eye,
  Utensils,
  Bomb,
  Coins,
  Ship,
  Ghost,
  Crown,
  Info,
  LogOut,
  X,
  Trophy,
  RotateCcw,
  User,
  CheckCircle,
  Settings,
  AlertTriangle,
  Footprints,
  BookOpen,
  Compass,
  Trash2,
} from "lucide-react";

// --- Firebase Config & Init ---
const firebaseConfig = {
  apiKey: "AIzaSyDf86JHBvY9Y1B1x8QDbJkASmlANouEvX0",
  authDomain: "card-games-28729.firebaseapp.com",
  projectId: "card-games-28729",
  storageBucket: "card-games-28729.firebasestorage.app",
  messagingSenderId: "466779458834",
  appId: "1:466779458834:web:c5e264df6d9f0bd56d37cb",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = "pirates-game-v1";

// --- Game Constants ---
const CARDS = {
  THIEF: {
    name: "Thief",
    val: 0,
    defaultCount: 2,
    icon: Footprints,
    color: "text-gray-400",
    bg: "bg-gray-800",
    desc: "Gain 1 coin if you survive a round.",
  },
  GUARD: {
    name: "Guard",
    val: 1,
    defaultCount: 6,
    icon: Shield,
    color: "text-blue-400",
    bg: "bg-blue-900",
    desc: "Guess a player's card. If right, they die.",
  },
  SPY: {
    name: "Spy",
    val: 2,
    defaultCount: 2,
    icon: Eye,
    color: "text-emerald-400",
    bg: "bg-emerald-900",
    desc: "Look at another player's hand.",
  },
  SWORDSMAN: {
    name: "Swordsman",
    val: 3,
    defaultCount: 2,
    icon: Sword,
    color: "text-red-400",
    bg: "bg-red-900",
    desc: "Fight another player. Lower card dies.",
  },
  COOK: {
    name: "Cook",
    val: 4,
    defaultCount: 2,
    icon: Utensils,
    color: "text-orange-400",
    bg: "bg-orange-900",
    desc: "Immune to effects until your next turn.",
  },
  CANNONEER: {
    name: "Cannoneer",
    val: 5,
    defaultCount: 2,
    icon: Bomb,
    color: "text-red-600",
    bg: "bg-red-950",
    desc: "Force discard & redraw. Kills Pirates.",
  },
  MERCHANT: {
    name: "Merchant",
    val: 6,
    defaultCount: 2,
    icon: Coins,
    color: "text-yellow-400",
    bg: "bg-yellow-900",
    desc: "Draw 2 extra, keep best of 3.",
  },
  SAILOR: {
    name: "Sailor",
    val: 7,
    defaultCount: 1,
    icon: Anchor,
    color: "text-cyan-400",
    bg: "bg-cyan-900",
    desc: "Swap hands with another player.",
  },
  CAPTAIN: {
    name: "Captain",
    val: 8,
    defaultCount: 1,
    icon: Crown,
    color: "text-purple-400",
    bg: "bg-purple-900",
    desc: "Must play if holding Cannoneer/Sailor.",
  },
  PIRATE: {
    name: "Pirate",
    val: 9,
    defaultCount: 1,
    icon: Skull,
    color: "text-white",
    bg: "bg-black",
    desc: "If played, you die. (Suicide).",
  },
};

// --- Helper Functions ---
const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

// --- Sub-Components ---

const FloatingBackground = () => {
  const items = [
    { Icon: Skull, left: "10%", delay: "0s", duration: "15s" },
    { Icon: Anchor, left: "30%", delay: "5s", duration: "18s" },
    { Icon: Footprints, left: "70%", delay: "2s", duration: "20s" },
    { Icon: Sword, left: "50%", delay: "8s", duration: "12s" },
    { Icon: Bomb, left: "85%", delay: "1s", duration: "16s" },
    { Icon: Coins, left: "20%", delay: "10s", duration: "14s" },
    { Icon: Ship, left: "60%", delay: "12s", duration: "25s" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>
        {`
          @keyframes floatUp {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            10% { opacity: 0.4; } 
            90% { opacity: 0.4; }
            100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
          }
        `}
      </style>
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute text-white/30 opacity-40"
          style={{
            left: item.left,
            bottom: "-10%",
            animation: `floatUp ${item.duration} linear infinite`,
            animationDelay: item.delay,
          }}
        >
          <item.Icon size={80} />
        </div>
      ))}
    </div>
  );
};

// Replaces simple alerts with a nice UI
const InfoModal = ({ title, text, onClose, type = "info" }) => (
  <div className="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 border-2 border-gray-600 rounded-xl p-6 w-full max-w-sm shadow-2xl relative">
      <div className="flex flex-col items-center text-center gap-4">
        {type === "error" ? (
          <AlertTriangle className="text-red-500 w-12 h-12" />
        ) : type === "spy" ? (
          <Eye className="text-emerald-400 w-12 h-12" />
        ) : (
          <Info className="text-blue-400 w-12 h-12" />
        )}

        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-gray-300 text-lg">{text}</p>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
            type === "error"
              ? "bg-red-600 hover:bg-red-500"
              : type === "spy"
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          Okay
        </button>
      </div>
    </div>
  </div>
);

const GameGuideModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-0 md:p-4">
    <div className="bg-gray-900 md:rounded-2xl w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border-none md:border border-gray-700 shadow-2xl flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <div className="flex flex-col">
          <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 uppercase tracking-widest">
            GAME GUIDE
          </h2>
          <span className="text-gray-400 text-xs md:text-sm font-medium tracking-wide">
            Deception, Deduction & Discovery
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-10 text-gray-300 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {/* Section 1: Objective */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 md:p-6 rounded-2xl border border-blue-700/30">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3 flex items-center gap-3">
            <Trophy className="text-yellow-400 fill-current" size={24} /> The
            Objective
          </h3>
          <p className="text-sm md:text-lg leading-relaxed">
            The high seas are treacherous. Your goal is simple:{" "}
            <strong>survive</strong>. The game is played in multiple rounds. To
            win a round, you must be the <strong>Last Player Standing</strong>{" "}
            or hold the <strong>Highest Value Card</strong> when the deck runs
            out.
            <br />
            <br />
            Survivors earn{" "}
            <span className="text-yellow-400 font-bold">1 Coin</span>. The first
            pirate to amass{" "}
            <span className="text-yellow-400 font-bold">10 Coins</span> wins the
            game and the treasure!
          </p>
        </div>

        {/* Section 2: The Crew (Cards) */}
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <User className="text-purple-400" size={24} /> The Crew (Cards)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
            {Object.values(CARDS)
              .sort((a, b) => a.val - b.val)
              .map((card) => (
                <div
                  key={card.name}
                  className="flex items-start gap-3 md:gap-4 bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors"
                >
                  <div
                    className={`p-3 md:p-4 rounded-xl ${card.bg} border border-gray-600 shadow-lg shrink-0`}
                  >
                    <card.icon className={`${card.color}`} size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center w-full mb-1">
                      <h4 className="font-bold text-white text-base md:text-lg">
                        {card.name}
                      </h4>
                      <span className="text-xs bg-black/60 px-2 py-1 rounded text-gray-300 font-mono border border-gray-600">
                        Val: {card.val}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-400 leading-snug">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Section 3: How It Works */}
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Compass className="text-green-400" size={24} /> How It Works
          </h3>
          <div className="space-y-6 relative pl-4 border-l-2 border-gray-700 ml-4">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-[25px] top-0 bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-gray-600 shadow-lg">
                1
              </div>
              <div className="pl-6">
                <h4 className="text-lg font-bold text-white mb-1">The Draw</h4>
                <p className="text-gray-400 text-sm md:text-base">
                  You start the round with <strong>1 card</strong> in hand. At
                  the start of your turn, you draw a{" "}
                  <strong>second card</strong> from the deck.
                </p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-[25px] top-0 bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-gray-600 shadow-lg">
                2
              </div>
              <div className="pl-6">
                <h4 className="text-lg font-bold text-white mb-1">The Play</h4>
                <p className="text-gray-400 text-sm md:text-base">
                  Choose one of your two cards to play face up. Its ability
                  triggers immediately. The other card remains hidden in your
                  hand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6 bg-gray-800 border-t border-gray-700 text-center sticky bottom-0">
        <button
          onClick={onClose}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-10 py-3 md:py-4 rounded-xl font-bold text-lg transition-all shadow-xl"
        >
          Got it, Let's Play!
        </button>
      </div>
    </div>
  </div>
);

const CardDisplay = ({ type, onClick, disabled, highlight, small, tiny }) => {
  const card = CARDS[type];
  if (!card)
    return (
      <div className="w-16 h-24 md:w-20 md:h-28 bg-gray-700 rounded border border-gray-600"></div>
    );

  if (tiny) {
    return (
      <div
        className={`w-5 h-7 md:w-6 md:h-8 rounded border flex items-center justify-center ${card.bg} border-gray-600 shadow-sm`}
        title={card.name}
      >
        <card.icon className={`${card.color} w-3 h-3`} />
      </div>
    );
  }

  // Responsive classes for Card
  const sizeClasses = small
    ? "w-12 h-16 md:w-16 md:h-24 p-0.5 md:p-1"
    : "w-24 h-36 md:w-32 md:h-48 p-2 md:p-3";

  const iconSize = small
    ? "w-5 h-5 md:w-6 md:h-6"
    : "w-10 h-10 md:w-12 md:h-12";
  const textSize = small ? "text-[8px] md:text-[10px]" : "text-xs md:text-sm";
  const descSize = "text-[9px] md:text-[10px]";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-xl border-2 shadow-lg transition-all flex flex-col items-center justify-between
        ${sizeClasses}
        ${
          highlight
            ? "ring-4 ring-yellow-400 scale-105 z-10"
            : "border-gray-700"
        }
        ${card.bg} ${
        disabled
          ? "opacity-50 cursor-not-allowed grayscale"
          : "hover:scale-105 cursor-pointer"
      }
      `}
    >
      <div
        className={`font-bold ${textSize} ${
          card.type === "PIRATE" ? "text-white" : "text-white"
        } w-full flex justify-between`}
      >
        <span>{card.val}</span>
        {!small && <span>{card.name}</span>}
      </div>

      <card.icon className={`${card.color} ${iconSize}`} />

      {!small && (
        <div
          className={`${descSize} text-gray-300 text-center leading-tight bg-black/30 p-1 rounded w-full line-clamp-3 md:line-clamp-none`}
        >
          {card.desc}
        </div>
      )}
    </button>
  );
};

const LogViewer = ({ logs, onClose }) => (
  <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-0 md:p-4">
    <div className="bg-gray-800 w-full md:max-w-md h-full md:h-[70vh] rounded-none md:rounded-xl flex flex-col border-none md:border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <h3 className="text-white font-bold text-lg">Game Log</h3>
        <button onClick={onClose} className="p-2 bg-gray-700 rounded-full">
          <X className="text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[...logs].reverse().map((log, i) => (
          <div
            key={i}
            className={`text-xs md:text-sm p-3 rounded border-l-2 ${
              log.type === "danger"
                ? "bg-red-900/20 border-red-500 text-red-200"
                : log.type === "success"
                ? "bg-green-900/20 border-green-500 text-green-200"
                : "bg-gray-700/50 border-gray-500 text-gray-300"
            }`}
          >
            {log.text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function PiratesGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  // UI States
  const [showLogs, setShowLogs] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedGuess, setSelectedGuess] = useState("");
  const [guardModalTarget, setGuardModalTarget] = useState(null);
  const [guardPendingGuess, setGuardPendingGuess] = useState(null); // Added for new Guard confirm flow

  // Popup State
  const [infoModal, setInfoModal] = useState(null); // { title, text, type }

  // --- Auth & Listener ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          // Check if I was kicked or if the room is valid
          const isInRoom = data.players.some((p) => p.id === user.uid);
          if (!isInRoom) {
            setRoomId("");
            setView("menu");
            setError("You have left the room or were kicked.");
            return;
          }

          setGameState(data);
          if (data.status === "playing") {
            setView("game");
          } else if (data.status === "lobby") {
            setView("lobby");
          }
        } else {
          setRoomId("");
          setView("menu");
          setError("Room closed or does not exist.");
        }
      }
    );
    return () => unsub();
  }, [roomId, user]);

  // --- Helper to show modal instead of alert ---
  const showAlert = (title, text, type = "error") => {
    setInfoModal({ title, text, type });
  };

  // --- Actions ---
  const createRoom = async () => {
    if (!playerName) return setError("Name required");
    setLoading(true);
    const newId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const initialData = {
      roomId: newId,
      hostId: user.uid,
      status: "lobby",
      players: [
        {
          id: user.uid,
          name: playerName,
          coins: 0,
          hand: [],
          playedCards: [],
          eliminated: false,
          immune: false,
          readyForNext: false,
        },
      ],
      deck: [],
      deckConfig: { guards: 6, merchants: 2 }, // Default config
      discardPile: [],
      logs: [],
      turnIndex: 0,
      roundCount: 1,
      burntCard: null,
      thiefActive: null,
      pendingAction: null,
    };
    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      initialData
    );
    setRoomId(newId);
    setRoomCodeInput(newId);
    setView("lobby");
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName)
      return setError("Room ID and Name required");
    setLoading(true);
    const ref = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomCodeInput
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      setError("Room not found");
      setLoading(false);
      return;
    }

    const data = snap.data();
    if (data.status !== "lobby") {
      setError("Game already started");
      setLoading(false);
      return;
    }

    if (data.players.find((p) => p.id === user.uid)) {
      setRoomId(roomCodeInput);
    } else if (data.players.length < 8) {
      // Max 8 players
      const newPlayers = [
        ...data.players,
        {
          id: user.uid,
          name: playerName,
          coins: 0,
          hand: [],
          playedCards: [],
          eliminated: false,
          immune: false,
          readyForNext: false,
        },
      ];
      await updateDoc(ref, { players: newPlayers });
      setRoomId(roomCodeInput);
    } else {
      setError("Room full (Max 8)");
    }
    setLoading(false);
  };

  const leaveRoom = async () => {
    if (!roomId || !user) return;
    try {
      const roomRef = doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "rooms",
        roomId
      );
      const snap = await getDoc(roomRef);

      if (snap.exists()) {
        const data = snap.data();
        const newPlayers = data.players.filter((p) => p.id !== user.uid);

        if (newPlayers.length === 0) {
          // Last player left, delete room
          await deleteDoc(roomRef);
        } else {
          // If host left, pass host to first remaining player
          let newHostId = data.hostId;
          if (data.hostId === user.uid) {
            newHostId = newPlayers[0].id;
          }

          await updateDoc(roomRef, {
            players: newPlayers,
            hostId: newHostId,
          });
        }
      }
    } catch (e) {
      console.error("Error leaving room:", e);
    }
    setRoomId("");
    setView("menu");
    setGameState(null);
  };

  const kickPlayer = async (targetId) => {
    if (!gameState || gameState.hostId !== user.uid) return;
    const newPlayers = gameState.players.filter((p) => p.id !== targetId);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: newPlayers,
      }
    );
  };

  const updateDeckConfig = async (newGuards, newMerchants) => {
    if (gameState.hostId !== user.uid) return;
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        deckConfig: { guards: newGuards, merchants: newMerchants },
      }
    );
  };

  const startRound = async (existingState = null) => {
    const state = existingState || gameState;
    const playerCount = state.players.length;

    let config = state.deckConfig || { guards: 6, merchants: 2 };
    if (playerCount > 4) {
      config = { guards: 6, merchants: 2 };
    }

    // Generate Deck based on Config
    const deck = [];
    Object.keys(CARDS).forEach((key) => {
      let count = CARDS[key].defaultCount;
      if (key === "GUARD") count = config.guards ?? 6;
      if (key === "MERCHANT") count = config.merchants ?? 2;

      for (let i = 0; i < count; i++) deck.push(key);
    });

    const shuffledDeck = shuffle(deck);
    const burntCard = shuffledDeck.pop();

    const players = state.players.map((p) => ({
      ...p,
      hand: [shuffledDeck.pop()],
      playedCards: [],
      eliminated: false,
      immune: false,
      readyForNext: false, // Reset ready state
    }));

    const startIdx = Math.floor(Math.random() * players.length);
    players[startIdx].hand.push(shuffledDeck.pop());

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        deck: shuffledDeck,
        burntCard,
        players,
        discardPile: [],
        turnIndex: startIdx,
        thiefActive: null,
        logs: arrayUnion({
          text: `--- Round ${state.roundCount} Started ---`,
          type: "neutral",
        }),
      }
    );
  };

  const setPlayerReady = async () => {
    const players = [...gameState.players];
    const myIdx = players.findIndex((p) => p.id === user.uid);
    players[myIdx].readyForNext = true;
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players }
    );
  };

  const resetToLobby = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;

    const players = gameState.players.map((p) => ({
      ...p,
      hand: [],
      playedCards: [],
      coins: 0,
      eliminated: false,
      immune: false,
      readyForNext: false,
    }));

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players,
        deck: [],
        logs: [],
        roundCount: 1,
        winnerId: null,
      }
    );
  };

  const nextTurn = async (currentState, logs = []) => {
    let players = [...currentState.players];
    let deck = [...currentState.deck];
    let turnIndex = currentState.turnIndex;
    let thiefActive = currentState.thiefActive;

    const activePlayers = players.filter((p) => !p.eliminated);

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.coins += 1;
      logs.push({
        text: `Round Over! ${winner.name} is the last survivor (+1 Coin).`,
        type: "success",
      });

      if (winner.coins >= 10) {
        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            players,
            logs: arrayUnion(...logs),
            status: "finished",
            winnerId: winner.id,
          }
        );
        return;
      }

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          logs: arrayUnion(...logs),
          roundCount: increment(1),
        }
      );
      setTimeout(
        () =>
          startRound({
            ...currentState,
            players,
            roundCount: currentState.roundCount + 1,
          }),
        2500
      );
      return;
    }

    if (deck.length === 0 && players[turnIndex].hand.length === 1) {
      let maxVal = -1;
      let winners = [];
      activePlayers.forEach((p) => {
        const val = CARDS[p.hand[0]].val;
        if (val > maxVal) {
          maxVal = val;
          winners = [p];
        } else if (val === maxVal) {
          winners.push(p);
        }
      });

      winners.forEach((w) => {
        const idx = players.findIndex((p) => p.id === w.id);
        players[idx].coins += 1;
      });

      logs.push({
        text: `Deck Empty! Winners: ${winners
          .map((w) => w.name)
          .join(", ")} (Card Value: ${maxVal}).`,
        type: "success",
      });

      if (players.some((p) => p.coins >= 10)) {
        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            players,
            logs: arrayUnion(...logs),
            status: "finished",
            winnerId: players.find((p) => p.coins >= 10).id,
          }
        );
        return;
      }

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          logs: arrayUnion(...logs),
          roundCount: increment(1),
        }
      );
      setTimeout(
        () =>
          startRound({
            ...currentState,
            players,
            roundCount: currentState.roundCount + 1,
          }),
        2500
      );
      return;
    }

    let nextIdx = (turnIndex + 1) % players.length;
    while (players[nextIdx].eliminated) {
      nextIdx = (nextIdx + 1) % players.length;
    }

    if (thiefActive && thiefActive.playerId === players[nextIdx].id) {
      players[nextIdx].coins += 1;
      logs.push({
        text: `${players[nextIdx].name} survived the round as Thief (+1 Coin)!`,
        type: "success",
      });
      thiefActive = null;
    }

    players[nextIdx].immune = false;

    if (deck.length > 0) {
      players[nextIdx].hand.push(deck.pop());
    } else {
      players[nextIdx].hand.push(currentState.burntCard);
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
        deck,
        turnIndex: nextIdx,
        thiefActive,
        logs: arrayUnion(...logs),
      }
    );
  };

  const handleOpponentClick = (targetId) => {
    if (!selectedCard) return;
    if (targetId === user.uid) {
      showAlert("Targeting Error", "You cannot target yourself!", "error");
      return;
    }

    // Guard play triggers modal
    if (selectedCard === "GUARD") {
      setGuardModalTarget(targetId);
      setGuardPendingGuess(null); // Reset pending guess
      return;
    }

    handlePlayCard(selectedCard, targetId);
  };

  const handlePlayCard = async (
    cardType,
    explicitTargetId = null,
    explicitGuess = null
  ) => {
    if (!user || gameState.players[gameState.turnIndex].id !== user.uid) return;

    const needsTarget = ["GUARD", "SPY", "SWORDSMAN", "CANNONEER", "SAILOR"];
    const needsGuess = cardType === "GUARD";
    const finalGuess = explicitGuess || selectedGuess;

    if (needsTarget.includes(cardType) && !explicitTargetId) {
      setSelectedCard(cardType);
      return;
    }

    if (needsGuess && !finalGuess) {
      setSelectedCard(cardType);
      return;
    }

    const players = JSON.parse(JSON.stringify(gameState.players));
    const myIdx = players.findIndex((p) => p.id === user.uid);
    const me = players[myIdx];
    let deck = [...gameState.deck];
    let logs = [];
    let thiefActive = gameState.thiefActive;

    const hand = me.hand;
    const hasCaptain = hand.includes("CAPTAIN");
    const hasCannoneerOrSailor =
      hand.includes("CANNONEER") || hand.includes("SAILOR");

    if (hasCaptain && hasCannoneerOrSailor && cardType !== "CAPTAIN") {
      showAlert(
        "Captain's Orders",
        "You MUST play the Captain if you hold a Cannoneer or Sailor!",
        "error"
      );
      return;
    }

    const cardIdx = me.hand.indexOf(cardType);
    if (cardIdx === -1) return;
    me.hand.splice(cardIdx, 1);

    if (!me.playedCards) me.playedCards = [];
    me.playedCards.push(cardType);

    const eliminate = (pid, reason) => {
      const idx = players.findIndex((p) => p.id === pid);
      players[idx].eliminated = true;
      if (players[idx].hand.length > 0) {
        if (!players[idx].playedCards) players[idx].playedCards = [];
        players[idx].playedCards.push(players[idx].hand[0]);
      }
      players[idx].hand = [];
      logs.push({
        text: `💀 ${players[idx].name} was eliminated! (${reason})`,
        type: "danger",
      });
      if (thiefActive && thiefActive.playerId === pid) thiefActive = null;
    };

    if (cardType === "THIEF") {
      logs.push({
        text: `${me.name} plays Thief. (Gain coin if survived until next turn)`,
        type: "neutral",
      });
      if (thiefActive) {
        logs.push({ text: `🚫 Previous Thief thwarted!`, type: "neutral" });
      }
      thiefActive = { playerId: user.uid, turnSet: gameState.turnIndex };
    } else if (cardType === "GUARD") {
      const target = players.find((p) => p.id === explicitTargetId);
      logs.push({
        text: `${me.name} plays Guard on ${target.name}, guessing ${CARDS[finalGuess].name}.`,
        type: "neutral",
      });
      if (!target.immune) {
        const targetCard = target.hand[0];
        if (targetCard === finalGuess) {
          eliminate(explicitTargetId, "Guard Correct Guess");
        } else {
          logs.push({
            text: `❌ Guard guess wrong. ${target.name} is safe.`,
            type: "neutral",
          });
        }
      } else {
        logs.push({
          text: `🛡️ ${target.name} is immune to the Guard!`,
          type: "warning",
        });
      }
    } else if (cardType === "SPY") {
      const target = players.find((p) => p.id === explicitTargetId);
      if (!target.immune) {
        logs.push({
          text: `${me.name} plays Spy and looks at ${target.name}'s hand.`,
          type: "neutral",
        });
        // REPLACED ALERT WITH MODAL
        showAlert(
          "Spy Report",
          `${target.name} is holding: ${CARDS[target.hand[0]].name}`,
          "spy"
        );
      } else {
        logs.push({
          text: `${me.name} tried to Spy, but ${target.name} is immune!`,
          type: "warning",
        });
      }
    } else if (cardType === "SWORDSMAN") {
      const target = players.find((p) => p.id === explicitTargetId);
      if (!target.immune) {
        const myVal = CARDS[players[myIdx].hand[0]].val;
        const targetVal = CARDS[target.hand[0]].val;
        logs.push({
          text: `${me.name} challenges ${target.name} to a Sword Fight!`,
          type: "neutral",
        });
        if (myVal < targetVal)
          eliminate(user.uid, "Lost Sword Fight (Lower Card)");
        else if (targetVal < myVal)
          eliminate(explicitTargetId, "Lost Sword Fight (Lower Card)");
        else
          logs.push({
            text: `⚔️ Sword Fight Tie! Both survive.`,
            type: "neutral",
          });
      } else {
        logs.push({
          text: `🛡️ ${target.name} is immune to Sword Fight!`,
          type: "warning",
        });
      }
    } else if (cardType === "COOK") {
      players[myIdx].immune = true;
      logs.push({
        text: `🍳 ${me.name} plays Cook. Immune until next turn.`,
        type: "success",
      });
    } else if (cardType === "CANNONEER") {
      const targetIdx = players.findIndex((p) => p.id === explicitTargetId);
      const target = players[targetIdx];

      if (!target.immune) {
        if (target.hand[0] === "PIRATE") {
          logs.push({
            text: `${me.name} fires Cannon at ${target.name}... It's a Pirate!`,
            type: "danger",
          });
          eliminate(explicitTargetId, "Cannoneer hit a Pirate");
        } else {
          const oldCard = target.hand.pop();
          let newCard;
          if (deck.length > 0) {
            newCard = deck.pop();
          } else {
            newCard = gameState.burntCard;
            logs.push({
              text: "Deck empty! Recycled Burnt Card.",
              type: "warning",
            });
          }
          players[targetIdx].hand.push(newCard);
          deck.unshift(oldCard);
          logs.push({
            text: `💣 ${me.name} used Cannoneer. ${target.name} was forced to switch cards.`,
            type: "neutral",
          });
        }
      } else {
        logs.push({
          text: `🛡️ ${target.name} is immune to Cannoneer!`,
          type: "warning",
        });
      }
    } else if (cardType === "MERCHANT") {
      let drawn = [];
      if (deck.length >= 2) {
        drawn = [deck.pop(), deck.pop()];
      } else if (deck.length === 1) {
        drawn = [deck.pop()];
      }

      const pool = [...players[myIdx].hand, ...drawn];
      players[myIdx].hand = [];

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          deck,
          thiefActive: thiefActive || null,
          logs: arrayUnion(...logs),
          discardPile: arrayUnion(cardType),
          merchantState: { pool, originalDeckCount: deck.length },
        }
      );
      setSelectedCard(null);
      setSelectedGuess("");
      return;
    } else if (cardType === "SAILOR") {
      const targetIdx = players.findIndex((p) => p.id === explicitTargetId);
      if (!players[targetIdx].immune) {
        const myCard = players[myIdx].hand.pop();
        const theirCard = players[targetIdx].hand.pop();
        players[myIdx].hand.push(theirCard);
        players[targetIdx].hand.push(myCard);
        logs.push({
          text: `⚓ ${me.name} swapped hands with ${players[targetIdx].name}.`,
          type: "neutral",
        });
      } else {
        logs.push({
          text: `🛡️ ${players[targetIdx].name} is immune to Swap!`,
          type: "warning",
        });
      }
    } else if (cardType === "CAPTAIN") {
      logs.push({
        text: `${me.name} plays Captain (No Effect).`,
        type: "neutral",
      });
    } else if (cardType === "PIRATE") {
      eliminate(user.uid, "Played Pirate (Suicide)");
    }

    setSelectedCard(null);
    setSelectedGuess("");

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        discardPile: arrayUnion(cardType),
      }
    );

    await nextTurn(
      {
        players,
        deck,
        turnIndex: gameState.turnIndex,
        thiefActive: thiefActive || null,
        burntCard: gameState.burntCard,
        deckConfig: gameState.deckConfig,
      },
      logs
    );
  };

  const handleMerchantConfirm = async (keptCard) => {
    const pool = gameState.merchantState.pool;
    const rejected = pool.filter((c, i) => i !== pool.indexOf(keptCard));

    let newDeck = [...gameState.deck, ...rejected];
    newDeck = shuffle(newDeck);

    const players = [...gameState.players];
    const myIdx = players.findIndex((p) => p.id === user.uid);
    players[myIdx].hand = [keptCard];

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        merchantState: null,
      }
    );

    await nextTurn(
      {
        players,
        deck: newDeck,
        turnIndex: gameState.turnIndex,
        thiefActive: gameState.thiefActive,
        burntCard: gameState.burntCard,
        deckConfig: gameState.deckConfig,
      },
      [
        {
          text: `${
            gameState.players.find((p) => p.id === user.uid).name
          } finished Merchant selection.`,
          type: "neutral",
        },
      ]
    );
  };

  const activePlayers =
    gameState?.players.filter((p) => !p.eliminated && p.id !== user?.uid) || [];
  const me = gameState?.players.find((p) => p.id === user?.uid);
  const isMyTurn = gameState?.players[gameState?.turnIndex]?.id === user?.uid;
  const allReady = gameState?.players
    .filter((p) => p.id !== gameState.hostId)
    .every((p) => p.readyForNext);

  if (!user)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}

        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 font-serif tracking-widest z-10 text-center">
          PIRATES
        </h1>
        <div className="text-lg md:text-xl text-blue-300 font-serif tracking-widest mb-8 opacity-80 z-10 uppercase text-center">
          Adventure on the sea
        </div>

        <div className="bg-gray-800 p-6 md:p-8 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl z-10">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm">
              {error}
            </div>
          )}
          <input
            className="w-full bg-gray-900 border border-gray-700 p-3 rounded mb-4 text-white placeholder-gray-500"
            placeholder="Pirate Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 p-3 rounded font-bold mb-4 flex items-center justify-center gap-2"
          >
            <Ship size={20} /> Create New Ship
          </button>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <input
              className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded text-white placeholder-gray-500 uppercase"
              placeholder="Room Code"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 p-3 md:px-6 rounded font-bold"
            >
              Join
            </button>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="w-full text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 py-2"
          >
            <BookOpen size={16} /> How to Play
          </button>
        </div>
        <FloatingBackground />
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const guardCount = gameState.deckConfig?.guards ?? 6;
    const merchantCount = gameState.deckConfig?.merchants ?? 2;
    const playerCount = gameState.players.length;

    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6 flex flex-col items-center">
        <div className="w-full max-w-2xl relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-yellow-500">
              Cabin: {roomId}
            </h2>
            <button
              onClick={leaveRoom}
              className="text-gray-400 hover:text-white flex items-center gap-2"
            >
              <LogOut size={20} /> Leave
            </button>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6">
            <h3 className="text-gray-400 uppercase tracking-widest mb-4">
              Crew ({gameState.players.length}/8)
            </h3>
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-gray-700 p-3 rounded mb-2"
              >
                <span className="font-bold flex items-center gap-2">
                  {p.id === gameState.hostId && (
                    <Crown size={16} className="text-yellow-400" />
                  )}{" "}
                  {p.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm">Ready</span>
                  {isHost && p.id !== user.uid && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="p-1 hover:bg-red-900/50 rounded text-red-400"
                      title="Kick Player"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isHost && (
            <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings size={16} /> Deck Config
                </h3>
                {playerCount > 4 && (
                  <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded">
                    Disabled (5+ Players)
                  </span>
                )}
              </div>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                  playerCount > 4 ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="bg-gray-900 p-3 rounded flex justify-between items-center">
                  <div className="text-sm font-bold text-blue-400">
                    Guards ({guardCount})
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateDeckConfig(guardCount - 1, merchantCount)
                      }
                      disabled={guardCount <= 4}
                      className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30"
                    >
                      -
                    </button>
                    <button
                      onClick={() =>
                        updateDeckConfig(guardCount + 1, merchantCount)
                      }
                      disabled={guardCount >= 6}
                      className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="bg-gray-900 p-3 rounded flex justify-between items-center">
                  <div className="text-sm font-bold text-yellow-400">
                    Merchants ({merchantCount})
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateDeckConfig(guardCount, merchantCount - 1)
                      }
                      disabled={merchantCount <= 0}
                      className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30"
                    >
                      -
                    </button>
                    <button
                      onClick={() =>
                        updateDeckConfig(guardCount, merchantCount + 1)
                      }
                      disabled={merchantCount >= 2}
                      className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isHost ? (
            <button
              onClick={() => startRound()}
              disabled={gameState.players.length < 2}
              className={`w-full py-4 rounded-xl font-bold text-xl shadow-lg ${
                gameState.players.length < 2
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500"
              }`}
            >
              Set Sail (Start Game)
            </button>
          ) : (
            <div className="text-center text-gray-500 animate-pulse">
              Waiting for Captain to start...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "game" && gameState) {
    const isMerchantActive = gameState.merchantState && isMyTurn;

    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col relative overflow-hidden">
        <FloatingBackground />

        {/* Global Info Modal (Replaces Alerts) */}
        {infoModal && (
          <InfoModal
            title={infoModal.title}
            text={infoModal.text}
            type={infoModal.type}
            onClose={() => setInfoModal(null)}
          />
        )}

        <div className="bg-gray-800 p-2 md:p-4 flex justify-between items-center z-50 shadow-md">
          <div className="font-bold text-yellow-500 flex items-center gap-2 text-sm md:text-base">
            <Ship size={18} /> Room: {roomId}
            <span className="text-gray-400 text-xs md:text-sm ml-2">
              Rnd {gameState.roundCount}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogs(true)}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <Info size={20} />
            </button>
            <button
              onClick={leaveRoom}
              className="p-2 hover:bg-gray-700 rounded"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-2 md:p-4 flex flex-col items-center justify-between relative z-10">
          <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-2 items-center text-gray-500 hidden md:flex">
            <div className="w-16 h-24 bg-gray-800 border-2 border-gray-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-xl">{gameState.deck.length}</span>
            </div>
            <span className="text-xs uppercase">Deck</span>
          </div>

          {/* Mobile Deck Counter (Top Center) */}
          <div className="md:hidden bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700 text-xs text-gray-400 mb-2">
            Deck:{" "}
            <span className="text-white font-bold">
              {gameState.deck.length}
            </span>
          </div>

          {/* Opponents Area - INCREASED WIDTH */}
          <div className="flex gap-2 md:gap-4 justify-center flex-wrap w-full max-w-5xl">
            {gameState.players.map((p, i) => {
              if (p.id === user.uid) return null;
              const isActive = gameState.turnIndex === i;
              const isSelectable = isMyTurn && selectedCard && !p.eliminated;
              const isCookProtected = p.immune;
              const isThiefActive = gameState.thiefActive?.playerId === p.id;

              return (
                <div key={p.id} className="flex flex-col items-center">
                  <div
                    className={`
                    relative bg-gray-800 p-2 md:p-3 rounded-lg md:rounded-xl border-2 w-28 md:w-32 transition-all cursor-pointer
                    ${
                      isActive
                        ? "border-yellow-500 shadow-yellow-500/20 shadow-lg scale-105"
                        : "border-gray-700"
                    }
                    ${p.eliminated ? "opacity-50 grayscale" : ""}
                    ${
                      isSelectable
                        ? "ring-2 md:ring-4 ring-orange-500 hover:scale-110"
                        : ""
                    }
                    ${
                      isCookProtected
                        ? "ring-2 md:ring-4 ring-green-400/50 shadow-[0_0_15px_rgba(74,222,128,0.5)] animate-pulse"
                        : ""
                    }
                    ${
                      isThiefActive
                        ? "ring-2 md:ring-4 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse"
                        : ""
                    }
                  `}
                    onClick={() =>
                      isSelectable ? handleOpponentClick(p.id) : null
                    }
                  >
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                      <span className="font-bold truncate text-xs md:text-sm w-full">
                        {p.name}
                      </span>
                    </div>
                    {/* Status Icons Row */}
                    <div className="absolute top-1 right-1 flex flex-col gap-0.5">
                      {p.immune && (
                        <Shield size={10} className="text-green-400" />
                      )}
                      {isThiefActive && (
                        <Footprints size={10} className="text-red-400" />
                      )}
                    </div>

                    <div className="flex gap-0.5 md:gap-1 justify-center mb-1 md:mb-2">
                      {p.hand.map((_, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-6 md:w-6 md:h-8 bg-blue-900 rounded border border-blue-500"
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[8px] md:text-xs text-gray-400 bg-gray-900/50 p-0.5 md:p-1 rounded">
                      <span className="flex items-center gap-0.5">
                        <Coins size={8} className="text-yellow-400" /> {p.coins}
                      </span>
                      {p.eliminated && (
                        <Skull size={10} className="text-red-500" />
                      )}
                    </div>
                    {isActive && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 rounded-full whitespace-nowrap">
                        TURN
                      </div>
                    )}

                    {isSelectable && (
                      <div className="absolute inset-0 bg-orange-500/20 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-[10px] md:text-sm text-orange-300 animate-pulse">
                        TARGET
                      </div>
                    )}
                  </div>
                  <div className="mt-1 md:mt-2 flex gap-0.5 justify-center flex-wrap max-w-[5rem] md:max-w-[8rem]">
                    {p.playedCards &&
                      p.playedCards.map((c, idx) => (
                        <CardDisplay key={idx} type={c} tiny />
                      ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pointer-events-none z-0 my-2 flex flex-col items-center space-y-2 opacity-80 w-full px-4">
            {gameState.logs
              .slice(-2)
              .reverse()
              .map((l, i) => (
                <div
                  key={i}
                  className="bg-black/60 px-3 py-1 rounded text-xs md:text-sm text-white backdrop-blur-sm text-center truncate max-w-full"
                >
                  {l.text}
                </div>
              ))}
          </div>

          {/* My Player Area */}
          <div
            className={`w-full max-w-2xl bg-gray-800/90 p-3 md:p-6 rounded-t-2xl md:rounded-t-3xl border-t border-gray-600 backdrop-blur-md transition-colors ${
              me?.eliminated ? "grayscale opacity-75" : ""
            }`}
          >
            <div className="flex justify-between items-start md:items-center mb-3 md:mb-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3">
                <div
                  className={`bg-gray-900 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-gray-700 flex items-center gap-2 
                    ${
                      me.immune
                        ? "ring-2 ring-green-500 shadow-lg shadow-green-500/20"
                        : ""
                    }
                    ${
                      gameState.thiefActive?.playerId === me.id
                        ? "ring-2 ring-red-500 shadow-lg shadow-red-500/20"
                        : ""
                    }
                 `}
                >
                  <User className="text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-bold text-sm md:text-lg max-w-[80px] md:max-w-none truncate">
                    {me.name}
                  </span>
                  {me.immune && (
                    <Shield className="text-green-400 ml-1 md:ml-2 w-3 h-3 md:w-5 md:h-5" />
                  )}
                  {gameState.thiefActive?.playerId === me.id && (
                    <Footprints className="text-red-400 ml-1 md:ml-2 w-3 h-3 md:w-5 md:h-5" />
                  )}
                </div>
                <div className="bg-gray-900 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-gray-700 flex items-center gap-2">
                  <Coins className="text-yellow-400 w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-bold text-sm md:text-xl text-yellow-400">
                    {me.coins}
                  </span>
                  <span className="text-[10px] md:text-xs text-gray-500 uppercase font-bold self-end mb-0.5 md:mb-1">
                    / 10
                  </span>
                </div>
              </div>

              {/* My Played Cards */}
              <div className="flex flex-col items-end gap-1">
                {isMyTurn && !me.eliminated && !isMerchantActive && (
                  <div className="text-green-400 font-bold animate-pulse uppercase tracking-widest text-xs md:text-sm mb-1">
                    Your Turn
                  </div>
                )}
                <div className="flex gap-0.5 items-center bg-gray-900/50 p-1 md:p-2 rounded-lg border border-gray-700">
                  <span className="text-[8px] md:text-[10px] text-gray-500 uppercase mr-1 hidden md:inline">
                    History
                  </span>
                  {me.playedCards &&
                    me.playedCards.slice(-4).map(
                      (
                        c,
                        idx // Limit history on mobile
                      ) => <CardDisplay key={idx} type={c} tiny />
                    )}
                </div>
              </div>
            </div>

            {me.eliminated ? (
              <div className="text-center py-4 md:py-8 text-red-500 font-bold text-xl md:text-2xl uppercase tracking-widest border-2 border-red-900 bg-red-900/10 rounded-xl">
                <Skull className="inline-block mb-1 md:mb-2 w-8 h-8 md:w-12 md:h-12" />
                <br />
                Eliminated
              </div>
            ) : (
              <>
                {/* Card Selection Area */}
                <div className="flex justify-center gap-2 md:gap-4 mb-2">
                  {isMerchantActive
                    ? gameState.merchantState.pool.map((c, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-2"
                        >
                          <CardDisplay
                            type={c}
                            onClick={() => handleMerchantConfirm(c)}
                            highlight={true}
                            // REMOVED small={true} for full detail in Merchant view
                          />
                          <span className="text-xs text-green-400 font-bold">
                            Keep
                          </span>
                        </div>
                      ))
                    : me.hand.map((c, i) => {
                        const isPlayable = isMyTurn;
                        const isSelected = selectedCard === c;

                        return (
                          <div
                            key={i}
                            className="flex flex-col items-center gap-2 relative"
                          >
                            {isSelected && (
                              <div className="absolute -top-8 md:-top-10 bg-yellow-500 text-black px-2 py-1 rounded text-[10px] md:text-xs font-bold animate-bounce z-20 whitespace-nowrap">
                                Select Target!
                              </div>
                            )}
                            <CardDisplay
                              type={c}
                              onClick={() =>
                                isPlayable ? handlePlayCard(c) : null
                              }
                              disabled={!isPlayable}
                              highlight={isPlayable && isSelected}
                            />
                            {isPlayable && isSelected && (
                              <div className="flex flex-col gap-1 w-full animate-in fade-in slide-in-from-bottom-2">
                                <button
                                  onClick={() => setSelectedCard(null)}
                                  className="bg-red-900/50 hover:bg-red-900 text-[8px] md:text-[10px] py-1 rounded text-red-300 w-full"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                </div>
              </>
            )}
          </div>
        </div>

        {showLogs && (
          <LogViewer logs={gameState.logs} onClose={() => setShowLogs(false)} />
        )}

        {/* --- GUARD GUESS MODAL --- */}
        {guardModalTarget && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <div className="bg-gray-800 border-2 border-blue-500 rounded-xl p-4 md:p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="text-blue-400" />
                Guess a Card
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.keys(CARDS)
                  .filter((k) => {
                    if (k === "GUARD") return false;
                    const mCount = gameState.deckConfig?.merchants ?? 2;
                    if (k === "MERCHANT" && mCount === 0) return false;
                    return true;
                  })
                  .map((k) => (
                    <button
                      key={k}
                      onClick={() => setGuardPendingGuess(k)}
                      className={`
                        p-2 rounded text-xs md:text-sm font-bold transition-colors flex items-center gap-1 md:gap-2 justify-center md:justify-start
                        ${
                          guardPendingGuess === k
                            ? "bg-yellow-500 text-black ring-2 ring-yellow-300"
                            : "bg-gray-700 hover:bg-blue-600 text-white"
                        }
                      `}
                    >
                      {React.createElement(CARDS[k].icon, { size: 14 })}
                      {CARDS[k].name}
                    </button>
                  ))}
              </div>

              {/* Confirm / Cancel Button Logic */}
              <button
                onClick={() => {
                  if (guardPendingGuess) {
                    handlePlayCard(
                      "GUARD",
                      guardModalTarget,
                      guardPendingGuess
                    );
                    setGuardModalTarget(null);
                    setGuardPendingGuess(null);
                    setSelectedCard(null);
                  } else {
                    setGuardModalTarget(null);
                    setSelectedCard(null);
                  }
                }}
                className={`
                  w-full py-3 rounded font-bold transition-colors
                  ${
                    guardPendingGuess
                      ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
                      : "bg-red-900/50 hover:bg-red-900 text-red-200"
                  }
                `}
              >
                {guardPendingGuess ? "Confirm Play" : "Cancel"}
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4 text-center">
            <Trophy size={48} className="text-yellow-400 mb-4 animate-bounce" />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Game Over!
            </h1>
            <div className="text-xl md:text-2xl text-gray-300 mb-8">
              {gameState.players.find((p) => p.id === gameState.winnerId)?.name}{" "}
              wins the treasure!
            </div>

            {gameState.hostId === user.uid ? (
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                {!allReady && (
                  <div className="text-red-400 text-xs md:text-sm animate-pulse mb-2 flex items-center gap-2 justify-center">
                    <AlertTriangle size={16} /> Waiting for crew...
                  </div>
                )}
                <button
                  onClick={resetToLobby}
                  disabled={!allReady}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl 
                        ${
                          allReady
                            ? "bg-green-600 hover:bg-green-500 shadow-green-900/20"
                            : "bg-gray-700 cursor-not-allowed text-gray-400"
                        }
                      `}
                >
                  <RotateCcw /> Return to Lobby
                </button>
              </div>
            ) : (
              <button
                onClick={setPlayerReady}
                disabled={
                  gameState.players.find((p) => p.id === user.uid)?.readyForNext
                }
                className={`w-full max-w-xs py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  gameState.players.find((p) => p.id === user.uid)?.readyForNext
                    ? "bg-gray-700 text-green-400 border border-green-500 cursor-default"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {gameState.players.find((p) => p.id === user.uid)
                  ?.readyForNext ? (
                  <>
                    <CheckCircle size={24} /> Waiting for Host...
                  </>
                ) : (
                  "Ready for Next Game"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}