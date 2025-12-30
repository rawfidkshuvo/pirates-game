import React, { useState, useEffect, useRef } from "react";
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
  History,
  ArrowRight,
  Home,
  Zap,
  Hammer,
  Sparkles,
} from "lucide-react";

// --- Firebase Config & Init ---
// Using environment config for compatibility with the preview environment
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "AIzaSyBjIjK53vVJW1y5RaqEFGSFp0ECVDBEe1o",
        authDomain: "game-hub-ff8aa.firebaseapp.com",
        projectId: "game-hub-ff8aa",
        storageBucket: "game-hub-ff8aa.firebasestorage.app",
        messagingSenderId: "586559578902",
        appId: "1:586559578902:web:4899548c3fd4da8c6aa637",
      };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "pirates-game";
const GAME_ID = "5";

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
    desc: "Force discard & redraw. Kills Pirates. Gets killed if Captain.",
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
    desc: "No action. Must play if holding Cannoneer/Sailor.",
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

// NEW: Central Feedback Overlay
const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none">
    <div
      className={`
      flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] 
      transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300
      backdrop-blur-md
      ${
        type === "success"
          ? "bg-green-900/90 border-green-500 text-green-100"
          : ""
      }
      ${type === "failure" ? "bg-red-900/90 border-red-500 text-red-100" : ""}
      ${
        type === "neutral" ? "bg-blue-900/90 border-blue-500 text-blue-100" : ""
      }
    `}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-black/30 rounded-full border-2 border-white/20">
          <Icon size={64} className="animate-bounce" />
        </div>
      )}
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-center drop-shadow-lg mb-2">
        {message}
      </h2>
      {subtext && (
        <p className="text-lg md:text-xl font-bold opacity-90 tracking-wide text-center">
          {subtext}
        </p>
      )}
    </div>
  </div>
);

const FloatingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full bg-red-900/10 mix-blend-overlay" />
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/black-scales.png")',
      }}
    ></div>
  </div>
);

const PiratesLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Ship size={12} className="text-red-500" />
    <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">
      PIRATES
    </span>
  </div>
);

const LeaveConfirmModal = ({
  onConfirmLeave,
  onConfirmLobby,
  onCancel,
  isHost,
  inGame,
}) => (
  <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Abandon Ship?</h3>
      <p className="text-gray-400 mb-6 text-sm">
        {isHost
          ? "Leaving will destroy the room for everyone!"
          : inGame
          ? "Leaving now will end the game for you!"
          : "Leaving the lobby will disconnect you."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay (Cancel)
        </button>
        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Home size={18} /> Return Crew to Lobby
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> {isHost ? "Destroy Room" : "Leave Game"}
        </button>
      </div>
    </div>
  </div>
);

const InfoModal = ({
  title,
  text,
  onClose,
  type = "info",
  card = null,
  compareCard = null,
  labels = [],
}) => (
  <div className="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 border-2 border-gray-600 rounded-xl p-6 w-full max-w-sm shadow-2xl relative">
      <div className="flex flex-col items-center text-center gap-4">
        {type === "error" ? (
          <AlertTriangle className="text-red-500 w-12 h-12" />
        ) : type === "spy" ? (
          <Eye className="text-emerald-400 w-12 h-12" />
        ) : type === "sword" ? (
          <Sword className="text-red-400 w-12 h-12" />
        ) : type === "round_end" ? (
          <Trophy className="text-yellow-400 w-12 h-12 animate-bounce" />
        ) : (
          <Info className="text-blue-400 w-12 h-12" />
        )}

        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-gray-300 text-lg">{text}</p>

        {(card || compareCard) && (
          <div className="flex gap-4 justify-center items-center my-2">
            {card && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1 font-bold text-yellow-500">
                  {labels[0] || "Target Hand"}
                </span>
                <CardDisplay type={card} small />
              </div>
            )}
            {compareCard && (
              <>
                <div className="font-bold text-xl text-gray-500">
                  <ArrowRight size={24} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400 mb-1 font-bold text-yellow-500">
                    {labels[1] || "Attacker"}
                  </span>
                  <CardDisplay type={compareCard} small />
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
            type === "error"
              ? "bg-red-600 hover:bg-red-500"
              : type === "spy"
              ? "bg-emerald-600 hover:bg-emerald-500"
              : type === "round_end"
              ? "bg-yellow-600 hover:bg-yellow-500"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {type === "round_end" ? "Continue" : "Okay"}
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
          <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 uppercase tracking-widest">
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
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 p-4 md:p-6 rounded-2xl border border-red-700/30">
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

        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <User className="text-red-400" size={24} /> The Crew (Cards)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
            {Object.values(CARDS)
              .sort((a, b) => a.val - b.val)
              .map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.name}
                    className="flex items-start gap-3 md:gap-4 bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors"
                  >
                    <div
                      className={`p-3 md:p-4 rounded-xl ${card.bg} border border-gray-600 shadow-lg shrink-0`}
                    >
                      <Icon className={`${card.color}`} size={24} />
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
                );
              })}
          </div>
        </div>

        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Compass className="text-orange-400" size={24} /> How It Works
          </h3>
          <div className="space-y-6 relative pl-4 border-l-2 border-gray-700 ml-4">
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
          className="w-full md:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white px-10 py-3 md:py-4 rounded-xl font-bold text-lg transition-all shadow-xl"
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
  <div className="fixed inset-0 top-14 bg-black/90 z-[155] flex items-center justify-center p-0 md:p-4">
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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  // UI States
  const [showLogs, setShowLogs] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedGuess, setSelectedGuess] = useState("");
  const [guardModalTarget, setGuardModalTarget] = useState(null);
  const [guardPendingGuess, setGuardPendingGuess] = useState(null);

  // Popup Queue State
  const [modalQueue, setModalQueue] = useState([]);
  const [activeModal, setActiveModal] = useState(null);

  // Visual Feedback State
  const [feedbackOverlay, setFeedbackOverlay] = useState(null);

  // Track last processed action to avoid duplicate popups
  const lastProcessedActionId = useRef(null);
  const lastProcessedRoundId = useRef(null);

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

  // --- NEW: Session Restore Logic ---
  useEffect(() => {
    // Only attempt restore if logged in and currently in menu
    if (user && view === "menu") {
      const savedRoomId = localStorage.getItem("pirates_room_id");
      const savedPlayerName = localStorage.getItem("pirates_player_name");

      if (savedRoomId && savedPlayerName) {
        setLoading(true);
        setPlayerName(savedPlayerName);
        setRoomId(savedRoomId); // Triggers the snapshot listener
      }
    }
  }, [user, view]);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          const isInRoom = data.players.some((p) => p.id === user.uid);
          if (!isInRoom) {
            setRoomId("");
            setView("menu");
            setError("The Captain abandoned the ship! (You were disconnected)");
            localStorage.removeItem("pirates_room_id");
            localStorage.removeItem("pirates_player_name");
            setLoading(false);
            return;
          }

          setGameState(data);
          if (data.status === "playing" || data.status === "finished") {
            setView("game");
          } else if (data.status === "lobby") {
            setView("lobby");
          }
          setLoading(false);
        } else {
          setRoomId("");
          setView("menu");
          setError("The ship has sunk! (Room Closed)");
          localStorage.removeItem("pirates_room_id");
          localStorage.removeItem("pirates_player_name");
          setLoading(false);
        }
      }
    );
    return () => unsub();
  }, [roomId, user]);

  // Queue Processor Effect
  useEffect(() => {
    if (!activeModal && modalQueue.length > 0) {
      setActiveModal(modalQueue[0]);
      setModalQueue((prev) => prev.slice(1));
    }
  }, [activeModal, modalQueue]);

  // Trigger Feedback Function
  const triggerFeedback = (type, message, subtext = "", Icon = null) => {
    setFeedbackOverlay({ type, message, subtext, icon: Icon });
    setTimeout(() => setFeedbackOverlay(null), 2000); // Show for 2 seconds
  };

  // Listener for Opponent Action Notifications AND Round End
  useEffect(() => {
    if (!gameState || !user) return;

    // 1. Action Notifications (Individual)
    if (gameState.lastAction) {
      const action = gameState.lastAction;
      if (action.id !== lastProcessedActionId.current) {
        if (action.targetId === user.uid) {
          lastProcessedActionId.current = action.id;

          // --- VISUAL FEEDBACK FOR VICTIM ---
          if (action.type === "CANNONEER") {
            if (action.message.includes("Reflected")) {
              triggerFeedback(
                "success",
                "DEFENDED",
                "Captain Killed Attacker!",
                Crown
              );
            } else if (action.message.includes("Pirate")) {
              triggerFeedback(
                "failure",
                "ELIMINATED",
                "Cannon Hit Pirate!",
                Skull
              );
            } else {
              triggerFeedback(
                "failure",
                "UNDER ATTACK",
                "Card Destroyed!",
                Bomb
              );
            }
          } else if (
            action.type === "GUARD" &&
            action.message.includes("CORRECT")
          ) {
            triggerFeedback(
              "failure",
              "ELIMINATED",
              "Guard Caught You!",
              Skull
            );
          } else if (
            action.type === "GUARD" &&
            action.message.includes("WRONG")
          ) {
            triggerFeedback(
              "neutral",
              "SAFE",
              "Guard Guessed Wrong",
              CheckCircle
            );
          } else if (action.type === "SWORDSMAN") {
            if (action.message.includes("You Died")) {
              triggerFeedback("failure", "DEFEAT", "Lost Sword Fight", Skull);
            } else if (action.message.includes("You Won")) {
              triggerFeedback("success", "VICTORY", "Won Sword Fight", Trophy);
            } else {
              triggerFeedback("neutral", "TIED", "Both Survived", Sword);
            }
          }
          // ---------------------------------

          setModalQueue((prev) => [
            ...prev,
            {
              title: "Action Alert!",
              text: action.message,
              type:
                action.type === "SWORDSMAN"
                  ? "sword"
                  : action.type === "SPY"
                  ? "spy"
                  : "warning",
              card: action.cardToShow,
              compareCard: action.compareCard,
              labels: action.labels,
            },
          ]);
        }
      }
    }

    // 2. Round End Notification (Global)
    if (gameState.lastRoundResult) {
      const roundRes = gameState.lastRoundResult;
      // Only show if new and valid
      if (roundRes.id !== lastProcessedRoundId.current) {
        lastProcessedRoundId.current = roundRes.id;
        setModalQueue((prev) => [
          ...prev,
          {
            title: `Round ${roundRes.round} Complete!`,
            text: `${roundRes.winnerName} won the round and earned a Coin!`,
            type: "round_end",
            card: null,
            compareCard: null,
          },
        ]);
      }
    }
  }, [gameState, user]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data[GAME_ID]?.maintenance) {
          setIsMaintenance(true);
        } else {
          setIsMaintenance(false);
        }
      }
    });
    return () => unsub();
  }, []);

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            The ship is in dry dock for repairs. The Captain says no sailing
            today!
          </p>
        </div>
        <div className="h-8"></div>
        <a href="https://rawfidkshuvo.github.io/gamehub/">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 rounded-full border border-indigo-500/20 text-indigo-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm">
                <Sparkles size={16} /> Visit Gamehub...Try our other releases...{" "}
                <Sparkles size={16} />
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  }

  const showAlert = (title, text, type = "error", card = null) => {
    setModalQueue((prev) => [...prev, { title, text, type, card }]);
  };

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
      deckConfig: { guards: 6, merchants: 2 },
      discardPile: [],
      logs: [],
      turnIndex: 0,
      roundCount: 1,
      burntCard: null,
      thiefActive: null,
      pendingAction: null,
      lastAction: null,
      lastRoundResult: null,
    };
    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      initialData
    );
    // SAVE SESSION
    localStorage.setItem("pirates_room_id", newId);
    localStorage.setItem("pirates_player_name", playerName);

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
      // Allow reconnect if player exists
      const existingPlayer = data.players.find((p) => p.id === user.uid);
      if (!existingPlayer) {
        setError("Game already started");
        setLoading(false);
        return;
      }
    }

    if (data.players.find((p) => p.id === user.uid)) {
      // Just rejoining logic handled by setting RoomId and effect
    } else if (data.players.length < 8) {
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
    } else {
      setError("Room full (Max 8)");
      setLoading(false);
      return;
    }

    // SAVE SESSION
    localStorage.setItem("pirates_room_id", roomCodeInput);
    localStorage.setItem("pirates_player_name", playerName);

    setRoomId(roomCodeInput);
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
        const isHost = data.hostId === user.uid;

        if (isHost) {
          // MODIFIED: Host deletes room immediately regardless of status
          await deleteDoc(roomRef);
        } else {
          // NON-HOST logic remains the same
          if (data.status === "lobby") {
            const newPlayers = data.players.filter((p) => p.id !== user.uid);
            await updateDoc(roomRef, { players: newPlayers });
          } else {
            await handleGameAbandon(roomRef, data);
          }
        }
      }
    } catch (e) {
      console.error("Error leaving room:", e);
    }
    // CLEAR SESSION
    localStorage.removeItem("pirates_room_id");
    localStorage.removeItem("pirates_player_name");

    setRoomId("");
    setView("menu");
    setGameState(null);
    setShowLeaveConfirm(false);
  };

  const handleGameAbandon = async (roomRef, data) => {
    const remainingPlayers = data.players.filter((p) => p.id !== user.uid);
    let winnerId = null;

    if (remainingPlayers.length > 0) {
      winnerId = remainingPlayers[0].id;
    }

    await updateDoc(roomRef, {
      status: "finished",
      winnerId: winnerId,
      players: data.players.filter((p) => p.id !== user.uid),
      logs: arrayUnion({
        id: Date.now().toString(),
        text: `${
          data.players.find((p) => p.id === user.uid)?.name
        } left the game. Game Over.`,
        type: "danger",
      }),
    });
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
      readyForNext: false,
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
        lastAction: null,
        lastRoundResult: null,
        logs: arrayUnion({
          id: Date.now() + Math.random().toString(),
          text: `--- Round ${
            state.roundCount || gameState.roundCount
          } Started ---`,
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
        lastAction: null,
        lastRoundResult: null,
      }
    );
  };

  // --- RESTART GAME LOGIC (Host Only) ---
  const restartGame = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;

    // 1. Reset all players to clean slate (0 coins)
    const players = gameState.players.map((p) => ({
      ...p,
      hand: [],
      playedCards: [],
      coins: 0,
      eliminated: false,
      immune: false,
      readyForNext: false,
    }));

    // 2. Generate and Shuffle Deck
    let config = gameState.deckConfig || { guards: 6, merchants: 2 };
    if (players.length > 4) config = { guards: 6, merchants: 2 };

    const deck = [];
    Object.keys(CARDS).forEach((key) => {
      let count = CARDS[key].defaultCount;
      if (key === "GUARD") count = config.guards ?? 6;
      if (key === "MERCHANT") count = config.merchants ?? 2;
      for (let i = 0; i < count; i++) deck.push(key);
    });

    const shuffledDeck = shuffle(deck);
    const burntCard = shuffledDeck.pop();

    // 3. Deal Initial Cards
    const playersWithCards = players.map((p) => ({
      ...p,
      hand: [shuffledDeck.pop()],
    }));

    // 4. Select Start Player and Deal Second Card
    const startIdx = Math.floor(Math.random() * playersWithCards.length);
    playersWithCards[startIdx].hand.push(shuffledDeck.pop());

    // 5. Update Firestore
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        deck: shuffledDeck,
        burntCard,
        players: playersWithCards,
        discardPile: [],
        turnIndex: startIdx,
        thiefActive: null,
        lastAction: null,
        lastRoundResult: null,
        roundCount: 1,
        winnerId: null,
        // CHANGED: We pass a new array to overwrite/clear old logs
        logs: [
          {
            id: Date.now().toString(),
            text: "--- NEW GAME STARTED ---",
            type: "neutral",
          },
        ],
      }
    );
  };

  const nextTurn = async (
    currentState,
    logs = [],
    actionNotification = null
  ) => {
    let players = [...currentState.players];
    let deck = [...currentState.deck];
    let turnIndex = currentState.turnIndex;
    let thiefActive = currentState.thiefActive;

    const activePlayers = players.filter((p) => !p.eliminated);
    const uniqueLogs = logs.map((log) => ({
      ...log,
      id: log.id || Date.now() + Math.random().toString(),
    }));

    let updateData = {
      players,
      deck,
    };

    if (actionNotification) {
      updateData.lastAction = actionNotification;
    }

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.coins += 1;
      uniqueLogs.push({
        id: Date.now() + Math.random().toString(),
        text: `🏁 Round Over! ${winner.name} survives alone (+1 Coin).`,
        type: "success",
      });

      // Prepare Round Result
      const roundResult = {
        id: Date.now(),
        winnerName: winner.name,
        round: currentState.roundCount || gameState.roundCount,
      };

      // --- SKIP LAST ROUND RESULT IF GAME IS WON ---
      if (winner.coins >= 10) {
        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            ...updateData,
            status: "finished",
            winnerId: winner.id,
            logs: arrayUnion(...uniqueLogs),
          }
        );
        return;
      }
      // ---------------------------------------------

      updateData.lastRoundResult = roundResult;

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          ...updateData,
          roundCount: increment(1),
          logs: arrayUnion(...uniqueLogs),
        }
      );
      setTimeout(
        () =>
          startRound({
            ...currentState,
            players,
            roundCount: (currentState.roundCount || gameState.roundCount) + 1,
          }),
        3500
      );
      return;
    }

    // --- LOGIC FIX: Handle Empty Deck Showdown ---
    // If player has 1 card but deck is empty, they cannot draw.
    // Trigger End of Round comparison.
    // Note: If turn player just played Merchant, hand might be empty momentarily, but Merchant logic handles refilling/nextTurn.
    // This check runs before drawing a new card for the next player.
    if (deck.length === 0) {
      // Find highest card among survivors
      let maxVal = -1;
      let winners = [];
      activePlayers.forEach((p) => {
        if (p.hand.length > 0) {
          // Safety check
          const val = CARDS[p.hand[0]].val;
          if (val > maxVal) {
            maxVal = val;
            winners = [p];
          } else if (val === maxVal) {
            winners.push(p);
          }
        }
      });

      winners.forEach((w) => {
        const idx = players.findIndex((p) => p.id === w.id);
        players[idx].coins += 1;
      });

      const winnerNames = winners.map((w) => w.name).join(", ");
      uniqueLogs.push({
        id: Date.now() + Math.random().toString(),
        text: `🌊 Deck Empty! Winners: ${winnerNames} (Card Value: ${maxVal}).`,
        type: "success",
      });

      const roundResult = {
        id: Date.now(),
        winnerName: winnerNames,
        round: currentState.roundCount || gameState.roundCount,
      };

      if (players.some((p) => p.coins >= 10)) {
        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            ...updateData,
            status: "finished",
            winnerId: players.find((p) => p.coins >= 10).id,
            logs: arrayUnion(...uniqueLogs),
          }
        );
        return;
      }

      updateData.lastRoundResult = roundResult;

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          ...updateData,
          roundCount: increment(1),
          logs: arrayUnion(...uniqueLogs),
        }
      );
      setTimeout(
        () =>
          startRound({
            ...currentState,
            players,
            roundCount: (currentState.roundCount || gameState.roundCount) + 1,
          }),
        3500
      );
      return;
    }

    let nextIdx = (turnIndex + 1) % players.length;
    while (players[nextIdx].eliminated) {
      nextIdx = (nextIdx + 1) % players.length;
    }

    if (thiefActive && thiefActive.playerId === players[nextIdx].id) {
      // Feedback for Thief Player
      if (players[nextIdx].id === user.uid) {
        triggerFeedback("success", "+1 COIN", "Survived as Thief", Coins);
      }

      players[nextIdx].coins += 1;
      uniqueLogs.push({
        id: Date.now() + Math.random().toString(),
        text: `👣 ${players[nextIdx].name} survived the round as Thief (+1 Coin)!`,
        type: "success",
      });
      thiefActive = null;

      // --- THIEF INSTANT WIN FIX ---
      if (players[nextIdx].coins >= 10) {
        uniqueLogs.push({
          id: Date.now() + Math.random().toString(),
          text: `🏆 ${players[nextIdx].name} collected 10 coins via Thief and WINS THE GAME!`,
          type: "success",
        });

        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            players,
            status: "finished",
            winnerId: players[nextIdx].id,
            logs: arrayUnion(...uniqueLogs),
            // EXPLICITLY OMITTING 'lastRoundResult' prevents the Round End modal
          }
        );
        return; // Stop execution
      }
      // -----------------------------
    }

    players[nextIdx].immune = false;

    if (deck.length > 0) {
      players[nextIdx].hand.push(deck.pop());
    }

    updateData = {
      ...updateData,
      deck,
      turnIndex: nextIdx,
      thiefActive,
      players,
      logs: arrayUnion(...uniqueLogs),
    };

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updateData
    );
  };

  const handleOpponentClick = (targetId) => {
    if (!selectedCard) return;
    if (targetId === user.uid) {
      showAlert("Targeting Error", "You cannot target yourself!", "error");
      return;
    }
    if (selectedCard === "GUARD") {
      setGuardModalTarget(targetId);
      setGuardPendingGuess(null);
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
    let actionNotification = null;

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

    // Helper to calculate winner if deck empty during play (triggered by Cannoneer running out of cards)
    const handleDeckEmptyEnd = async () => {
      let maxVal = -1;
      let winners = [];
      const activePlayers = players.filter((p) => !p.eliminated);

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

      const winnerNames = winners.map((w) => w.name).join(", ");

      logs.push({
        id: Date.now() + Math.random().toString(),
        text: `🌊 Deck Empty! Winners: ${winnerNames} (Card Value: ${maxVal}).`,
        type: "success",
      });

      const uniqueLogs = logs.map((l) => ({
        ...l,
        id: Date.now() + Math.random().toString(),
      }));

      const roundResult = {
        id: Date.now(),
        winnerName: winnerNames,
        round: gameState.roundCount,
      };

      if (players.some((p) => p.coins >= 10)) {
        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            players,
            deck,
            status: "finished",
            winnerId: players.find((p) => p.coins >= 10).id,
            logs: arrayUnion(...uniqueLogs),
            discardPile: arrayUnion(cardType), // Save played card
            lastAction: actionNotification,
          }
        );
      } else {
        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            players,
            deck,
            roundCount: increment(1),
            logs: arrayUnion(...uniqueLogs),
            discardPile: arrayUnion(cardType),
            lastAction: actionNotification,
            lastRoundResult: roundResult,
          }
        );
        setTimeout(
          () =>
            startRound({
              ...gameState,
              players,
              roundCount: gameState.roundCount + 1,
            }),
          3500
        );
      }
    };

    if (cardType === "THIEF") {
      logs.push({
        text: `👣 ${me.name} plays Thief. (Gain coin if survived until next turn)`,
        type: "neutral",
      });
      if (thiefActive) {
        logs.push({
          text: `🚫 Previous Thief thwarted by ${me.name}!`,
          type: "neutral",
        });
      }
      thiefActive = { playerId: user.uid, turnSet: gameState.turnIndex };
    } else if (cardType === "GUARD") {
      const target = players.find((p) => p.id === explicitTargetId);
      logs.push({
        text: `🛡️ ${me.name} used Guard on ${target.name}, guessing ${CARDS[finalGuess].name}.`,
        type: "neutral",
      });
      if (!target.immune) {
        const targetCard = target.hand[0];
        if (targetCard === finalGuess) {
          triggerFeedback("success", "KILLED", "Guard Guess Correct!", Skull);
          eliminate(
            explicitTargetId,
            `Guard caught a ${CARDS[finalGuess].name}`
          );
          actionNotification = {
            id: Date.now(),
            targetId: explicitTargetId,
            type: "GUARD",
            message: `${me.name} guessed your card was a ${CARDS[finalGuess].name}. They were CORRECT! You are out.`,
            cardToShow: targetCard,
            compareCard: finalGuess,
            labels: ["You Had", "They Guessed"],
          };
        } else {
          triggerFeedback("failure", "MISSED", "Guard Guess Wrong", Shield);
          logs.push({
            text: `❌ Guard guess wrong. ${target.name} does not have ${CARDS[finalGuess].name}.`,
            type: "neutral",
          });
          actionNotification = {
            id: Date.now(),
            targetId: explicitTargetId,
            type: "GUARD",
            message: `${me.name} guessed your card was a ${CARDS[finalGuess].name}. They were WRONG. You are safe.`,
            cardToShow: targetCard,
            compareCard: finalGuess,
            labels: ["You Have", "They Guessed"],
          };
        }
      } else {
        triggerFeedback("failure", "IMMUNE", "Target Protected", Shield);
        logs.push({
          text: `🛡️ ${target.name} is immune to the Guard!`,
          type: "warning",
        });
        actionNotification = {
          id: Date.now(),
          targetId: explicitTargetId,
          type: "GUARD",
          message: `${me.name} tried to Guard you, but you were Immune!`,
        };
      }
    } else if (cardType === "SPY") {
      const target = players.find((p) => p.id === explicitTargetId);
      if (!target.immune) {
        logs.push({
          text: `👁️ ${me.name} plays Spy and looks at ${target.name}'s hand.`,
          type: "neutral",
        });
        showAlert(
          "Spy Report",
          `${target.name} is holding: ${CARDS[target.hand[0]].name}`,
          "spy",
          target.hand[0]
        );
        actionNotification = {
          id: Date.now(),
          targetId: explicitTargetId,
          type: "SPY",
          message: `${me.name} used a Spy to look at your hand.`,
        };
      } else {
        triggerFeedback("failure", "IMMUNE", "Target Protected", Shield);
        logs.push({
          text: `🛡️ ${me.name} tried to Spy, but ${target.name} is immune!`,
          type: "warning",
        });
        actionNotification = {
          id: Date.now(),
          targetId: explicitTargetId,
          type: "SPY",
          message: `${me.name} tried to Spy on you, but you were Immune!`,
        };
      }
    } else if (cardType === "SWORDSMAN") {
      const target = players.find((p) => p.id === explicitTargetId);
      if (!target.immune) {
        const myCardKey = players[myIdx].hand[0];
        const targetCardKey = target.hand[0];
        const myVal = CARDS[myCardKey].val;
        const targetVal = CARDS[targetCardKey].val;

        logs.push({
          text: `⚔️ ${me.name} challenged ${target.name}.`,
          type: "neutral",
        });

        if (myVal < targetVal) {
          triggerFeedback("failure", "DEFEAT", "You Died (Lower Card)", Skull);
          eliminate(user.uid, `Lost Sword Fight (Lower Card)`);
          logs.push({ text: `... ${me.name} was defeated!`, type: "danger" });
          actionNotification = {
            id: Date.now(),
            targetId: explicitTargetId,
            type: "SWORDSMAN",
            message: `${me.name} challenged you! Your ${CARDS[targetCardKey].name} beat their ${CARDS[myCardKey].name}. You Won!`,
            cardToShow: targetCardKey,
            compareCard: myCardKey,
            labels: ["Your Hand", "Attacker"],
          };
          showAlert(
            "Sword Fight Result",
            `You challenged ${target.name}. Their ${CARDS[targetCardKey].name} beat your ${CARDS[myCardKey].name}. You Died.`,
            "sword",
            targetCardKey
          );
        } else if (targetVal < myVal) {
          triggerFeedback(
            "success",
            "VICTORY",
            "Target Died (Lower Card)",
            Trophy
          );
          eliminate(explicitTargetId, `Lost Sword Fight (Lower Card)`);
          logs.push({
            text: `... ${target.name} was defeated!`,
            type: "danger",
          });
          actionNotification = {
            id: Date.now(),
            targetId: explicitTargetId,
            type: "SWORDSMAN",
            message: `${me.name} challenged you! Your ${CARDS[targetCardKey].name} lost to their ${CARDS[myCardKey].name}. You Died.`,
            cardToShow: targetCardKey,
            compareCard: myCardKey,
            labels: ["Your Hand", "Attacker"],
          };
          showAlert(
            "Sword Fight Result",
            `You challenged ${target.name}. Your ${CARDS[myCardKey].name} beat their ${CARDS[targetCardKey].name}. You Won!`,
            "sword",
            targetCardKey
          );
        } else {
          triggerFeedback("neutral", "TIED", "Both Survived", Sword);
          logs.push({
            text: `⚔️ Sword Fight Tie! Both survive.`,
            type: "neutral",
          });
          actionNotification = {
            id: Date.now(),
            targetId: explicitTargetId,
            type: "SWORDSMAN",
            message: `${me.name} challenged you! Tie (${CARDS[targetCardKey].name}). Both survive.`,
            cardToShow: targetCardKey,
            compareCard: myCardKey,
            labels: ["Your Hand", "Attacker"],
          };
          showAlert(
            "Sword Fight Result",
            `Tie! You both have ${CARDS[myCardKey].name}.`,
            "sword",
            targetCardKey
          );
        }
      } else {
        triggerFeedback("failure", "IMMUNE", "Target Protected", Shield);
        logs.push({
          text: `🛡️ ${target.name} is immune to Sword Fight!`,
          type: "warning",
        });
        actionNotification = {
          id: Date.now(),
          targetId: explicitTargetId,
          type: "SWORDSMAN",
          message: `${me.name} tried to fight you, but you were Immune!`,
        };
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
          // Success Feedback for Attacker
          triggerFeedback("success", "KILLED", "Pirate Eliminated!", Skull);
          logs.push({
            text: `💣 ${me.name} fires Cannon at ${target.name}... It's a Pirate! Target eliminated.`,
            type: "success",
          });
          eliminate(explicitTargetId, "Cannoneer hit a Pirate");
          actionNotification = {
            id: Date.now(),
            targetId: explicitTargetId,
            type: "CANNONEER",
            message: `${me.name} fired a Cannon at you. You had a Pirate and were eliminated!`,
          };
        } else if (target.hand[0] === "CAPTAIN") {
          // Captain Reflects
          triggerFeedback(
            "failure",
            "BACKFIRE",
            "Hit Captain (You Died)",
            Crown
          );
          logs.push({
            text: `💣 ${me.name} fires Cannon at ${target.name}... It's a Captain! ${me.name} blows themselves up!`,
            type: "danger",
          });
          eliminate(user.uid, "Cannoneer hit a Captain");

          const oldCard = target.hand.pop();
          if (!players[targetIdx].playedCards)
            players[targetIdx].playedCards = [];
          players[targetIdx].playedCards.push(oldCard);

          let newCard;
          if (deck.length > 0) {
            newCard = deck.pop();
          } else {
            newCard = gameState.burntCard;
            logs.push({
              text: "Deck empty! Recycled Burnt Card for Captain holder.",
              type: "warning",
            });
          }
          players[targetIdx].hand.push(newCard);

          actionNotification = {
            id: Date.now(),
            targetId: explicitTargetId,
            type: "CANNONEER",
            message: `${me.name} fired a Cannon at you. Your Captain Reflected the attack! They died. You drew a new card.`,
            cardToShow: oldCard,
            compareCard: newCard,
            labels: ["Reflected", "New Card"],
          };

          // CHECK END GAME: If deck was empty (used burntCard), end game
          if (deck.length === 0) {
            setSelectedCard(null);
            setSelectedGuess("");
            await handleDeckEmptyEnd();
            return;
          }
        } else {
          // Standard Hit
          triggerFeedback("success", "DESTROYED", "Card Removed", Bomb);
          const oldCard = target.hand.pop();
          if (!players[targetIdx].playedCards)
            players[targetIdx].playedCards = [];
          players[targetIdx].playedCards.push(oldCard);

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

          logs.push({
            text: `💣 ${me.name} destroyed ${target.name}'s card!`,
            type: "neutral",
          });
          actionNotification = {
            id: Date.now(),
            targetId: explicitTargetId,
            type: "CANNONEER",
            message: `${me.name} destroyed your card! It was added to your history. You drew a new one.`,
            cardToShow: oldCard,
            compareCard: newCard,
            labels: ["Destroyed", "New Card"],
          };

          // CHECK END GAME: If deck was empty (used burntCard), end game
          if (deck.length === 0) {
            setSelectedCard(null);
            setSelectedGuess("");
            await handleDeckEmptyEnd();
            return;
          }
        }
      } else {
        triggerFeedback("failure", "IMMUNE", "Target Protected", Shield);
        logs.push({
          text: `🛡 ${target.name} is immune to Cannoneer!`,
          type: "warning",
        });
        actionNotification = {
          id: Date.now(),
          targetId: explicitTargetId,
          type: "CANNONEER",
          message: `${me.name} tried to Cannon you, but you were Immune!`,
        };
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

      const uniqueLogs = logs.map((l) => ({
        ...l,
        id: Date.now() + Math.random().toString(),
      }));

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          deck,
          thiefActive: thiefActive || null,
          logs: arrayUnion(...uniqueLogs),
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
        actionNotification = {
          id: Date.now(),
          targetId: explicitTargetId,
          type: "SAILOR",
          message: `${me.name} swapped hands with you.`,
          cardToShow: myCard,
          compareCard: theirCard,
          labels: ["Taken Card", "Current Hand"],
        };
      } else {
        logs.push({
          text: `🛡️ ${players[targetIdx].name} is immune to Swap!`,
          type: "warning",
        });
        actionNotification = {
          id: Date.now(),
          targetId: explicitTargetId,
          type: "SAILOR",
          message: `${me.name} tried to swap hands with you, but you were Immune!`,
        };
      }
    } else if (cardType === "CAPTAIN") {
      logs.push({
        text: `👑 ${me.name} plays Captain (No Effect).`,
        type: "neutral",
      });
    } else if (cardType === "PIRATE") {
      triggerFeedback("failure", "SUICIDE", "You Played Pirate!", Skull);
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
        roundCount: gameState.roundCount,
      },
      logs,
      actionNotification
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
        roundCount: gameState.roundCount,
      },
      [
        {
          text: `💰 ${
            gameState.players.find((p) => p.id === user.uid).name
          } used Merchant to draw cards and kept one.`,
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
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />
        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 text-center mb-10 animate-in fade-in zoom-in duration-700">
          <Ship
            size={64}
            className="text-red-500 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-orange-600 font-serif tracking-widest drop-shadow-md">
            PIRATES
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            Adventure on the Sea
          </p>
        </div>
        <div className="bg-gray-900/80 backdrop-blur border border-red-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom-10 duration-700 delay-100">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/50 border border-gray-600 p-3 rounded mb-4 text-white placeholder-gray-500 focus:border-red-500 outline-none transition-colors"
            placeholder="Pirate Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all"
          >
            <Ship size={20} /> Create New Ship
          </button>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-gray-600 p-3 rounded text-white placeholder-gray-500 uppercase font-mono tracking-wider focus:border-red-500 outline-none"
              placeholder="ROOM CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-3 rounded font-bold transition-colors"
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
        <div className="absolute bottom-4 text-slate-600 text-xs text-center">
          Inspired by Love Letter. A tribute game.
          <br />
          Developed by <strong>RAWFID K SHUVO</strong>. Visit{" "}
          <a
            href="https://rawfidkshuvo.github.io/gamehub/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500 underline hover:text-red-600"
          >
            GAMEHUB
          </a>{" "}
          for more games.
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const guardCount = gameState.deckConfig?.guards ?? 6;
    const merchantCount = gameState.deckConfig?.merchants ?? 2;
    const playerCount = gameState.players.length;

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={leaveRoom}
            onConfirmLobby={() => {
              resetToLobby();
              setShowLeaveConfirm(false);
            }}
            isHost={isHost}
            inGame={false}
          />
        )}
        <div className="z-10 w-full max-w-lg bg-gray-900/90 backdrop-blur p-8 rounded-2xl border border-red-900/50 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            <h2 className="text-2xl font-serif text-red-500">
              Cabin: <span className="text-white font-mono">{roomId}</span>
            </h2>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded text-red-300"
              title="Leave Room"
            >
              <LogOut size={16} />
            </button>
          </div>
          <div className="bg-black/20 rounded-xl p-4 mb-8 border border-gray-800">
            <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-4 flex justify-between">
              <span>Crew ({gameState.players.length}/8)</span>
            </h3>
            <div className="space-y-2">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-gray-800/50 p-3 rounded border border-gray-700/50"
                >
                  <span
                    className={`font-bold flex items-center gap-2 ${
                      p.id === user.uid ? "text-red-400" : "text-gray-300"
                    }`}
                  >
                    <User
                      size={14}
                      className={
                        p.id === user.uid ? "text-red-400" : "text-gray-500"
                      }
                    />
                    {p.name}
                    {p.id === gameState.hostId && (
                      <Crown size={14} className="text-yellow-500" />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-xs flex items-center gap-1">
                      <CheckCircle size={12} /> Ready
                    </span>
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
              {gameState.players.length < 2 && (
                <div className="text-center text-gray-500 italic text-sm py-2">
                  Waiting for more agents...
                </div>
              )}
            </div>
          </div>
          {isHost && (
            <div className="bg-black/30 rounded-lg p-3 mb-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-red-300 font-bold mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
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
                      className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 text-white"
                    >
                      -
                    </button>
                    <button
                      onClick={() =>
                        updateDeckConfig(guardCount + 1, merchantCount)
                      }
                      disabled={guardCount >= 6}
                      className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 text-white"
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
                      className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 text-white"
                    >
                      -
                    </button>
                    <button
                      onClick={() =>
                        updateDeckConfig(guardCount, merchantCount + 1)
                      }
                      disabled={merchantCount >= 2}
                      className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 text-white"
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
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                gameState.players.length >= 2
                  ? "bg-green-700 hover:bg-green-600 text-white shadow-green-900/20"
                  : "bg-gray-800 cursor-not-allowed text-gray-500"
              }`}
            >
              {gameState.players.length < 2
                ? "Awaiting Agents..."
                : "Commence Operation"}
            </button>
          ) : (
            <div className="text-center text-red-400/60 animate-pulse font-serif italic">
              Waiting for Host command...
            </div>
          )}
        </div>
        <PiratesLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const isMerchantActive = gameState.merchantState && isMyTurn;
    const isHost = gameState.hostId === user.uid;

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />

        {/* FEEDBACK OVERLAY */}
        {feedbackOverlay && (
          <FeedbackOverlay
            type={feedbackOverlay.type}
            message={feedbackOverlay.message}
            subtext={feedbackOverlay.subtext}
            icon={feedbackOverlay.icon}
          />
        )}

        {activeModal && (
          <InfoModal
            title={activeModal.title}
            text={activeModal.text}
            type={activeModal.type}
            card={activeModal.card}
            compareCard={activeModal.compareCard}
            labels={activeModal.labels}
            onClose={() => setActiveModal(null)}
          />
        )}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={leaveRoom}
            onConfirmLobby={() => {
              resetToLobby();
              setShowLeaveConfirm(false);
            }}
            isHost={isHost}
            inGame={true}
          />
        )}
        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}
        <div className="h-14 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between px-4 z-[160] backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-2">
            <span className="font-serif text-red-500 font-bold tracking-wider hidden md:block">
              PIRATES
            </span>
            <span className="text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
              Room {gameState.roomId}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 hover:bg-gray-800 rounded text-gray-400"
              title="Guide"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(true)}
              className="p-2 hover:bg-gray-800 rounded text-gray-400"
              title="History"
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/50 rounded text-red-400"
              title="Leave"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 p-2 md:p-4 flex flex-col items-center justify-between relative z-10 max-w-6xl mx-auto w-full">
          <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-2 items-center text-gray-500 hidden md:flex">
            <div className="w-16 h-24 bg-gray-900/90 border-2 border-gray-700 rounded-lg flex items-center justify-center">
              <span className="font-bold text-xl">{gameState.deck.length}</span>
            </div>
            <span className="text-xs uppercase">Deck</span>
          </div>
          <div className="md:hidden bg-gray-800/80 px-3 py-1 rounded-full border border-gray-700 text-xs text-gray-400 mb-2">
            Deck:{" "}
            <span className="text-white font-bold">
              {gameState.deck.length}
            </span>
          </div>
          <div className="flex gap-2 md:gap-4 justify-center flex-wrap w-full">
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
                    relative bg-gray-900/90 p-2 md:p-3 rounded-lg md:rounded-xl border-2 w-36 md:w-48 transition-all cursor-pointer
                    ${
                      isActive
                        ? "border-red-500 shadow-red-500/20 shadow-lg scale-105"
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
                      <span
                        className={`font-bold truncate text-xs md:text-sm w-full ${
                          isActive ? "text-red-300" : "text-gray-300"
                        }`}
                      >
                        {p.name}
                      </span>
                    </div>
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
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 rounded-full whitespace-nowrap">
                        PLAYING
                      </div>
                    )}
                    {isSelectable && (
                      <div className="absolute inset-0 bg-orange-500/20 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-[10px] md:text-sm text-orange-300 animate-pulse">
                        TARGET
                      </div>
                    )}
                    {isCookProtected && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 rounded-full whitespace-nowrap z-20 shadow-lg">
                        IMMUNE
                      </div>
                    )}
                    {isThiefActive && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 rounded-full whitespace-nowrap z-20 shadow-lg">
                        THIEF
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
          <div
            className={`w-full max-w-2xl bg-gray-900/95 p-3 md:p-6 rounded-t-2xl md:rounded-t-3xl border-t border-red-900/50 backdrop-blur-md transition-colors ${
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
                  <span className="font-bold text-sm md:text-lg max-w-[80px] md:max-w-none truncate text-gray-300">
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
              <div className="flex flex-col items-end gap-1 max-w-[160px] md:max-w-xs">
                {isMyTurn && !me.eliminated && !isMerchantActive && (
                  <div className="text-green-400 font-bold animate-pulse uppercase tracking-widest text-xs md:text-sm mb-1 bg-green-900/20 px-2 py-0.5 rounded border border-green-500/50">
                    PLAYING
                  </div>
                )}
                <div className="flex gap-0.5 items-center bg-gray-900/50 p-1 md:p-2 rounded-lg border border-gray-700 w-full overflow-x-auto">
                  <span className="text-[8px] md:text-[10px] text-gray-500 uppercase mr-1 hidden md:inline shrink-0">
                    History
                  </span>
                  {me.playedCards &&
                    me.playedCards.map((c, idx) => (
                      <div key={idx} className="shrink-0">
                        <CardDisplay type={c} tiny />
                      </div>
                    ))}
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
        {gameState.status === "finished" &&
          !activeModal &&
          modalQueue.length === 0 && (
            <div className="fixed inset-0 top-14 bg-black/95 z-[150] flex flex-col items-center justify-center p-4 text-center">
              <Trophy
                size={48}
                className="text-yellow-400 mb-4 animate-bounce"
              />
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Game Over!
              </h1>
              <div className="text-xl md:text-2xl text-gray-300 mb-8">
                {
                  gameState.players.find((p) => p.id === gameState.winnerId)
                    ?.name
                }{" "}
                wins the treasure!
              </div>

              {gameState.hostId === user.uid ? (
                <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                  {!allReady && (
                    <div className="text-red-400 text-xs md:text-sm animate-pulse mb-1 flex items-center gap-2 justify-center">
                      <AlertTriangle size={16} /> Waiting for crew...
                    </div>
                  )}
                  {/* RESTART BUTTON */}
                  <button
                    onClick={restartGame}
                    disabled={!allReady}
                    className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl transition-all
                        ${
                          allReady
                            ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 text-white"
                            : "bg-gray-700 cursor-not-allowed text-gray-400"
                        }
                      `}
                  >
                    <RotateCcw size={20} /> Restart Game
                  </button>
                  <button
                    onClick={resetToLobby}
                    disabled={!allReady}
                    className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 border-2 transition-all
                        ${
                          allReady
                            ? "border-green-600 text-green-500 hover:bg-green-600/10"
                            : "border-gray-700 text-gray-500 cursor-not-allowed"
                        }
                      `}
                  >
                    <Home size={20} /> Return to Lobby
                  </button>
                </div>
              ) : (
                <button
                  onClick={setPlayerReady}
                  disabled={
                    gameState.players.find((p) => p.id === user.uid)
                      ?.readyForNext
                  }
                  className={`w-full max-w-xs py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                    gameState.players.find((p) => p.id === user.uid)
                      ?.readyForNext
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
        <PiratesLogo />
      </div>
    );
  }

  return null;
}
