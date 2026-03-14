import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  BackHandler,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

const { width, height } = Dimensions.get("window");

// ─── ORIGINAL: Floating upward particle ──────────────────────────────────────
function Particle({
  delay,
  x,
  size,
  duration,
  color,
  rotation,
}: {
  delay: number;
  x: number;
  size: number;
  duration: number;
  color: string;
  rotation: number;
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
          Animated.timing(translateY, {
            toValue: -20,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
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
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        width: size,
        height: size,
        backgroundColor: color,
        transform: [{ translateY }, { rotate: `${rotation}deg` }],
        opacity,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: size * 2.5,
      }}
    />
  );
}

// ─── KEPT: Glitch letter ──────────────────────────────────────────────────────
function GlitchLetter({ char, index }: { char: string; index: number }) {
  const glitch = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const triggerGlitch = () => {
      Animated.sequence([
        Animated.delay(1800 + index * 250 + Math.random() * 2500),
        Animated.timing(glitch, { toValue: 1, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch, { toValue: -1, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch, { toValue: 0.6, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch, { toValue: -0.3, duration: 40, useNativeDriver: true }),
        Animated.timing(glitch, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start(() => triggerGlitch());
    };
    triggerGlitch();
  }, []);

  const translateX = glitch.interpolate({ inputRange: [-1, 0, 1], outputRange: [-7, 0, 7] });

  return (
    <Animated.Text
      style={{
        fontSize: 72,
        fontWeight: "900",
        letterSpacing: 5,
        transform: [{ translateX }],
        color: "#f8f8ff",
        textShadowColor: "#ff6b35",
        textShadowOffset: { width: 2, height: 0 },
        textShadowRadius: 10,
      }}
    >
      {char}
    </Animated.Text>
  );
}

// ─── Stylish centered equal-width button ──────────────────────────────────────
function MenuButton({
  label,
  onPress,
  delay,
  accentColor,
}: {
  label: string;
  onPress?: () => void;
  delay: number;
  accentColor: string;
}) {
  const fadeY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;
  const borderOpacity = useRef(new Animated.Value(0.35)).current;
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 340, useNativeDriver: true }),
      ]),
    ]).start();

    // idle border pulse
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay + 600),
        Animated.timing(borderOpacity, { toValue: 0.7, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(borderOpacity, { toValue: 0.35, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
    // shimmer sweep on press
    shimmerX.setValue(-1);
    Animated.timing(shimmerX, { toValue: 2, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 18 }).start();
  };

  return (
    <Animated.View style={{
      opacity,
      transform: [{ translateY: fadeY }, { scale: pressScale }],
      marginBottom: 16,
      width: 280,
    }}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={{
          paddingVertical: 20,
          borderWidth: 1,
          borderColor: borderOpacity.interpolate({
            inputRange: [0.35, 0.7],
            outputRange: [accentColor + "59", accentColor + "b3"],
          }),
          backgroundColor: pressed ? accentColor + "1a" : "transparent",
          overflow: "hidden",
          alignItems: "center",
        }}>
          {/* shimmer sweep */}
          <Animated.View pointerEvents="none" style={{
            position: "absolute",
            top: 0, bottom: 0,
            width: 80,
            backgroundColor: "#ffffff",
            opacity: 0.06,
            left: shimmerX.interpolate({ inputRange: [-1, 2], outputRange: [-80, 360] }),
            transform: [{ skewX: "-15deg" }],
          }} />

          <Text style={{
            fontSize: 15,
            fontWeight: "800",
            letterSpacing: 8,
            color: pressed ? accentColor : "#ccc0dc",
            textAlign: "center",
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

// ─── NEW BG: Noise texture via many tiny random rects ────────────────────────
const NOISE_CELLS = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  x: Math.random() * width,
  y: Math.random() * height,
  w: Math.random() * 60 + 20,
  h: Math.random() * 3 + 1,
  opacity: Math.random() * 0.03 + 0.01,
}));

// ─── NEW BG: Pulsing vignette rings ──────────────────────────────────────────
function VignetteRing({ radius, delay, color }: { radius: number; delay: number; color: string }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 5000 + delay * 0.4, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.85, duration: 5000 + delay * 0.4, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: width / 2 - radius,
        top: height * 0.28 - radius,
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        borderWidth: 1,
        borderColor: color,
        opacity: Animated.multiply(opacity, new Animated.Value(0.12)) as any,
        transform: [{ scale }],
      }}
    />
  );
}

// ─── NEW BG: Full background composition ─────────────────────────────────────
function Background() {
  const breathe = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(breathe, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <>
      {/* Void base */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#07000f"}]} />

      {/* Deep magenta floor bleed - fully covers bottom */}
      <Animated.View pointerEvents="none" style={{
        position: "absolute",
        bottom: -height * 0.2,
        left: -width * 0.15,
        width: width * 1.3,
        height: height * 0.55,
        borderRadius: height * 0.4,
        backgroundColor: "#1f0030",
        opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.0] }),
      }} />

      {/* Top cold indigo cap - fully covers top */}
      <Animated.View pointerEvents="none" style={{
        position: "absolute",
        top: -height * 0.05,
        left: -width * 0.1,
        width: width * 1.2,
        height: height * 0.5,
        borderRadius: height * 0.4,
        backgroundColor: "#050020",
        opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.5] }),
      }} />

      {/* Ember core — sits behind title */}
      <Animated.View pointerEvents="none" style={{
        position: "absolute",
        top: height * 0.14,
        left: width * 0.5 - 130,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: "#3d0020",
        opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.75] }),
      }} />

      {/* Right side amber leak */}
      <Animated.View pointerEvents="none" style={{
        position: "absolute",
        top: height * 0.4,
        right: -80,
        width: 220,
        height: 320,
        borderRadius: 160,
        backgroundColor: "#2a0a00",
        opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] }),
      }} />

      {/* Left cool violet leak */}
      <Animated.View pointerEvents="none" style={{
        position: "absolute",
        top: height * 0.5,
        left: -60,
        width: 200,
        height: 280,
        borderRadius: 140,
        backgroundColor: "#150030",
        opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.65] }),
      }} />

      {/* Noise grain overlay */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {NOISE_CELLS.map((cell) => (
          <View
            key={cell.id}
            style={{
              position: "absolute",
              left: cell.x,
              top: cell.y,
              width: cell.w,
              height: cell.h,
              backgroundColor: "#ffffff",
              opacity: cell.opacity,
            }}
          />
        ))}
      </View>

      {/* Pulsing concentric rings around title */}
      <VignetteRing radius={160} delay={0}    color="#ff2d78" />
      <VignetteRing radius={220} delay={400}  color="#7c3aed" />
      <VignetteRing radius={290} delay={800}  color="#ff6b35" />
      <VignetteRing radius={370} delay={1200} color="#ff2d78" />

      {/* Soft edge fade - top */}
      <View pointerEvents="none" style={{
        position: "absolute", top: 0, left: 0, right: 0, height: height * 0.12,
        backgroundColor: "#07000f", opacity: 0.45,
      }} />
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MenuScreen() {
  const router = useRouter();

  const chromaShift = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(-40)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  // ─── EXIT handler ───────────────────────────────────────────────────────────
  const handleExit = () => {
    if (Platform.OS === "android") {
      BackHandler.exitApp();
    } else {
      // iOS doesn't allow programmatic exit per Apple guidelines.
      // Best practice: go back to the root or do nothing.
      // If you're using Expo Go, this will simply be a no-op on iOS.
      router.dismissAll?.();
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(chromaShift, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(chromaShift, { toValue: -1, duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const titleChars = "VOLATILE".split("");

  // Particle data — stable across renders, includes random rotation per particle
  const particles = useRef(
    Array.from({ length: 40 }, (_, i) => {
      const palette = [
        "#ff6b35", "#ff2d78", "#c026d3", "#7c3aed",
        "#ff6b35", "#ff2d78", "#ff6b35", "#7c3aed",
      ];
      return {
        id: i,
        x: Math.random() * width,
        size: Math.random() * 4 + 1.5,
        delay: Math.random() * 5000,
        duration: Math.random() * 7000 + 6000,
        color: palette[i % palette.length],
        rotation: Math.random() * 360,
      };
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* ── BACKGROUND ── */}
      <Background />

      {/* ── PARTICLES (rising dots at random rotations) ── */}
      {particles.map((p) => (
        <Particle
          key={p.id}
          x={p.x}
          size={p.size}
          delay={p.delay}
          duration={p.duration}
          color={p.color}
          rotation={p.rotation}
        />
      ))}

      {/* ── CONTENT ── */}
      <View style={styles.content}>

        {/* Title */}
        <Animated.View style={[styles.titleZone, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
          <Animated.View style={[styles.titleGhostLayer, {
            transform: [{ translateX: chromaShift.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] }) }],
          }]}>
            {titleChars.map((c, i) => (
              <Text key={i} style={[styles.titleGhostChar, { color: "#00e5ff" }]}>{c}</Text>
            ))}
          </Animated.View>
          <Animated.View style={[styles.titleGhostLayer, {
            transform: [{ translateX: chromaShift.interpolate({ inputRange: [-1, 1], outputRange: [4, -4] }) }],
          }]}>
            {titleChars.map((c, i) => (
              <Text key={i} style={[styles.titleGhostChar, { color: "#ff2d78" }]}>{c}</Text>
            ))}
          </Animated.View>
          <View style={styles.titleRealLayer}>
            {titleChars.map((c, i) => (
              <GlitchLetter key={i} char={c} index={i} />
            ))}
          </View>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineRow, { opacity: subtitleOpacity }]}>
          <View style={[styles.taglineDash, { backgroundColor: "#ff6b35" }]} />
          <Text style={styles.tagline}>SLIDE  ·  SOLVE  ·  CONQUER</Text>
          <View style={[styles.taglineDash, { backgroundColor: "#ff2d78" }]} />
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.menuBlock, { opacity: subtitleOpacity , marginTop: 60}]}>
          <MenuButton label="PLAY" onPress={() => router.push("/mode")} delay={500} accentColor="#ff6b35" />
          {/* <MenuButton label="SETTINGS" onPress={() => router.push("/settings")} delay={620} accentColor="#ff2d78" /> */}
          <MenuButton label="EXIT" onPress={handleExit} delay={740} accentColor="#7c3aed" />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // Title
  titleZone: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  titleGhostLayer: {
    position: "absolute",
    flexDirection: "row",
    opacity: 0.35,
  },
  titleGhostChar: {
    fontSize: 72,
    fontWeight: "900",
    letterSpacing: 5,
  },
  titleRealLayer: {
    position: "absolute",
    flexDirection: "row",
  },

  // Tagline
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 36,
  },
  taglineDash: {
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  tagline: {
    fontSize: 10,
    letterSpacing: 4,
    color: "#6b4a5e",
    fontWeight: "700",
  },

  // Buttons
  menuBlock: { alignItems: "center" },
});