import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, memo, useCallback } from "react";

const { width, height } = Dimensions.get("window");

// ─── Sizing ───────────────────────────────────────────────────────────────────
const CHROME_HEIGHT = 44 + 36 + 30 + 52 + 80;
const H_PAD = 24;
const BOARD_PAD = 8;
const GAP = 4;

const MAX_BOARD = Math.min(width - H_PAD * 2, height - CHROME_HEIGHT, 340);
const TILE_SIZE = Math.floor((MAX_BOARD - BOARD_PAD * 2 - GAP * 4) / 3);
const BOARD_SIZE = TILE_SIZE * 3 + GAP * 4 + BOARD_PAD * 2;
const TILE_FONT = Math.max(16, Math.round(TILE_SIZE * 0.38));
const BTN_WIDTH = Math.min(width - H_PAD * 2, 280);

const GRID_SIZE = TILE_SIZE * 3 + GAP * 2;
const INNER_BOARD = BOARD_SIZE - BOARD_PAD * 2;
const GRID_OFFSET = BOARD_PAD + (INNER_BOARD - GRID_SIZE) / 2;

// ─── Difficulty config ────────────────────────────────────────────────────────
const DIFFICULTY_CONFIG = {
  easy: { shuffleMoves: 20, accentColor: "#ff6b35", label: "EASY" },
  medium: { shuffleMoves: 80, accentColor: "#ff2d78", label: "MEDIUM" },
  hard: { shuffleMoves: 200, accentColor: "#7c3aed", label: "HARD" },
} as const;
type Difficulty = keyof typeof DIFFICULTY_CONFIG;

// ─── Particle — memo so it NEVER re-renders after mount ───────────────────────
const Particle = memo(function Particle({ delay, x, size, duration, color, rotation }: {
  delay: number; x: number; size: number;
  duration: number; color: string; rotation: number;
}) {
  const translateY = useRef(new Animated.Value(height + 20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(height + 20);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -20, duration, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.75, duration: 600, useNativeDriver: true }),
            Animated.delay(duration - 1200),
            Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View style={{
      position: "absolute", left: x, width: size, height: size,
      backgroundColor: color,
      transform: [{ translateY }, { rotate: `${rotation}deg` }],
      opacity,
      shadowColor: color, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1, shadowRadius: size * 2.5,
    }} />
  );
});

// ─── Noise cells ──────────────────────────────────────────────────────────────
const NOISE_CELLS = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  x: Math.random() * width, y: Math.random() * height,
  w: Math.random() * 60 + 20, h: Math.random() * 3 + 1,
  opacity: Math.random() * 0.03 + 0.01,
}));

// ─── Vignette ring ────────────────────────────────────────────────────────────
const VignetteRing = memo(function VignetteRing({ radius, delay, color }: {
  radius: number; delay: number; color: string;
}) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 5000 + delay * 0.4, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.85, duration: 5000 + delay * 0.4, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <Animated.View pointerEvents="none" style={{
      position: "absolute",
      left: width / 2 - radius, top: height * 0.28 - radius,
      width: radius * 2, height: radius * 2, borderRadius: radius,
      borderWidth: 1, borderColor: color,
      opacity: Animated.multiply(opacity, new Animated.Value(0.12)) as any,
      transform: [{ scale }],
    }} />
  );
});

// ─── Background — memo so it never re-renders ─────────────────────────────────
const Background = memo(function Background() {
  const breathe = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(breathe, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(shimmer, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ])).start();
  }, []);

  return (
    <>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#07000f" }]} />
      <Animated.View pointerEvents="none" style={{
        position: "absolute", bottom: -height * 0.2, left: -width * 0.15,
        width: width * 1.3, height: height * 0.55, borderRadius: height * 0.4,
        backgroundColor: "#1f0030",
        opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.0] }),
      }} />
      <Animated.View pointerEvents="none" style={{
        position: "absolute", top: -height * 0.05, left: -width * 0.1,
        width: width * 1.2, height: height * 0.5, borderRadius: height * 0.4,
        backgroundColor: "#050020",
        opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.5] }),
      }} />
      <Animated.View pointerEvents="none" style={{
        position: "absolute", top: height * 0.14, left: width * 0.5 - 130,
        width: 260, height: 260, borderRadius: 130, backgroundColor: "#3d0020",
        opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.75] }),
      }} />
      <Animated.View pointerEvents="none" style={{
        position: "absolute", top: height * 0.4, right: -80,
        width: 220, height: 320, borderRadius: 160, backgroundColor: "#2a0a00",
        opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] }),
      }} />
      <Animated.View pointerEvents="none" style={{
        position: "absolute", top: height * 0.5, left: -60,
        width: 200, height: 280, borderRadius: 140, backgroundColor: "#150030",
        opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.65] }),
      }} />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {NOISE_CELLS.map(cell => (
          <View key={cell.id} style={{
            position: "absolute", left: cell.x, top: cell.y,
            width: cell.w, height: cell.h,
            backgroundColor: "#ffffff", opacity: cell.opacity,
          }} />
        ))}
      </View>
      <VignetteRing radius={160} delay={0} color="#ff2d78" />
      <VignetteRing radius={220} delay={400} color="#7c3aed" />
      <VignetteRing radius={290} delay={800} color="#ff6b35" />
      <VignetteRing radius={370} delay={1200} color="#ff2d78" />
      <View pointerEvents="none" style={{
        position: "absolute", top: 0, left: 0, right: 0, height: height * 0.12,
        backgroundColor: "#07000f", opacity: 0.45,
      }} />
    </>
  );
});

// ─── Action button ────────────────────────────────────────────────────────────
function ActionButton({ label, onPress, accentColor, btnWidth = BTN_WIDTH }: {
  label: string; onPress: () => void; accentColor: string; btnWidth?: number;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;
  const borderOpacity = useRef(new Animated.Value(0.35)).current;
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(borderOpacity, { toValue: 0.7, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(borderOpacity, { toValue: 0.35, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ])).start();
  }, []);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
    shimmerX.setValue(-1);
    Animated.timing(shimmerX, { toValue: 2, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  };
  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 18 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }], width: btnWidth }}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={{
          paddingVertical: 16, borderWidth: 1,
          borderColor: borderOpacity.interpolate({
            inputRange: [0.35, 0.7],
            outputRange: [accentColor + "59", accentColor + "b3"],
          }),
          backgroundColor: pressed ? accentColor + "1a" : "transparent",
          overflow: "hidden", alignItems: "center",
        }}>
          <Animated.View pointerEvents="none" style={{
            position: "absolute", top: 0, bottom: 0, width: 80,
            backgroundColor: "#ffffff", opacity: 0.06,
            left: shimmerX.interpolate({ inputRange: [-1, 2], outputRange: [-80, btnWidth + 80] }),
            transform: [{ skewX: "-15deg" }],
          }} />
          <Text style={{
            fontSize: 13, fontWeight: "800", letterSpacing: 6,
            color: pressed ? accentColor : "#ccc0dc", textAlign: "center",
            textShadowColor: accentColor,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: pressed ? 12 : 0,
          }}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Tile — memo so only moved tiles re-render ────────────────────────────────
const Tile = memo(function Tile({
  value,
  index,
  accentColor,
  onPress,
}: {
  value: number;
  index: number;
  accentColor: string;
  onPress: (index: number) => void;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const row = Math.floor(index / 3);
  const col = index % 3;

  const position = useRef(
    new Animated.ValueXY({
      x: GRID_OFFSET + col * (TILE_SIZE + GAP),
      y: GRID_OFFSET + row * (TILE_SIZE + GAP),
    })
  ).current;

  useEffect(() => {
    Animated.spring(position, {
      toValue: {
        x: GRID_OFFSET + col * (TILE_SIZE + GAP),
        y: GRID_OFFSET + row * (TILE_SIZE + GAP),
      },
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [index]);

  if (value === 0) return null;

  return (
    <Animated.View style={{
      position: "absolute", width: TILE_SIZE, height: TILE_SIZE,
      transform: [{ translateX: position.x }, { translateY: position.y }, { scale: pressScale }],
    }}>
      <Pressable
        style={{ flex: 1 }}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.92, useNativeDriver: true }).start()}
        onPress={() => {
          Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start();
          onPress(index);
        }}
      >
        <View style={{
          flex: 1, borderWidth: 1, alignItems: "center", justifyContent: "center",
          borderColor: accentColor + "88", backgroundColor: accentColor + "12",
        }}>
          <Text style={{ fontSize: TILE_FONT, fontWeight: "900", letterSpacing: 2, color: "#f0eaff" }}>
            {value}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ─── Timer — created once, reads refs, never restarts ─────────────────────────
function Timer({
  startTimeRef,
  isWon,
  accentColor,
}: {
  startTimeRef: React.MutableRefObject<number | null>;
  isWon: boolean;
  accentColor: string;
}) {
  const [time, setTime] = useState(0);
  const isWonRef = useRef(isWon);

  useEffect(() => { isWonRef.current = isWon; }, [isWon]);

  useEffect(() => {
    const id = setInterval(() => {
      if (startTimeRef.current && !isWonRef.current) {
        setTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  const m = Math.floor(time / 60);
  const s = time % 60;

  return (
    <Text style={[styles.timerText, { color: accentColor }]}>
      {`${m}:${s.toString().padStart(2, "0")}`}
    </Text>
  );
}

// ─── Win overlay ──────────────────────────────────────────────────────────────
function WinOverlay({ moves, accentColor, onReplay, onMenu }: {
  moves: number; accentColor: string; onReplay: () => void; onMenu: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const cardWidth = Math.min(width - H_PAD * 2, 300);
  const halfBtn = (cardWidth - 40) / 2;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.winOverlay, { opacity }]}>
      <Animated.View style={[styles.winCard, { width: cardWidth, transform: [{ scale }], borderColor: accentColor + "66" }]}>
        <View style={[styles.winAccentLine, { backgroundColor: accentColor }]} />
        <Text style={[styles.winTitle, { color: accentColor, textShadowColor: accentColor }]}>SOLVED</Text>
        <View style={styles.winDivider}>
          <View style={[styles.dash, { backgroundColor: "#ff6b35" }]} />
          <Text style={styles.winSubtitle}>PUZZLE COMPLETE</Text>
          <View style={[styles.dash, { backgroundColor: "#ff2d78" }]} />
        </View>
        <Text style={[styles.winMoves, { color: accentColor }]}>{moves}</Text>
        <Text style={styles.winMovesLabel}>MOVES</Text>
        <View style={styles.winButtons}>
          <ActionButton label="AGAIN" onPress={onReplay} accentColor={accentColor} btnWidth={halfBtn} />
          <ActionButton label="MENU" onPress={onMenu} accentColor="#7c3aed" btnWidth={halfBtn} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GameScreen() {
  const router = useRouter();
  const { difficulty = "medium" } = useLocalSearchParams<{ difficulty: string }>();
  const config = DIFFICULTY_CONFIG[(difficulty as Difficulty)] ?? DIFFICULTY_CONFIG.medium;
  const { accentColor, shuffleMoves, label: diffLabel } = config;

  const [board, setBoard] = useState([1, 2, 3, 4, 5, 6, 7, 8, 0]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const startTimeRef = useRef<number | null>(null);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const particles = useRef(
    Array.from({ length: 40 }, (_, i) => {
      const palette = ["#ff6b35", "#ff2d78", "#c026d3", "#7c3aed", "#ff6b35", "#ff2d78", "#ff6b35", "#7c3aed"];
      return {
        id: i, x: Math.random() * width,
        size: Math.random() * 4 + 1.5,
        delay: Math.random() * 5000,
        duration: Math.random() * 7000 + 6000,
        color: palette[i % palette.length],
        rotation: Math.random() * 360,
      };
    })
  ).current;

  function checkWin(b: number[]) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 0].every((v, i) => v === b[i]);
  }

  function shuffleBoard() {
    let b = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    for (let i = 0; i < shuffleMoves; i++) {
      const ei = b.indexOf(0);
      const r = Math.floor(ei / 3), c = ei % 3;
      const opts: number[] = [];
      if (r > 0) opts.push(ei - 3);
      if (r < 2) opts.push(ei + 3);
      if (c > 0) opts.push(ei - 1);
      if (c < 2) opts.push(ei + 1);
      const pick = opts[Math.floor(Math.random() * opts.length)];
      b[ei] = b[pick];
      b[pick] = 0;
    }
    setBoard(b);
    setMoves(0);
    setIsWon(false);
    setHasStarted(true);
    startTimeRef.current = Date.now();
  }

  // useCallback so Tile memo isn't invalidated by a new function ref each render
  const handleTilePress = useCallback((index: number) => {
    setBoard(prev => {
      const ei = prev.indexOf(0);
      const r = Math.floor(index / 3), c = index % 3;
      const er = Math.floor(ei / 3), ec = ei % 3;
      const adj = (r === er && Math.abs(c - ec) === 1) || (c === ec && Math.abs(r - er) === 1);
      if (!adj) return prev;
      const nb = [...prev];
      nb[ei] = prev[index]; nb[index] = 0;
      if (checkWin(nb)) setIsWon(true);
      return nb;
    });
    setMoves(m => m + 1);
  }, []);

  return (
    <View style={styles.container}>
      <Background />

      {particles.map(p => (
        <Particle key={p.id} x={p.x} size={p.size} delay={p.delay}
          duration={p.duration} color={p.color} rotation={p.rotation} />
      ))}

      <Animated.View style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>

        <View style={styles.header}>
          <Text style={[styles.diffBadge, { color: accentColor, borderColor: accentColor + "55" }]}>
            {diffLabel}
          </Text>
          <Timer startTimeRef={startTimeRef} isWon={isWon} accentColor={accentColor} />
          <Text style={[styles.movesText, { color: accentColor }]}>
            {moves} <Text style={styles.movesLabel}>MOVES</Text>
          </Text>
        </View>

        <View style={[styles.board, { borderColor: accentColor + "33" }]}>
          {board.map((tile, index) => (
            <Tile
              key={tile}
              value={tile}
              index={index}
              onPress={handleTilePress}
              accentColor={accentColor}
            />
          ))}
        </View>

        <View style={{ marginTop: 6 }}>
          <ActionButton
            label={hasStarted ? "SHUFFLE" : "START"}
            onPress={shuffleBoard}
            accentColor={accentColor}
          />
        </View>

      </Animated.View>

      {isWon && (
        <WinOverlay
          moves={moves}
          accentColor={accentColor}
          onReplay={shuffleBoard}
          onMenu={() => router.push("/menu")}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: H_PAD },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: BOARD_SIZE, marginBottom: 20 },
  diffBadge: { fontSize: 11, letterSpacing: 5, fontWeight: "800", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  movesText: { fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  movesLabel: { fontSize: 9, letterSpacing: 3, fontWeight: "700", color: "#6b4a5e" },
  board: { width: BOARD_SIZE, height: BOARD_SIZE, position: "relative", borderWidth: 1, marginBottom: 22, backgroundColor: "#0a0015" },
  timerText: { fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  winOverlay: { backgroundColor: "#07000fcc", alignItems: "center", justifyContent: "center" },
  winCard: { borderWidth: 1, backgroundColor: "#0e0018", alignItems: "center", paddingBottom: 28, overflow: "hidden" },
  winAccentLine: { width: "50%", height: 2, marginBottom: 24 },
  winTitle: { fontSize: 48, fontWeight: "900", letterSpacing: 8, textShadowOffset: { width: 2, height: 0 }, textShadowRadius: 12 },
  winDivider: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 24 },
  winSubtitle: { fontSize: 9, letterSpacing: 4, color: "#6b4a5e", fontWeight: "700" },
  winMoves: { fontSize: 56, fontWeight: "900", letterSpacing: 4 },
  winMovesLabel: { fontSize: 9, letterSpacing: 5, color: "#6b4a5e", fontWeight: "700", marginBottom: 28 },
  winButtons: { flexDirection: "row", gap: 12, paddingHorizontal: 14 },
  dash: { width: 20, height: 1 },
});