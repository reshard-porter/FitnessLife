/**
 * FitnessLife — single-file Ionic-style React fitness studio (Sworkit-inspired visual system)
 * ---------------------------------------------------------------------------
 * • iPhone / Android shell with iOS (Cupertino) and Material Design modes
 * • Apple Watch Ultra companion (docked or floating PiP) with bi-directional sync
 * • Web Audio API procedural music engine (4 tracks), Auto-Tempo, −12 dB ducking
 * • speechSynthesis voice coach + harmonic chime cues
 * • 60 fps skeletal motion coach with rep counter, tempo pacer, joint angles
 * • Circuit builder + generator, muscle fatigue heatmap, 150-min challenge, medals
 * • Native Bridge inspector (Capacitor WatchConnectivity / HealthKit / MediaSession)
 *
 * Requires: react, lucide-react, Tailwind CSS (utility classes, arbitrary values).
 * No external audio or image assets — everything is synthesized or drawn.
 */
import React, { useState, useEffect, useRef, useId } from "react";
import {
  ExternalLink,
  Play, Pause, SkipForward, SkipBack, Heart, HeartPulse, Flame, Timer, Music2,
  Volume2, Mic, MicOff, Watch, Smartphone, Monitor, PictureInPicture2, Columns2,
  Activity, Dumbbell, ChevronUp, ChevronDown, Plus, Minus, Trash2, Wand2, Trophy,
  Code2, X, Zap, Gauge, Flag, RotateCcw, Copy, Target, CalendarCheck, Search,
  Lock, Droplets, Waves, Footprints, Signal, Wifi, BatteryFull, Radio, Shield,
  ArrowLeftRight, Sparkles, Info, Check, Megaphone, ArrowLeft, Share2, Video, SlidersHorizontal,
  Users, Clock, Leaf, CalendarDays, ListChecks, ChevronLeft, ChevronRight,
} from "lucide-react";

/* ═══════════════════════════ DOMAIN DATA ═══════════════════════════ */

const ZONES = [
  null,
  { n: 1, name: "Warm-up", color: "#8EA6C9", lo: 60, hi: 114 },
  { n: 2, name: "Fat Burn", color: "#39A7FF", lo: 114, hi: 133 },
  { n: 3, name: "Aerobic", color: "#2FD08A", lo: 133, hi: 152 },
  { n: 4, name: "Threshold", color: "#FFB020", lo: 152, hi: 171 },
  { n: 5, name: "Anaerobic Peak", color: "#FF3B5C", lo: 171, hi: 190 },
];
const zoneOf = (hr) => (hr >= 171 ? 5 : hr >= 152 ? 4 : hr >= 133 ? 3 : hr >= 114 ? 2 : 1);
const zoneMid = (z) => [0, 100, 124, 142, 161, 177][z];
const kcalPerMin = (hr) => Math.max(1.1, (hr - 58) * 0.105);

const TRACKS = [
  { id: 0, title: "Neon Tabata Drive", genre: "Synthwave", bpm: 140, color: "#FF4FD8" },
  { id: 1, title: "Endurance House Flow", genre: "Deep House", bpm: 126, color: "#39A7FF" },
  { id: 2, title: "Peak Plyo Bass", genre: "Drum & Bass · HIIT", bpm: 155, color: "#FF8A1F" },
  { id: 3, title: "Zen Mobility & Recovery", genre: "Ambient Lo-Fi", bpm: 88, color: "#2FD08A" },
];
const TEMPO_FACTOR = [1, 0.86, 0.93, 1, 1.07, 1.14];

const SIGNATURE_EX = [
  { id: "pushup", name: "Alternating Push-up Plank", short: "Push-up Plank", level: 2, equip: "None", category: "Plank", intensity: 0.62, tempo: 3.0, joint: "elbow", alt: true,
    muscles: { chest: 14, triceps: 10, shoulders: 8, core: 8 }, cue: "Brace your core and keep one straight line from head to heels. Elbows track at forty-five degrees." },
  { id: "spider", name: "Spiderman Plank Crunch", short: "Spiderman Crunch", level: 2, equip: "None", category: "Plank", intensity: 0.58, tempo: 2.4, joint: "knee", alt: true,
    muscles: { core: 14, obliques: 12, shoulders: 6, quads: 4 }, cue: "Drive the knee toward the same-side elbow. Keep the hips low and level." },
  { id: "jumpsquat", name: "Plyometric Jump Squats", short: "Jump Squats", level: 3, equip: "None", category: "Plyo", intensity: 0.95, tempo: 2.2, joint: "knee", alt: false,
    muscles: { quads: 16, glutes: 14, calves: 10, hamstrings: 6 }, cue: "Sit back into the hips, then explode up. Land softly through the midfoot." },
  { id: "renegade", name: "Renegade Plank Rows", short: "Renegade Rows", level: 3, equip: "Dumbbells", category: "Plank", intensity: 0.72, tempo: 2.8, joint: "elbow", alt: true,
    muscles: { lats: 14, core: 10, biceps: 8, shoulders: 6 }, cue: "Feet wide, hips square to the floor. Pull the elbow back toward the hip." },
  { id: "rdl", name: "Single-Leg Romanian Reach", short: "Single-Leg RDL", level: 2, equip: "None", category: "Balance", intensity: 0.5, tempo: 3.4, joint: "hip", alt: true,
    muscles: { hamstrings: 14, glutes: 12, lowerback: 8, core: 4 }, cue: "Hinge from the hip with a flat back. Reach long through the back heel." },
  { id: "burpee", name: "Burpee Broad Thrust", short: "Burpee Thrust", level: 3, equip: "None", category: "Plyo", intensity: 1.0, tempo: 3.0, joint: "knee", alt: false,
    muscles: { quads: 12, chest: 10, glutes: 10, shoulders: 8, core: 8, calves: 6 }, cue: "Chest to the floor, snap the feet in, then jump forward as far as you can." },
  { id: "hollow", name: "Hollow Body Scissor Hold", short: "Hollow Scissors", level: 2, equip: "Mat", category: "Plank", intensity: 0.45, tempo: 1.6, joint: "hip", alt: false,
    muscles: { core: 16, obliques: 6, quads: 4 }, cue: "Press your low back into the floor. Small, fast scissors." },
  { id: "scorpion", name: "Thoracic Scorpion Bridge", short: "Scorpion Bridge", level: 1, equip: "Mat", category: "Mobility", intensity: 0.35, tempo: 4.0, joint: "hip", alt: true,
    muscles: { lowerback: 10, glutes: 8, obliques: 8, traps: 6 }, cue: "Keep both shoulders heavy on the floor. Rotate through the mid back." },
];

/* ═══════════════════════ EXERCISE LIBRARY ═══════════════════════
   Every exercise maps to an animated movement pattern (POSES below).
   Row: [name, pattern, category, level 1-3, equipment, "primary secondary …", intensity 0-1, cue, flags]
   flags: "s" = one-sided → generates (Left) and (Right) entries.                                    */

// pattern → [seconds per rep, tracked joint, alternates sides each rep]
const PMETA = {
  squat: [2.6, "knee", false], goblet: [2.8, "knee", false], lunge: [2.8, "knee", true], split: [2.6, "knee", false], bulgarian: [3, "knee", false],
  kneedrive: [1.1, "hip", true], buttkick: [0.9, "knee", true], calfraise: [1.6, "knee", false], hinge: [3, "hip", false], goodmorning: [3, "hip", false],
  kbswing: [1.8, "hip", false], curl: [2.6, "elbow", false], press: [2.6, "elbow", false], raise: [2.6, "elbow", false], row: [2.6, "elbow", false],
  kickback: [2.4, "elbow", false], ohext: [2.6, "elbow", false], dip: [2.8, "elbow", false], kneepush: [2.8, "elbow", false], pikepush: [3, "elbow", false],
  plank: [4, "hip", false], highplank: [4, "elbow", false], plankupdown: [3, "elbow", true], sideplank: [3.2, "hip", false], climber: [0.9, "knee", true],
  shouldertap: [1.6, "elbow", true], bearcrawl: [1.6, "knee", true], birddog: [3, "hip", true], catcow: [4, "hip", false], child: [5, "hip", false],
  cobra: [4, "elbow", false], superman: [3, "hip", false], bridge: [2.6, "hip", false], slbridge: [2.8, "hip", false], crunch: [2.2, "hip", false],
  situp: [2.8, "hip", false], bicycle: [1.4, "knee", true], legraise: [3, "hip", false], revcrunch: [2.4, "hip", false], vup: [2.6, "hip", false],
  twist: [1.6, "elbow", true], deadbug: [3, "knee", true], jack: [0.9, "elbow", false], skater: [1.4, "knee", true], tuck: [1.6, "knee", false],
  inchworm: [5, "hip", false], wallsit: [4, "knee", false], toetouch: [4, "hip", false], quadstretch: [5, "knee", false], hipflexor: [5, "hip", false],
  armcircle: [2, "elbow", false], neck: [4, "hip", false], seated: [2.6, "knee", false], seatankle: [2.2, "knee", false], seatmarch: [1.8, "hip", true],
  donkey: [2.2, "hip", false], hydrant: [2.2, "hip", false], clam: [2.2, "knee", false], sidelying: [2.4, "hip", false], pullup: [3.2, "elbow", false],
  pullapart: [2.2, "elbow", false], fly: [3, "elbow", false], floorpress: [2.6, "elbow", false], pullover: [3, "elbow", false], shrug: [2, "elbow", false],
  uprightrow: [2.4, "elbow", false], woodchop: [2.2, "hip", true], punch: [0.8, "elbow", true], legswing: [1.6, "hip", false], pistol: [3.4, "knee", false],
  sidebend: [3, "hip", true], tree: [5, "knee", false], warrior: [5, "knee", false], downdog: [5, "hip", false], seatfold: [5, "hip", false],
  butterfly: [3, "knee", false], wristcurl: [1.8, "elbow", false], toecrunch: [2.2, "hip", false],
  pushup: [3, "elbow", true], spider: [2.4, "knee", true], jumpsquat: [2.2, "knee", false], renegade: [2.8, "elbow", true], rdl: [3.4, "hip", true],
  burpee: [3, "knee", false], hollow: [1.6, "hip", false], scorpion: [4, "hip", true],
};

const LIB_ROWS = [
  // ── Chest ──
  ["Standard Push-up", "pushup", "Strength", 2, "None", "chest triceps shoulders core", 0.6, "Lower as one unit until your chest hovers above the floor."],
  ["Wide Push-up", "pushup", "Strength", 2, "None", "chest shoulders triceps", 0.6, "Hands wider than shoulders. Keep elbows soft at the top."],
  ["Diamond Push-up", "pushup", "Strength", 3, "None", "triceps chest shoulders", 0.64, "Thumbs and index fingers touch. Elbows brush your ribs."],
  ["Knee Push-up", "kneepush", "Strength", 1, "None", "chest triceps shoulders", 0.45, "Straight line from knees to head. Lower with control."],
  ["Incline Push-up", "kneepush", "Strength", 1, "Chair", "chest triceps shoulders", 0.42, "Hands on a sturdy chair. Body stays in one plank line."],
  ["Wall Push-up", "kneepush", "Strength", 1, "None", "chest triceps shoulders", 0.3, "Lean into the wall, then press away with straight arms."],
  ["Decline Push-up", "pushup", "Strength", 3, "Chair", "chest shoulders triceps core", 0.66, "Feet on the chair. Keep hips from sagging."],
  ["Staggered Push-up", "pushup", "Strength", 2, "None", "chest triceps shoulders", 0.6, "Offset your hands and switch sides each set."],
  ["Archer Push-up", "pushup", "Strength", 3, "None", "chest triceps shoulders core", 0.66, "Shift toward one hand while the other arm stays long."],
  ["Hindu Push-up", "pikepush", "Strength", 3, "None", "chest shoulders triceps lowerback", 0.66, "Swoop from pike through the floor into an upward arch."],
  ["Clap Push-up", "pushup", "Plyo", 3, "None", "chest triceps shoulders", 0.85, "Push explosively, clap, and land with soft elbows."],
  ["T Push-up", "sideplank", "Strength", 3, "None", "chest obliques shoulders core", 0.64, "After each rep rotate into a side plank, arm to the sky."],
  ["Slow Tempo Push-up", "pushup", "Strength", 2, "None", "chest triceps core", 0.58, "Three seconds down, one second up."],
  ["Push-up Hold", "highplank", "Strength", 2, "None", "chest triceps core", 0.5, "Hold halfway down without letting the hips drop."],
  ["Dumbbell Floor Press", "floorpress", "Strength", 1, "Dumbbells", "chest triceps shoulders", 0.4, "Elbows touch the floor lightly, then press straight up."],
  ["Dumbbell Chest Fly", "fly", "Strength", 2, "Dumbbells", "chest shoulders", 0.38, "Soft elbows. Open wide, then hug a big tree."],
  ["Dumbbell Squeeze Press", "floorpress", "Strength", 2, "Dumbbells", "chest triceps", 0.42, "Press the dumbbells together the whole time."],
  ["Kettlebell Floor Press", "floorpress", "Strength", 2, "Kettlebell", "chest triceps shoulders", 0.42, "Wrist stacked over elbow. Press and lock out."],
  ["Band Chest Press", "raise", "Strength", 1, "Resistance Band", "chest triceps shoulders", 0.36, "Band behind your back. Press forward to straight arms."],
  ["Band Chest Fly", "pullapart", "Strength", 1, "Resistance Band", "chest shoulders", 0.34, "Bring hands together in front of your chest, slowly return."],
  // ── Back ──
  ["Dumbbell Bent-Over Row", "row", "Strength", 2, "Dumbbells", "lats traps biceps lowerback", 0.48, "Flat back. Pull elbows toward your hips."],
  ["Single-Arm Dumbbell Row", "row", "Strength", 2, "Dumbbells", "lats biceps traps", 0.46, "Brace on your knee. Row the weight to your pocket.", "s"],
  ["Band Bent-Over Row", "row", "Strength", 1, "Resistance Band", "lats traps biceps", 0.4, "Stand on the band and squeeze shoulder blades together."],
  ["Kettlebell Gorilla Row", "row", "Strength", 3, "Kettlebell", "lats core biceps traps", 0.56, "Deep hinge. Alternate rows without twisting the hips."],
  ["Dumbbell Reverse Fly", "row", "Strength", 2, "Dumbbells", "traps shoulders lats", 0.38, "Lead with the pinkies and lift to shoulder height."],
  ["Band Pull-Apart", "pullapart", "Strength", 1, "Resistance Band", "traps shoulders", 0.3, "Arms straight. Pull the band to your chest."],
  ["Band Face Pull", "pullapart", "Strength", 1, "Resistance Band", "shoulders traps", 0.32, "Pull toward your eyes with elbows high."],
  ["Superman Hold", "superman", "Strength", 1, "Mat", "lowerback glutes traps", 0.35, "Lift arms and legs together. Look at the floor."],
  ["Superman Pulls", "superman", "Strength", 2, "Mat", "lats lowerback traps", 0.4, "From the hold, pull elbows down to your ribs."],
  ["Swimmers", "superman", "Strength", 2, "Mat", "lowerback glutes shoulders", 0.45, "Flutter opposite arm and leg quickly."],
  ["Prone Y Raise", "superman", "Strength", 1, "Mat", "traps shoulders lowerback", 0.3, "Thumbs up, arms in a Y. Lift from the shoulder blades."],
  ["Back Extension", "cobra", "Strength", 1, "Mat", "lowerback glutes", 0.32, "Lift the chest a few inches. Keep the neck long."],
  ["Pull-up", "pullup", "Strength", 3, "Pull-up Bar", "lats biceps traps forearms", 0.72, "Start from a dead hang. Chest to the bar."],
  ["Chin-up", "pullup", "Strength", 3, "Pull-up Bar", "biceps lats forearms", 0.7, "Palms toward you. Pull your chin over the bar."],
  ["Negative Pull-up", "pullup", "Strength", 2, "Pull-up Bar", "lats biceps forearms", 0.6, "Jump to the top and lower for five seconds."],
  ["Dead Hang", "pullup", "Strength", 1, "Pull-up Bar", "forearms lats shoulders", 0.35, "Relax into the hang with active shoulders."],
  ["Band Lat Pulldown", "pullup", "Strength", 1, "Resistance Band", "lats biceps", 0.4, "Anchor the band high. Pull elbows to your ribs."],
  ["Dumbbell Deadlift", "hinge", "Strength", 2, "Dumbbells", "hamstrings glutes lowerback forearms", 0.55, "Push the floor away. Weights slide along your legs."],
  ["Kettlebell Deadlift", "hinge", "Strength", 2, "Kettlebell", "glutes hamstrings lowerback", 0.52, "Bell between your feet. Hips back, chest proud."],
  ["Kettlebell High Pull", "uprightrow", "Strength", 3, "Kettlebell", "traps shoulders glutes", 0.62, "Drive with the hips, pull elbows high."],
  ["Dumbbell Shrug", "shrug", "Strength", 1, "Dumbbells", "traps forearms", 0.3, "Lift shoulders to your ears. Pause, then lower."],
  ["Bird Dog", "birddog", "Core", 1, "Mat", "lowerback core glutes", 0.3, "Reach long with opposite arm and leg. Hips stay level."],
  ["Bird Dog Crunch", "birddog", "Core", 2, "Mat", "core lowerback glutes", 0.38, "Extend, then touch elbow to knee under your body."],
  // ── Shoulders ──
  ["Dumbbell Shoulder Press", "press", "Strength", 2, "Dumbbells", "shoulders triceps traps", 0.48, "Ribs down. Press straight overhead."],
  ["Arnold Press", "press", "Strength", 3, "Dumbbells", "shoulders triceps", 0.5, "Rotate palms from facing you to facing forward as you press."],
  ["Band Overhead Press", "press", "Strength", 1, "Resistance Band", "shoulders triceps", 0.4, "Stand on the band. Press without arching your back."],
  ["Kettlebell Overhead Press", "press", "Strength", 2, "Kettlebell", "shoulders triceps core", 0.5, "Bell rests on the forearm. Press and lock out.", "s"],
  ["Dumbbell Push Press", "press", "Strength", 3, "Dumbbells", "shoulders triceps quads", 0.65, "Dip the knees and drive the weights up."],
  ["Front Raise", "raise", "Strength", 1, "Dumbbells", "shoulders", 0.32, "Raise to eye level with soft elbows."],
  ["Lateral Raise", "raise", "Strength", 2, "Dumbbells", "shoulders traps", 0.34, "Lift out to the sides, pinkies slightly up."],
  ["Band Lateral Raise", "raise", "Strength", 1, "Resistance Band", "shoulders", 0.3, "Stand on the band and raise to shoulder height."],
  ["Upright Row", "uprightrow", "Strength", 2, "Dumbbells", "shoulders traps biceps", 0.38, "Lead with the elbows to chest height."],
  ["Pike Push-up", "pikepush", "Strength", 3, "None", "shoulders triceps chest", 0.62, "Hips high. Lower the top of your head toward the floor."],
  ["Plank Shoulder Taps", "shouldertap", "Plank", 2, "None", "shoulders core obliques", 0.5, "Widen your feet and keep the hips still."],
  ["Plank Up-Down", "plankupdown", "Plank", 2, "None", "shoulders triceps core", 0.62, "Move from forearms to hands one arm at a time."],
  ["Arm Circles", "armcircle", "Mobility", 1, "None", "shoulders", 0.2, "Small circles growing larger, then reverse."],
  ["Wall Slides", "press", "Mobility", 1, "None", "shoulders traps", 0.22, "Back flat to the wall. Slide arms up and down."],
  ["Kettlebell Halo", "armcircle", "Mobility", 2, "Kettlebell", "shoulders core", 0.35, "Circle the bell around your head, close to the skull."],
  ["Overhead Hold", "press", "Strength", 2, "Dumbbells", "shoulders core triceps", 0.42, "Lock the arms overhead and breathe."],
  ["Y-T-W Raises", "pullapart", "Mobility", 1, "None", "traps shoulders", 0.28, "Trace a Y, then a T, then a W with your arms."],
  // ── Arms ──
  ["Dumbbell Bicep Curl", "curl", "Strength", 1, "Dumbbells", "biceps forearms", 0.32, "Elbows pinned to your sides. No swinging."],
  ["Hammer Curl", "curl", "Strength", 1, "Dumbbells", "biceps forearms", 0.32, "Palms face each other the whole time."],
  ["Alternating Bicep Curl", "curl", "Strength", 1, "Dumbbells", "biceps forearms", 0.32, "One arm at a time, full range."],
  ["Band Bicep Curl", "curl", "Strength", 1, "Resistance Band", "biceps forearms", 0.28, "Stand on the band. Squeeze at the top."],
  ["Concentration Curl", "curl", "Strength", 2, "Dumbbells", "biceps", 0.3, "Elbow braced on the inner thigh.", "s"],
  ["Zottman Curl", "curl", "Strength", 2, "Dumbbells", "biceps forearms", 0.34, "Curl palms up, lower palms down."],
  ["Isometric Curl Hold", "curl", "Strength", 2, "Dumbbells", "biceps forearms", 0.3, "Hold at ninety degrees."],
  ["Kettlebell Curl", "curl", "Strength", 2, "Kettlebell", "biceps forearms", 0.34, "Hold the horns. Curl to the chest."],
  ["Tricep Kickback", "kickback", "Strength", 1, "Dumbbells", "triceps", 0.3, "Upper arm still. Straighten the elbow fully."],
  ["Overhead Tricep Extension", "ohext", "Strength", 2, "Dumbbells", "triceps", 0.34, "Elbows point forward. Lower behind your head."],
  ["Band Tricep Extension", "ohext", "Strength", 1, "Resistance Band", "triceps", 0.3, "Anchor the band under your back foot."],
  ["Chair Dips", "dip", "Strength", 2, "Chair", "triceps chest shoulders", 0.5, "Hips close to the chair. Elbows bend straight back."],
  ["Chair Dip with Leg Lift", "dip", "Strength", 3, "Chair", "triceps core shoulders", 0.56, "Lift one leg at the top of every rep."],
  ["Floor Skull Crusher", "pullover", "Strength", 2, "Dumbbells", "triceps", 0.34, "Bend only at the elbows, toward your forehead."],
  ["Close-Grip Floor Press", "floorpress", "Strength", 2, "Dumbbells", "triceps chest", 0.4, "Dumbbells touching, elbows tucked."],
  ["Tricep Push-up", "pushup", "Strength", 3, "None", "triceps chest", 0.62, "Hands under shoulders, elbows skim the ribs."],
  ["Seated Wrist Curl", "wristcurl", "Strength", 1, "Dumbbells", "forearms", 0.18, "Forearms on thighs. Curl only the wrists."],
  ["Reverse Wrist Curl", "wristcurl", "Strength", 1, "Dumbbells", "forearms", 0.18, "Palms down. Lift the back of the hand."],
  ["Towel Wring", "wristcurl", "Strength", 1, "None", "forearms", 0.15, "Twist a towel hard in both directions."],
  ["Farmer's Hold", "shrug", "Strength", 2, "Dumbbells", "forearms traps core", 0.4, "Heavy weights, tall posture, steady breathing."],
  // ── Core ──
  ["Crunch", "crunch", "Core", 1, "Mat", "core", 0.3, "Curl the ribs toward the hips. Chin off the chest."],
  ["Bicycle Crunch", "bicycle", "Core", 2, "Mat", "core obliques", 0.45, "Rotate shoulder toward the opposite knee."],
  ["Reverse Crunch", "revcrunch", "Core", 2, "Mat", "core", 0.38, "Roll the hips off the floor using your abs."],
  ["Sit-up", "situp", "Core", 2, "Mat", "core", 0.42, "Feet anchored. Roll up one vertebra at a time."],
  ["V-up", "vup", "Core", 3, "Mat", "core quads", 0.55, "Hands and feet meet over your hips."],
  ["Jackknife", "vup", "Core", 3, "Mat", "core quads", 0.55, "Fold from long to tight in one motion."],
  ["Seated Knee Tuck", "vup", "Core", 2, "Mat", "core", 0.45, "Lean back on your hands. Pull knees to chest."],
  ["Leg Raise", "legraise", "Core", 2, "Mat", "core quads", 0.42, "Low back pressed down. Lower slowly."],
  ["Windshield Wipers", "legraise", "Core", 3, "Mat", "obliques core", 0.48, "Legs up, sweep side to side with control."],
  ["Flutter Kicks", "hollow", "Core", 2, "Mat", "core quads", 0.45, "Small fast kicks just above the floor."],
  ["Hollow Hold", "hollow", "Core", 2, "Mat", "core", 0.42, "Arms by the ears, low back glued down."],
  ["Hollow Rock", "hollow", "Core", 3, "Mat", "core", 0.5, "Rock as one rigid shape."],
  ["Russian Twist", "twist", "Core", 2, "Mat", "obliques core", 0.42, "Lean back slightly and rotate from the ribs."],
  ["Weighted Russian Twist", "twist", "Core", 3, "Dumbbells", "obliques core", 0.5, "Tap the weight beside each hip."],
  ["Boat Pose Hold", "twist", "Yoga", 2, "Mat", "core quads", 0.4, "Chest lifted, shins parallel to the floor."],
  ["Dead Bug", "deadbug", "Core", 1, "Mat", "core", 0.3, "Opposite arm and leg lower. Back stays flat."],
  ["Toe Touch Crunch", "toecrunch", "Core", 2, "Mat", "core", 0.4, "Legs vertical. Reach your fingers to your toes."],
  ["Heel Taps", "crunch", "Core", 1, "Mat", "obliques core", 0.35, "Shoulders up, tap each heel side to side."],
  ["Forearm Plank", "plank", "Plank", 1, "None", "core shoulders glutes", 0.35, "Squeeze glutes and pull elbows toward toes."],
  ["High Plank Hold", "highplank", "Plank", 1, "None", "core shoulders triceps", 0.38, "Hands under shoulders. Push the floor away."],
  ["Side Plank", "sideplank", "Plank", 2, "None", "obliques core shoulders", 0.4, "Stack your hips and lift them high.", "s"],
  ["Side Plank Hip Dips", "sideplank", "Plank", 2, "None", "obliques core", 0.45, "Lower the hip toward the floor and lift.", "s"],
  ["Plank Jacks", "climber", "Plank", 2, "None", "core shoulders calves", 0.66, "Jump feet wide and narrow, hips steady."],
  ["Plank Saw", "plank", "Plank", 2, "None", "core shoulders", 0.4, "Rock forward and back from the toes."],
  ["Plank Hip Twists", "plank", "Plank", 2, "None", "obliques core", 0.44, "Drop one hip toward the floor, then the other."],
  ["Mountain Climbers", "climber", "Cardio", 2, "None", "core shoulders quads", 0.78, "Drive knees fast under your chest."],
  ["Cross-Body Mountain Climbers", "climber", "Cardio", 2, "None", "obliques core shoulders", 0.78, "Knee toward the opposite elbow."],
  ["Bear Plank Hold", "bearcrawl", "Core", 2, "None", "core shoulders quads", 0.45, "Knees hover an inch off the floor."],
  ["Dumbbell Woodchopper", "woodchop", "Core", 2, "Dumbbells", "obliques core shoulders", 0.5, "Pivot the back foot as you chop across."],
  ["Band Pallof Press", "raise", "Core", 2, "Resistance Band", "obliques core", 0.32, "Press straight out and resist the twist.", "s"],
  ["Standing Oblique Crunch", "kneedrive", "Core", 1, "None", "obliques core", 0.4, "Bring knee and elbow together at your side."],
  ["Standing Side Bend", "sidebend", "Core", 1, "Dumbbells", "obliques", 0.3, "Slide the weight down your leg and back up."],
  ["Kettlebell Windmill", "press", "Core", 3, "Kettlebell", "obliques shoulders hamstrings", 0.45, "Eyes on the bell as you hinge sideways.", "s"],
  // ── Glutes ──
  ["Glute Bridge", "bridge", "Strength", 1, "Mat", "glutes hamstrings core", 0.35, "Drive through the heels and squeeze at the top."],
  ["Single-Leg Glute Bridge", "slbridge", "Strength", 2, "Mat", "glutes hamstrings", 0.42, "Keep hips level as you lift.", "s"],
  ["Marching Bridge", "slbridge", "Strength", 2, "Mat", "glutes hamstrings core", 0.42, "Hold the bridge and march one knee at a time."],
  ["Dumbbell Hip Thrust", "bridge", "Strength", 2, "Dumbbells", "glutes hamstrings", 0.45, "Weight on the hips. Chin tucked."],
  ["Frog Pump", "bridge", "Strength", 1, "Mat", "glutes adductors", 0.36, "Soles together, knees wide, pump the hips."],
  ["Hamstring Walkout", "bridge", "Strength", 2, "Mat", "hamstrings glutes", 0.42, "From a bridge, walk the heels out and back."],
  ["Donkey Kick", "donkey", "Strength", 1, "Mat", "glutes hamstrings", 0.32, "Press the sole toward the ceiling.", "s"],
  ["Banded Donkey Kick", "donkey", "Strength", 2, "Resistance Band", "glutes hamstrings", 0.36, "Band around the foot. Slow on the way down.", "s"],
  ["Fire Hydrant", "hydrant", "Strength", 1, "Mat", "glutes", 0.3, "Lift the bent knee out to the side.", "s"],
  ["Clamshell", "clam", "Strength", 1, "Mat", "glutes", 0.25, "Feet together. Open the top knee like a book.", "s"],
  ["Band Clamshell", "clam", "Strength", 1, "Resistance Band", "glutes", 0.28, "Band above the knees. Pause at the top.", "s"],
  ["Side-Lying Leg Raise", "sidelying", "Strength", 1, "Mat", "glutes adductors", 0.26, "Toes face forward as you lift.", "s"],
  ["Kettlebell Swing", "kbswing", "Strength", 3, "Kettlebell", "glutes hamstrings lowerback shoulders", 0.85, "Snap the hips. The bell floats to chest height."],
  ["Sumo Squat", "goblet", "Strength", 1, "None", "glutes adductors quads", 0.5, "Wide stance, toes out, knees track the toes."],
  ["Curtsy Lunge", "lunge", "Strength", 2, "None", "glutes quads adductors", 0.55, "Step back and across behind the front leg."],
  ["Standing Glute Kickback", "legswing", "Strength", 1, "None", "glutes hamstrings", 0.3, "Squeeze the glute as the leg moves back.", "s"],
  ["Hip Hinge Pulses", "hinge", "Strength", 1, "None", "glutes hamstrings", 0.36, "Small pulses at the bottom of the hinge."],
  ["Band Lateral Walk", "skater", "Strength", 1, "Resistance Band", "glutes", 0.4, "Stay low and keep tension on the band."],
  // ── Legs ──
  ["Bodyweight Squat", "squat", "Strength", 1, "None", "quads glutes hamstrings", 0.55, "Sit between your heels, chest up."],
  ["Goblet Squat", "goblet", "Strength", 2, "Dumbbells", "quads glutes core", 0.58, "Hold the weight at your chest. Elbows inside the knees."],
  ["Kettlebell Goblet Squat", "goblet", "Strength", 2, "Kettlebell", "quads glutes core", 0.58, "Hold the bell by the horns."],
  ["Pulse Squat", "squat", "Strength", 2, "None", "quads glutes", 0.6, "Stay low and pulse a few inches."],
  ["Pause Squat", "squat", "Strength", 2, "None", "quads glutes", 0.55, "Hold the bottom for two seconds."],
  ["Prisoner Squat", "squat", "Strength", 1, "None", "quads glutes traps", 0.55, "Hands behind the head, elbows wide."],
  ["Squat to Calf Raise", "squat", "Strength", 2, "None", "quads calves glutes", 0.58, "Stand tall and rise onto your toes."],
  ["Deep Squat Hold", "squat", "Mobility", 1, "None", "quads glutes adductors", 0.3, "Sink low, heels down, elbows push the knees out."],
  ["Wall Sit", "wallsit", "Strength", 1, "None", "quads glutes", 0.45, "Thighs parallel to the floor. Back flat on the wall."],
  ["Forward Lunge", "lunge", "Strength", 2, "None", "quads glutes hamstrings", 0.55, "Front knee over the ankle, back knee toward the floor."],
  ["Reverse Lunge", "lunge", "Strength", 1, "None", "quads glutes", 0.52, "Step back softly and drive through the front heel."],
  ["Walking Lunge", "lunge", "Strength", 2, "None", "quads glutes hamstrings", 0.58, "Long steps, tall torso."],
  ["Dumbbell Lunge", "lunge", "Strength", 2, "Dumbbells", "quads glutes forearms", 0.6, "Weights hang at your sides."],
  ["Lateral Lunge", "lunge", "Strength", 2, "None", "adductors quads glutes", 0.5, "Sit into one hip, other leg straight."],
  ["Cossack Squat", "lunge", "Strength", 3, "None", "adductors quads glutes", 0.55, "Shift low side to side, toes up on the straight leg."],
  ["Static Split Squat", "split", "Strength", 1, "None", "quads glutes", 0.5, "Drop straight down and up.", "s"],
  ["Bulgarian Split Squat", "bulgarian", "Strength", 3, "Chair", "quads glutes", 0.65, "Back foot on the chair. Torso slightly forward.", "s"],
  ["Step-up", "kneedrive", "Strength", 2, "Chair", "quads glutes", 0.55, "Drive through the top foot. Don't push off the back.", "s"],
  ["Pistol Squat", "pistol", "Strength", 3, "None", "quads glutes core", 0.7, "Reach the free leg forward and sit back.", "s"],
  ["Dumbbell Romanian Deadlift", "hinge", "Strength", 2, "Dumbbells", "hamstrings glutes lowerback", 0.5, "Soft knees. Feel the stretch in the hamstrings."],
  ["Single-Leg Dumbbell Deadlift", "rdl", "Balance", 3, "Dumbbells", "hamstrings glutes core", 0.55, "Square hips toward the floor."],
  ["Kettlebell Sumo Deadlift", "hinge", "Strength", 2, "Kettlebell", "glutes adductors hamstrings", 0.52, "Wide stance. Push the knees out."],
  ["Good Morning", "goodmorning", "Strength", 1, "None", "hamstrings lowerback glutes", 0.4, "Hands behind head. Hinge until you feel the hamstrings."],
  ["Calf Raise", "calfraise", "Strength", 1, "None", "calves", 0.3, "Rise high, pause, lower slowly."],
  ["Single-Leg Calf Raise", "calfraise", "Strength", 2, "None", "calves", 0.34, "Fingertips on a wall for balance.", "s"],
  ["Dumbbell Calf Raise", "calfraise", "Strength", 2, "Dumbbells", "calves", 0.36, "Weights at your sides, full range."],
  ["Seated Calf Raise", "seatankle", "Strength", 1, "Dumbbells", "calves", 0.25, "Weights on the knees. Lift the heels."],
  ["Tibialis Raise", "calfraise", "Strength", 1, "None", "calves", 0.22, "Back on a wall, lift the toes toward the shins."],
  // ── Cardio & plyometrics ──
  ["Jumping Jacks", "jack", "Cardio", 1, "None", "calves shoulders quads", 0.7, "Land softly and keep a steady rhythm."],
  ["Seal Jacks", "jack", "Cardio", 2, "None", "chest shoulders calves", 0.72, "Clap the arms together in front of your chest."],
  ["Star Jumps", "jack", "Plyo", 3, "None", "quads glutes shoulders", 0.9, "Explode into a star shape in the air."],
  ["Squat Jacks", "jack", "Cardio", 2, "None", "quads glutes calves", 0.8, "Jump wide into a squat, then narrow."],
  ["High Knees", "kneedrive", "Cardio", 2, "None", "quads core calves", 0.85, "Knees to hip height, quick feet."],
  ["March in Place", "kneedrive", "Cardio", 1, "None", "quads core", 0.4, "Lift knees and swing the arms."],
  ["Power Skips", "kneedrive", "Cardio", 2, "None", "quads calves glutes", 0.85, "Drive the knee up and reach for the sky."],
  ["Butt Kicks", "buttkick", "Cardio", 1, "None", "hamstrings calves", 0.75, "Heels to glutes, stay on the balls of your feet."],
  ["Fast Feet", "calfraise", "Cardio", 2, "None", "calves quads", 0.8, "Tiny rapid steps, athletic stance."],
  ["Jump Rope", "calfraise", "Cardio", 1, "None", "calves shoulders", 0.75, "Small hops and wrist circles, with or without a rope."],
  ["Skater Hops", "skater", "Cardio", 2, "None", "glutes quads calves", 0.8, "Bound side to side and stick each landing."],
  ["Lateral Shuffle", "skater", "Cardio", 2, "None", "quads glutes adductors", 0.75, "Stay low and shuffle without crossing your feet."],
  ["Classic Burpee", "burpee", "Cardio", 3, "None", "quads chest shoulders core", 0.95, "Squat, kick back, push-up, jump."],
  ["Half Burpee", "burpee", "Cardio", 2, "None", "quads shoulders core", 0.8, "Skip the push-up. Keep it fast."],
  ["Box Jump", "jumpsquat", "Plyo", 3, "None", "quads glutes calves", 0.92, "Swing the arms and land softly with knees bent."],
  ["Broad Jump", "jumpsquat", "Plyo", 3, "None", "glutes quads calves", 0.92, "Jump forward as far as you can and stick it."],
  ["Tuck Jump", "tuck", "Plyo", 3, "None", "quads core calves", 0.95, "Pull knees to chest at the top."],
  ["Frog Jumps", "jumpsquat", "Plyo", 3, "None", "quads glutes adductors", 0.9, "Wide squat, then leap forward."],
  ["Jumping Lunge", "lunge", "Plyo", 3, "None", "quads glutes calves", 0.9, "Switch legs in the air and land quietly."],
  ["Shadow Boxing", "punch", "Cardio", 1, "None", "shoulders core triceps", 0.65, "Guard up, rotate through the hips."],
  ["Jab-Cross Combo", "punch", "Cardio", 2, "None", "shoulders triceps core", 0.7, "Snap each punch and return to guard."],
  ["Uppercuts", "punch", "Cardio", 2, "None", "shoulders biceps obliques", 0.7, "Dip the knees and drive up through the punch."],
  ["Speed Bag Arms", "armcircle", "Cardio", 1, "None", "shoulders", 0.55, "Fists circle each other quickly at chin height."],
  ["Lunge Punches", "lunge", "Cardio", 2, "None", "quads shoulders core", 0.7, "Punch forward as you lunge."],
  ["Bear Crawl", "bearcrawl", "Cardio", 2, "None", "shoulders core quads", 0.7, "Opposite hand and foot move together."],
  ["Inchworm", "inchworm", "Mobility", 2, "None", "hamstrings shoulders core", 0.5, "Walk hands out to a plank, then walk them back."],
  ["Sprinter Sit-up", "situp", "Cardio", 2, "Mat", "core quads", 0.62, "Drive one knee up as you sit, like a sprinter."],
  // ── Mobility, stretching & yoga ──
  ["Cat-Cow", "catcow", "Mobility", 1, "Mat", "lowerback core", 0.15, "Round as you exhale, arch as you inhale."],
  ["Child's Pose", "child", "Stretch", 1, "Mat", "lowerback lats", 0.1, "Sit hips to heels and breathe into your back."],
  ["Cobra Stretch", "cobra", "Stretch", 1, "Mat", "core lowerback", 0.15, "Hips stay down. Lift through the chest."],
  ["Downward Dog", "downdog", "Yoga", 1, "Mat", "hamstrings calves shoulders", 0.25, "Press the floor away, heels reach down."],
  ["Standing Forward Fold", "toetouch", "Stretch", 1, "None", "hamstrings lowerback", 0.15, "Soft knees. Let your head hang heavy."],
  ["Standing Quad Stretch", "quadstretch", "Stretch", 1, "None", "quads", 0.12, "Knees together, tuck the pelvis.", "s"],
  ["Kneeling Hip Flexor Stretch", "hipflexor", "Stretch", 1, "Mat", "quads glutes", 0.12, "Squeeze the back glute and shift forward.", "s"],
  ["World's Greatest Stretch", "hipflexor", "Mobility", 2, "Mat", "glutes hamstrings shoulders", 0.25, "Lunge, elbow to instep, then rotate to the sky.", "s"],
  ["Seated Hamstring Stretch", "seatfold", "Stretch", 1, "Mat", "hamstrings lowerback", 0.12, "Hinge from the hips toward your toes."],
  ["Butterfly Stretch", "butterfly", "Stretch", 1, "Mat", "adductors glutes", 0.12, "Soles together, gently press the knees down."],
  ["90/90 Hip Switch", "butterfly", "Mobility", 2, "Mat", "glutes adductors", 0.2, "Rotate both knees side to side, chest tall."],
  ["Warrior I", "warrior", "Yoga", 1, "Mat", "quads glutes shoulders", 0.25, "Square the hips forward, arms overhead."],
  ["Warrior II", "warrior", "Yoga", 1, "Mat", "quads adductors shoulders", 0.25, "Front knee over the ankle, gaze past your fingers."],
  ["Tree Pose", "tree", "Yoga", 1, "None", "calves glutes core", 0.15, "Foot on the inner calf or thigh, never the knee.", "s"],
  ["Sun Salutation", "inchworm", "Yoga", 1, "Mat", "hamstrings shoulders core", 0.3, "Move with your breath through each shape."],
  ["Leg Swings", "legswing", "Mobility", 1, "None", "hamstrings glutes", 0.2, "Hold a wall and swing loosely front to back.", "s"],
  ["Hip Circles", "kneedrive", "Mobility", 1, "None", "glutes adductors", 0.2, "Draw big circles with the knee."],
  ["Neck Rolls", "neck", "Mobility", 1, "None", "traps", 0.05, "Slow half circles, ear to shoulder."],
  ["Shoulder Rolls", "shrug", "Mobility", 1, "None", "traps shoulders", 0.08, "Roll up, back and down."],
  ["Arm Swings", "armcircle", "Mobility", 1, "None", "shoulders chest", 0.15, "Hug yourself, then open wide."],
  ["Thread the Needle", "birddog", "Mobility", 1, "Mat", "traps lats", 0.12, "From all fours, slide one arm under your body.", "s"],
  ["Pigeon Stretch", "child", "Stretch", 2, "Mat", "glutes", 0.12, "Front shin across the mat, hips square.", "s"],
  ["Supine Figure-4 Stretch", "deadbug", "Stretch", 1, "Mat", "glutes", 0.1, "Ankle over the knee, pull the thigh in.", "s"],
  ["Supine Spinal Twist", "deadbug", "Stretch", 1, "Mat", "lowerback obliques", 0.1, "Knees fall to one side, shoulders stay down.", "s"],
  ["Standing Side Stretch", "sidebend", "Stretch", 1, "None", "obliques lats", 0.1, "Reach long over the top."],
  ["Wrist Circles", "wristcurl", "Mobility", 1, "None", "forearms", 0.05, "Interlace the fingers and circle both ways."],
  ["Wall Calf Stretch", "split", "Stretch", 1, "None", "calves", 0.1, "Back heel down, lean into the wall.", "s"],
  // ── Rehab & care ──
  ["Ankle ABCs", "seatankle", "Rehab", 1, "Chair", "calves", 0.08, "Trace the alphabet with your big toe.", "s"],
  ["Ankle Dorsiflexion", "seatankle", "Rehab", 1, "Chair", "calves", 0.08, "Pull the toes up toward your shin.", "s"],
  ["Ankle Eversion", "seatankle", "Rehab", 1, "Chair", "calves", 0.08, "Turn the sole of the foot outward.", "s"],
  ["Ankle Inversion", "seatankle", "Rehab", 1, "Chair", "calves", 0.08, "Turn the sole of the foot inward.", "s"],
  ["Seated Knee Extension", "seated", "Rehab", 1, "Chair", "quads", 0.15, "Straighten the knee and squeeze the thigh.", "s"],
  ["Seated Marching", "seatmarch", "Rehab", 1, "Chair", "quads core", 0.2, "Sit tall and lift one knee at a time."],
  ["Sit-to-Stand", "squat", "Rehab", 1, "Chair", "quads glutes", 0.35, "Stand without using your hands if you can."],
  ["Heel Slides", "revcrunch", "Rehab", 1, "Mat", "hamstrings quads", 0.12, "Slide the heel toward your hip and back."],
  ["Straight Leg Raise", "slbridge", "Rehab", 1, "Mat", "quads core", 0.18, "Lock the knee and lift to the other thigh's height.", "s"],
  ["Chin Tucks", "neck", "Rehab", 1, "None", "traps", 0.05, "Glide the chin straight back, make a double chin."],
  ["Scapular Squeeze", "pullapart", "Rehab", 1, "None", "traps", 0.1, "Pinch the shoulder blades together and hold."],
  ["Wall Angels", "press", "Rehab", 1, "None", "shoulders traps", 0.15, "Wrists and elbows stay on the wall."],
  ["Pendulum Swing", "armcircle", "Rehab", 1, "None", "shoulders", 0.08, "Lean on a table and let the arm hang and circle.", "s"],
  ["Seated Toe Raises", "seatankle", "Rehab", 1, "Chair", "calves", 0.08, "Lift the toes, keep the heels down."],
  ["Seated Torso Rotation", "twist", "Rehab", 1, "Chair", "obliques lowerback", 0.1, "Rotate gently from the ribs, hips still."],
  ["Single-Leg Balance", "tree", "Balance", 1, "None", "calves core glutes", 0.15, "Soft standing knee, eyes on one spot.", "s"],
];

const AREA_OF_MUSCLE = { chest: "Chest", lats: "Back", traps: "Back", lowerback: "Back", shoulders: "Shoulders", biceps: "Arms", triceps: "Arms", forearms: "Arms", core: "Core", obliques: "Core", glutes: "Glutes", quads: "Legs", hamstrings: "Legs", adductors: "Legs", calves: "Legs" };
const areaOf = (e) => (["Cardio", "Plyo"].includes(e.category) ? "Cardio" : ["Mobility", "Stretch", "Yoga"].includes(e.category) ? "Mobility" : e.category === "Rehab" ? "Rehab" : AREA_OF_MUSCLE[Object.keys(e.muscles)[0]] || "Core");
const AREAS = ["All", "Chest", "Back", "Shoulders", "Arms", "Core", "Glutes", "Legs", "Cardio", "Mobility", "Rehab"];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const shortName = (n) => (n.length <= 20 ? n : n.replace(/^(Dumbbell|Kettlebell|Band|Banded|Single-Arm|Standing|Seated|Supine|Alternating) /, "").slice(0, 22));

function buildLibrary(existing) {
  const out = [], used = new Set(existing.map((e) => e.id));
  const W = [14, 10, 7, 5, 4];
  LIB_ROWS.forEach(([name, pose, category, level, equip, mus, intensity, cue, flags]) => {
    const [tempo, joint, alt] = PMETA[pose];
    const muscles = Object.fromEntries(mus.split(" ").map((m, i) => [m, W[i] || 4]));
    const base = { pose, category, level, equip, intensity, tempo, joint, muscles, cue };
    const sides = flags === "s" ? [["Left", "L"], ["Right", "R"]] : [[null, null]];
    sides.forEach(([label, side]) => {
      const full = label ? `${name} (${label})` : name;
      let id = slug(full); while (used.has(id)) id += "-x";
      used.add(id);
      out.push({ ...base, id, name: full, short: label ? `${shortName(name)} ${side}` : shortName(name), alt: side ? false : alt, side });
    });
  });
  return out;
}

const EX_LIST = [...SIGNATURE_EX.map((e) => ({ ...e, pose: e.id })), ...buildLibrary(SIGNATURE_EX)];
const EX = Object.fromEntries(EX_LIST.map((e) => [e.id, e]));
let uidSeq = 100;
const uid = () => "c" + uidSeq++;
const DEFAULT_CIRCUIT = ["jumpsquat", "pushup", "spider", "renegade", "rdl", "burpee", "hollow", "scorpion"].map((id) => ({ uid: uid(), id, work: 30, rest: 15 }));

const MUSCLES = {
  chest: "Chest", shoulders: "Shoulders", biceps: "Biceps", triceps: "Triceps", core: "Core", obliques: "Obliques",
  quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves", lats: "Lats", traps: "Traps", lowerback: "Lower Back",
  forearms: "Forearms", adductors: "Adductors",
};
const SEED_STRAIN = { chest: 8, shoulders: 14, biceps: 4, triceps: 10, core: 22, obliques: 12, quads: 31, hamstrings: 18, glutes: 26, calves: 9, lats: 6, traps: 5, lowerback: 11, forearms: 3, adductors: 7 };
const RECOVERY_H_PER_PCT = 0.48;

const firstSentence = (s) => (s.match(/^[^.]+\./) || [s])[0];
const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ═══════════════════════ WEB AUDIO BEAT ENGINE ═══════════════════════ */

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

class BeatEngine {
  constructor() {
    this.ctx = null; this.playing = false; this.track = 0; this.bpm = 140;
    this.step = 0; this.bar = 0; this.timer = null; this.duckCount = 0; this.onDuck = null; this.volume = 0.8;
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {}); return true; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      const ctx = new AC(); this.ctx = ctx;
      this.music = ctx.createGain(); this.music.gain.value = 0.85;
      this.duckG = ctx.createGain(); this.duckG.gain.value = this.duckCount > 0 ? 0.251 : 1;
      this.vol = ctx.createGain(); this.vol.gain.value = this.volume;
      this.cue = ctx.createGain(); this.cue.gain.value = 0.9;
      this.comp = ctx.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 4;
      this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 512; this.analyser.smoothingTimeConstant = 0.78;
      // music → duck (−12 dB) → master volume → compressor;  voice/chime cues bypass the duck
      this.music.connect(this.duckG); this.duckG.connect(this.vol); this.vol.connect(this.comp);
      this.cue.connect(this.comp); this.comp.connect(this.analyser); this.analyser.connect(ctx.destination);
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
      return true;
    } catch (e) { this.ctx = null; return false; }
  }
  start() {
    if (!this.ensure()) return false;
    if (this.playing) return true;
    this.playing = true; this.step = 0; this.bar = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.pump(), 25);
    return true;
  }
  stop() { this.playing = false; if (this.timer) clearInterval(this.timer); this.timer = null; }
  setVolume(v) {
    this.volume = v;
    try { if (this.ctx) this.vol.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); } catch (e) {}
  }
  pump() {
    try {
      const ctx = this.ctx;
      if (!ctx || !this.playing) return;
      if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05;
      while (this.nextTime < ctx.currentTime + 0.12) {
        this.schedule(this.step, this.bar, this.nextTime);
        this.nextTime += 60 / this.bpm / 4;
        if (++this.step >= 16) { this.step = 0; this.bar++; }
      }
    } catch (e) {}
  }
  /* ── voices ── */
  kick(t, v = 1, f0 = 150, f1 = 42, dec = 0.32) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.11);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    o.connect(g); g.connect(this.music); o.start(t); o.stop(t + dec + 0.02);
  }
  noiseHit(t, { v = 0.3, type = "highpass", f = 7000, q = 0.7, dec = 0.05 }) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    s.connect(fl); fl.connect(g); g.connect(this.music);
    s.start(t, Math.random() * 0.5, dec + 0.05);
  }
  hat(t, v = 0.1, open = false) { this.noiseHit(t, { v, f: open ? 6500 : 8800, dec: open ? 0.2 : 0.045 }); }
  snare(t, v = 0.32) {
    this.noiseHit(t, { v, type: "bandpass", f: 1900, q: 0.6, dec: 0.17 });
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    g.gain.setValueAtTime(v * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.12);
  }
  clap(t, v = 0.3) {
    for (let i = 0; i < 3; i++) this.noiseHit(t + i * 0.011, { v: v * (i === 2 ? 1 : 0.6), type: "bandpass", f: 1300, q: 1.2, dec: i === 2 ? 0.16 : 0.02 });
  }
  synth(t, { freqs, type = "sawtooth", dur = 0.2, v = 0.12, cut = 1200, cutEnd = null, q = 4, a = 0.005, pan = 0, detune = 0 }) {
    const c = this.ctx, g = c.createGain(), fl = c.createBiquadFilter();
    fl.type = "lowpass"; fl.Q.value = q; fl.frequency.setValueAtTime(cut, t);
    if (cutEnd) fl.frequency.exponentialRampToValueAtTime(cutEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.setValueAtTime(v, t + Math.max(a, dur * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    fl.connect(g);
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(this.music); }
    else g.connect(this.music);
    freqs.forEach((f, i) => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune * (i % 2 ? 1 : -1);
      o.connect(fl); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  subDrop(t, f, dur, drop) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(drop ? f * 2.5 : f, t); o.frequency.exponentialRampToValueAtTime(f, t + (drop ? 0.35 : 0.02));
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.42, t + 0.01);
    g.gain.setValueAtTime(0.42, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.music); o.start(t); o.stop(t + dur + 0.05);
  }
  /* ── sequencer: one 16th-note step per call ── */
  schedule(s, bar, t) {
    const sp = 60 / this.bpm / 4;
    if (this.track === 0) { // Neon Tabata Drive — synthwave, Am F C G
      const root = [45, 41, 48, 43][bar % 4], minor = bar % 4 === 0;
      const chord = minor ? [0, 3, 7] : [0, 4, 7];
      if (s % 4 === 0) this.kick(t, 0.95);
      if (s === 4 || s === 12) this.snare(t, 0.3);
      if (s % 4 === 2) this.hat(t, 0.1, true); else if (s % 2 === 1) this.hat(t, 0.04);
      if (s % 2 === 0) {
        const sweep = 380 + (((bar % 4) * 16 + s) / 64) * 1700;
        this.synth(t, { freqs: [mtof(s % 4 === 2 ? root : root - 12)], dur: sp * 1.7, v: 0.16, cut: sweep, cutEnd: 160, q: 9, detune: 8 });
      }
      this.synth(t, { freqs: [mtof(root + 24 + chord[s % 3])], type: "square", dur: sp * 0.9, v: 0.03, cut: 2600, q: 1 });
    } else if (this.track === 1) { // Endurance House Flow — deep house minor 7ths
      const root = [41, 44, 39, 46][bar % 4];
      if (s % 4 === 0) this.kick(t, 0.9, 130, 45, 0.3);
      if (s === 4 || s === 12) this.clap(t, 0.28);
      if (s % 4 === 2) this.hat(t, 0.11, true); else if (s % 2 === 1) this.hat(t, 0.035);
      if (s === 3 || s === 10) this.synth(t, { freqs: [0, 3, 7, 10].map((i) => mtof(root + 24 + i)), dur: sp * 1.6, v: 0.045, cut: 1700, cutEnd: 420, q: 3 });
      if (s % 4 === 2) this.synth(t, { freqs: [mtof(root)], type: "triangle", dur: sp * 1.7, v: 0.26, cut: 700, q: 1 });
    } else if (this.track === 2) { // Peak Plyo Bass — breakbeat + sub drop
      const root = [38, 38, 34, 36][bar % 4];
      if (s === 0 || s === 10) this.kick(t, 1, 160, 40, 0.28);
      if (s === 4 || s === 12) this.snare(t, 0.36);
      if (s === 7 || s === 15) this.snare(t, 0.09);
      this.hat(t, s % 2 === 0 ? 0.075 : 0.035);
      if (s === 0) this.subDrop(t, mtof(root), sp * 8, bar % 4 === 0);
      if (s === 8) this.subDrop(t, mtof(root), sp * 7, false);
      if (bar % 4 === 3 && s >= 12) this.noiseHit(t, { v: 0.05 + (s - 12) * 0.02, type: "bandpass", f: 1200 + (s - 12) * 1400, q: 2, dec: sp });
    } else { // Zen Mobility & Recovery — lo-fi with binaural pads (±5 Hz L/R)
      const root = [48, 45, 50, 43][bar % 4];
      const iv = [[0, 4, 7, 11], [0, 3, 7, 10], [0, 3, 7, 10], [0, 4, 7, 10]][bar % 4];
      if (s === 0) {
        const fr = iv.map((i) => mtof(root + 12 + i));
        this.synth(t, { freqs: fr, type: "triangle", dur: sp * 16, v: 0.035, a: sp * 4, cut: 1400, q: 0.5, pan: -0.8 });
        this.synth(t, { freqs: fr.map((f) => f + 5), type: "sine", dur: sp * 16, v: 0.035, a: sp * 4, cut: 1600, q: 0.5, pan: 0.8 });
      }
      if (s === 0 || s === 10) this.kick(t, 0.5, 110, 45, 0.25);
      if (s === 4 || s === 12) this.noiseHit(t, { v: 0.1, type: "bandpass", f: 2500, q: 1, dec: 0.08 });
      if (s % 2 === 0) this.hat(t + (s % 4 === 2 ? sp * 0.33 : 0), 0.03);
      if (s === 0 || s === 8) this.synth(t, { freqs: [mtof(root - 12)], type: "sine", dur: sp * 6, v: 0.2, cut: 400, q: 0.5, a: 0.02 });
    }
  }
  /* ── cues & ducking ── */
  chime(base = 880, v = 0.22, dur = 0.9) {
    if (!this.ensure()) return;
    try {
      const c = this.ctx, t = c.currentTime + 0.01;
      this.cue.gain.setValueAtTime(0.45 + this.volume * 0.55, t);
      [[1, 1], [2.01, 0.45], [3, 0.22], [4.2, 0.1]].forEach(([r, a]) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.value = base * r;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * a, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur / Math.pow(r, 0.3));
        o.connect(g); g.connect(this.cue); o.start(t); o.stop(t + dur + 0.1);
      });
    } catch (e) {}
  }
  duck(on) {
    this.duckCount = Math.max(0, this.duckCount + (on ? 1 : -1));
    const active = this.duckCount > 0;
    if (this.ctx) {
      try {
        const g = this.duckG.gain, t = this.ctx.currentTime;
        g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
        g.setTargetAtTime(active ? 0.251 : 1, t, active ? 0.04 : 0.25); // 0.251 ≈ −12 dB
      } catch (e) {}
    }
    if (this.onDuck) this.onDuck(active);
  }
  duckFor(sec) { this.duck(true); setTimeout(() => this.duck(false), sec * 1000); }
  spectrum(n = 16) {
    const out = new Array(n).fill(0);
    if (!this.ctx || !this.analyser) return out;
    try {
      this.analyser.getByteFrequencyData(this.freq);
      const bins = this.freq.length, hz = this.ctx.sampleRate / 2 / bins;
      for (let i = 0; i < n; i++) {
        const f0 = 40 * Math.pow(400, i / n), f1 = 40 * Math.pow(400, (i + 1) / n);
        const a = Math.floor(f0 / hz), b = Math.max(a + 1, Math.ceil(f1 / hz));
        let sum = 0, cnt = 0;
        for (let k = a; k < b && k < bins; k++) { sum += this.freq[k]; cnt++; }
        out[i] = cnt ? Math.min(1, (sum / cnt / 255) * 1.15) : 0;
      }
    } catch (e) {}
    return out;
  }
  dispose() {
    this.stop();
    try { if (this.ctx) this.ctx.close(); } catch (e) {}
    this.ctx = null; this.duckCount = 0;
  }
}

/** Speak through speechSynthesis while ducking music −12 dB; always releases the duck. */
function speakWithDuck(engine, text, enabled) {
  if (!enabled) { engine.duckFor(0.7); return; }
  let released = false;
  const release = () => { if (!released) { released = true; engine.duck(false); } };
  engine.duck(true);
  const fallback = setTimeout(release, Math.min(9000, 1200 + text.length * 75));
  try {
    const ss = window.speechSynthesis;
    if (!ss || !window.SpeechSynthesisUtterance) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05; u.pitch = 1; u.volume = 1;
    u.onend = () => { clearTimeout(fallback); setTimeout(release, 180); };
    u.onerror = u.onend;
    ss.speak(u);
  } catch (e) {}
}

/* ═══════════════════════ SKELETAL MOTION LIBRARY ═══════════════════════ */

const JOINTS = ["h", "s", "eL", "hL", "eR", "hR", "p", "kL", "fL", "kR", "fR"];
const STAND = { h: [100, 26], s: [100, 40], eL: [97, 60], hL: [96, 80], eR: [103, 60], hR: [104, 80], p: [100, 80], kL: [98, 110], fL: [96, 140], kR: [102, 110], fR: [104, 140] };
const PLANK = { h: [153, 84], s: [140, 92], eL: [139, 116], hL: [138, 140], eR: [141, 116], hR: [142, 140], p: [95, 111], kL: [66, 124], fL: [36, 138], kR: [66, 125], fR: [38, 139] };
const PUSH = { h: [154, 114], s: [140, 122], eL: [122, 128], hL: [138, 140], eR: [125, 129], hR: [142, 140], p: [95, 128], kL: [66, 133], fL: [36, 139], kR: [66, 134], fR: [38, 139] };
const shift = (P, dx, dy) => Object.fromEntries(JOINTS.map((j) => [j, [P[j][0] + dx, P[j][1] + dy]]));
const POSES = {
  pushup: [PLANK, PUSH],
  spider: [PLANK, { ...PLANK, kR: [112, 116], fR: [96, 132] }],
  jumpsquat: [STAND,
    { h: [112, 58], s: [106, 70], eL: [122, 74], hL: [138, 70], eR: [124, 75], hR: [140, 71], p: [84, 98], kL: [110, 106], fL: [100, 140], kR: [112, 107], fR: [103, 140] },
    { h: [100, 6], s: [100, 20], eL: [92, 38], hL: [86, 54], eR: [94, 39], hR: [88, 55], p: [100, 60], kL: [99, 90], fL: [100, 118], kR: [101, 90], fR: [103, 118] }],
  renegade: [PLANK, { ...PLANK, eR: [118, 94], hR: [134, 110] }],
  rdl: [STAND, { h: [152, 70], s: [138, 76], eL: [138, 98], hL: [139, 118], eR: [140, 98], hR: [141, 118], p: [98, 80], kL: [100, 110], fL: [98, 140], kR: [70, 82], fR: [42, 84] }],
  burpee: [STAND, shift(PUSH, -18, 0),
    { h: [112, 10], s: [110, 24], eL: [122, 14], hL: [132, 6], eR: [124, 15], hR: [134, 7], p: [104, 62], kL: [90, 88], fL: [80, 112], kR: [92, 90], fR: [82, 114] }],
  hollow: [
    { h: [50, 114], s: [62, 122], eL: [42, 114], hL: [22, 108], eR: [44, 115], hR: [24, 109], p: [104, 132], kL: [136, 122], fL: [168, 110], kR: [136, 128], fR: [168, 124] },
    { h: [50, 114], s: [62, 122], eL: [42, 114], hL: [22, 108], eR: [44, 115], hR: [24, 109], p: [104, 132], kL: [136, 128], fL: [168, 124], kR: [136, 122], fR: [168, 110] }],
  scorpion: [
    { h: [40, 130], s: [54, 134], eL: [38, 140], hL: [22, 140], eR: [40, 140], hR: [24, 140], p: [100, 136], kL: [130, 138], fL: [160, 139], kR: [130, 138], fR: [160, 139] },
    { h: [40, 130], s: [54, 134], eL: [38, 140], hL: [22, 140], eR: [40, 140], hR: [24, 140], p: [102, 126], kL: [118, 108], fL: [160, 139], kR: [118, 108], fR: [94, 86] }],
};

/* ── Movement patterns for the full library (side view, facing right, floor at y≈141) ── */
const S_ = (o) => ({ ...STAND, ...o });
const SQ = POSES.jumpsquat[1];
const QUAD = { h: [148, 98], s: [134, 104], eL: [133, 122], hL: [132, 141], eR: [135, 122], hR: [136, 141], p: [94, 106], kL: [92, 140], fL: [62, 141], kR: [96, 140], fR: [66, 141] };
const SUP = { h: [44, 130], s: [58, 135], eL: [74, 138], hL: [90, 139], eR: [76, 138], hR: [92, 139], p: [98, 138], kL: [122, 114], fL: [134, 140], kR: [124, 113], fR: [136, 140] };
const SUPF = { ...SUP, kL: [128, 139], fL: [158, 140], kR: [130, 138], fR: [160, 139] };
const PRONE = { h: [160, 130], s: [146, 134], eL: [150, 140], hL: [164, 140], eR: [152, 140], hR: [166, 140], p: [100, 137], kL: [70, 139], fL: [40, 140], kR: [72, 139], fR: [42, 140] };
const SEAT = { h: [96, 52], s: [94, 66], eL: [100, 84], hL: [112, 94], eR: [102, 84], hR: [114, 94], p: [94, 104], kL: [122, 104], fL: [122, 140], kR: [124, 104], fR: [124, 140] };
const HINGE = { h: [140, 56], s: [128, 62], eL: [127, 84], hL: [127, 104], eR: [129, 84], hR: [129, 104], p: [90, 80], kL: [97, 110], fL: [96, 140], kR: [100, 110], fR: [104, 140] };
const FPL = { h: [154, 112], s: [140, 120], eL: [139, 140], hL: [156, 140], eR: [141, 140], hR: [158, 140], p: [95, 124], kL: [66, 132], fL: [36, 140], kR: [66, 133], fR: [38, 140] };
const LUNGE_B = { h: [96, 46], s: [96, 60], eL: [95, 80], hL: [95, 100], eR: [97, 80], hR: [97, 100], p: [96, 100], kL: [80, 134], fL: [58, 141], kR: [122, 104], fR: [124, 140] };
const SPLIT_A = { h: [97, 30], s: [97, 44], eL: [96, 64], hL: [96, 84], eR: [98, 64], hR: [98, 84], p: [97, 84], kL: [84, 112], fL: [64, 140], kR: [114, 110], fR: [124, 140] };
const PIKE = { h: [140, 118], s: [130, 106], eL: [134, 124], hL: [138, 141], eR: [136, 124], hR: [140, 141], p: [100, 66], kL: [86, 104], fL: [72, 141], kR: [88, 104], fR: [74, 141] };
const LYING = { h: [40, 124], s: [54, 130], eL: [60, 140], hL: [48, 140], eR: [70, 124], hR: [90, 130], p: [96, 132], kL: [118, 124], fL: [96, 134], kR: [118, 122], fR: [96, 132] };
const LONGSIT = { h: [90, 96], s: [92, 108], eL: [104, 118], hL: [118, 124], eR: [106, 118], hR: [120, 124], p: [94, 138], kL: [124, 136], fL: [154, 138], kR: [126, 136], fR: [156, 138] };
const RUNARMS = { eL: [94, 58], hL: [100, 72], eR: [108, 58], hR: [116, 46] };
const SITTWIST = { h: [82, 88], s: [86, 102], eL: [98, 112], hL: [108, 116], eR: [100, 112], hR: [110, 116], p: [100, 134], kL: [122, 110], fL: [140, 120], kR: [124, 110], fR: [142, 120] };
const PULLHANG = { h: [100, 40], s: [100, 52], eL: [101, 30], hL: [102, 10], eR: [103, 30], hR: [104, 10], p: [100, 92], kL: [98, 120], fL: [94, 140], kR: [102, 120], fR: [98, 140] };
const BEAR = { h: [150, 98], s: [136, 102], eL: [137, 122], hL: [138, 141], eR: [139, 122], hR: [140, 141], p: [94, 102], kL: [102, 128], fL: [74, 141], kR: [104, 128], fR: [76, 141] };
const CRUNCH_UP = { s: [64, 126], h: [54, 114], eL: [56, 112], hL: [48, 114], eR: [58, 112], hR: [50, 114] };
const TABLE = { h: [44, 130], s: [58, 135], eL: [62, 118], hL: [64, 100], eR: [64, 118], hR: [66, 100], p: [98, 138], kL: [100, 112], fL: [122, 110], kR: [102, 112], fR: [124, 110] };

Object.assign(POSES, {
  squat: [STAND, SQ],
  goblet: [S_({ eL: [110, 58], hL: [106, 46], eR: [112, 58], hR: [108, 46] }), { ...SQ, eL: [116, 82], hL: [114, 68], eR: [118, 82], hR: [116, 68] }],
  lunge: [STAND, LUNGE_B],
  split: [SPLIT_A, LUNGE_B],
  bulgarian: [{ ...SPLIT_A, kL: [80, 104], fL: [56, 108] }, { ...LUNGE_B, kL: [74, 118], fL: [54, 108] }],
  kneedrive: [S_(RUNARMS), S_({ h: [101, 22], s: [100, 36], p: [100, 76], kR: [120, 76], fR: [118, 104], eR: [92, 58], hR: [96, 72], eL: [110, 56], hL: [118, 44] })],
  buttkick: [S_(RUNARMS), S_({ ...RUNARMS, kR: [98, 112], fR: [80, 96] })],
  calfraise: [STAND, { ...shift(STAND, 0, -7), fL: [96, 140], fR: [104, 140] }],
  hinge: [S_({ eR: [104, 60], hR: [106, 80] }), HINGE],
  goodmorning: [S_({ eL: [94, 30], hL: [100, 22], eR: [96, 30], hR: [102, 22] }), { ...HINGE, eL: [126, 50], hL: [136, 52], eR: [128, 50], hR: [138, 52] }],
  kbswing: [{ ...HINGE, eL: [106, 96], hL: [98, 112], eR: [108, 96], hR: [100, 112] }, S_({ eL: [116, 48], hL: [134, 42], eR: [118, 48], hR: [136, 42] })],
  curl: [S_({ eR: [103, 60], hR: [106, 80] }), S_({ eL: [97, 60], hL: [110, 46], eR: [103, 60], hR: [116, 46] })],
  press: [S_({ eL: [110, 54], hL: [106, 38], eR: [112, 54], hR: [108, 38] }), S_({ eL: [101, 22], hL: [102, 6], eR: [103, 22], hR: [104, 6] })],
  raise: [STAND, S_({ eL: [116, 44], hL: [134, 44], eR: [118, 44], hR: [136, 44] })],
  row: [HINGE, { ...HINGE, eL: [110, 58], hL: [122, 78], eR: [112, 58], hR: [124, 78] }],
  kickback: [{ ...HINGE, eL: [110, 70], hL: [114, 90], eR: [112, 70], hR: [116, 90] }, { ...HINGE, eL: [110, 70], hL: [92, 74], eR: [112, 70], hR: [94, 74] }],
  ohext: [S_({ eL: [106, 18], hL: [94, 30], eR: [108, 18], hR: [96, 30] }), S_({ eL: [106, 20], hL: [108, 6], eR: [108, 20], hR: [110, 6] })],
  dip: [
    { h: [100, 48], s: [96, 62], eL: [90, 79], hL: [86, 96], eR: [92, 79], hR: [88, 96], p: [100, 96], kL: [128, 100], fL: [138, 140], kR: [130, 100], fR: [140, 140] },
    { h: [102, 64], s: [98, 78], eL: [78, 80], hL: [86, 96], eR: [80, 80], hR: [88, 96], p: [100, 110], kL: [128, 104], fL: [138, 140], kR: [130, 104], fR: [140, 140] }],
  kneepush: [{ ...PLANK, h: [153, 86], s: [140, 94], p: [100, 118], kL: [72, 139], fL: [52, 128], kR: [74, 140], fR: [54, 129] }, { ...PUSH, p: [100, 128], kL: [72, 139], fL: [52, 128], kR: [74, 140], fR: [54, 129] }],
  pikepush: [PIKE, { ...PIKE, h: [146, 130], s: [132, 118], eL: [122, 128], eR: [124, 129] }],
  plank: [FPL, { ...FPL, p: [95, 121] }],
  highplank: [PLANK, { ...PLANK, p: [95, 109] }],
  plankupdown: [FPL, PLANK],
  sideplank: [{ ...FPL, eL: [140, 100], hL: [141, 80] }, { ...FPL, p: [95, 131], eL: [140, 100], hL: [141, 80] }],
  climber: [PLANK, { ...PLANK, kR: [118, 118], fR: [104, 134] }],
  shouldertap: [PLANK, { ...PLANK, eR: [146, 112], hR: [140, 96] }],
  bearcrawl: [BEAR, { ...BEAR, eR: [146, 121], hR: [152, 141], kL: [112, 126], fL: [84, 141] }],
  birddog: [QUAD, { ...QUAD, eR: [154, 100], hR: [174, 98], kL: [70, 104], fL: [46, 100] }],
  catcow: [QUAD, { ...QUAD, s: [134, 98], p: [94, 100], h: [148, 108] }, { ...QUAD, s: [134, 110], p: [94, 110], h: [150, 92] }],
  child: [QUAD, { h: [138, 132], s: [122, 126], eL: [146, 138], hL: [168, 140], eR: [148, 138], hR: [170, 140], p: [82, 128], kL: [100, 140], fL: [66, 140], kR: [102, 140], fR: [68, 140] }],
  cobra: [PRONE, { ...PRONE, s: [140, 110], h: [154, 98], eL: [146, 124], hL: [150, 140], eR: [148, 125], hR: [152, 140] }],
  superman: [{ ...PRONE, eL: [158, 138], hL: [178, 138], eR: [160, 138], hR: [180, 138] }, { ...PRONE, h: [160, 124], s: [146, 130], eL: [160, 126], hL: [180, 122], eR: [162, 126], hR: [182, 122], kL: [70, 134], fL: [40, 126], kR: [72, 134], fR: [42, 126] }],
  bridge: [SUP, { ...SUP, p: [98, 114], s: [60, 134] }],
  slbridge: [{ ...SUP, kL: [126, 108], fL: [152, 104] }, { ...SUP, p: [98, 114], s: [60, 134], kL: [126, 96], fL: [152, 86] }],
  crunch: [{ ...SUP, eL: [48, 124], hL: [40, 126], eR: [50, 124], hR: [42, 126] }, { ...SUP, ...CRUNCH_UP }],
  situp: [{ ...SUP, eL: [74, 130], hL: [90, 130], eR: [76, 130], hR: [92, 130] }, { ...SUP, s: [110, 100], h: [116, 86], eL: [124, 108], hL: [140, 108], eR: [126, 108], hR: [142, 108] }],
  bicycle: [{ ...SUP, ...CRUNCH_UP, kR: [100, 104], fR: [120, 112], kL: [126, 124], fL: [154, 122] }, { ...SUP, ...CRUNCH_UP, kL: [100, 104], fL: [120, 112], kR: [126, 124], fR: [154, 122] }],
  legraise: [SUPF, { ...SUPF, kL: [110, 110], fL: [116, 82], kR: [112, 110], fR: [118, 82] }],
  revcrunch: [{ ...SUP, kL: [112, 112], fL: [128, 124], kR: [114, 112], fR: [130, 124] }, { ...SUP, p: [100, 128], kL: [100, 100], fL: [114, 94], kR: [102, 100], fR: [116, 94] }],
  toecrunch: [{ ...SUPF, kL: [108, 110], fL: [112, 82], kR: [110, 110], fR: [114, 82], eL: [60, 118], hL: [62, 100], eR: [62, 118], hR: [64, 100] }, { ...SUPF, ...CRUNCH_UP, eL: [80, 100], hL: [100, 86], eR: [82, 100], hR: [102, 86], kL: [108, 110], fL: [112, 82], kR: [110, 110], fR: [114, 82] }],
  vup: [{ ...SUPF, eL: [40, 136], hL: [22, 136], eR: [42, 136], hR: [24, 136] }, { h: [78, 100], s: [84, 112], eL: [98, 100], hL: [112, 88], eR: [100, 100], hR: [114, 88], p: [100, 134], kL: [122, 108], fL: [138, 84], kR: [124, 108], fR: [140, 84] }],
  twist: [SITTWIST, { ...SITTWIST, eL: [88, 116], hL: [80, 126], eR: [90, 116], hR: [82, 126] }],
  deadbug: [TABLE, { ...TABLE, eR: [44, 126], hR: [26, 128], kL: [128, 128], fL: [156, 126] }],
  jack: [STAND, shift(S_({ eL: [94, 22], hL: [90, 6], eR: [106, 22], hR: [110, 6] }), 0, -4)],
  skater: [S_({ p: [100, 88], s: [104, 50], h: [106, 36], kL: [102, 114], kR: [106, 114] }), { h: [114, 44], s: [110, 58], eL: [124, 70], hL: [134, 80], eR: [100, 72], hR: [92, 84], p: [98, 92], kR: [110, 116], fR: [104, 140], kL: [80, 116], fL: [66, 132] }],
  tuck: [SQ, { h: [100, 10], s: [100, 24], eL: [110, 34], hL: [118, 26], eR: [112, 34], hR: [120, 26], p: [100, 64], kL: [118, 58], fL: [104, 84], kR: [120, 60], fR: [106, 86] }],
  inchworm: [STAND, { h: [114, 126], s: [108, 112], eL: [114, 126], hL: [118, 141], eR: [116, 126], hR: [120, 141], p: [98, 80], kL: [98, 110], fL: [96, 140], kR: [100, 110], fR: [104, 140] }, PLANK],
  wallsit: [{ h: [80, 44], s: [78, 58], eL: [88, 78], hL: [100, 92], eR: [90, 78], hR: [102, 92], p: [78, 98], kL: [104, 98], fL: [104, 140], kR: [106, 98], fR: [106, 140] }, { h: [80, 45], s: [78, 59], eL: [88, 79], hL: [100, 93], eR: [90, 79], hR: [102, 93], p: [78, 99], kL: [104, 99], fL: [104, 140], kR: [106, 99], fR: [106, 140] }],
  toetouch: [STAND, { h: [112, 128], s: [106, 114], eL: [110, 126], hL: [112, 140], eR: [112, 126], hR: [114, 140], p: [94, 82], kL: [96, 110], fL: [96, 140], kR: [98, 110], fR: [104, 140] }],
  quadstretch: [S_({ kR: [100, 112], fR: [84, 96], eR: [96, 70], hR: [86, 94] }), S_({ kR: [98, 114], fR: [82, 92], eR: [94, 72], hR: [84, 90], eL: [104, 22], hL: [106, 6] })],
  hipflexor: [
    { h: [94, 40], s: [94, 54], eL: [94, 74], hL: [100, 92], eR: [96, 74], hR: [102, 92], p: [94, 96], kL: [82, 140], fL: [56, 140], kR: [122, 104], fR: [124, 140] },
    { h: [100, 40], s: [100, 54], eL: [100, 34], hL: [100, 16], eR: [102, 34], hR: [102, 16], p: [102, 102], kL: [84, 140], fL: [58, 140], kR: [126, 106], fR: [126, 140] }],
  armcircle: [S_({ eL: [112, 46], hL: [126, 52], eR: [114, 46], hR: [128, 52] }), S_({ eL: [102, 22], hL: [104, 6], eR: [104, 22], hR: [106, 6] }), S_({ eL: [86, 46], hL: [74, 52], eR: [88, 46], hR: [76, 52] })],
  neck: [STAND, S_({ h: [106, 28] }), S_({ h: [94, 28] })],
  seated: [SEAT, { ...SEAT, fR: [154, 100] }],
  seatankle: [SEAT, { ...SEAT, kR: [126, 102], fR: [132, 136] }],
  seatmarch: [SEAT, { ...SEAT, kR: [122, 90], fR: [124, 124] }],
  wristcurl: [{ ...SEAT, eR: [104, 88], hR: [126, 100], eL: [102, 88], hL: [124, 100] }, { ...SEAT, eR: [104, 88], hR: [126, 92], eL: [102, 88], hL: [124, 92] }],
  donkey: [QUAD, { ...QUAD, kR: [76, 100], fR: [66, 76] }],
  hydrant: [QUAD, { ...QUAD, kR: [90, 112], fR: [62, 116] }],
  clam: [LYING, { ...LYING, kR: [114, 104] }],
  sidelying: [{ ...LYING, kL: [126, 134], fL: [156, 136], kR: [126, 132], fR: [156, 134] }, { ...LYING, kL: [126, 134], fL: [156, 136], kR: [124, 116], fR: [152, 102] }],
  pullup: [PULLHANG, { h: [100, 22], s: [100, 34], eL: [112, 28], hL: [102, 10], eR: [114, 28], hR: [104, 10], p: [100, 74], kL: [98, 102], fL: [94, 122], kR: [102, 102], fR: [98, 122] }],
  pullapart: [S_({ eL: [118, 42], hL: [138, 42], eR: [120, 42], hR: [140, 42] }), S_({ eL: [94, 44], hL: [80, 46], eR: [96, 44], hR: [82, 46] })],
  fly: [{ ...SUP, eL: [58, 118], hL: [60, 100], eR: [60, 118], hR: [62, 100] }, { ...SUP, eL: [48, 132], hL: [40, 140], eR: [70, 132], hR: [78, 140] }],
  floorpress: [{ ...SUP, eL: [66, 140], hL: [64, 124], eR: [68, 140], hR: [66, 124] }, { ...SUP, eL: [60, 118], hL: [60, 100], eR: [62, 118], hR: [62, 100] }],
  pullover: [{ ...SUP, eL: [60, 118], hL: [60, 100], eR: [62, 118], hR: [62, 100] }, { ...SUP, eL: [40, 122], hL: [24, 132], eR: [42, 122], hR: [26, 132] }],
  shrug: [S_({ eR: [103, 60], hR: [104, 80] }), { ...shift(STAND, 0, -4), p: [100, 80], kL: [98, 110], fL: [96, 140], kR: [102, 110], fR: [104, 140] }],
  uprightrow: [STAND, S_({ eL: [110, 46], hL: [104, 52], eR: [112, 46], hR: [106, 52] })],
  woodchop: [S_({ eL: [92, 24], hL: [86, 8], eR: [94, 24], hR: [88, 8] }), { h: [110, 40], s: [106, 52], eL: [118, 72], hL: [128, 92], eR: [120, 72], hR: [130, 92], p: [94, 88], kL: [104, 112], fL: [98, 140], kR: [106, 112], fR: [104, 140] }],
  punch: [S_({ eL: [108, 56], hL: [114, 42], eR: [110, 58], hR: [116, 44], p: [98, 82], kR: [106, 112] }), S_({ eL: [108, 56], hL: [114, 42], eR: [124, 42], hR: [146, 40], p: [98, 82], kR: [106, 112] })],
  legswing: [S_({ kR: [92, 108], fR: [80, 136] }), S_({ kR: [112, 106], fR: [126, 130] })],
  pistol: [S_({ kL: [114, 104], fL: [134, 112] }), { h: [118, 62], s: [110, 74], eL: [124, 74], hL: [140, 72], eR: [126, 75], hR: [142, 73], p: [88, 104], kR: [112, 110], fR: [104, 140], kL: [118, 104], fL: [146, 104] }],
  sidebend: [STAND, S_({ h: [109, 29], s: [105, 41], eL: [104, 62], hL: [106, 84], eR: [106, 62], hR: [108, 84] })],
  tree: [S_({ kL: [114, 102], fL: [102, 110], eL: [101, 22], hL: [101, 6], eR: [103, 22], hR: [103, 6] }), S_({ h: [101, 26], kL: [114, 102], fL: [102, 110], eL: [102, 22], hL: [102, 6], eR: [104, 22], hR: [104, 6] })],
  warrior: [{ ...LUNGE_B, eL: [96, 40], hL: [96, 22], eR: [98, 40], hR: [98, 22] }, { ...LUNGE_B, eL: [116, 58], hL: [134, 58], eR: [78, 58], hR: [60, 58] }],
  downdog: [PIKE, { ...PIKE, p: [99, 62] }],
  seatfold: [LONGSIT, { ...LONGSIT, h: [118, 112], s: [110, 118], eL: [128, 126], hL: [146, 130], eR: [130, 126], hR: [148, 130] }],
  butterfly: [{ ...LONGSIT, kL: [112, 118], fL: [110, 138], kR: [114, 118], fR: [112, 138] }, { ...LONGSIT, kL: [114, 126], fL: [110, 138], kR: [116, 126], fR: [112, 138] }],
});

const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mixPose = (a, b, k) => Object.fromEntries(JOINTS.map((j) => [j, [a[j][0] + (b[j][0] - a[j][0]) * k, a[j][1] + (b[j][1] - a[j][1]) * k]]));
const swapLR = (p) => ({ ...p, eL: p.eR, hL: p.hR, eR: p.eL, hR: p.hL, kL: p.kR, fL: p.fR, kR: p.kL, fR: p.fL });
function poseAt(ex, t, rep) {
  const K = POSES[ex.pose || ex.id], A = K[0], B = K[1], C = K[2] || K[0];
  let p;
  if (t < 0.4) p = mixPose(A, B, easeIO(t / 0.4));          // eccentric
  else if (t < 0.55) p = B;                                   // isometric hold
  else if (t < 0.85) p = mixPose(B, C, easeIO((t - 0.55) / 0.3)); // concentric
  else p = mixPose(C, A, easeIO((t - 0.85) / 0.15));          // return
  if (ex.side === "L") return swapLR(p);
  return ex.alt && rep % 2 === 1 ? swapLR(p) : p;
}
const phaseAt = (t) => (t < 0.4 ? "ecc" : t < 0.55 ? "iso" : "con");
function angleAt(a, b, c) {
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const d = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1);
  return Math.round((Math.acos(clamp(d, -1, 1)) * 180) / Math.PI);
}
const jointAngles = (p) => ({ elbow: angleAt(p.s, p.eR, p.hR), knee: angleAt(p.p, p.kR, p.fR), hip: angleAt(p.s, p.p, p.kR) });
const JOINT_KEY = { elbow: ["s", "eR", "hR"], knee: ["p", "kR", "fR"], hip: ["s", "p", "kR"] };

/* ═══════════════════════ BADGES ═══════════════════════ */

const METALS = {
  gold: ["#FFE8A3", "#E2A93B", "#7A4E0E"], ruby: ["#FFB3C1", "#E8264B", "#6E0D21"], silver: ["#F4F6FA", "#AEB7C5", "#4F5868"],
  blue: ["#B8E1FF", "#2D8CFF", "#0F3A80"], teal: ["#B5FFE4", "#21C48A", "#0A5A40"], orange: ["#FFD2A6", "#FF8A1F", "#7E3500"],
};
const BADGES = [
  { id: "crusher", name: "150-Min Weekly Crusher", desc: "Log 150 active minutes this week.", icon: Flame, metal: "gold", prog: (c) => [c.stats.weekMin, 150, "min"] },
  { id: "z5", name: "Zone 5 Peak Performer", desc: "Spend 60 seconds in Zone 5 (171+ BPM).", icon: HeartPulse, metal: "ruby", prog: (c) => [c.stats.z5Sec, 60, "sec"] },
  { id: "plank", name: "Plank Master", desc: "Finish 6 plank-family intervals.", icon: Shield, metal: "silver", prog: (c) => [c.stats.plankIntervals, 6, "intervals"] },
  { id: "streak", name: "7-Day Streak", desc: "Train seven days in a row.", icon: CalendarCheck, metal: "blue", prog: (c) => [c.stats.streak, 7, "days"] },
  { id: "lap", name: "Split Second", desc: "Mark a haptic lap from the watch Action button.", icon: Flag, metal: "teal", prog: (c) => [c.watchLaps, 1, "laps"] },
  { id: "dj", name: "Tempo Matched", desc: "Train 30 seconds in Zone 4+ with Auto-Tempo on.", icon: Radio, metal: "orange", prog: (c) => [c.stats.autoHotSec, 30, "sec"] },
];

/* ═══════════════════════ CIRCUIT GENERATOR ═══════════════════════ */

const FOCUS_ROTATION = {
  "Full Body": ["Legs", "Chest", "Core", "Back", "Glutes", "Cardio", "Shoulders", "Arms"],
  "Upper Body": ["Chest", "Back", "Shoulders", "Arms", "Core"],
  "Lower Body": ["Legs", "Glutes", "Legs", "Cardio", "Glutes", "Core"],
  "Core": ["Core", "Glutes", "Core", "Back"],
  "Mobility": ["Mobility"],
};
/** Rotates through body areas so a circuit trains the whole body, matching intensity to the target zone. */
function generateCircuit({ minutes, equip, zone, focus = "Full Body" }) {
  const target = [0, 0.32, 0.45, 0.6, 0.75, 0.92][zone];
  const [work, rest] = focus === "Mobility" ? [45, 10] : [[0, 0], [45, 15], [40, 15], [40, 20], [30, 20], [20, 10]][zone];
  const ok = (e) => e.equip === "None" || e.equip === "Mat" || equip.includes(e.equip);
  const rotation = FOCUS_ROTATION[focus] || FOCUS_ROTATION["Full Body"];
  const n = Math.max(2, Math.floor((minutes * 60 + rest) / (work + rest)));
  const used = new Map();
  const items = [];
  for (let i = 0; i < n; i++) {
    const area = rotation[i % rotation.length];
    let pool = EX_LIST.filter((e) => ok(e) && areaOf(e) === area);
    if (!pool.length) pool = EX_LIST.filter((e) => ok(e) && areaOf(e) !== "Rehab");
    pool.sort((a, b) => (used.get(a.id) || 0) - (used.get(b.id) || 0) || Math.abs(a.intensity - target) - Math.abs(b.intensity - target));
    const pick = pool[Math.floor(Math.random() * Math.min(4, pool.length))];
    used.set(pick.id, (used.get(pick.id) || 0) + 1);
    items.push({ uid: uid(), id: pick.id, work, rest });
  }
  return items;
}
const circuitSeconds = (c) => c.reduce((a, it, i) => a + it.work + (i < c.length - 1 ? it.rest : 0), 0);

/* ═══════════════════════ WORKOUT STATE MACHINE ═══════════════════════ */

function advance(p, circuit) {
  if (!p.running) return p;
  const elapsed = p.elapsed + 1;
  if (p.remaining > 1) return { ...p, remaining: p.remaining - 1, elapsed };
  if (p.phase === "prep") return { ...p, phase: "work", remaining: circuit[p.idx].work, elapsed };
  if (p.phase === "work") {
    if (p.idx >= circuit.length - 1) return { ...p, phase: "done", running: false, remaining: 0, elapsed };
    const r = circuit[p.idx].rest;
    if (r > 0) return { ...p, phase: "rest", remaining: r, elapsed };
    return { ...p, phase: "work", idx: p.idx + 1, remaining: circuit[p.idx + 1].work, elapsed };
  }
  if (p.phase === "rest") return { ...p, phase: "work", idx: p.idx + 1, remaining: circuit[p.idx + 1].work, elapsed };
  return p;
}

/* ═══════════════════════ NATIVE (Capacitor) MODE ═══════════════════════ */
// Inside the Capacitor iOS shell the app renders full-screen: no device frame,
// no developer toolbar, the real status bar, and safe-area insets instead of a fake notch.
const NATIVE = typeof window !== "undefined" && !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
/** Small native plugin compiled into the iOS app (ios/App/App/FitnessNativePlugin.swift). */
const FitnessNative = (() => { try { return NATIVE && window.Capacitor.registerPlugin ? window.Capacitor.registerPlugin("FitnessNative") : null; } catch (e) { return null; } })();
const SPOTIFY_GREEN = "#1DB954";
/** Zone-matched Spotify searches (opens the Spotify app when installed, the web player otherwise). */
const SPOTIFY_MIXES = [
  { zone: 1, label: "Warm-up", sub: "≈100 BPM", q: "warm up workout 100 bpm" },
  { zone: 2, label: "Steady cardio", sub: "≈130 BPM", q: "running 130 bpm" },
  { zone: 3, label: "Aerobic", sub: "≈140 BPM", q: "cardio workout 140 bpm" },
  { zone: 4, label: "Threshold HIIT", sub: "≈155 BPM", q: "hiit workout 155 bpm" },
  { zone: 5, label: "Peak effort", sub: "165+ BPM", q: "beast mode workout" },
  { zone: 0, label: "Stretch & recover", sub: "Slow", q: "yoga stretch chill" },
];
const spotifySearchUrl = (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`;
const readPref = (k, d) => { try { return window.localStorage.getItem(k) || d; } catch (e) { return d; } };
const writePref = (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) {} };
/** A real link on the web; routed through UIApplication.open inside the iOS app. */
function ExtLink({ href, className = "", children, onOpen, label }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={className}
      onClick={(e) => { onOpen && onOpen(); if (FitnessNative) { e.preventDefault(); FitnessNative.openURL({ url: href }).catch(() => {}); } }}>{children}</a>
  );
}

/* ═══════════════════════ BRAND ═══════════════════════ */
const RING1 = 2 * Math.PI * 176, RING2 = 2 * Math.PI * 118;
const PULSE_D = "M78 266 H190 L218 212 L252 324 L290 174 L318 266 H434";
/** FitnessLife mark: activity rings with a heartbeat line knocked out of them. */
function BrandMark({ size = 64, bg = true, animate = false, radius = 0 }) {
  const id = useId().replace(/:/g, "");
  const a = (name, dur, delay) => (animate ? { animation: `${name} ${dur}s cubic-bezier(.22,1,.36,1) ${delay}s both` } : undefined);
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} style={{ borderRadius: radius, display: "block", flexShrink: 0 }} role="img" aria-label="FitnessLife">
      <defs>
        <radialGradient id={`bg${id}`} cx="34%" cy="28%" r="85%"><stop offset="0" stopColor="#2A4058" /><stop offset=".55" stopColor="#1A2636" /><stop offset="1" stopColor="#0E1520" /></radialGradient>
        <linearGradient id={`o${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFC069" /><stop offset=".5" stopColor="#F7931E" /><stop offset="1" stopColor="#E5600B" /></linearGradient>
        <linearGradient id={`b${id}`} x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9BE0FF" /><stop offset=".5" stopColor="#4CB4E7" /><stop offset="1" stopColor="#2484BC" /></linearGradient>
        <filter id={`g${id}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      {bg && <rect width="512" height="512" fill={`url(#bg${id})`} />}
      <g fill="none" strokeLinecap="round">
        <circle cx="256" cy="256" r="176" stroke="#fff" strokeOpacity=".06" strokeWidth="40" />
        <circle cx="256" cy="256" r="118" stroke="#fff" strokeOpacity=".06" strokeWidth="40" />
        <circle cx="256" cy="256" r="176" stroke={`url(#o${id})`} strokeWidth="40" strokeDasharray={`${RING1 * 0.8} ${RING1}`} transform="rotate(-62 256 256)" style={a("fl-r1", 1.1, 0.1)} />
        <circle cx="256" cy="256" r="118" stroke={`url(#b${id})`} strokeWidth="40" strokeDasharray={`${RING2 * 0.72} ${RING2}`} transform="rotate(118 256 256)" style={a("fl-r2", 1.1, 0.25)} />
        <path d={PULSE_D} stroke="#1A2636" strokeWidth="54" strokeLinejoin="round" strokeDasharray={animate ? "660" : undefined} style={a("fl-pulse", 0.8, 0.5)} />
        <path d={PULSE_D} stroke="#fff" strokeWidth="22" strokeLinejoin="round" filter={`url(#g${id})`} opacity=".55" strokeDasharray={animate ? "660" : undefined} style={a("fl-pulse", 0.8, 0.5)} />
        <path d={PULSE_D} stroke="#fff" strokeWidth="22" strokeLinejoin="round" strokeDasharray={animate ? "660" : undefined} style={a("fl-pulse", 0.8, 0.5)} />
      </g>
    </svg>
  );
}
/** Animated launch screen: picks up from the native launch image, draws the rings, then fades into the app. */
function LaunchSplash({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2650); return () => clearTimeout(t); }, []); // eslint-disable-line
  return (
    <button aria-label="Skip intro" onClick={onDone} className="absolute inset-0 z-[70] flex flex-col items-center justify-center text-white cursor-default"
      style={{ background: "radial-gradient(circle at 50% 38%,#2A4058 0%,#1A2636 42%,#0E1520 100%)", animation: "fl-out .5s ease 2.15s forwards" }}>
      <div style={{ animation: "fl-beat .9s ease-in-out 1.35s 1" }}><BrandMark size={152} bg={false} animate /></div>
      <div className="mt-7 text-[36px] font-black tracking-[-.6px] leading-none" style={{ animation: "fl-rise .6s ease .8s both" }}>Fitness<span className="text-[var(--orange)]">Life</span></div>
      <div className="mt-2.5 text-[13.5px] font-bold text-[#9FB2C6]" style={{ animation: "fl-rise .6s ease 1s both" }}>Train every muscle. Live stronger.</div>
      <div className="mt-5 h-[3px] w-[56px] rounded-full" style={{ background: "linear-gradient(90deg,#F7931E,#4CB4E7)", animation: "fl-rise .6s ease 1.15s both" }} />
      <div className="absolute bottom-12 text-[10.5px] text-white/40 font-bold tracking-[.16em] uppercase" style={{ animation: "fl-rise .6s ease 1.3s both" }}>{EX_LIST.length} exercises · Apple Watch ready</div>
    </button>
  );
}

const T = (n, pad) => (NATIVE ? `calc(env(safe-area-inset-top, 0px) + ${n}px)` : pad + n);

/* ═══════════════════════ GLOBAL STYLES ═══════════════════════ */
// Visual system taken from the Sworkit template: white screens, Mulish type,
// Sworkit orange for actions, sky blue for time/progress, navy for exercise detail.
const RING1_C = (2 * Math.PI * 176).toFixed(1), RING1_D = (2 * Math.PI * 176 * 0.8).toFixed(1);
const RING2_C = (2 * Math.PI * 118).toFixed(1), RING2_D = (2 * Math.PI * 118 * 0.72).toFixed(1);
const CSS = `
.sw{--orange:#F7931E;--orange-d:#E07D0A;--blue:#4CB4E7;--blue-d:#2B93C9;--navy:#1A2636;--navy2:#233347;--navy3:#2E4259;--slate:#2F3C4D;--ink:#2B333D;--muted:#8B939C;--line:#E4E7EB;--bg:#F1F3F5;--card:#FFFFFF;--green:#34C17B;--ground:#F1F3F5}
.sw-ios{font-family:'Mulish','Avenir Next','Segoe UI',system-ui,sans-serif}
.sw-md{font-family:Roboto,'Segoe UI',system-ui,sans-serif}
.sw .font-disp{font-family:'Mulish','Avenir Next',system-ui,sans-serif;font-weight:800;letter-spacing:-.01em}
.sw .font-code{font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
.sw .tnum{font-variant-numeric:tabular-nums}
.sw .no-sb::-webkit-scrollbar{display:none}.sw .no-sb{scrollbar-width:none}
.sw input[type=range]{accent-color:var(--orange)}
.sw button:focus-visible,.sw input:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.sw .hero-title{text-shadow:0 2px 10px rgba(0,0,0,.45);text-wrap:balance}
@keyframes fl-r1{from{stroke-dasharray:0 ${RING1_C}}to{stroke-dasharray:${RING1_D} ${RING1_C}}}
@keyframes fl-r2{from{stroke-dasharray:0 ${RING2_C}}to{stroke-dasharray:${RING2_D} ${RING2_C}}}
@keyframes fl-pulse{from{stroke-dashoffset:660}to{stroke-dashoffset:0}}
@keyframes fl-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fl-out{to{opacity:0;visibility:hidden}}
@keyframes fl-beat{0%,100%{transform:scale(1)}45%{transform:scale(1.06)}}
@keyframes sw-beat{0%,100%{transform:scale(1)}14%{transform:scale(1.25)}28%{transform:scale(1)}}
@keyframes sw-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes sw-up{from{transform:translateY(100%)}to{transform:none}}
@keyframes sw-fade{from{opacity:0}to{opacity:1}}
@keyframes sw-shine{0%{transform:translateX(-140%) rotate(20deg)}100%{transform:translateX(240%) rotate(20deg)}}
@keyframes sw-pulse{0%{box-shadow:0 0 0 0 rgba(76,180,231,.55)}100%{box-shadow:0 0 0 10px rgba(76,180,231,0)}}
.sw .ring-anim{transition:stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)}
.sw .needle-anim{transition:transform 1.2s cubic-bezier(.22,1,.36,1)}
@media (prefers-reduced-motion:reduce){.sw *{animation-duration:.001ms!important;transition-duration:.001ms!important}}
`;

/* ═══════════════════════ SMALL UI PRIMITIVES ═══════════════════════ */

function Ring({ cx, cy, r, stroke, value, color, track = "rgba(255,255,255,.08)", cap = "round" }) {
  const c = 2 * Math.PI * r, v = clamp(value, 0, 1);
  return (
    <g transform={`rotate(-90 ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      {v > 0.002 && <circle className="ring-anim" cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap={cap} strokeDasharray={c} strokeDashoffset={c * (1 - v)} />}
    </g>
  );
}
function arcPath(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
}
function useMounted() { const [m, setM] = useState(false); useEffect(() => { const id = requestAnimationFrame(() => setM(true)); return () => cancelAnimationFrame(id); }, []); return m; }

function Toggle({ on, onChange, ios, label, id }) {
  return (
    <button id={id} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative shrink-0 transition-colors ${ios ? "w-[50px] h-[30px] rounded-full" : "w-[52px] h-[32px] rounded-full border-2"} ${on ? (ios ? "bg-[#34C759]" : "bg-[var(--orange)] border-[var(--orange)]") : ios ? "bg-[#E3E6EA]" : "bg-transparent border-[var(--muted)]"}`}>
      <span className={`absolute top-1/2 -translate-y-1/2 rounded-full shadow transition-all ${ios ? "w-[26px] h-[26px] bg-white" : on ? "w-6 h-6 bg-white" : "w-4 h-4 bg-[var(--muted)]"} ${ios ? (on ? "left-[22px]" : "left-[2px]") : on ? "left-[22px]" : "left-[6px]"}`} />
    </button>
  );
}
function Seg({ options, value, onChange, small }) {
  return (
    <div className="flex p-[3px] gap-[2px] rounded-[10px] bg-white/[0.08]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={String(o.value)} onClick={() => onChange(o.value)} aria-pressed={active}
            className={`flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] ${small ? "px-2.5 py-1 text-[11.5px]" : "px-3 py-1.5 text-[12.5px]"} font-bold transition-colors ${active ? "bg-white text-[#2B333D] shadow" : "text-white/60"}`}>
            {o.icon && <o.icon size={13} />}{o.label}
          </button>
        );
      })}
    </div>
  );
}
function IconBtn({ icon: I, onClick, label, size = 40, tone = "default", className = "", iconSize = 18, disabled }) {
  const tones = {
    default: "bg-[#EEF1F4] text-[var(--ink)]", navy: "bg-white/10 text-white", orange: "bg-[var(--orange)] text-white",
    ghost: "text-[var(--ink)]", ghostLight: "text-white", blue: "bg-[var(--blue)] text-white",
  };
  return (
    <button aria-label={label} title={label} disabled={disabled} onClick={onClick} style={{ width: size, height: size }}
      className={`grid place-items-center rounded-full active:scale-95 transition disabled:opacity-35 ${tones[tone]} ${className}`}><I size={iconSize} /></button>
  );
}
const LEVELS = ["", "Beginner", "Intermediate", "Advanced"];

/* ── Illustrated athlete (stands in for the template's studio video stills) ──
   Limbs are tapered capsules so the figure reads as a person in leggings and a tank top. */
const SKIN = "#C98E6B", SKIN_FAR = "#9E6A4C", CLOTH = "#1D2026";
function capsule(a, b, ra, rb) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 0.001, nx = -dy / L, ny = dx / L;
  const f = (v) => v.toFixed(2);
  return `M${f(a[0] + nx * ra)} ${f(a[1] + ny * ra)} L${f(b[0] + nx * rb)} ${f(b[1] + ny * rb)} A${rb} ${rb} 0 0 0 ${f(b[0] - nx * rb)} ${f(b[1] - ny * rb)} L${f(a[0] - nx * ra)} ${f(a[1] - ny * ra)} A${ra} ${ra} 0 0 0 ${f(a[0] + nx * ra)} ${f(a[1] + ny * ra)} Z`;
}
const lerpPt = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
function Figure({ p, cloth = CLOTH, farCloth = "#3B4049", hair = "#231912", skin = SKIN, skinFar = SKIN_FAR }) {
  const cap = (a, b, ra, rb, fill) => <path d={capsule(a, b, ra, rb)} fill={fill} />;
  const shoe = (k, fpt, far) => {
    const dx = fpt[0] - k[0], dy = fpt[1] - k[1], L = Math.hypot(dx, dy) || 1, ux = dy / L, uy = -dx / L;
    const heel = [fpt[0] - ux * 1.6, fpt[1] - uy * 1.6], toe = [fpt[0] + ux * 7.2, fpt[1] + uy * 7.2];
    return cap(heel, toe, 3.3, 2.6, far ? "#C9CED5" : "#F4F5F7");
  };
  const neckTop = lerpPt(p.s, p.h, 0.62);
  const dirx = p.h[0] - p.s[0] >= -4 ? 1 : -1; // hair sits behind the face
  return (
    <g>
      {/* far side */}
      {cap(p.s, p.eL, 3.8, 3.1, skinFar)}{cap(p.eL, p.hL, 3.0, 2.4, skinFar)}<circle cx={p.hL[0]} cy={p.hL[1]} r="2.6" fill={skinFar} />
      {cap(p.p, p.kL, 6.0, 4.5, farCloth)}{cap(p.kL, p.fL, 4.3, 3.0, farCloth)}{shoe(p.kL, p.fL, true)}
      {/* torso + head */}
      {cap(p.s, neckTop, 2.9, 2.7, skin)}
      {cap(p.s, p.p, 7.4, 6.4, cloth)}
      <circle cx={p.s[0]} cy={p.s[1]} r="5.2" fill={cloth} />
      <ellipse cx={p.h[0] - dirx * 1.7} cy={p.h[1] - 1.4} rx="8.1" ry="8.3" fill={hair} />
      <ellipse cx={p.h[0] + dirx * 0.9} cy={p.h[1] + 0.9} rx="7" ry="7.6" fill={skin} />
      <circle cx={p.h[0] - dirx * 1.3} cy={p.h[1] + 0.8} r="1.6" fill={skinFar} />
      {/* near side */}
      {cap(p.p, p.kR, 6.3, 4.7, cloth)}{cap(p.kR, p.fR, 4.5, 3.1, cloth)}{shoe(p.kR, p.fR, false)}
      {cap(p.p, lerpPt(p.p, p.kR, 0.42), 6.9, 6.3, "#2B3038")}
      {cap(p.s, p.eR, 4.0, 3.2, skin)}{cap(p.eR, p.hR, 3.1, 2.5, skin)}<circle cx={p.hR[0]} cy={p.hR[1]} r="2.7" fill={skin} />
    </g>
  );
}
/* Equipment props so seated, dip, split-squat and pull-up patterns aren't floating */
function Props({ ex }) {
  const pose = ex && (ex.pose || ex.id);
  const metal = "#9AA3AD", wood = "#B98E62", dark = "#59626C";
  if (pose === "pullup") return <g><rect x="60" y="6" width="84" height="4" rx="2" fill={metal} /><rect x="60" y="6" width="3" height="136" fill={dark} opacity=".5" /><rect x="141" y="6" width="3" height="136" fill={dark} opacity=".5" /></g>;
  if (["seated", "seatankle", "seatmarch", "wristcurl"].includes(pose)) return <g fill={dark}><rect x="80" y="106" width="34" height="4" rx="1.5" /><rect x="80" y="64" width="3.5" height="46" rx="1.5" /><rect x="82" y="110" width="2.5" height="31" /><rect x="110" y="110" width="2.5" height="31" /></g>;
  if (pose === "dip") return <g fill={wood}><rect x="62" y="96" width="34" height="5" rx="1.5" /><rect x="64" y="101" width="3" height="40" /><rect x="91" y="101" width="3" height="40" /></g>;
  if (pose === "bulgarian") return <g fill={wood}><rect x="36" y="110" width="34" height="5" rx="1.5" /><rect x="38" y="115" width="3" height="26" /><rect x="65" y="115" width="3" height="26" /></g>;
  return null;
}
function Scene({ ex, t = 0.47, rep = 0, variant = "studio", className = "", vb = "0 8 200 142", pose }) {
  const id = useId().replace(/:/g, "");
  const p = pose || poseAt(ex, t, rep);
  const fx = (p.fL[0] + p.fR[0]) / 2;
  return (
    <svg viewBox={vb} preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={ex ? ex.name : "athlete"}>
      {variant === "studio" && (
        <>
          <defs>
            <linearGradient id={`w${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#DDE4E5" /><stop offset="1" stopColor="#BFCACC" /></linearGradient>
            <linearGradient id={`f${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5B6461" /><stop offset="1" stopColor="#2D3432" /></linearGradient>
          </defs>
          <rect x="-200" y="-120" width="600" height="248" fill={`url(#w${id})`} />
          <rect x="-200" y="128" width="600" height="140" fill={`url(#f${id})`} />
          <rect x="-200" y="127" width="600" height="1.4" fill="#A3ADAF" />
        </>
      )}
      {variant === "white" && <rect x="0" y="0" width="200" height="160" fill="#fff" />}
      <ellipse cx={fx} cy="143" rx="36" ry="3.2" fill="#000" opacity={variant === "studio" ? 0.22 : 0.07} />
      <Props ex={ex} />
      <Figure p={p} />
    </svg>
  );
}

function Spectrum({ engine, bands = 16, height = 64, gap = 3, color, className = "" }) {
  const [v, setV] = useState(() => Array(bands).fill(0));
  useEffect(() => {
    let raf, last = 0;
    const loop = (t) => { if (t - last > 33) { last = t; setV(engine.spectrum(bands)); } raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, bands]);
  return (
    <div className={`flex items-end ${className}`} style={{ height, gap }} aria-hidden>
      {v.map((x, i) => (
        <div key={i} className="flex-1 rounded-t-[2px]" style={{ height: `${Math.max(5, x * 100)}%`, background: color || (i < bands * 0.55 ? "#4CB4E7" : "#F7931E"), opacity: 0.45 + x * 0.55 }} />
      ))}
    </div>
  );
}

function HrSpark({ data, h = 44 }) {
  const W = 200, lo = 60, hi = 190;
  const y = (v) => h - ((v - lo) / (hi - lo)) * h;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${y(v).toFixed(1)}`).join(" ");
  const last = data[data.length - 1], col = ZONES[zoneOf(last)].color;
  return (
    <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: h }} aria-hidden>
      {[2, 3, 4, 5].map((z) => <line key={z} x1="0" x2={W} y1={y(ZONES[z].lo)} y2={y(ZONES[z].lo)} stroke={ZONES[z].color} strokeOpacity=".3" strokeDasharray="2 3" />)}
      <polyline points={`0,${h} ${pts} ${W},${h}`} fill={col} fillOpacity=".14" stroke="none" />
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.8" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={W} cy={y(last)} r="3" fill={col} />
    </svg>
  );
}

/* ═══════════════════════ MOTION COACH (navy player) ═══════════════════════ */

function MotionCoach({ ex, active, tempoScale = 1, onRep, compact, between }) {
  const st = useRef({ t: 0.45, rep: 0, last: 0 });
  const [f, setF] = useState({ t: 0.45, rep: 0 });
  useEffect(() => {
    if (!active) return;
    let raf;
    const loop = (now) => {
      const s = st.current;
      if (s.last) {
        s.t += Math.min(0.05, (now - s.last) / 1000) / (ex.tempo / tempoScale);
        if (s.t >= 1) { s.t -= 1; s.rep++; onRep && onRep(); }
      }
      s.last = now; setF({ t: s.t, rep: s.rep });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); st.current.last = 0; };
  }, [active, ex, tempoScale]); // eslint-disable-line

  const p = poseAt(ex, f.t, f.rep);
  const ang = jointAngles(p);
  const ph = phaseAt(f.t);
  const [ja, jb, jc] = JOINT_KEY[ex.joint];
  const A = p[ja], B = p[jb], Cc = p[jc];
  const a0 = Math.atan2(A[1] - B[1], A[0] - B[0]), a1 = Math.atan2(Cc[1] - B[1], Cc[0] - B[0]);
  let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const R = 13, sx = B[0] + R * Math.cos(a0), sy = B[1] + R * Math.sin(a0), ex2 = B[0] + R * Math.cos(a0 + d), ey2 = B[1] + R * Math.sin(a0 + d);
  const arc = `M${B[0]} ${B[1]} L${sx} ${sy} A${R} ${R} 0 0 ${d > 0 ? 1 : 0} ${ex2} ${ey2} Z`;
  const lx = clamp(B[0] + 16, 4, 150), ly = clamp(B[1] - 22, 12, 126);
  const phases = [{ k: "ecc", label: "Eccentric", w: 40, c: "#4CB4E7" }, { k: "iso", label: "Isometric", w: 15, c: "#FFFFFF" }, { k: "con", label: "Concentric", w: 45, c: "#F7931E" }];

  return (
    <div>
      <div className="relative bg-white rounded-[6px] overflow-hidden">
        <svg viewBox="0 0 200 152" className="w-full block" style={{ maxHeight: compact ? 210 : 300 }} role="img" aria-label={`${ex.name} demonstration`}>
          <rect x="0" y="0" width="200" height="152" fill="#fff" />
          <ellipse cx={(p.fL[0] + p.fR[0]) / 2} cy="143" rx="36" ry="3" fill="#000" opacity=".07" />
          <Props ex={ex} />
          <Figure p={p} />
          <path d={arc} fill="#4CB4E7" fillOpacity=".28" stroke="#4CB4E7" strokeWidth="1" />
          <circle cx={B[0]} cy={B[1]} r="3" fill="#4CB4E7" stroke="#fff" strokeWidth="1.2" />
          <g transform={`translate(${lx} ${ly})`}>
            <rect width="48" height="15" rx="7.5" fill="#1A2636" />
            <text x="24" y="10.4" textAnchor="middle" fontSize="7.8" fontWeight="800" fill="#fff" fontFamily="Mulish, sans-serif">{ex.joint.toUpperCase()} {ang[ex.joint]}°</text>
          </g>
        </svg>
        <div className="absolute top-2 left-2 rounded-[6px] bg-[var(--navy)] text-white px-2.5 py-1 leading-none">
          <div className="text-[8.5px] tracking-[.14em] uppercase text-white/60 font-bold">Reps</div>
          <div className="text-[22px] font-black tnum">{f.rep}</div>
        </div>
        <div className="absolute top-2 right-2 rounded-full bg-[var(--blue)] text-white text-[10px] font-extrabold px-2 py-0.5">
          {(60 / (ex.tempo / tempoScale)).toFixed(0)} reps/min
        </div>
      </div>
      {between}
      <div className="mt-4 rounded-[6px] bg-[var(--navy2)] p-3">
        <div className="flex items-center justify-between">
          <div className="text-white text-[13px] font-extrabold">Tempo</div>
          <div className="text-white/55 text-[11.5px] font-semibold">Rep {f.rep + 1} · {ex.tempo.toFixed(1)}s per rep</div>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden relative bg-white/10 mt-2.5">
          {phases.map((x) => <div key={x.k} style={{ width: x.w + "%", background: ph === x.k ? x.c : "rgba(255,255,255,.14)" }} className={`h-full transition-colors ${x.k !== "con" ? "border-r-2 border-[var(--navy2)]" : ""}`} />)}
          <div className="absolute top-[-3px] w-[3px] h-[14px] rounded bg-white shadow" style={{ left: `calc(${f.t * 100}% - 1px)` }} />
        </div>
        <div className="grid grid-cols-3 mt-2">
          {phases.map((x, i) => (
            <div key={x.k} className={`flex items-center gap-1.5 text-[11.5px] ${i === 1 ? "justify-center" : i === 2 ? "justify-end" : ""} ${ph === x.k ? "text-white font-extrabold" : "text-white/45 font-semibold"}`}>
              <span className="w-2 h-2 rounded-full" style={{ background: x.c, opacity: ph === x.k ? 1 : 0.4 }} />{x.label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {["elbow", "knee", "hip"].map((j) => (
            <div key={j} className={`rounded-[6px] py-2 text-center ${j === ex.joint ? "bg-[rgba(76,180,231,0.2)] ring-1 ring-[var(--blue)]" : "bg-[var(--navy3)]"}`}>
              <div className="text-[11px] text-white/65 font-bold capitalize">{j} angle</div>
              <div className="text-[19px] font-black tnum text-white leading-tight">{ang[j]}°</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ ANATOMY (template "Focus Areas") ═══════════════════════ */

const BODY_HALF = "M60 32 C56 32 54 33 53 36 C50 39 44 40 38 42 C31 44 28 49 27 57 L25 76 C24 86 22 98 21 108 C20 118 19 126 17 134 C16 140 18 144 22 142 C24 141 25 137 26 133 C28 122 31 108 33 96 L35 80 L37 70 C38 82 39 94 40 104 C39 112 38 120 38 128 C37 148 39 166 41 182 C42 190 42 196 41 204 C40 216 41 228 42 236 C42 240 44 242 48 242 C51 242 52 239 52 236 C53 222 54 208 55 196 C56 186 57 178 57 168 C58 154 59 142 60 136 Z";
const FRONT = [["shoulders", "e", 33, 50, 7, 8], ["shoulders", "e", 87, 50, 7, 8], ["chest", "e", 49, 57, 10, 7], ["chest", "e", 71, 57, 10, 7], ["biceps", "e", 30, 73, 4.2, 10], ["biceps", "e", 90, 73, 4.2, 10], ["core", "r", 53, 67, 14, 36], ["obliques", "e", 44, 86, 4, 12], ["obliques", "e", 76, 86, 4, 12], ["quads", "e", 48, 150, 7.5, 22], ["quads", "e", 72, 150, 7.5, 22], ["calves", "e", 47, 207, 4.5, 14], ["calves", "e", 73, 207, 4.5, 14], ["forearms", "e", 25, 113, 3.4, 12], ["forearms", "e", 95, 113, 3.4, 12], ["adductors", "e", 55.5, 146, 2.6, 15], ["adductors", "e", 64.5, 146, 2.6, 15]];
const BACK = [["traps", "e", 60, 45, 15, 6], ["shoulders", "e", 33, 51, 7, 7], ["shoulders", "e", 87, 51, 7, 7], ["lats", "e", 46, 72, 8, 15], ["lats", "e", 74, 72, 8, 15], ["triceps", "e", 30, 73, 4.2, 10], ["triceps", "e", 90, 73, 4.2, 10], ["lowerback", "r", 53, 88, 14, 17], ["glutes", "e", 50, 117, 10, 9], ["glutes", "e", 70, 117, 10, 9], ["hamstrings", "e", 48, 152, 7, 19], ["hamstrings", "e", 72, 152, 7, 19], ["calves", "e", 47, 207, 4.5, 14], ["calves", "e", 73, 207, 4.5, 14], ["forearms", "e", 25, 113, 3.4, 12], ["forearms", "e", 95, 113, 3.4, 12]];
function heat(s) {
  // fresh → sky blue, working → Sworkit orange, overloaded → red
  if (s < 40) return "#4CB4E7";
  if (s < 70) return "#F7931E";
  return "#FF4D4D";
}
/** mode "focus": template look (targeted muscles in sky blue). mode "heat": fatigue heatmap. */
function BodyMap({ view, values, mode = "focus", sel, onSel, maxH = 250 }) {
  const regions = view === "front" ? FRONT : BACK;
  const fillFor = (v) => (mode === "focus" ? "#4CB4E7" : heat(v));
  const opFor = (v) => (mode === "focus" ? (v > 0 ? 0.55 + Math.min(v, 16) / 36 : 0) : 0.35 + Math.min(v, 100) * 0.006);
  return (
    <svg viewBox="0 0 120 246" className="w-full" style={{ maxHeight: maxH }} role="img" aria-label={`${view === "front" ? "Anterior" : "Posterior"} muscle map`}>
      <g fill="#24364B" stroke="#8FA6BF" strokeWidth="1" strokeLinejoin="round">
        <ellipse cx="60" cy="17" rx="10.5" ry="12.5" />
        <rect x="55" y="27" width="10" height="9" rx="3" />
        <path d={BODY_HALF} />
        <path d={BODY_HALF} transform="translate(120 0) scale(-1 1)" />
      </g>
      <g stroke="#8FA6BF" strokeWidth=".6" fill="none" opacity=".55">
        <path d="M60 40 L60 132" /><path d="M41 104 Q60 112 79 104" />
        {view === "front" ? <path d="M42 62 Q60 70 78 62" /> : <path d="M44 58 Q60 64 76 58" />}
      </g>
      {regions.map(([m, sh, x, y, a, b], i) => {
        const v = values[m] || 0;
        const props = { fill: fillFor(v), fillOpacity: opFor(v), stroke: sel === m ? "#fff" : "none", strokeWidth: 1.4, style: { cursor: onSel ? "pointer" : "default", transition: "fill .6s, fill-opacity .6s" }, onClick: onSel ? () => onSel(m) : undefined };
        return sh === "e"
          ? <ellipse key={i} cx={x} cy={y} rx={a} ry={b} {...props}><title>{MUSCLES[m]}{mode === "heat" ? ` ${Math.round(v)}%` : ""}</title></ellipse>
          : <rect key={i} x={x} y={y} width={a} height={b} rx="5" {...props}><title>{MUSCLES[m]}{mode === "heat" ? ` ${Math.round(v)}%` : ""}</title></rect>;
      })}
      {[[48, 184], [72, 184], [47, 236], [73, 236], [27, 98], [93, 98]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" fill="#4CB4E7" opacity=".9" />)}
    </svg>
  );
}

/* ═══════════════════════ MEDAL ═══════════════════════ */

function Medal({ b, unlocked, pct, onClick, size = 70 }) {
  const [tilt, setTilt] = useState([0, 0]);
  const [l, m, d] = METALS[b.metal];
  const I = b.icon;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 text-center" aria-label={`${b.name}${unlocked ? ", unlocked" : ", locked"}`}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTilt([((e.clientY - r.top) / r.height - 0.5) * -22, ((e.clientX - r.left) / r.width - 0.5) * 22]); }}
      onMouseLeave={() => setTilt([0, 0])}>
      <div style={{ perspective: 400 }}>
        <div className="relative rounded-full transition-transform duration-150" style={{ width: size, height: size, transform: `rotateX(${tilt[0]}deg) rotateY(${tilt[1]}deg)`, transformStyle: "preserve-3d", filter: unlocked ? "none" : "grayscale(1) opacity(.45)" }}>
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 210deg, ${l}, ${m}, ${d}, ${m}, ${l}, ${m}, ${d}, ${l})`, boxShadow: unlocked ? `0 8px 18px -6px ${m}aa, inset 0 -3px 6px rgba(0,0,0,.3)` : "inset 0 -3px 6px rgba(0,0,0,.3)" }} />
          <div className="absolute rounded-full grid place-items-center overflow-hidden" style={{ inset: size * 0.11, background: `radial-gradient(circle at 35% 28%, ${l} 0%, ${m} 45%, ${d} 100%)`, boxShadow: "inset 0 2px 3px rgba(255,255,255,.45), inset 0 -4px 8px rgba(0,0,0,.3)", transform: "translateZ(12px)" }}>
            <I size={size * 0.36} color="#fff" strokeWidth={2.4} style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.45))" }} />
            {unlocked && <div className="absolute top-0 left-0 h-full w-1/3 bg-white/35 blur-[2px]" style={{ animation: "sw-shine 3.2s ease-in-out infinite" }} />}
          </div>
          {!unlocked && <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white grid place-items-center shadow"><Lock size={12} className="text-[var(--muted)]" /></div>}
        </div>
      </div>
      <div className="text-[11px] font-bold leading-tight max-w-[96px] text-[var(--ink)]">{b.name}</div>
      {!unlocked && <div className="w-14 h-1 rounded-full bg-[#E4E7EB] overflow-hidden"><div className="h-full bg-[var(--orange)]" style={{ width: `${pct * 100}%` }} /></div>}
    </button>
  );
}

/* ═══════════════════════ APPLE WATCH ULTRA ═══════════════════════ */

function WatchUltra(props) {
  const { screen, setScreen, w, ex, hr, zone, music, bpm, stats, act, haptic, crownMode, setCrownMode, zoneOverride, engine, ducking, phaseTotal, standHr } = props;
  const caseRef = useRef(null), crownRef = useRef(null), swipe = useRef(null);
  const [hud, setHud] = useState(null);
  const hudTimer = useRef(null);
  const crownAcc = useRef(0);
  const live = useRef({}); live.current = { crownMode, music, bpm };

  useEffect(() => {
    if (!haptic || !caseRef.current || !caseRef.current.animate) return;
    try { caseRef.current.animate([{ transform: "translateX(0)" }, { transform: "translateX(-3px) rotate(-.7deg)" }, { transform: "translateX(3px) rotate(.7deg)" }, { transform: "translateX(-2px)" }, { transform: "translateX(0)" }], { duration: 340, easing: "ease-out" }); } catch (e) {}
  }, [haptic]);

  const crownStep = (dir) => {
    const L = live.current;
    if (L.crownMode === "volume") {
      const v = clamp(Math.round((L.music.volume + dir * 0.04) * 100) / 100, 0, 1);
      act("watch", "VOLUME", { value: v }); showHud(`VOL ${Math.round(v * 100)}%`);
    } else { act("watch", "BPM_NUDGE", { delta: dir }); showHud(`BPM ${L.bpm + dir}`); }
  };
  const showHud = (txt) => { setHud(txt); clearTimeout(hudTimer.current); hudTimer.current = setTimeout(() => setHud(null), 900); };
  useEffect(() => () => clearTimeout(hudTimer.current), []);
  useEffect(() => {
    const el = crownRef.current;
    if (!el) return;
    const onWheel = (e) => { e.preventDefault(); crownAcc.current += e.deltaY; if (Math.abs(crownAcc.current) > 30) { crownStep(crownAcc.current < 0 ? 1 : -1); crownAcc.current = 0; } };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []); // eslint-disable-line
  const crownDrag = useRef(null);

  const z = ZONES[zone];
  const phaseColor = { work: "#FF8A1F", rest: "#2FD08A", prep: "#39A7FF", idle: "#8B95A7", done: "#FFD54A" }[w.phase];
  const phaseLabel = { work: "WORK", rest: "REST", prep: "GET READY", idle: "READY", done: "COMPLETE" }[w.phase];
  const frac = phaseTotal ? w.remaining / phaseTotal : 0;
  // zone perimeter
  const cx = 102, cy = 92, R = 76, seg = (2 * Math.PI) / 5, gap = 0.07;
  const zStart = (n) => -Math.PI / 2 + (n - 1) * seg + gap / 2;
  const hrFrac = clamp((hr - z.lo) / (z.hi - z.lo), 0, 1);
  const dotA = zStart(zone) + hrFrac * (seg - gap);
  const moveGoal = 600, moveVal = 180 + stats.sessionKcal * 1 + (stats.kcal - 842) * 0.2;

  const screens = [
    <div key="0" className="w-full h-full shrink-0 relative">
      <svg viewBox="0 0 204 250" className="absolute inset-0 w-full h-full">
        {[1, 2, 3, 4, 5].map((n) => <path key={n} d={arcPath(cx, cy, R, zStart(n), zStart(n) + seg - gap)} stroke={ZONES[n].color} strokeOpacity={n === zone ? 1 : 0.22} strokeWidth={n === zone ? 9 : 6} fill="none" strokeLinecap="round" />)}
        <circle cx={cx + R * Math.cos(dotA)} cy={cy + R * Math.sin(dotA)} r="6" fill="#fff" stroke={z.color} strokeWidth="3" />
        <Ring cx={cx} cy={cy} r={62} stroke={3.5} value={frac} color={phaseColor} track="rgba(255,255,255,.07)" />
        {[1, 2, 3, 4, 5].map((n) => { const a = zStart(n) + (seg - gap) / 2; return <text key={n} x={cx + (R + 12) * Math.cos(a)} y={cy + (R + 12) * Math.sin(a) + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill={n === zone ? ZONES[n].color : "#5d6675"} fontFamily="Mulish, sans-serif">Z{n}</text>; })}
      </svg>
      <div className="absolute left-0 right-0 top-[38px] flex flex-col items-center leading-none pointer-events-none">
        <div className="text-[9px] font-bold tracking-[.16em]" style={{ color: phaseColor }}>{phaseLabel}</div>
        <div className="font-disp text-[44px] font-bold tnum mt-0.5 text-white">{w.phase === "idle" || w.phase === "done" ? "0:00" : fmt(w.remaining)}</div>
        <div className="text-[10px] text-white/80 font-semibold max-w-[104px] truncate mt-0.5">{ex.short}</div>
        <div className="flex items-center gap-1 mt-1.5">
          <Heart size={11} fill={z.color} color={z.color} style={{ animation: `sw-beat ${(60 / hr).toFixed(2)}s infinite` }} />
          <span className="font-disp text-[17px] font-bold tnum" style={{ color: z.color }}>{Math.round(hr)}</span>
          <span className="text-[8px] text-white/50 font-bold">BPM</span>
        </div>
      </div>
      <div className="absolute left-0 right-0 top-[176px] flex justify-center gap-3">
        <button aria-label="Watch play or pause" onClick={() => act("watch", "TOGGLE_PLAY")} className="w-[38px] h-[38px] rounded-full grid place-items-center active:scale-90 transition" style={{ background: w.running ? "#3a2a12" : "#FF8A1F" }}>
          {w.running ? <Pause size={17} color="#FF8A1F" fill="#FF8A1F" /> : <Play size={17} color="#1a0d00" fill="#1a0d00" />}
        </button>
        <button aria-label="Watch skip interval" onClick={() => act("watch", "SKIP")} className="w-[38px] h-[38px] rounded-full grid place-items-center bg-white/10 active:scale-90 transition"><SkipForward size={16} color="#fff" /></button>
      </div>
      <div className="absolute left-0 right-0 top-[222px] flex justify-center gap-[3px]">
        {[null, 1, 2, 3, 4, 5].map((n) => (
          <button key={String(n)} onClick={() => act("watch", "ZONE_OVERRIDE", { zone: n })} aria-label={n ? `Override to zone ${n}` : "Automatic zone"}
            className="h-[15px] min-w-[17px] px-1 rounded-full text-[8px] font-extrabold" style={{ background: zoneOverride === n ? (n ? ZONES[n].color : "#fff") : "rgba(255,255,255,.1)", color: zoneOverride === n ? "#000" : "#aab" }}>
            {n ? n : "A"}
          </button>
        ))}
      </div>
    </div>,
    <div key="1" className="w-full h-full shrink-0 relative px-3 pt-7">
      <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[.14em]" style={{ color: TRACKS[music.track].color }}><Music2 size={10} /> NOW PLAYING</div>
      <div className="text-[14px] font-bold text-white leading-tight mt-1 truncate">{TRACKS[music.track].title}</div>
      <div className="text-[10px] text-white/55 truncate">{TRACKS[music.track].genre}</div>
      <div className="flex items-baseline gap-1.5 mt-1.5">
        <span className="font-disp text-[30px] font-bold tnum text-white leading-none">{bpm}</span>
        <span className="text-[9px] font-bold text-white/50">BPM</span>
        {music.auto && <span className="ml-1 text-[8px] font-extrabold px-1.5 py-[1px] rounded-full bg-[var(--orange)] text-black">AUTO Z{zone}</span>}
        {ducking && <span className="text-[8px] font-extrabold px-1.5 py-[1px] rounded-full bg-[var(--blue)] text-black">−12 dB</span>}
      </div>
      <Spectrum engine={engine} bands={12} height={34} gap={2} className="mt-2" />
      <div className="flex justify-between items-center mt-2.5 px-1">
        <button aria-label="Previous track" onClick={() => act("watch", "TRACK", { index: (music.track + 3) % 4 })} className="w-8 h-8 grid place-items-center rounded-full bg-white/10"><SkipBack size={14} color="#fff" /></button>
        <button aria-label="Play or pause music" onClick={() => act("watch", "MUSIC_TOGGLE")} className="w-11 h-11 grid place-items-center rounded-full bg-white">{music.playing ? <Pause size={18} fill="#000" color="#000" /> : <Play size={18} fill="#000" color="#000" />}</button>
        <button aria-label="Next track" onClick={() => act("watch", "TRACK", { index: (music.track + 1) % 4 })} className="w-8 h-8 grid place-items-center rounded-full bg-white/10"><SkipForward size={14} color="#fff" /></button>
      </div>
      <div className="flex gap-1 mt-2.5 justify-center">
        {["volume", "bpm"].map((m) => (
          <button key={m} onClick={() => setCrownMode(m)} className="text-[8.5px] font-extrabold px-2 py-[3px] rounded-full" style={{ background: crownMode === m ? "#FF8A1F" : "rgba(255,255,255,.1)", color: crownMode === m ? "#000" : "#ccd" }}>
            CROWN: {m === "volume" ? `VOL ${Math.round(music.volume * 100)}` : `BPM ${music.nudge >= 0 ? "+" : ""}${music.nudge}`}
          </button>
        ))}
      </div>
    </div>,
    <div key="2" className="w-full h-full shrink-0 relative px-3 pt-7">
      <div className="text-[9px] font-bold tracking-[.14em] text-white/60">ACTIVITY</div>
      <div className="flex items-center gap-2 mt-1">
        <svg viewBox="0 0 100 100" width="96" height="96">
          <Ring cx={50} cy={50} r={42} stroke={10} value={moveVal / moveGoal} color="#FA114F" track="#3a0716" />
          <Ring cx={50} cy={50} r={30} stroke={10} value={stats.weekMin / 150} color="#92E82A" track="#1f3108" />
          <Ring cx={50} cy={50} r={18} stroke={10} value={standHr / 12} color="#1EEAEF" track="#073335" />
        </svg>
        <div className="leading-tight text-[10px] font-bold tnum">
          <div style={{ color: "#FA114F" }}>{Math.round(moveVal)}/{moveGoal}<span className="text-[8px] opacity-70"> KCAL</span></div>
          <div style={{ color: "#92E82A" }}>{stats.weekMin.toFixed(1)}/150<span className="text-[8px] opacity-70"> MIN</span></div>
          <div style={{ color: "#1EEAEF" }}>{standHr}/12<span className="text-[8px] opacity-70"> HRS</span></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        <div className="rounded-xl bg-white/[0.08] px-2 py-1.5">
          <div className="flex items-center gap-1 text-[8px] font-bold text-[#7CC6FF]"><Droplets size={9} /> SpO₂</div>
          <div className="font-disp text-[20px] font-bold text-white tnum leading-none mt-0.5">{hr > 165 ? 97 : 98}<span className="text-[10px]">%</span></div>
        </div>
        <div className="rounded-xl bg-white/[0.08] px-2 py-1.5">
          <div className="flex items-center gap-1 text-[8px] font-bold text-[#B794FF]"><Waves size={9} /> HRV</div>
          <div className="font-disp text-[20px] font-bold text-white tnum leading-none mt-0.5">{Math.round(78 - (hr - 68) * 0.42)}<span className="text-[10px]"> ms</span></div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="relative select-none" style={{ width: 236, height: 300 }}>
      {/* Alpine loop strap stubs */}
      <div className="absolute left-[46px] right-[46px] -top-[22px] h-[40px] rounded-t-[18px] bg-gradient-to-b from-[#C25A14] to-[#E46F1C]" />
      <div className="absolute left-[46px] right-[46px] -bottom-[22px] h-[40px] rounded-b-[18px] bg-gradient-to-t from-[#C25A14] to-[#E46F1C]" />
      <div ref={caseRef} className="absolute inset-0">
        <div className="absolute inset-0 rounded-[60px] bg-gradient-to-br from-[#C9C3BA] via-[#8E8981] to-[#5B5751] shadow-[0_24px_50px_-14px_rgba(0,0,0,.85)]" />
        <div className="absolute inset-[5px] rounded-[55px] bg-gradient-to-b from-[#2A2A2C] to-[#141416]" />
        {/* Action button (Haptic Lap Marker) */}
        <button aria-label="Action button: haptic lap marker" onClick={() => act("watch", "LAP")} title="Action button · Lap"
          className="absolute -left-[7px] top-[78px] w-[10px] h-[46px] rounded-[4px] bg-gradient-to-r from-[#FF5A00] to-[#FF8A30] shadow active:translate-x-[2px] transition" />
        {/* Digital Crown + guard + side button */}
        <div className="absolute -right-[10px] top-[62px] w-[14px] h-[86px] rounded-[6px] bg-gradient-to-r from-[#7B766E] to-[#B4AEA5]" />
        <div ref={crownRef} role="slider" aria-label={`Digital Crown, ${crownMode}`} aria-valuenow={crownMode === "volume" ? Math.round(music.volume * 100) : bpm} tabIndex={0}
          onKeyDown={(e) => { if (e.key === "ArrowUp") crownStep(1); if (e.key === "ArrowDown") crownStep(-1); }}
          onPointerDown={(e) => { crownDrag.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if (crownDrag.current == null) return; const dy = crownDrag.current - e.clientY; if (Math.abs(dy) > 8) { crownStep(dy > 0 ? 1 : -1); crownDrag.current = e.clientY; } }}
          onPointerUp={() => (crownDrag.current = null)}
          className="absolute -right-[20px] top-[82px] w-[16px] h-[40px] rounded-[5px] cursor-ns-resize touch-none"
          style={{ background: "repeating-linear-gradient(180deg,#d8d2c8 0 2px,#8d877e 2px 4px)", boxShadow: "inset 0 0 0 1px #6c665e" }} title="Digital Crown · scroll or drag" />
        <button aria-label="Side button: next screen" onClick={() => setScreen((screen + 1) % 3)} className="absolute -right-[7px] top-[176px] w-[8px] h-[48px] rounded-[3px] bg-gradient-to-r from-[#8a857c] to-[#bcb6ac]" />
        {/* Display */}
        <div className="absolute inset-[16px] rounded-[46px] bg-black overflow-hidden touch-pan-y"
          onPointerDown={(e) => { swipe.current = e.clientX; }}
          onPointerUp={(e) => { if (swipe.current == null) return; const dx = e.clientX - swipe.current; if (dx < -36) setScreen(Math.min(2, screen + 1)); if (dx > 36) setScreen(Math.max(0, screen - 1)); swipe.current = null; }}>
          <div className="absolute top-[10px] left-0 right-0 flex justify-between px-7 text-[10px] font-bold text-white/80 z-10 pointer-events-none">
            <span className="tnum" style={{ color: "#FF8A1F" }}>{w.running ? "● REC" : ""}</span>
            <span className="tnum">{new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M/i, "")}</span>
          </div>
          <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${screen * 100}%)` }}>{screens}</div>
          <div className="absolute bottom-[7px] left-0 right-0 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => <button key={i} aria-label={`Watch screen ${i + 1}`} onClick={() => setScreen(i)} className={`h-[5px] rounded-full transition-all ${screen === i ? "w-3 bg-white" : "w-[5px] bg-white/35"}`} />)}
          </div>
          {hud && <div className="absolute top-[34px] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-white text-black text-[10px] font-extrabold tnum" style={{ animation: "sw-fade .15s" }}>{hud}</div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ NATIVE BRIDGE SOURCES ═══════════════════════ */

const BRIDGE_FILES = [
  {
    name: "watchBridge.ts", lang: "TypeScript", body: `// src/native/watchBridge.ts
// WatchConnectivity bridge between the Capacitor iOS WebView and a SwiftUI watch app.
// @capacitor-community/apple-watch covers declarative watch UI + data pushes;
// for raw sendMessage / updateApplicationContext we register a small custom plugin
// (Swift side below). Both can live in the same project.
import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

export interface WorkoutContext {
  phase: 'idle' | 'prep' | 'work' | 'rest' | 'done';
  intervalIndex: number;
  remaining: number;
  exercise: string;
  heartRate: number;
  zone: 1 | 2 | 3 | 4 | 5;
  music: { trackId: number; bpm: number; volume: number; playing: boolean; auto: boolean };
}

export type WatchCommand =
  | { cmd: 'TOGGLE_PLAY' } | { cmd: 'SKIP' } | { cmd: 'LAP' }
  | { cmd: 'VOLUME'; value: number } | { cmd: 'BPM_NUDGE'; delta: number }
  | { cmd: 'ZONE_OVERRIDE'; zone: number | null } | { cmd: 'TRACK'; index: number }
  | { cmd: 'HR'; bpm: number };

export interface WatchBridgePlugin {
  status(): Promise<{ paired: boolean; installed: boolean; reachable: boolean }>;
  updateApplicationContext(o: { context: WorkoutContext }): Promise<void>;
  sendMessage(o: { message: Record<string, unknown> }): Promise<{ reply?: Record<string, unknown> }>;
  addListener(e: 'watchCommand', cb: (c: WatchCommand) => void): Promise<PluginListenerHandle>;
}

export const WatchBridge = registerPlugin<WatchBridgePlugin>('WatchBridge');

// Phone -> Watch: latest-state-wins. Delivered even if the watch app wakes later.
export const pushContext = (context: WorkoutContext) =>
  WatchBridge.updateApplicationContext({ context });

// Phone -> Watch: immediate, only while reachable (e.g. haptic on interval change).
export const pingWatch = (message: Record<string, unknown>) =>
  WatchBridge.sendMessage({ message }).catch(() => pushContext as unknown);

// Watch -> Phone: commands from the wrist feed the same reducer the phone UI uses.
export const onWatchCommand = (dispatch: (c: WatchCommand) => void) =>
  WatchBridge.addListener('watchCommand', dispatch);


// ─────────────────────────────────────────────────────────────
// ios/App/App/WatchBridgePlugin.swift
// ─────────────────────────────────────────────────────────────
import Capacitor
import WatchConnectivity

@objc(WatchBridgePlugin)
public class WatchBridgePlugin: CAPPlugin, CAPBridgedPlugin, WCSessionDelegate {
  public let identifier = "WatchBridgePlugin"
  public let jsName = "WatchBridge"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "updateApplicationContext", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "sendMessage", returnType: CAPPluginReturnPromise)
  ]

  override public func load() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  @objc func status(_ call: CAPPluginCall) {
    let s = WCSession.default
    call.resolve(["paired": s.isPaired, "installed": s.isWatchAppInstalled, "reachable": s.isReachable])
  }

  @objc func updateApplicationContext(_ call: CAPPluginCall) {
    guard let ctx = call.getObject("context") else { return call.reject("context required") }
    do { try WCSession.default.updateApplicationContext(ctx as [String: Any]); call.resolve() }
    catch { call.reject(error.localizedDescription) }
  }

  @objc func sendMessage(_ call: CAPPluginCall) {
    guard WCSession.default.isReachable, let msg = call.getObject("message") else {
      return call.reject("Watch not reachable")
    }
    WCSession.default.sendMessage(msg as [String: Any],
      replyHandler: { reply in call.resolve(["reply": reply]) },
      errorHandler: { err in call.reject(err.localizedDescription) })
  }

  // Watch -> Phone
  public func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    notifyListeners("watchCommand", data: message)
  }
  public func session(_ s: WCSession, activationDidCompleteWith st: WCSessionActivationState, error: Error?) {}
  public func sessionDidBecomeInactive(_ session: WCSession) {}
  public func sessionDidDeactivate(_ session: WCSession) { WCSession.default.activate() }
}


// ─────────────────────────────────────────────────────────────
// WatchApp/PhoneLink.swift  (SwiftUI watch app target)
// ─────────────────────────────────────────────────────────────
import SwiftUI
import WatchConnectivity

final class PhoneLink: NSObject, ObservableObject, WCSessionDelegate {
  static let shared = PhoneLink()
  @Published var context: [String: Any] = [:]

  override init() {
    super.init()
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func send(_ command: [String: Any]) {
    guard WCSession.default.isReachable else { return }
    WCSession.default.sendMessage(command, replyHandler: nil)
  }

  func session(_ s: WCSession, didReceiveApplicationContext ctx: [String: Any]) {
    DispatchQueue.main.async { self.context = ctx }
  }
  func session(_ s: WCSession, activationDidCompleteWith st: WCSessionActivationState, error: Error?) {}
}

// Action button / Digital Crown wiring in a SwiftUI view:
//   .digitalCrownRotation($volume, from: 0, through: 1, by: 0.02)
//   .onChange(of: volume) { _, v in PhoneLink.shared.send(["cmd": "VOLUME", "value": v]) }
//   Button("Lap") { WKInterfaceDevice.current().play(.click); PhoneLink.shared.send(["cmd": "LAP"]) }`,
  },
  {
    name: "health.ts", lang: "TypeScript", body: `// src/native/health.ts
// Read/write HealthKit from the iPhone with @perfood/capacitor-healthkit.
// Sample-name strings map to HKQuantityTypeIdentifier values; confirm the exact
// keys against the README of the plugin version you install.
import { CapacitorHealthkit } from '@perfood/capacitor-healthkit';

const READ  = ['heartRate', 'restingHeartRate', 'calories', 'activity'];
//              ^ HKQuantityTypeIdentifierHeartRate   ^ HKQuantityTypeIdentifierActiveEnergyBurned
const WRITE = ['calories', 'activity'];               // activity => HKWorkoutType

export async function requestHealthAccess() {
  await CapacitorHealthkit.requestAuthorization({ all: [], read: READ, write: WRITE });
}

export async function latestHeartRate(): Promise<number | undefined> {
  const end = new Date();
  const start = new Date(end.getTime() - 10 * 60 * 1000);
  const res = await CapacitorHealthkit.queryHKitSampleType<{ value: number }>({
    sampleName: 'heartRate',
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    limit: 1,
  });
  return res.resultData?.[0]?.value;
}

// Info.plist
//   NSHealthShareUsageDescription  "FitnessLife reads heart rate to set your training zone."
//   NSHealthUpdateUsageDescription "FitnessLife saves workouts and active energy to Health."
// Xcode: Signing & Capabilities -> HealthKit (iOS target AND watch target)


// ─────────────────────────────────────────────────────────────
// WatchApp/WorkoutManager.swift — live HKWorkoutSession on the wrist
// The Capacitor plugin reads/writes samples; a live session with streaming
// heart rate runs on watchOS (HKWorkoutSession + HKLiveWorkoutBuilder).
// ─────────────────────────────────────────────────────────────
import HealthKit

final class WorkoutManager: NSObject, HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
  let store = HKHealthStore()
  private var session: HKWorkoutSession?
  private var builder: HKLiveWorkoutBuilder?
  private let heartRate = HKQuantityType(.heartRate)
  private let energy = HKQuantityType(.activeEnergyBurned)

  func authorize() async throws {
    try await store.requestAuthorization(toShare: [HKQuantityType.workoutType(), energy],
                                         read: [heartRate, energy])
  }

  func start() throws {
    let cfg = HKWorkoutConfiguration()
    cfg.activityType = .highIntensityIntervalTraining
    cfg.locationType = .indoor
    session = try HKWorkoutSession(healthStore: store, configuration: cfg)
    builder = session?.associatedWorkoutBuilder()
    builder?.dataSource = HKLiveWorkoutDataSource(healthStore: store, workoutConfiguration: cfg)
    session?.delegate = self
    builder?.delegate = self
    let now = Date()
    session?.startActivity(with: now)
    builder?.beginCollection(withStart: now) { _, _ in }
  }

  func pause()  { session?.pause() }
  func resume() { session?.resume() }
  func end() {
    session?.end()
    builder?.endCollection(withEnd: Date()) { _, _ in
      self.builder?.finishWorkout { _, _ in }
    }
  }

  func workoutBuilder(_ b: HKLiveWorkoutBuilder, didCollectDataOf types: Set<HKSampleType>) {
    let bpmUnit = HKUnit.count().unitDivided(by: .minute())
    if types.contains(heartRate),
       let bpm = b.statistics(for: heartRate)?.mostRecentQuantity()?.doubleValue(for: bpmUnit) {
      PhoneLink.shared.send(["cmd": "HR", "bpm": bpm])
    }
  }
  func workoutBuilderDidCollectEvent(_ b: HKLiveWorkoutBuilder) {}
  func workoutSession(_ s: HKWorkoutSession, didChangeTo to: HKWorkoutSessionState,
                      from: HKWorkoutSessionState, date: Date) {}
  func workoutSession(_ s: HKWorkoutSession, didFailWithError error: Error) {}
}`,
  },
  {
    name: "mediaSession.ts", lang: "TypeScript", body: `// src/native/mediaSession.ts
// Lock-screen / Control Center transport controls for the synthesized workout mix.
type Handlers = { play: () => void; pause: () => void; nexttrack: () => void; previoustrack: () => void };

export function bindLockScreen(title: string, genre: string, h: Handlers) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title, artist: 'FitnessLife', album: genre,
  });
  (Object.keys(h) as MediaSessionAction[]).forEach((action) => {
    try { navigator.mediaSession.setActionHandler(action, h[action as keyof Handlers]); } catch {}
  });
}

export const setPlaybackState = (playing: boolean) => {
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
};


// ─────────────────────────────────────────────────────────────
// ios/App/App/AppDelegate.swift — background audio + ducking other apps
// ─────────────────────────────────────────────────────────────
import AVFoundation

func application(_ app: UIApplication,
                 didFinishLaunchingWithOptions opts: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
  // Default: play alongside Spotify / Apple Music without interrupting them.
  try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
  try? AVAudioSession.sharedInstance().setActive(true)
  return true
}

// Called by a tiny Capacitor plugin around each voice cue / 3-2-1 countdown.
enum CueAudio {
  static func begin() {          // other apps drop in volume while the coach speaks
    let s = AVAudioSession.sharedInstance()
    try? s.setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers, .duckOthers])
    try? s.setActive(true)
  }
  static func end() {            // restore their volume
    let s = AVAudioSession.sharedInstance()
    try? s.setActive(false, options: .notifyOthersOnDeactivation)
    try? s.setCategory(.playback, mode: .default, options: [.mixWithOthers])
    try? s.setActive(true)
  }
}

// Info.plist
//   UIBackgroundModes: [ "audio" ]          // keep the mix + cues alive when locked`,
  },
  {
    name: "capacitor.config.ts", lang: "TypeScript", body: `// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.fitnesslife',
  appName: 'FitnessLife',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    // WatchBridge is registered natively (ios/App/App/WatchBridgePlugin.swift).
    SplashScreen: { launchAutoHide: true, backgroundColor: '#0B0E13' },
  },
};

export default config;

// ── install ──────────────────────────────────────────────────
// npm i @ionic/react @ionic/react-router @capacitor/core @capacitor/ios
// npm i @capacitor-community/apple-watch @perfood/capacitor-healthkit
// npx cap add ios && npx cap sync ios
// Xcode: File > New > Target > watchOS App (SwiftUI), same App Group as the iOS target.
//        Add HealthKit + Background Modes (Audio, Workout processing on the watch).

// ── wiring in App.tsx ────────────────────────────────────────
// useEffect(() => {
//   const sub = onWatchCommand((c) => act('watch', c.cmd, c));   // same reducer as the phone UI
//   return () => { sub.then((h) => h.remove()); };
// }, []);
// useEffect(() => { pushContext(toContext(state)); }, [state.phase, state.idx, hrBucket, music]);`,
  },
];

function BridgeInspector({ toast }) {
  const [i, setI] = useState(0);
  const f = BRIDGE_FILES[i];
  const copy = () => {
    try {
      navigator.clipboard.writeText(f.body).then(() => toast("Copied", `${f.name} is on your clipboard.`, Check), () => toast("Copy blocked", "Select the code and copy it manually.", Info));
    } catch (e) { toast("Copy blocked", "Select the code and copy it manually.", Info); }
  };
  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex gap-1.5 overflow-x-auto no-sb pb-2">
        {BRIDGE_FILES.map((x, k) => (
          <button key={x.name} onClick={() => setI(k)} className={`shrink-0 px-3 py-1.5 rounded-[4px] text-[12px] font-code border ${k === i ? "bg-[var(--navy)] border-[var(--navy)] text-white font-semibold" : "border-[var(--line)] text-[var(--ink)]"}`}>{x.name}</button>
        ))}
      </div>
      <div className="flex items-center justify-between py-1.5">
        <span className="text-[11.5px] text-[var(--muted)]">{f.lang} · {f.body.split("\n").length} lines</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--orange)]"><Copy size={13} /> COPY</button>
      </div>
      <pre className="font-code text-[11px] leading-[1.55] bg-[var(--navy)] rounded-[6px] p-3 overflow-auto flex-1 min-h-0 whitespace-pre">
        {f.body.split("\n").map((ln, k) => (
          <div key={k} className="flex">
            <span className="w-8 shrink-0 text-right pr-3 text-white/25 select-none">{k + 1}</span>
            <span className={/^\s*\/\//.test(ln) ? "text-[#7F93AA]" : /^\s*(import|export|const|func|final|let|guard|public|override|@objc|enum|static|type|interface|try)\b/.test(ln) ? "text-[#FFB866]" : "text-[#E3EAF2]"}>{ln || " "}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

/* ═══════════════════════ SHEET + TOASTS ═══════════════════════ */

function Sheet({ open, onClose, title, ios, children, tall }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end text-[var(--ink)]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[#1A2636]/50" style={{ animation: "sw-fade .2s" }} onClick={onClose} />
      <div className={`relative bg-white ${ios ? "rounded-t-[14px]" : "rounded-t-[28px]"} flex flex-col ${tall ? "h-[88%]" : "max-h-[86%]"} shadow-[0_-12px_40px_rgba(0,0,0,.25)]`} style={{ animation: "sw-up .32s cubic-bezier(.22,1,.36,1)" }}>
        <div className="mx-auto mt-2 w-10 h-[4px] rounded-full bg-[#C9CED4]" />
        <div className={`flex items-center px-4 pt-3 pb-3 ${ios ? "justify-center" : "justify-start"} relative`}>
          <div className={ios ? "text-[17px] font-extrabold" : "text-[20px] font-medium"}>{title}</div>
          <button onClick={onClose} aria-label="Close" className="absolute right-3 w-8 h-8 grid place-items-center rounded-full bg-[#EEF1F4]"><X size={16} /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-5 no-sb">{children}</div>
      </div>
    </div>
  );
}

function Toasts({ toasts, ios, topPad }) {
  return (
    <div className={`absolute left-0 right-0 z-50 flex flex-col gap-2 px-3 pointer-events-none ${ios ? "" : "bottom-[140px]"}`} style={ios ? { top: T(8, topPad) } : undefined} aria-live="polite">
      {toasts.map((t) => {
        const I = t.icon || Info;
        return (
          <div key={t.id} className={`flex items-center gap-3 px-3.5 py-2.5 ${ios ? "rounded-[14px] bg-white/95 backdrop-blur-xl text-[var(--ink)] shadow-[0_10px_30px_rgba(26,38,54,.22)] border border-black/5" : "rounded-[4px] bg-[#2B333D] text-white shadow-lg"}`} style={{ animation: "sw-in .28s cubic-bezier(.22,1,.36,1)" }}>
            <div className="w-8 h-8 shrink-0 rounded-full grid place-items-center bg-[var(--orange)] text-white"><I size={16} /></div>
            <div className="min-w-0">
              <div className="text-[13px] font-extrabold leading-tight">{t.title}</div>
              {t.msg && <div className={`text-[12px] leading-snug ${ios ? "text-[var(--muted)]" : "text-white/70"}`}>{t.msg}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════ TRAIN: overview (light) + player (navy) ═══════════════════════ */

function OverviewView({ C }) {
  const { wide, topPad, w, circuit, act, circuitName, setView, setTab, toast } = C;
  const heroEx = EX[circuit[0]?.id] || EX_LIST[0];
  const total = circuitSeconds(circuit);
  const avg = circuit.reduce((a, it) => a + EX[it.id].intensity, 0) / Math.max(1, circuit.length);
  const tz = zoneOf(92 + avg * 86);
  const active = w.phase !== "idle" && w.phase !== "done";
  const share = () => {
    const txt = `${circuitName} · ${circuit.length} intervals · ${fmt(total)}`;
    try { navigator.clipboard.writeText(txt).then(() => toast("Workout copied", "Paste it anywhere to share.", Share2), () => toast("Share", txt, Share2)); } catch (e) { toast("Share", txt, Share2); }
  };
  return (
    <div className="bg-white min-h-full pb-4">
      <div className="relative overflow-hidden" style={{ height: T(222, topPad) }}>
        <Scene ex={heroEx} t={0.47} className="absolute inset-0 w-full h-full" vb="-45 -40 240 200" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/30" />
        <div className="absolute left-1 right-1 flex justify-between" style={{ top: T(0, topPad) }}>
          <IconBtn icon={ArrowLeft} tone="ghostLight" label="Back to Create Custom" onClick={() => setTab("build")} />
          <IconBtn icon={Share2} tone="ghostLight" label="Share workout" onClick={share} iconSize={17} />
        </div>
        <div className="absolute inset-x-5 text-center" style={{ top: T(46, topPad) }}>
          <h1 className="hero-title text-white text-[22px] font-black leading-[1.22]">{circuitName}</h1>
        </div>
        <svg className="absolute right-0 bottom-0" width="70" height="46" viewBox="0 0 70 46" aria-hidden><polygon points="70,0 70,46 0,46" fill="#fff" /></svg>
        <Video size={19} className="absolute right-2.5 bottom-2 text-[var(--blue)]" />
      </div>
      <div className="h-[4px] bg-[var(--blue)] mr-[70px]" />
      <div className={wide ? "max-w-[860px] mx-auto" : ""}>
        <p className="px-4 pt-3 text-[14px] leading-[1.45] text-[#3D4651]">
          Interval training built on functional movement patterns: push, hinge, squat, rotate and jump. Your coach, music tempo and heart-rate zones adjust in real time as you move.
        </p>
        <div className="flex gap-4 px-4 pt-3 text-[12.5px] font-semibold text-[var(--muted)]">
          <span className="flex items-center gap-1.5"><Clock size={14} /> {fmt(total)}</span>
          <span className="flex items-center gap-1.5"><Dumbbell size={14} /> {circuit.length} intervals</span>
          <span className="flex items-center gap-1.5"><Heart size={14} /> Zone {tz} target</span>
        </div>
        <div className="px-4 pt-3.5">
          <button onClick={() => (active ? setView("player") : act("phone", "TOGGLE_PLAY"))} disabled={!circuit.length}
            className="w-full py-3 rounded-full bg-[var(--orange)] text-white font-extrabold text-[14px] tracking-[.06em] uppercase shadow-[0_6px_16px_-6px_rgba(247,147,30,.8)] active:scale-[.98] transition disabled:opacity-40 flex items-center justify-center gap-2">
            <Play size={16} fill="currentColor" /> {active ? "Resume workout" : w.idx > 0 ? `Start at interval ${w.idx + 1}` : "Start workout"}
          </button>
        </div>
        <div className="h-px bg-[var(--line)] mt-4" />
        <div className={`grid ${wide ? "grid-cols-4" : "grid-cols-2"} gap-x-2.5 gap-y-3 px-2.5 pt-3`}>
          {circuit.map((it, i) => {
            const e = EX[it.id], current = active && i === w.idx;
            return (
              <button key={it.uid} onClick={() => { act("phone", "JUMP", { idx: i }); setView("player"); }} className="text-left group">
                <div className={`relative rounded-[3px] overflow-hidden ${current ? "ring-[3px] ring-[var(--orange)]" : ""}`} style={{ aspectRatio: "16 / 11" }}>
                  <Scene ex={e} t={0.45} className="absolute inset-0 w-full h-full" />
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-[var(--blue)] text-white text-[11px] font-bold pl-1.5 pr-2 py-[2px]"><Video size={12} /> {it.work} secs</span>
                  {current && <span className="absolute bottom-1.5 right-1.5 rounded-full bg-[var(--orange)] text-white text-[10px] font-extrabold px-2 py-[1px]">NOW</span>}
                </div>
                <div className="text-[13.5px] text-[var(--ink)] mt-1 leading-tight group-hover:text-[var(--orange)]">{e.name}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NavyTile({ k, children, className = "" }) {
  return (
    <div className={`rounded-[6px] bg-[var(--navy2)] py-2.5 px-2 text-center ${className}`}>
      <div className="text-white text-[13px] font-extrabold">{k}</div>
      <div className="text-white/85 text-[13px] mt-0.5">{children}</div>
    </div>
  );
}

function PlayerView({ C }) {
  const { wide, topPad, w, circuit, ex, hr, zone, act, stats, hrHist, phaseTotal, tempoScale, say, onRep, zoneOverride, cadence, laps, setView } = C;
  const coachIdx = w.phase === "rest" ? Math.min(w.idx + 1, circuit.length - 1) : w.idx;
  const coachEx = EX[circuit[coachIdx]?.id] || ex;
  const z = ZONES[zone];
  const phaseColor = { work: "#F7931E", rest: "#34C17B", prep: "#4CB4E7", idle: "#8B939C", done: "#FFD54A" }[w.phase];
  const phaseLabel = { work: "Work", rest: "Rest · up next", prep: "Get ready", idle: "Ready", done: "Complete" }[w.phase];
  const frac = phaseTotal ? 1 - w.remaining / phaseTotal : 0;
  const total = circuitSeconds(circuit);
  const upNext = circuit.slice(w.idx + 1, w.idx + 4);

  const nameAndTiles = (
    <div>
      <div className="flex items-center gap-2 mt-3">
        <span className="shrink-0 rounded-full px-2 py-[2px] text-[10.5px] font-extrabold uppercase tracking-wide text-[#1A2636]" style={{ background: phaseColor }}>{phaseLabel}</span>
        <h2 className="text-white text-[17px] font-extrabold leading-tight truncate">{coachEx.name}</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2.5">
        <NavyTile k="Difficulty"><span className="flex justify-center gap-1 pt-0.5">{[1, 2, 3].map((n) => <Flame key={n} size={17} className={n <= coachEx.level ? "text-white" : "text-white/30"} fill={n <= coachEx.level ? "#fff" : "rgba(255,255,255,.3)"} />)}</span></NavyTile>
        <NavyTile k="Equipment">{coachEx.equip}</NavyTile>
        <NavyTile k="Impact Level">{coachEx.intensity > 0.8 ? "High" : coachEx.intensity > 0.55 ? "Moderate" : "Low"}</NavyTile>
        <NavyTile k="Quiet">{coachEx.category === "Plyo" || (coachEx.category === "Cardio" && coachEx.intensity > 0.7) ? "No" : "Yes"}</NavyTile>
      </div>
    </div>
  );

  const focus = (
    <div className={wide ? "" : "mt-4"}>
      <div className="text-white text-[13px] font-extrabold mb-1">Focus Areas</div>
      <div className="grid grid-cols-2 gap-6 px-4">
        <BodyMap view="front" values={coachEx.muscles} maxH={wide ? 250 : 230} />
        <BodyMap view="back" values={coachEx.muscles} maxH={wide ? 250 : 230} />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2.5 justify-center">
        {Object.keys(coachEx.muscles).map((m) => <span key={m} className="text-[11px] font-bold px-2 py-[2px] rounded-full bg-[rgba(76,180,231,0.2)] text-[#9BD7F5]">{MUSCLES[m]}</span>)}
      </div>
    </div>
  );

  const bio = (
    <div className="rounded-[6px] bg-[var(--navy2)] p-3.5 text-white">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-extrabold flex items-center gap-1.5"><Activity size={14} className="text-[var(--blue)]" /> Heart Rate</div>
        {zoneOverride
          ? <button onClick={() => act("phone", "ZONE_OVERRIDE", { zone: null })} className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: ZONES[zoneOverride].color, color: "#1A2636" }}>Watch override Z{zoneOverride} · clear</button>
          : <span className="text-[11px] text-white/50">HealthKit · max 190</span>}
      </div>
      <div className="flex items-end gap-3 mt-1.5">
        <div className="flex items-center gap-2">
          <Heart size={20} fill={z.color} color={z.color} style={{ animation: `sw-beat ${(60 / hr).toFixed(2)}s infinite` }} />
          <span className="text-[40px] font-black tnum leading-none">{Math.round(hr)}</span>
          <span className="text-[11px] text-white/55 font-bold mb-1">BPM</span>
        </div>
        <div className="ml-auto text-right"><div className="text-[11px] font-extrabold" style={{ color: z.color }}>ZONE {zone}</div><div className="text-[12px] text-white/60">{z.name}</div></div>
      </div>
      <div className="flex gap-[3px] mt-2">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-1.5 flex-1 rounded-full" style={{ background: ZONES[n].color, opacity: n === zone ? 1 : 0.22 }} />)}</div>
      <div className="mt-2"><HrSpark data={hrHist} /></div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[["Burn rate", kcalPerMin(hr).toFixed(1), "kcal/min"], ["Session", Math.round(stats.sessionKcal), "kcal"], ["Cadence", cadence, "reps/min"]].map(([k, v, u]) => (
          <div key={k} className="rounded-[6px] bg-[var(--navy3)] px-2 py-1.5 text-center">
            <div className="text-[11px] text-white/60 font-bold">{k}</div>
            <div className="text-[19px] font-black tnum leading-tight">{v}</div>
            <div className="text-[10px] text-white/50">{u}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const next = (
    <div className="rounded-[6px] bg-[var(--navy2)] p-3.5 text-white">
      <div className="text-[13px] font-extrabold">Up Next</div>
      {upNext.length ? upNext.map((it, k) => (
        <div key={it.uid} className={`flex items-center gap-3 py-2 ${k ? "border-t border-white/[0.07]" : ""}`}>
          <div className="w-14 h-10 shrink-0 rounded-[3px] overflow-hidden bg-white"><Scene ex={EX[it.id]} variant="white" className="w-full h-full" /></div>
          <div className="flex-1 min-w-0"><div className="text-[13px] font-bold truncate">{EX[it.id].name}</div><div className="text-[11px] text-white/55">{it.work}s work · {it.rest}s rest</div></div>
        </div>
      )) : <div className="text-[12.5px] text-white/60 py-2">Last interval. Finish strong.</div>}
      {laps.length > 0 && <div className="mt-2 pt-2 border-t border-white/[0.07] text-[11.5px] text-white/60 flex items-center gap-1.5"><Flag size={12} className="text-[var(--orange)]" /> Lap {laps[0].n} at {fmt(laps[0].t)} · {laps[0].hr} BPM · {laps[0].ex}</div>}
    </div>
  );

  /* video-player style transport, pinned to the bottom of the player */
  const transport = (
    <div className="sticky bottom-0 z-10 bg-[#1A2636] border-t border-white/[0.07]">
      <div className="h-[3px] bg-white/10"><div className="h-full transition-[width] duration-1000 ease-linear" style={{ width: `${frac * 100}%`, background: phaseColor }} /></div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-white text-[26px] font-black tnum leading-none">{w.phase === "idle" ? fmt(total) : fmt(w.remaining)}</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: phaseColor }}>{w.phase === "idle" ? "total" : w.phase}</span>
          </div>
          <div className="text-white/55 text-[11.5px] font-semibold mt-0.5 truncate">Interval {Math.min(w.idx + 1, circuit.length)} of {circuit.length} · {fmt(w.elapsed)} elapsed</div>
        </div>
        <IconBtn icon={RotateCcw} label="Reset workout" onClick={() => act("phone", "RESET")} size={36} iconSize={16} tone="navy" />
        <button onClick={() => act("phone", "TOGGLE_PLAY")} disabled={!circuit.length} aria-label={w.running ? "Pause workout" : "Start workout"}
          className="w-[50px] h-[50px] rounded-full grid place-items-center bg-[var(--orange)] text-white active:scale-95 transition shadow-[0_6px_18px_-4px_rgba(247,147,30,.8)] disabled:opacity-40">
          {w.running ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
        </button>
        <IconBtn icon={SkipForward} label="Skip interval" onClick={() => act("phone", "SKIP")} size={36} iconSize={16} tone="navy" />
        <IconBtn icon={Flag} label="Haptic lap marker" onClick={() => act("phone", "LAP")} size={36} iconSize={16} tone="navy" />
      </div>
    </div>
  );

  const coach = (between) => <MotionCoach key={circuit[coachIdx]?.uid || coachIdx} ex={coachEx} active={w.running && w.phase === "work"} tempoScale={tempoScale} onRep={onRep} compact={!wide} between={between} />;

  return (
    <div className="bg-[var(--navy)] min-h-full flex flex-col">
      <div className="flex items-center justify-between px-1" style={{ paddingTop: T(0, topPad) }}>
        <IconBtn icon={ArrowLeft} tone="ghostLight" label="Back to workout overview" onClick={() => setView("overview")} />
        <div className="text-white text-[15px] font-extrabold">Exercise {Math.min(coachIdx + 1, circuit.length)} of {circuit.length}</div>
        <IconBtn icon={Megaphone} tone="ghostLight" label="Speak form cue" onClick={() => say(`${coachEx.name}. ${coachEx.cue}`)} iconSize={17} />
      </div>
      <div className="flex-1 pb-4">
        {wide ? (
          <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-5 px-4 pt-2">
            <div className="min-w-0">{coach(nameAndTiles)}</div>
            <div className="flex flex-col gap-3 min-w-0">{focus}{bio}{next}</div>
          </div>
        ) : (
          <div className="px-3 pt-1">
            {coach(<>{nameAndTiles}{focus}</>)}
            <div className="flex flex-col gap-3 mt-3">{bio}{next}</div>
          </div>
        )}
      </div>
      {transport}
    </div>
  );
}

/* ═══════════════════════ CREATE CUSTOM (builder) ═══════════════════════ */

function BuilderTab({ C }) {
  const { ios, wide, topPad, circuit, setCircuit, toast, setSheet, setTab, setView, selUid, setSelUid, setCircuitName } = C;
  const [q, setQ] = useState("");
  const [area, setArea] = useState("All");
  const [shown, setShown] = useState(40);
  useEffect(() => setShown(40), [q, area]);
  const sel = circuit.find((c) => c.uid === selUid) || circuit[0];
  const selIdx = sel ? circuit.indexOf(sel) : -1;
  const move = (d) => setCircuit((c) => { const i = c.findIndex((x) => x.uid === sel.uid), j = i + d; if (i < 0 || j < 0 || j >= c.length) return c; const n = [...c]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const edit = (k, d) => setCircuit((c) => c.map((it) => (it.uid === sel.uid ? { ...it, [k]: clamp(it[k] + d, k === "work" ? 10 : 0, 120) } : it)));
  const remove = (u) => setCircuit((c) => c.filter((x) => x.uid !== u));
  const add = (e) => { const it = { uid: uid(), id: e.id, work: 30, rest: 15 }; setCircuit((c) => [...c, it]); setSelUid(it.uid); toast("Exercise added", e.name, Plus); };
  const ql = q.trim().toLowerCase();
  const items = EX_LIST.filter((e) => (area === "All" || areaOf(e) === area) && (!ql || e.name.toLowerCase().includes(ql) || e.category.toLowerCase().includes(ql) || e.equip.toLowerCase().includes(ql) || Object.keys(e.muscles).some((m) => MUSCLES[m].toLowerCase().includes(ql))));
  const Stepper = ({ k, color }) => (
    <div className="flex items-center justify-between gap-1.5 rounded-full border border-[var(--line)] bg-white pl-3">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">{k}</span>
      <div className="flex items-center">
        <button aria-label={`Less ${k}`} onClick={() => edit(k, -5)} className="w-7 h-7 grid place-items-center"><Minus size={13} /></button>
        <span className="w-9 text-center text-[13px] font-extrabold tnum" style={{ color }}>{sel[k]}s</span>
        <button aria-label={`More ${k}`} onClick={() => edit(k, 5)} className="w-7 h-7 grid place-items-center"><Plus size={13} /></button>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-full pb-4">
      <div className="bg-white px-4 pb-2.5 flex items-end justify-between" style={{ paddingTop: T(8, topPad) }}>
        <h1 className={ios ? "text-[19px] font-extrabold" : "text-[21px] font-medium"}>Create Custom</h1>
        <div className="flex gap-4 text-[13px] font-extrabold uppercase tracking-[.04em]">
          <button className="uppercase text-[var(--muted)]" onClick={() => { setCircuit(DEFAULT_CIRCUIT.map((c) => ({ ...c, uid: uid() }))); setCircuitName("Movement for Life Cardio & Strength Workouts"); toast("Changes discarded", "Circuit restored to the original.", RotateCcw); }}>Cancel</button>
          <button onClick={() => { setTab("train"); setView("overview"); }} disabled={!circuit.length} className="uppercase text-[var(--orange)] disabled:opacity-40">Next</button>
        </div>
      </div>
      <div className="bg-[var(--slate)] px-3 pt-3 pb-2.5">
        <div className="flex gap-2 overflow-x-auto no-sb pb-1">
          {circuit.map((it, i) => {
            const e = EX[it.id], on = sel && it.uid === sel.uid;
            return (
              <div key={it.uid} role="button" tabIndex={0} onClick={() => setSelUid(it.uid)} onKeyDown={(ev) => ev.key === "Enter" && setSelUid(it.uid)} className="w-[92px] shrink-0 cursor-pointer" aria-label={`Select ${e.name}`}>
                <div className={`relative bg-white rounded-[3px] overflow-hidden ${on ? "ring-[3px] ring-[var(--orange)]" : ""}`}>
                  <Scene ex={e} variant="white" className="w-full h-[62px] block" />
                  <span className="absolute bottom-1 left-1 rounded-full bg-[var(--navy)] text-white text-[9px] font-extrabold px-1.5">{i + 1}</span>
                  <button aria-label={`Remove ${e.name}`} onClick={(ev) => { ev.stopPropagation(); remove(it.uid); }} className="absolute top-1 right-1 w-[17px] h-[17px] rounded-full bg-[#8B939C] grid place-items-center text-white"><X size={11} strokeWidth={3} /></button>
                </div>
                <div className="text-white text-[10.5px] mt-1 truncate">{e.name}</div>
                <div className="text-white/55 text-[9.5px] tnum">{it.work}s · {it.rest}s rest</div>
              </div>
            );
          })}
          {!circuit.length && <div className="h-[92px] flex-1 rounded-[3px] border border-dashed border-white/40 grid place-items-center text-white/70 text-[12px]">Tap + on an exercise below</div>}
        </div>
        <div className="flex items-center justify-end gap-3 mt-1.5">
          <span className="text-white text-[12.5px] font-bold">{circuit.length} Exercises Added</span>
          <button disabled={!sel} onClick={() => { edit("rest", 5); toast("Rest added", `${Math.min(120, sel.rest + 5)}s after ${EX[sel.id].short}`, Timer); }} className="px-2 py-[3px] border border-white/80 rounded-[3px] text-white text-[11px] font-extrabold tracking-wider disabled:opacity-40">+ REST</button>
        </div>
      </div>
      {sel && (
        <div className="bg-[var(--bg)] px-4 pt-2.5 pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">Selected</span>
            <span className="text-[13.5px] font-extrabold truncate flex-1">{EX[sel.id].name}</span>
            <button aria-label="Move earlier" onClick={() => move(-1)} disabled={selIdx <= 0} className="w-7 h-7 grid place-items-center rounded-full bg-white border border-[var(--line)] disabled:opacity-30"><ChevronLeft size={15} /></button>
            <button aria-label="Move later" onClick={() => move(1)} disabled={selIdx >= circuit.length - 1} className="w-7 h-7 grid place-items-center rounded-full bg-white border border-[var(--line)] disabled:opacity-30"><ChevronRight size={15} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Stepper k="work" color="#F7931E" />
            <Stepper k="rest" color="#2B93C9" />
          </div>
        </div>
      )}
      <div className={wide ? "max-w-[820px]" : ""}>
        <div className="px-4 pt-3 flex justify-between items-center">
          <span className="text-[14px] font-semibold">{items.length} exercises</span>
          <button onClick={() => setSheet("generator")} className="flex items-center gap-1.5 text-[14px] font-semibold"><SlidersHorizontal size={15} /> Filters</button>
        </div>
        <div className="mx-4 mt-2.5 flex items-center gap-2.5 rounded-[4px] bg-white px-3 py-2.5 shadow-[0_1px_4px_rgba(26,38,54,.16)]">
          <Search size={16} className="text-[var(--muted)]" />
          <input id="exercise-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Exercises" className="bg-transparent outline-none flex-1 text-[14px] placeholder:text-[#A3AAB2]" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-sb px-4 pt-3 pb-1">
          {AREAS.map((a) => (
            <button key={a} onClick={() => setArea(a)} aria-pressed={area === a} className={`shrink-0 px-3 py-1.5 rounded-[4px] text-[13px] font-semibold border transition ${area === a ? "bg-[var(--navy)] border-[var(--navy)] text-white" : "border-[#C9CED4] text-[var(--ink)]"}`}>{a === "Rehab" ? "Rehab & Care" : a}</button>
          ))}
        </div>
        <div className="mt-1">
          {items.slice(0, shown).map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--line)]">
              <div className="w-[62px] h-[44px] shrink-0"><Scene ex={e} variant="white" className="w-full h-full" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-[var(--ink)] truncate">{e.name}</div>
                <div className="text-[12px] text-[var(--muted)] truncate">{e.category === "Rehab" ? "Rehab & Care" : e.category} - {LEVELS[e.level]}{e.equip !== "None" ? ` · ${e.equip}` : ""}</div>
              </div>
              <button aria-label={`Add ${e.name}`} onClick={() => add(e)} className="w-[22px] h-[22px] rounded-full bg-[#5E6670] text-white grid place-items-center active:scale-90 transition"><Plus size={14} strokeWidth={3} /></button>
            </div>
          ))}
          {items.length > shown && <button onClick={() => setShown((n) => n + 40)} className="w-full py-3.5 text-[13.5px] font-extrabold text-[var(--orange)] uppercase tracking-[.05em]">Show {Math.min(40, items.length - shown)} more of {items.length - shown}</button>}
          {!items.length && <div className="py-8 text-center text-[13px] text-[var(--muted)]">No exercise matches “{q}”{area !== "All" ? ` in ${area}` : ""}.</div>}
        </div>
      </div>
    </div>
  );
}

function GeneratorPanel({ C, close }) {
  const { setCircuit, setCircuitName, act, toast, setSelUid } = C;
  const [minutes, setMinutes] = useState(20);
  const [equip, setEquip] = useState([]);
  const [gz, setGz] = useState(4);
  const [focus, setFocus] = useState("Full Body");
  const gen = () => {
    const c = generateCircuit({ minutes, equip, zone: gz, focus });
    setCircuit(c); setSelUid(c[0]?.uid);
    setCircuitName(`${focus} · Zone ${gz} ${ZONES[gz].name} · ${minutes} min`);
    act("phone", "TRACK", { index: [0, 3, 1, 1, 0, 2][gz] });
    toast("Circuit generated", `${c.length} intervals, ${fmt(circuitSeconds(c))}. Music matched to Zone ${gz}.`, Wand2);
    close();
  };
  const Chip = ({ on, onClick, children, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`px-3 py-1.5 rounded-[4px] text-[13px] font-semibold border transition ${on ? "bg-[var(--navy)] border-[var(--navy)] text-white" : "border-[#C9CED4] text-[var(--ink)]"}`}>{children}</button>
  );
  return (
    <div>
      <p className="text-[13px] text-[var(--muted)] -mt-1 mb-3 text-center">Builds a circuit from {EX_LIST.length} exercises, rotating through every body area so nothing gets skipped.</p>
      <div className="flex justify-between items-baseline"><span className="text-[14px] font-bold">Time available</span><span className="text-[20px] font-black tnum">{minutes} min</span></div>
      <input id="gen-minutes" type="range" min="5" max="60" step="5" value={minutes} onChange={(e) => setMinutes(+e.target.value)} className="w-full mt-1" aria-label="Time available in minutes" />
      <div className="text-[14px] font-bold mt-3 mb-2">Equipment</div>
      <div className="flex gap-2 flex-wrap">
        <Chip on disabled>Bodyweight & Mat</Chip>
        {["Dumbbells", "Kettlebell", "Resistance Band", "Chair", "Pull-up Bar"].map((e) => <Chip key={e} on={equip.includes(e)} onClick={() => setEquip((q) => (q.includes(e) ? q.filter((x) => x !== e) : [...q, e]))}>{e}</Chip>)}
      </div>
      <div className="text-[14px] font-bold mt-4 mb-2">Focus</div>
      <div className="flex gap-2 flex-wrap">
        {Object.keys(FOCUS_ROTATION).map((f) => <Chip key={f} on={focus === f} onClick={() => setFocus(f)}>{f}</Chip>)}
      </div>
      <div className="text-[14px] font-bold mt-4 mb-2">Target heart rate zone</div>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setGz(n)} className="rounded-[6px] py-2 text-center border-2 transition" style={{ borderColor: gz === n ? ZONES[n].color : "#E4E7EB", background: gz === n ? ZONES[n].color + "1f" : "#fff" }}>
            <div className="text-[17px] font-black" style={{ color: ZONES[n].color }}>Z{n}</div>
            <div className="text-[9.5px] text-[var(--muted)] leading-tight px-0.5 truncate font-semibold">{ZONES[n].name}</div>
          </button>
        ))}
      </div>
      <button onClick={gen} className="mt-5 w-full py-3 rounded-full bg-[var(--orange)] text-white font-extrabold text-[14px] tracking-[.06em] uppercase flex items-center justify-center gap-2 active:scale-[.98] transition"><Wand2 size={16} /> Generate circuit</button>
    </div>
  );
}

/* ═══════════════════════ RECOVERY (navy, template detail screen) ═══════════════════════ */

function RecoveryTab({ C }) {
  const { ios, wide, topPad, strain, setStrain, toast } = C;
  const [sel, setSel] = useState("quads");
  const sorted = Object.entries(strain).sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3).reduce((a, [, v]) => a + v, 0) / 3;
  const readiness = Math.round(100 - top3 * 0.9);
  const rColor = readiness > 70 ? "#34C17B" : readiness > 45 ? "#F7931E" : "#FF4D4D";
  const eta = Math.ceil(sorted[0][1] * RECOVERY_H_PER_PCT);
  const maps = (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <NavyTile k="Readiness"><span className="text-[20px] font-black tnum" style={{ color: rColor }}>{readiness}%</span></NavyTile>
        <NavyTile k="Most Strained">{MUSCLES[sorted[0][0]]}</NavyTile>
        <NavyTile k="Fully Fresh">in {eta} h</NavyTile>
      </div>
      <div className="flex items-center justify-between mt-4 mb-1">
        <div className="text-white text-[13px] font-extrabold">Focus Areas</div>
        <div className="text-[12px] text-white/70">{MUSCLES[sel]} · <b className="text-white">{Math.round(strain[sel])}%</b> · {Math.ceil(strain[sel] * RECOVERY_H_PER_PCT)} h</div>
      </div>
      <div className="grid grid-cols-2 gap-5 px-3">
        <BodyMap view="front" values={strain} mode="heat" sel={sel} onSel={setSel} />
        <BodyMap view="back" values={strain} mode="heat" sel={sel} onSel={setSel} />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-white/60 font-bold">FRESH</span>
        <div className="flex-1 h-1.5 rounded-full" style={{ background: "linear-gradient(90deg, #4CB4E7 0 38%, #F7931E 42% 68%, #FF4D4D 72%)" }} />
        <span className="text-[10px] text-white/60 font-bold">STRAINED</span>
      </div>
    </div>
  );
  const table = (
    <div className="rounded-[6px] bg-[var(--navy2)] p-3.5">
      <div className="text-white text-[13px] font-extrabold mb-1.5">Muscle Fatigue</div>
      {sorted.map(([m, v]) => (
        <button key={m} onClick={() => setSel(m)} className="w-full flex items-center gap-3 py-1.5 text-left">
          <div className={`w-[84px] text-[12.5px] ${sel === m ? "font-extrabold text-white" : "text-white/80"}`}>{MUSCLES[m]}</div>
          <div className="flex-1 h-2 rounded-full bg-white/[0.08] overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${v}%`, background: heat(v) }} /></div>
          <div className="w-10 text-right text-[12px] font-bold tnum text-white">{Math.round(v)}%</div>
          <div className="w-10 text-right text-[11.5px] text-white/55 tnum">{Math.ceil(v * RECOVERY_H_PER_PCT)}h</div>
        </button>
      ))}
    </div>
  );
  return (
    <div className="bg-[var(--navy)] min-h-full pb-4">
      <div className="px-4 pb-3 flex items-end justify-between" style={{ paddingTop: T(8, topPad) }}>
        <h1 className={`text-white ${ios ? "text-[19px] font-extrabold" : "text-[21px] font-medium"}`}>Muscle Recovery</h1>
        <button onClick={() => { setStrain((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Math.max(0, v - 12 / RECOVERY_H_PER_PCT)]))); toast("12 hours later", "Recovery applied to every muscle group.", Timer); }}
          className="text-[12.5px] font-bold text-[var(--blue)] flex items-center gap-1"><Timer size={14} /> Skip ahead 12 h</button>
      </div>
      {wide ? <div className="grid grid-cols-2 gap-5 px-4 items-start">{maps}{table}</div> : <div className="flex flex-col gap-4 px-3">{maps}{table}</div>}
    </div>
  );
}

/* ═══════════════════════ 150 ACTIVE MINUTES CHALLENGE ═══════════════════════ */

/* Front-facing group for the challenge hero (the template shows a group photo) */
function FrontPerson({ x, ground = 222, h = 150, shirt, pants = "#262A31", skin = "#C98E6B", hair = "#231912", armsUp, lean = 0 }) {
  const k = h / 150, P = (dx, dy) => [x + dx * k + lean * (150 - dy) * k * 0.02, ground - dy * k];
  const cap = (a, b, ra, rb, fill) => <path d={capsule(a, b, ra * k, rb * k)} fill={fill} />;
  const sh = 15, hip = 9;
  const handL = armsUp ? P(-24, 178) : P(-20, 74), handR = armsUp ? P(24, 178) : P(20, 74);
  const elbL = armsUp ? P(-24, 148) : P(-20, 100), elbR = armsUp ? P(24, 148) : P(20, 100);
  return (
    <g>
      {cap(P(-hip + 2, 72), P(-8, 4), 6.2, 4.2, pants)}{cap(P(hip - 2, 72), P(8, 4), 6.2, 4.2, pants)}
      {cap(P(-9, 3), P(-15, 1), 3.4, 3, "#F2F3F5")}{cap(P(9, 3), P(15, 1), 3.4, 3, "#F2F3F5")}
      {cap(P(-sh, 124), elbL, 4.4, 3.8, skin)}{cap(elbL, handL, 3.6, 3, skin)}
      {cap(P(sh, 124), elbR, 4.4, 3.8, skin)}{cap(elbR, handR, 3.6, 3, skin)}
      <path d={`M${P(-sh - 1, 128)} L${P(sh + 1, 128)} L${P(hip + 2, 72)} L${P(-hip - 2, 72)} Z`.replace(/,/g, " ")} fill={shirt} />
      {cap(P(-sh, 126), P(sh, 126), 5, 5, shirt)}
      {cap(P(0, 128), P(0, 136), 3.6, 3.4, skin)}
      <ellipse cx={P(0, 148)[0]} cy={P(0, 150)[1]} rx={9.5 * k} ry={11.5 * k} fill={hair} />
      <ellipse cx={P(0, 146)[0]} cy={P(0, 146)[1] + 1.5 * k} rx={8.4 * k} ry={10 * k} fill={skin} />
    </g>
  );
}
function ParkHero() {
  return (
    <svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="park-sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#B7D2A6" /><stop offset=".55" stopColor="#86A970" /><stop offset="1" stopColor="#5E844A" /></linearGradient>
        <filter id="park-blur"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <rect width="400" height="230" fill="url(#park-sky)" />
      <g filter="url(#park-blur)" opacity=".9">
        {[[20, 60, 62], [100, 40, 70], [205, 52, 64], [300, 36, 82], [392, 66, 58]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? "#4C7638" : "#5F8B47"} />)}
        <rect y="170" width="400" height="60" fill="#79A35A" />
      </g>
      <FrontPerson x={118} h={140} shirt="#3D5A80" armsUp lean={-0.6} />
      <FrontPerson x={176} h={152} shirt="#2B2F36" />
      <FrontPerson x={232} h={146} shirt="#C0443A" armsUp hair="#5A3A22" skin="#E0B08E" />
      <FrontPerson x={290} h={138} shirt="#5C8DA8" lean={0.6} skin="#8E5B3E" />
      <rect width="400" height="230" fill="#000" opacity=".3" />
    </svg>
  );
}

function Stopwatch({ minutes, pace }) {
  const m = useMounted();
  const v = clamp(minutes / 150, 0, 1), pv = clamp(pace, 0, 1);
  const deg = (m ? v : 0) * 360;
  const onTrack = v >= pv * 0.95;
  const a = ((deg - 90) * Math.PI) / 180, R = 84;
  const tx = 130 + R * Math.cos(a), ty = 140 + R * Math.sin(a);
  return (
    <svg viewBox="0 0 260 262" className="w-full max-w-[230px] mx-auto block" role="img" aria-label={`${minutes.toFixed(1)} of 150 minutes, ${onTrack ? "on track" : "behind pace"}`}>
      <rect x="116" y="4" width="28" height="14" rx="4" fill="#C9CED4" />
      <rect x="123" y="16" width="14" height="12" fill="#C9CED4" />
      <rect x="200" y="30" width="20" height="12" rx="3" fill="#C9CED4" transform="rotate(45 210 36)" />
      <circle cx="130" cy="140" r="112" fill="none" stroke="#D5D9DE" strokeWidth="16" />
      <Ring cx={130} cy={140} r={112} stroke={16} value={m ? pv : 0} color="#4CB4E7" track="transparent" cap="butt" />
      <circle cx="130" cy="140" r="90" fill="none" stroke="#E6E9ED" strokeWidth="18" />
      <Ring cx={130} cy={140} r={90} stroke={18} value={m ? v : 0} color="#F7931E" track="transparent" cap="butt" />
      <circle cx="130" cy="140" r="67" fill="none" stroke="#ECEFF2" strokeWidth="14" />
      <circle cx="130" cy="140" r="45" fill="none" stroke="#EFF1F4" strokeWidth="12" />
      <circle cx="130" cy="140" r="24" fill="none" stroke="#F2F4F6" strokeWidth="10" />
      <g className="needle-anim" style={{ transform: `rotate(${deg}deg)`, transformOrigin: "130px 140px" }}>
        <line x1="130" y1="140" x2="130" y2="58" stroke="#3A434E" strokeWidth="4" strokeLinecap="round" />
      </g>
      <circle cx="130" cy="140" r="7" fill="#3A434E" />
      {m && (
        <g transform={`translate(${clamp(tx - 26, 2, 206)} ${clamp(ty + 4, 4, 244)})`}>
          <rect width="52" height="15" rx="3" fill="#3A434E" />
          <text x="26" y="10.6" textAnchor="middle" fontSize="8.6" fontWeight="800" fill="#fff" fontFamily="Mulish, sans-serif">{onTrack ? "On Track" : "Behind"}</text>
        </g>
      )}
    </svg>
  );
}

const LEADERS = [["Maya R.", 212], ["Devon K.", 188], ["Ana P.", 171], ["Chris L.", 140], ["Priya S.", 122], ["Jordan T.", 98], ["Sam W.", 64]];

function ChallengeTab({ C }) {
  const { wide, topPad, stats, badges, laps, logSession, setSheet, badgeCtx, chTab, setChTab } = C;
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const pace = (dow + (now.getHours() + now.getMinutes() / 60) / 24) / 7;
  const pct = Math.round((stats.weekMin / 150) * 100);
  const monday = new Date(now); monday.setDate(now.getDate() - dow);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const dfmt = (d) => d.toLocaleDateString([], { month: "short", day: "numeric" });
  const board = [...LEADERS.map(([n, v]) => ({ n, v })), { n: "You", v: stats.weekMin, me: true }].sort((a, b) => b.v - a.v);

  const progress = (
    <div className={wide ? "grid grid-cols-2 gap-5 items-start" : "flex flex-col gap-3"}>
      <div>
        <Stopwatch minutes={stats.weekMin} pace={pace} />
        <div className="flex justify-center gap-4 text-[11px] font-semibold text-[var(--muted)] -mt-1">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--orange)]" /> Your minutes</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--blue)]" /> Week elapsed</span>
        </div>
        <div className="mt-3 rounded-[10px] bg-white shadow-[0_2px_10px_rgba(26,38,54,.12)] p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-extrabold">My Progress</div>
            <div className="flex items-center gap-2 mt-2"><Timer size={22} className="text-[var(--blue)]" /><span className="text-[24px] font-black tnum">{stats.weekMin.toFixed(1)}</span><span className="text-[10.5px] text-[var(--muted)] font-bold mt-1.5">MINUTES</span></div>
            <div className="text-[10.5px] text-[var(--muted)] font-bold mt-1.5 tracking-wide">GOAL: 150 MINS/MEMBER</div>
          </div>
          <svg viewBox="0 0 90 90" width="88" height="88" className="shrink-0">
            <Ring cx={45} cy={45} r={36} stroke={14} value={stats.weekMin / 150} color="#4CB4E7" track="#E6E9ED" cap="butt" />
            <text x="45" y="50" textAnchor="middle" fontSize="16" fontWeight="900" fill="#4CB4E7" fontFamily="Mulish, sans-serif">{pct}%</text>
          </svg>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {[["Calories", Math.round(stats.kcal), "of 1,500"], ["Sessions", stats.sessions, "of 5"], ["Streak", stats.streak, "days"]].map(([k, v, u]) => (
            <div key={k} className="rounded-[10px] bg-white shadow-[0_2px_10px_rgba(26,38,54,.1)] py-2.5 text-center">
              <div className="text-[10px] uppercase tracking-[.1em] text-[var(--muted)] font-bold">{k}</div>
              <div className="text-[21px] font-black tnum leading-tight">{v}</div>
              <div className="text-[10.5px] text-[var(--muted)]">{u}</div>
            </div>
          ))}
        </div>
        <button onClick={logSession} className="w-full py-2.5 rounded-full border-2 border-[var(--orange)] text-[var(--orange)] font-extrabold text-[13px] uppercase tracking-[.05em] flex items-center justify-center gap-1.5"><Plus size={15} strokeWidth={3} /> Log 30-min session</button>
        <div className="rounded-[10px] bg-white shadow-[0_2px_10px_rgba(26,38,54,.12)] p-4">
          <div className="flex items-center justify-between mb-3"><div className="text-[15px] font-extrabold flex items-center gap-2"><Trophy size={16} className="text-[var(--orange)]" /> Achievements</div><span className="text-[12px] text-[var(--muted)] font-semibold tnum">{Object.keys(badges).length} of {BADGES.length}</span></div>
          <div className="grid grid-cols-3 gap-y-4 gap-x-2">
            {BADGES.map((b) => { const [v, t] = b.prog(badgeCtx); return <Medal key={b.id} b={b} unlocked={!!badges[b.id]} pct={clamp(v / t, 0, 1)} onClick={() => setSheet({ badge: b.id })} />; })}
          </div>
          {laps.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[var(--line)]">
              <div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[var(--muted)]">Lap markers</div>
              {laps.slice(0, 4).map((l) => <div key={l.n} className="flex justify-between text-[12.5px] py-1 tnum"><span>Lap {l.n} · {l.ex}</span><span className="text-[var(--muted)]">{fmt(l.t)} · {l.hr} BPM · {l.src === "watch" ? "Watch" : "iPhone"}</span></div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const details = (
    <div className="text-[14px] leading-[1.5] text-[#3D4651] max-w-[640px]">
      <p>Move for 150 minutes this week, the weekly activity amount the CDC and WHO recommend for adults. Every interval you train in Zone 2 or higher counts, from the phone or the watch.</p>
      <div className="mt-4 flex flex-col divide-y divide-[var(--line)] rounded-[10px] bg-white shadow-[0_2px_10px_rgba(26,38,54,.1)]">
        {[[CalendarDays, "Challenge week", `${dfmt(monday)} – ${dfmt(sunday)}, ${sunday.getFullYear()}`], [Target, "Goal", "150 active minutes per member"], [Users, "Members", "2,481 joined"], [ListChecks, "What counts", "Workouts, logged sessions, Apple Watch Exercise minutes"]].map(([I, k, v]) => (
          <div key={k} className="flex items-center gap-3 px-4 py-3"><I size={18} className="text-[var(--blue)] shrink-0" /><div><div className="text-[12px] text-[var(--muted)] font-semibold">{k}</div><div className="text-[14px] font-bold text-[var(--ink)]">{v}</div></div></div>
        ))}
      </div>
    </div>
  );

  const leaderboard = (
    <div className="rounded-[10px] bg-white shadow-[0_2px_10px_rgba(26,38,54,.1)] overflow-hidden max-w-[640px]">
      {board.map((r, i) => (
        <div key={r.n} className={`flex items-center gap-3 px-4 py-2.5 ${i ? "border-t border-[var(--line)]" : ""} ${r.me ? "bg-[rgba(247,147,30,0.1)]" : ""}`}>
          <span className="w-5 text-[13px] font-black text-[var(--muted)] tnum">{i + 1}</span>
          <span className="w-8 h-8 rounded-full grid place-items-center text-[12px] font-extrabold text-white" style={{ background: r.me ? "#F7931E" : ["#4CB4E7", "#2F3C4D", "#7A8794", "#34C17B"][i % 4] }}>{r.n.split(" ").map((s) => s[0]).join("")}</span>
          <span className={`flex-1 text-[14px] ${r.me ? "font-extrabold" : "font-semibold"}`}>{r.n}</span>
          <span className="text-[14px] font-black tnum">{r.v.toFixed(r.me ? 1 : 0)}<span className="text-[11px] text-[var(--muted)] font-semibold"> min</span></span>
          {r.v >= 150 && <Check size={15} className="text-[var(--green)]" strokeWidth={3} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-[var(--bg)] min-h-full pb-4">
      <div className="relative overflow-hidden" style={{ height: T(178, topPad) }}>
        <ParkHero />
        <div className="absolute inset-x-4 text-center" style={{ top: T(16, topPad) }}>
          <h1 className="hero-title text-white text-[25px] font-black leading-[1.15]">150 Active Minutes<br />Challenge</h1>
          <span className="inline-block mt-3 px-4 py-1.5 rounded-full bg-[var(--orange)] text-white text-[12.5px] font-extrabold">Joined challenge</span>
        </div>
      </div>
      <div className="bg-white flex border-b border-[var(--line)]">
        {["details", "progress", "leaderboard"].map((t) => (
          <button key={t} onClick={() => setChTab(t)} className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-[.08em] border-b-2 ${chTab === t ? "text-[var(--orange)] border-[var(--orange)]" : "text-[var(--muted)] border-transparent"}`}>{t}</button>
        ))}
      </div>
      <div className="p-4">{chTab === "progress" ? progress : chTab === "details" ? details : leaderboard}</div>
    </div>
  );
}

/* ═══════════════════════ APP ═══════════════════════ */

export default function App() {
  const engineRef = useRef(null);
  if (!engineRef.current) engineRef.current = new BeatEngine();
  const engine = engineRef.current;

  const [platform, setPlatform] = useState("ios");
  const [shell, setShell] = useState("mobile");
  const [watchMode, setWatchMode] = useState("docked");
  const [tab, setTab] = useState("train");
  const [view, setView] = useState("overview");
  const [chTab, setChTab] = useState("progress");
  const [circuit, setCircuitRaw] = useState(DEFAULT_CIRCUIT);
  const [circuitName, setCircuitName] = useState("Movement for Life Cardio & Strength Workouts");
  const [selUid, setSelUid] = useState(DEFAULT_CIRCUIT[0].uid);
  const [w, setW] = useState({ phase: "idle", idx: 0, remaining: 0, running: false, elapsed: 0 });
  const [music, setMusic] = useState(() => ({ playing: false, track: 0, volume: 0.8, nudge: 0, auto: true, voice: true, source: readPref("fl-music-source", "beats") }));
  const [spotifyInstalled, setSpotifyInstalled] = useState(null); // null = unknown (web)
  const [splash, setSplash] = useState(true);
  const [ducking, setDucking] = useState(false);
  const [hr, setHr] = useState(72);
  const [hrHist, setHrHist] = useState(() => Array(80).fill(72));
  const [zoneOverride, setZoneOverride] = useState(null);
  const [stats, setStats] = useState({ weekMin: 76.5, kcal: 842, sessions: 3, streak: 5, z5Sec: 0, plankIntervals: 0, sessionKcal: 0, sessionReps: 0, autoHotSec: 0 });
  const [strain, setStrain] = useState(SEED_STRAIN);
  const [laps, setLaps] = useState([]);
  const [badges, setBadges] = useState({});
  const [toasts, setToasts] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [syncLog, setSyncLog] = useState([]);
  const [syncFlash, setSyncFlash] = useState(null);
  const [watchScreen, setWatchScreen] = useState(0);
  const [crownMode, setCrownMode] = useState("volume");
  const [haptic, setHaptic] = useState(0);
  const [pip, setPip] = useState({ x: 24, y: 24 });
  const [clock, setClock] = useState(() => new Date());

  const ios = platform === "ios";
  const wide = shell === "studio";
  const topPad = wide ? 0 : 46;
  const ex = EX[circuit[Math.min(w.idx, circuit.length - 1)]?.id] || EX_LIST[0];
  const zone = zoneOf(hr);
  const track = TRACKS[music.track];
  const bpm = clamp(Math.round(track.bpm * (music.auto ? TEMPO_FACTOR[zone] : 1)) + music.nudge, 60, 190);
  const tempoScale = 1 + (zone - 3) * 0.05;
  const phaseTotal = w.phase === "prep" ? 5 : w.phase === "work" ? circuit[w.idx]?.work : w.phase === "rest" ? circuit[w.idx]?.rest : 0;
  const cadence = w.running && w.phase === "work" ? Math.round(60 / (ex.tempo / tempoScale)) : 0;
  const watchLaps = laps.filter((l) => l.src === "watch").length;

  const live = useRef({});
  live.current = { w, circuit, hr, zoneOverride, music, ex, zone, bpm };

  /* ── lifecycle: fonts, clock, audio disposal ── */
  useEffect(() => {
    if (!document.getElementById("sw-fonts")) {
      const l = document.createElement("link");
      l.id = "sw-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Mulish:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&family=Roboto:wght@400;500;700&display=swap";
      document.head.appendChild(l);
    }
    const t = setInterval(() => setClock(new Date()), 15000);
    // Voice cues duck our own beats; in Spotify mode they also duck Spotify through the native audio session.
    let nativeDucked = false;
    engine.onDuck = (active) => {
      setDucking(active);
      if (FitnessNative && live.current.music.source === "spotify" && active !== nativeDucked) {
        nativeDucked = active;
        (active ? FitnessNative.duckOthers() : FitnessNative.unduckOthers()).catch(() => {});
      }
    };
    if (FitnessNative) FitnessNative.canOpenURL({ url: "spotify://" }).then((r) => setSpotifyInstalled(!!r.value)).catch(() => {});
    return () => {
      clearInterval(t);
      engine.onDuck = null;
      engine.dispose();
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    };
  }, [engine]);

  const toast = (title, msg, icon) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, title, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };
  const say = (text) => speakWithDuck(engine, text, live.current.music.voice);
  const pulse = () => { setHaptic((h) => h + 1); try { navigator.vibrate && navigator.vibrate(35); } catch (e) {} };

  const spotifyMode = music.source === "spotify";
  const openSpotify = (q) => {
    const url = q ? spotifySearchUrl(q) : spotifyInstalled ? "spotify://" : "https://open.spotify.com";
    if (FitnessNative) { FitnessNative.openURL({ url }).catch(() => {}); return; }
    toast("Open Spotify", "Use the Spotify links in the music sheet. On iPhone they open the Spotify app.", Music2);
    setSheet("dj");
  };
  const startMusic = () => {
    if (live.current.music.source === "spotify") return true; // Spotify plays itself; we only add voice cues and chimes
    if (engine.start()) { setMusic((m) => ({ ...m, playing: true })); return true; }
    toast("Audio unavailable", "This browser blocked Web Audio. Tap play again or check site sound settings.", Volume2);
    return false;
  };
  const stopMusic = () => { engine.stop(); setMusic((m) => ({ ...m, playing: false })); };
  useEffect(() => { engine.bpm = bpm; engine.track = music.track; }, [engine, bpm, music.track]);
  useEffect(() => { engine.setVolume(music.volume); }, [engine, music.volume]);

  /* ── WatchConnectivity-style action bus (phone ⇄ watch) ── */
  const logSync = (src, type, payload) => {
    const entry = { id: Math.random(), t: Date.now(), src, method: src === "watch" ? "sendMessage" : "updateApplicationContext", type, payload };
    setSyncLog((l) => [entry, ...l].slice(0, 10));
    setSyncFlash(entry);
  };
  useEffect(() => { if (!syncFlash) return; const id = setTimeout(() => setSyncFlash(null), 1400); return () => clearTimeout(id); }, [syncFlash]);

  const act = (src, type, payload = {}) => {
    logSync(src, type, payload);
    const L = live.current;
    switch (type) {
      case "TOGGLE_PLAY": {
        if (!L.circuit.length) return toast("Circuit is empty", "Add exercises in Create Custom first.", Dumbbell);
        if (L.w.phase === "idle" || L.w.phase === "done") {
          const start = L.w.phase === "idle" ? Math.min(L.w.idx, L.circuit.length - 1) : 0;
          setStats((s) => ({ ...s, sessionKcal: 0, sessionReps: 0 }));
          setW({ phase: "prep", idx: start, remaining: 5, running: true, elapsed: 0 });
          setTab("train"); setView("player");
          startMusic();
        } else if (L.w.running) { setW((p) => ({ ...p, running: false })); stopMusic(); say("Paused."); }
        else { setW((p) => ({ ...p, running: true })); startMusic(); say("Resume."); }
        break;
      }
      case "SKIP":
        setW((p) => {
          if (p.phase === "idle" || p.phase === "done") return p;
          const r = advance({ ...p, running: true, remaining: 1 }, L.circuit);
          return { ...r, running: r.phase === "done" ? false : p.running };
        });
        break;
      case "JUMP": setW((p) => (p.phase === "idle" || p.phase === "done" ? { phase: "idle", idx: payload.idx, remaining: 0, running: false, elapsed: 0 } : p)); break;
      case "RESET": setW({ phase: "idle", idx: 0, remaining: 0, running: false, elapsed: 0 }); stopMusic(); break;
      case "LAP": {
        const lap = { n: laps.length + 1, t: L.w.elapsed, hr: Math.round(L.hr), ex: L.ex.short, src };
        setLaps((l) => [{ ...lap, n: l.length + 1 }, ...l]);
        engine.chime(1568, 0.16, 0.4); pulse();
        toast(`Lap ${lap.n} marked`, `${fmt(lap.t)} · ${lap.hr} BPM · ${src === "watch" ? "from Watch" : "from iPhone"}`, Flag);
        break;
      }
      case "VOLUME": setMusic((m) => ({ ...m, volume: payload.value })); break;
      case "BPM_NUDGE": setMusic((m) => ({ ...m, nudge: clamp(m.nudge + payload.delta, -30, 30) })); break;
      case "ZONE_OVERRIDE": setZoneOverride(payload.zone); if (payload.zone) toast(`Zone ${payload.zone} override`, `Heart rate now targets ${ZONES[payload.zone].name}.`, Target); break;
      case "TRACK": setMusic((m) => ({ ...m, track: payload.index })); break;
      case "MUSIC_TOGGLE":
        if (L.music.source === "spotify") openSpotify();
        else if (L.music.playing) stopMusic(); else startMusic();
        break;
      case "SOURCE":
        writePref("fl-music-source", payload.source);
        if (payload.source === "spotify") { engine.stop(); setMusic((m) => ({ ...m, source: "spotify", playing: false })); }
        else setMusic((m) => ({ ...m, source: "beats" }));
        break;
      case "AUTO_TEMPO": setMusic((m) => ({ ...m, auto: !m.auto })); break;
      case "VOICE": setMusic((m) => ({ ...m, voice: !m.voice })); break;
      default: break;
    }
  };

  /* ── biometric engine (HealthKit simulation) ── */
  useEffect(() => {
    const id = setInterval(() => {
      const L = live.current;
      let target = 68;
      if (L.zoneOverride) target = zoneMid(L.zoneOverride);
      else if (L.w.running) {
        if (L.w.phase === "work") target = 92 + L.ex.intensity * 86;     // up to 178 on plyometrics
        else if (L.w.phase === "rest") target = 104 + L.ex.intensity * 24;
        else if (L.w.phase === "prep") target = 92;
      }
      setHr((h) => clamp(h + (target - h) * (target > h ? 0.075 : 0.05) + (Math.random() - 0.5) * 1.4, 58, 186));
    }, 400);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { setHrHist((h) => [...h.slice(1), hr]); }, [hr]);

  /* ── workout clock ── */
  useEffect(() => {
    if (!w.running) return;
    const id = setInterval(() => {
      const L = live.current, z = zoneOf(L.hr), kc = kcalPerMin(L.hr) / 60;
      setW((p) => advance(p, L.circuit));
      setStats((s) => ({ ...s, weekMin: s.weekMin + 1 / 60, kcal: s.kcal + kc, sessionKcal: s.sessionKcal + kc, z5Sec: s.z5Sec + (z === 5 ? 1 : 0), autoHotSec: s.autoHotSec + (L.music.auto && L.music.playing && z >= 4 ? 1 : 0) }));
    }, 1000);
    return () => clearInterval(id);
  }, [w.running]);

  /* ── phase transitions → voice coach, chimes, strain ── */
  const prevW = useRef({ phase: "idle", idx: 0 });
  useEffect(() => {
    const prev = prevW.current, cur = { phase: w.phase, idx: w.idx };
    if (prev.phase === cur.phase && prev.idx === cur.idx) return;
    prevW.current = cur;
    const C = live.current.circuit, exAt = (i) => EX[C[i]?.id];
    if (prev.phase === "work" && cur.phase !== "idle" && exAt(prev.idx)) {
      const e = exAt(prev.idx), scale = (C[prev.idx]?.work || 30) / 30;
      setStrain((s) => { const n = { ...s }; Object.entries(e.muscles).forEach(([m, v]) => (n[m] = Math.min(100, (n[m] || 0) + v * scale))); return n; });
      if (e.category === "Plank") setStats((s) => ({ ...s, plankIntervals: s.plankIntervals + 1 }));
    }
    if (cur.phase === "prep" && exAt(cur.idx)) say(`Get ready. First up, ${exAt(cur.idx).name}.`);
    else if (cur.phase === "work" && exAt(cur.idx)) { engine.chime(1046, 0.22); pulse(); say(`${exAt(cur.idx).name}. ${firstSentence(exAt(cur.idx).cue)}`); }
    else if (cur.phase === "rest" && exAt(cur.idx + 1)) { engine.chime(660, 0.2); pulse(); say(`Rest. Up next, ${exAt(cur.idx + 1).name}.`); }
    else if (cur.phase === "done") {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => engine.chime(f, 0.18, 1.2), i * 110));
      pulse(); say("Workout complete. Great work.");
      setStats((s) => ({ ...s, sessions: s.sessions + 1, streak: s.streak + 1 }));
      toast("Workout complete", "Session logged to your 150-minute challenge.", Trophy);
    }
  }, [w.phase, w.idx]); // eslint-disable-line

  /* ── 3-2-1 countdown with harmonic chimes + ducking ── */
  useEffect(() => {
    if (!w.running || !["work", "rest", "prep"].includes(w.phase)) return;
    if (w.remaining >= 1 && w.remaining <= 3) {
      engine.chime(w.remaining === 1 ? 1318 : 880, 0.17, 0.5);
      if (live.current.music.voice) say(String(w.remaining)); else engine.duckFor(0.6);
    }
  }, [w.remaining]); // eslint-disable-line

  /* ── slow recovery decay ── */
  useEffect(() => {
    const id = setInterval(() => setStrain((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Math.max(0, v - 0.08)]))), 5000);
    return () => clearInterval(id);
  }, []);

  /* ── achievements ── */
  const badgeCtx = { stats, watchLaps };
  const unlockedRef = useRef({});
  useEffect(() => {
    BADGES.forEach((b) => {
      const [v, t] = b.prog(badgeCtx);
      if (!unlockedRef.current[b.id] && v >= t) {
        unlockedRef.current[b.id] = Date.now();
        setBadges((x) => ({ ...x, [b.id]: Date.now() }));
        toast("Achievement unlocked", b.name, b.icon);
        engine.chime(1568, 0.2, 1.3); pulse();
      }
    });
  }, [stats, watchLaps]); // eslint-disable-line

  /* ── MediaSession lock-screen controls (browser) ── */
  useEffect(() => {
    try {
      if (!("mediaSession" in navigator)) return;
      navigator.mediaSession.metadata = new window.MediaMetadata({ title: track.title, artist: "FitnessLife", album: track.genre });
      navigator.mediaSession.playbackState = music.playing ? "playing" : "paused";
      const h = { play: () => act("phone", "MUSIC_TOGGLE"), pause: () => act("phone", "MUSIC_TOGGLE"), nexttrack: () => act("phone", "TRACK", { index: (live.current.music.track + 1) % 4 }), previoustrack: () => act("phone", "TRACK", { index: (live.current.music.track + 3) % 4 }) };
      Object.entries(h).forEach(([k, fn]) => { try { navigator.mediaSession.setActionHandler(k, fn); } catch (e) {} });
    } catch (e) {}
  }, [music.track, music.playing]); // eslint-disable-line

  const setCircuit = (fn) => {
    setCircuitRaw(fn);
    const ph = live.current.w.phase;
    if (ph !== "idle") {
      setW({ phase: "idle", idx: 0, remaining: 0, running: false, elapsed: 0 });
      if (ph !== "done") { stopMusic(); toast("Circuit updated", "Workout reset to the start.", Info); }
    } else setW((p) => ({ ...p, idx: 0 }));
  };
  const logSession = () => {
    setStats((s) => ({ ...s, weekMin: s.weekMin + 30, kcal: s.kcal + 265, sessions: s.sessions + 1, streak: s.streak + 1 }));
    toast("Session logged", "30 active minutes added.", CalendarCheck);
  };

  const C = {
    ios, wide, topPad, w, circuit, setCircuit, ex, hr, zone, act, stats, hrHist, phaseTotal, tempoScale, say, zoneOverride, circuitName, setCircuitName,
    cadence, laps, strain, setStrain, toast, setSheet, badges, logSession, badgeCtx, view, setView, setTab, selUid, setSelUid, chTab, setChTab,
    onRep: () => setStats((s) => ({ ...s, sessionReps: s.sessionReps + 1 })),
  };

  const TABS = [
    { id: "train", label: "Workout", icon: Activity },
    { id: "build", label: "Create", icon: Dumbbell },
    { id: "recover", label: "Recovery", icon: HeartPulse },
    { id: "challenge", label: "Challenge", icon: Trophy },
  ];
  const badgeSheet = sheet && sheet.badge ? BADGES.find((b) => b.id === sheet.badge) : null;
  const lightStatus = tab !== "build";
  const MUSIC_ITEMS = [
    { key: "t0", label: "Neon Tabata", icon: Zap, on: music.track === 0, run: () => act("phone", "TRACK", { index: 0 }) },
    { key: "t1", label: "House Flow", icon: Music2, on: music.track === 1, run: () => act("phone", "TRACK", { index: 1 }) },
    { key: "t2", label: "Peak Plyo Bass", icon: Flame, on: music.track === 2, run: () => act("phone", "TRACK", { index: 2 }) },
    { key: "t3", label: "Zen Recovery", icon: Leaf, on: music.track === 3, run: () => act("phone", "TRACK", { index: 3 }) },
    { key: "auto", label: "Auto-Tempo", icon: Gauge, on: music.auto, run: () => act("phone", "AUTO_TEMPO") },
    { key: "voice", label: "Voice Coach", icon: music.voice ? Mic : MicOff, on: music.voice, run: () => act("phone", "VOICE") },
  ];

  const screen = (
    <div className={`relative h-full flex flex-col bg-white text-[var(--ink)] ${ios ? "sw-ios" : "sw-md"}`}>
      {!wide && !NATIVE && (
        <div className={`absolute top-0 left-0 right-0 h-[46px] flex items-center justify-between px-7 text-[14px] font-bold z-20 pointer-events-none ${lightStatus ? "text-white" : "text-[var(--ink)]"}`}>
          <span className="tnum">{clock.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M/i, "")}</span>
          {ios ? (
            <div className="absolute left-1/2 -translate-x-1/2 top-[10px] w-[118px] h-[33px] rounded-full bg-black flex items-center justify-end pr-2.5">
              {syncFlash && <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--blue)] mr-auto ml-3" style={{ animation: "sw-fade .2s" }}><Watch size={11} /> sync</span>}
              <span className="w-2 h-2 rounded-full bg-[#1a1f2a]" />
            </div>
          ) : <div className="absolute left-1/2 -translate-x-1/2 top-[14px] w-[13px] h-[13px] rounded-full bg-black" />}
          <span className="flex items-center gap-1.5">{!ios && syncFlash && <Watch size={13} className="text-[var(--blue)]" />}<Signal size={15} /><Wifi size={15} /><BatteryFull size={19} /></span>
        </div>
      )}

      <main key={tab + view} className="flex-1 min-h-0 overflow-y-auto no-sb">
        {tab === "train" && (view === "player" ? <PlayerView C={C} /> : <OverviewView C={C} />)}
        {tab === "build" && <BuilderTab C={C} />}
        {tab === "recover" && <RecoveryTab C={C} />}
        {tab === "challenge" && <ChallengeTab C={C} />}
      </main>

      {/* persistent mini-player */}
      <div className="shrink-0 bg-white border-t border-[var(--line)] px-3 py-2 flex items-center gap-2.5">
        <button onClick={() => setSheet("dj")} className="flex items-center gap-2.5 flex-1 min-w-0 text-left" aria-label="Open music deck">
          {spotifyMode ? (
            <div className="w-10 h-10 shrink-0 rounded-[6px] grid place-items-center" style={{ background: SPOTIFY_GREEN }}><Music2 size={18} color="#fff" /></div>
          ) : (
            <div className="w-10 h-10 shrink-0 rounded-[6px] grid place-items-center bg-[var(--navy)]">
              <Spectrum engine={engine} bands={4} height={20} gap={2} className="w-6" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold truncate">{spotifyMode ? "Spotify" : track.title}</div>
            <div className="text-[11.5px] text-[var(--muted)] flex items-center gap-1.5 tnum font-semibold truncate">
              {spotifyMode ? (FitnessNative ? "Voice cues lower Spotify" : "Plays in the Spotify app") : <>{bpm} BPM{music.auto && <span className="text-[var(--orange)] font-extrabold">· AUTO</span>}</>}
              {ducking && <span className="px-1.5 rounded-full bg-[var(--blue)] text-white font-extrabold text-[9.5px]">−12 dB</span>}
            </div>
          </div>
        </button>
        {spotifyMode
          ? <IconBtn icon={ExternalLink} label="Open Spotify" onClick={() => openSpotify()} size={36} iconSize={16} className="!bg-[#1DB954] !text-white" />
          : <IconBtn icon={music.playing ? Pause : Play} label={music.playing ? "Pause music" : "Play music"} onClick={() => act("phone", "MUSIC_TOGGLE")} size={36} iconSize={16} tone="orange" />}
        <IconBtn icon={ChevronUp} label="Expand music deck" onClick={() => setSheet("dj")} size={34} iconSize={18} tone="ghost" />
      </div>

      {/* tab bar */}
      <nav className={`shrink-0 flex bg-white border-t border-[var(--line)] ${ios && !wide ? "pt-1.5 pb-6" : "pt-2 pb-2.5"}`} style={NATIVE ? { paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)" } : undefined} aria-label="Tabs">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={on ? "page" : undefined} className="flex-1 flex flex-col items-center gap-0.5">
              {ios ? <t.icon size={22} className={on ? "text-[var(--orange)]" : "text-[#9AA2AB]"} strokeWidth={on ? 2.4 : 1.9} />
                : <span className={`w-14 h-8 rounded-full grid place-items-center transition ${on ? "bg-[rgba(247,147,30,0.15)]" : ""}`}><t.icon size={21} className={on ? "text-[var(--orange)]" : "text-[#9AA2AB]"} /></span>}
              <span className={`${ios ? "text-[10px]" : "text-[12px]"} font-bold ${on ? "text-[var(--orange)]" : "text-[#9AA2AB]"}`}>{t.label}</span>
            </button>
          );
        })}
      </nav>
      {ios && !wide && !NATIVE && <div className="absolute bottom-[7px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] rounded-full bg-[#1A1A1A]" />}

      <Toasts toasts={toasts} ios={ios} topPad={topPad} />
      {splash && <LaunchSplash onDone={() => setSplash(false)} />}

      {/* Music deck — styled like the template's Collections sheet */}
      <Sheet open={sheet === "dj"} onClose={() => setSheet(null)} title="Workout Music" ios={ios}>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-[10px] bg-[#EEF1F4] mb-3">
          {[["beats", "FitnessLife Beats"], ["spotify", "Spotify"]].map(([k, l]) => (
            <button key={k} onClick={() => act("phone", "SOURCE", { source: k })} aria-pressed={music.source === k}
              className={`py-2 rounded-[8px] text-[13px] font-extrabold flex items-center justify-center gap-1.5 transition ${music.source === k ? "bg-white shadow text-[var(--ink)]" : "text-[var(--muted)]"}`}>
              {k === "spotify" && <span className="w-2.5 h-2.5 rounded-full" style={{ background: SPOTIFY_GREEN }} />}{l}
            </button>
          ))}
        </div>
        {spotifyMode && (
          <div>
            <div className="rounded-[10px] p-4 text-white" style={{ background: "linear-gradient(135deg,#1DB954 0%,#138A3E 100%)" }}>
              <div className="text-[17px] font-black">Train to your Spotify</div>
              <div className="text-[12.5px] text-white/85 mt-1 leading-snug">Start your music in Spotify. FitnessLife keeps the timer, voice coach and chimes running over it{FitnessNative ? ", and lowers Spotify while the coach speaks." : "."}</div>
              <div className="flex items-center gap-2 mt-2.5 text-[11.5px] font-bold">
                <span className="px-2 py-[2px] rounded-full bg-white/20">{spotifyInstalled === null ? "Spotify status shows on iPhone" : spotifyInstalled ? "Spotify app installed" : "Spotify app not found · opens web player"}</span>
              </div>
              <ExtLink href={spotifyInstalled ? "spotify://" : "https://open.spotify.com"} className="mt-3 w-full py-2.5 rounded-full bg-white text-[#138A3E] text-[13.5px] font-black flex items-center justify-center gap-2">
                <ExternalLink size={15} /> Open Spotify
              </ExtLink>
            </div>
            <div className="text-[14px] font-extrabold mt-4 mb-1.5">Mixes for your heart-rate zone</div>
            <div className="rounded-[10px] border border-[var(--line)] divide-y divide-[var(--line)] overflow-hidden">
              {SPOTIFY_MIXES.map((m) => {
                const on = m.zone === zone;
                return (
                  <ExtLink key={m.q} href={spotifySearchUrl(m.q)} label={`Find ${m.label} music on Spotify`} className={`flex items-center gap-3 px-3 py-2.5 ${on ? "bg-[rgba(29,185,84,0.08)]" : "bg-white"}`}>
                    <span className="w-9 h-9 rounded-full grid place-items-center text-[12px] font-black text-white shrink-0" style={{ background: m.zone ? ZONES[m.zone].color : "#7A8794" }}>{m.zone ? `Z${m.zone}` : <Leaf size={15} />}</span>
                    <span className="flex-1 min-w-0"><span className="block text-[13.5px] font-bold text-[var(--ink)]">{m.label}</span><span className="block text-[11.5px] text-[var(--muted)]">{m.sub}{on ? " · your zone now" : ""}</span></span>
                    <ExternalLink size={15} className="text-[var(--muted)]" />
                  </ExtLink>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#F4F6F8] px-3 py-2.5">
              <div><div className="text-[13.5px] font-bold flex items-center gap-1.5">{music.voice ? <Mic size={14} /> : <MicOff size={14} />} Voice coach</div><div className="text-[11.5px] text-[var(--muted)]">Cues and 3-2-1 chimes play over Spotify</div></div>
              <Toggle id="voice-coach-spotify" ios={ios} on={music.voice} onChange={() => act("phone", "VOICE")} label="Voice coach" />
            </div>
            <button onClick={() => say(`${ex.name}. ${ex.cue}`)} className="mt-3 w-full py-2.5 rounded-full border-2 border-[var(--navy)] text-[13px] font-extrabold flex items-center justify-center gap-2"><Megaphone size={15} /> Test a form cue</button>
          </div>
        )}
        {!spotifyMode && <>
        <div className="rounded-[10px] bg-[var(--navy)] p-3.5">
          <div className="flex items-center justify-between text-[10.5px] font-bold text-white/55 tracking-[.1em] mb-2"><span>16-BAND SPECTRUM</span><span className="tnum">40 HZ – 16 KHZ</span></div>
          <Spectrum engine={engine} bands={16} height={96} gap={4} />
          <div className="flex items-center justify-between mt-3 text-white">
            <div className="tnum"><span className="text-[28px] font-black">{bpm}</span><span className="text-[11px] text-white/55 font-bold"> BPM</span></div>
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold tnum transition ${ducking ? "bg-[var(--blue)] text-white" : "bg-white/10 text-white/60"}`}>Music {ducking ? "−12.0" : "0.0"} dB</div>
            <IconBtn icon={music.playing ? Pause : Play} label={music.playing ? "Pause music" : "Play music"} onClick={() => act("phone", "MUSIC_TOGGLE")} tone="orange" size={46} iconSize={20} />
          </div>
        </div>
        <div className="text-center text-[17px] font-extrabold mt-4">{track.title}</div>
        <div className="text-center text-[12.5px] text-[var(--muted)] font-semibold">{track.genre} · {track.bpm} BPM base</div>
        <div className="grid grid-cols-3 gap-y-4 mt-4">
          {MUSIC_ITEMS.map((it) => (
            <button key={it.key} onClick={it.run} aria-pressed={it.on} className="flex flex-col items-center gap-1.5">
              <span className={`w-[54px] h-[54px] rounded-full grid place-items-center transition ${it.on ? "bg-[var(--navy)] text-white" : "bg-[#EDEFF2] text-[var(--ink)] shadow-[inset_0_-2px_0_rgba(0,0,0,.04)]"}`}><it.icon size={21} /></span>
              <span className={`text-[12px] leading-tight ${it.on ? "font-extrabold" : "font-semibold text-[#5E6670]"}`}>{it.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-[13px] font-bold"><span className="flex items-center gap-1.5"><Volume2 size={15} /> Master volume</span><span className="tnum">{Math.round(music.volume * 100)}%</span></div>
          <input id="master-volume" type="range" min="0" max="1" step="0.01" value={music.volume} onChange={(e) => act("phone", "VOLUME", { value: +e.target.value })} className="w-full mt-1" aria-label="Master volume" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[13px] font-bold flex items-center gap-1.5"><Gauge size={15} /> BPM nudge</span>
          <div className="flex items-center gap-2">
            <IconBtn icon={Minus} label="Slower" onClick={() => act("phone", "BPM_NUDGE", { delta: -2 })} size={32} iconSize={14} />
            <span className="w-12 text-center text-[17px] font-black tnum">{music.nudge >= 0 ? "+" : ""}{music.nudge}</span>
            <IconBtn icon={Plus} label="Faster" onClick={() => act("phone", "BPM_NUDGE", { delta: 2 })} size={32} iconSize={14} />
          </div>
        </div>
        <p className="text-[12px] text-[var(--muted)] mt-3">Auto-Tempo scales the beat to your heart-rate zone ({Math.round(TEMPO_FACTOR[zone] * 100)}% now). Voice cues lower the music by 12 dB while they play.</p>
        <button onClick={() => { if (!music.playing) startMusic(); say(`${ex.name}. ${ex.cue}`); }} className="mt-3 w-full py-2.5 rounded-full border-2 border-[var(--navy)] text-[13px] font-extrabold flex items-center justify-center gap-2"><Megaphone size={15} /> Play a form cue over the music</button>
        </>}
      </Sheet>

      <Sheet open={sheet === "generator"} onClose={() => setSheet(null)} title="Smart Circuit" ios={ios}>
        <GeneratorPanel C={C} close={() => setSheet(null)} />
      </Sheet>

      <Sheet open={sheet === "bridge"} onClose={() => setSheet(null)} title="Native Bridge" ios={ios} tall>
        <div className="text-[12.5px] text-[var(--muted)] mb-2.5">Production wiring for real hardware: WatchConnectivity, HealthKit and background audio with ducking.</div>
        <div style={{ height: "calc(100% - 40px)" }}><BridgeInspector toast={toast} /></div>
      </Sheet>

      <Sheet open={!!badgeSheet} onClose={() => setSheet(null)} title="Achievement" ios={ios}>
        {badgeSheet && (() => { const [v, t, u] = badgeSheet.prog(badgeCtx); const un = !!badges[badgeSheet.id]; return (
          <div className="flex flex-col items-center text-center pt-2 pb-2">
            <Medal b={badgeSheet} unlocked={un} pct={clamp(v / t, 0, 1)} size={120} onClick={() => {}} />
            <div className="text-[14px] text-[var(--muted)] mt-2 max-w-[260px]">{badgeSheet.desc}</div>
            <div className="mt-3 text-[24px] font-black tnum">{Math.min(v, t).toFixed(u === "min" ? 1 : 0)} / {t} <span className="text-[13px] text-[var(--muted)] font-semibold">{u}</span></div>
            <div className={`mt-2 px-3 py-1 rounded-full text-[12px] font-extrabold ${un ? "bg-[rgba(52,193,123,0.15)] text-[#1F9A5E]" : "bg-[#EEF1F4] text-[var(--muted)]"}`}>{un ? `Unlocked ${new Date(badges[badgeSheet.id]).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Locked"}</div>
          </div>); })()}
      </Sheet>
    </div>
  );

  const watchProps = { screen: watchScreen, setScreen: setWatchScreen, w, ex, hr, zone, music, bpm, stats, act, haptic, crownMode, setCrownMode, zoneOverride, engine, ducking, phaseTotal, standHr: 9 };
  const dragRef = useRef(null);

  if (NATIVE) {
    return (
      <div className="sw" style={{ position: "fixed", inset: 0, background: "#fff" }}>
        <style>{CSS}</style>
        {screen}
      </div>
    );
  }

  const syncPanel = (compact) => (
    <div className={`rounded-[12px] border border-white/[0.08] bg-[#232425] ${compact ? "p-2.5" : "p-3"} w-full`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10.5px] font-bold uppercase tracking-[.12em] text-white/50 flex items-center gap-1.5"><ArrowLeftRight size={12} /> WCSession</div>
        <span className="flex items-center gap-1.5 text-[10.5px] text-[var(--blue)] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)]" style={{ animation: "sw-pulse 1.6s infinite" }} /> reachable</span>
      </div>
      <div className="font-code text-[10.5px] leading-[1.6] flex flex-col">
        {syncLog.length ? syncLog.slice(0, compact ? 3 : 7).map((e) => (
          <div key={e.id} className="flex gap-1.5 min-w-0">
            <span className={e.src === "watch" ? "text-[var(--orange)]" : "text-[var(--blue)]"}>{e.src === "watch" ? "⌚→📱" : "📱→⌚"}</span>
            <span className="truncate text-white/75">{e.method}({JSON.stringify({ cmd: e.type, ...e.payload })})</span>
          </div>
        )) : <div className="text-white/45">Tap anything on the watch or phone.</div>}
      </div>
    </div>
  );

  const watchBlock = (
    <div className="flex flex-col items-center gap-2">
      <div className="py-6"><WatchUltra {...watchProps} /></div>
      <div className="text-[11px] text-white/45 text-center max-w-[250px] leading-snug">Swipe the display · scroll or drag the Digital Crown · the orange Action button marks a lap</div>
    </div>
  );

  return (
    <div className="sw min-h-full w-full sw-ios" style={{ background: "#2E2E2E", color: "#F2F3F5" }}>
      <style>{CSS}</style>
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#262626]/90 backdrop-blur-xl" style={{ paddingLeft: "max(16px, env(safe-area-inset-left, 0px))", paddingRight: "max(16px, env(safe-area-inset-right, 0px))" }}>
        <div className="max-w-[1240px] mx-auto py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-2.5 mr-auto">
            <BrandMark size={34} radius={9} />
            <div className="leading-tight"><div className="text-[16px] font-black">Fitness<span className="text-[var(--orange)]">Life</span></div><div className="text-[10.5px] text-white/45 font-bold uppercase tracking-[.14em]">Device studio</div></div>
          </div>
          <Seg small value={platform} onChange={setPlatform} options={[{ value: "ios", label: "iOS" }, { value: "md", label: "Material" }]} />
          <Seg small value={shell} onChange={setShell} options={[{ value: "mobile", label: "Mobile", icon: Smartphone }, { value: "studio", label: "Studio", icon: Monitor }]} />
          <Seg small value={watchMode} onChange={setWatchMode} options={[{ value: "off", label: "Off" }, { value: "docked", label: "Docked", icon: Columns2 }, { value: "pip", label: "PiP", icon: PictureInPicture2 }]} />
          <button onClick={() => setSheet("bridge")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white/[0.08] text-[12px] font-bold"><Code2 size={13} /> Native Bridge</button>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto py-7" style={{ paddingLeft: "max(16px, env(safe-area-inset-left, 0px))", paddingRight: "max(16px, env(safe-area-inset-right, 0px))" }}>
        <div className={`flex flex-wrap justify-center gap-10 ${wide ? "items-start" : "items-center"}`}>
          {wide ? (
            <div className="flex-1 min-w-0 basis-[640px] rounded-[18px] overflow-hidden shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)]" style={{ height: 820 }}>{screen}</div>
          ) : (
            <div className="shrink-0" style={{ width: "min(392px, 100%)" }}>
              {ios ? (
                <div className="p-[3px] rounded-[60px] bg-gradient-to-b from-[#F4F5F7] via-[#B4B8BE] to-[#E2E4E7] shadow-[0_40px_90px_-25px_rgba(0,0,0,.95)]">
                  <div className="p-[8px] rounded-[57px] bg-black">
                    <div className="relative overflow-hidden rounded-[49px]" style={{ height: 790 }}>{screen}</div>
                  </div>
                </div>
              ) : (
                <div className="p-[9px] rounded-[42px] bg-[#1C1E21] ring-1 ring-[#4A4E55] shadow-[0_40px_90px_-25px_rgba(0,0,0,.95)]">
                  <div className="relative overflow-hidden rounded-[33px]" style={{ height: 790 }}>{screen}</div>
                </div>
              )}
            </div>
          )}
          {(watchMode === "docked" || wide) && (
            <div className={`flex flex-col items-center gap-4 ${wide ? "w-[300px] shrink-0" : ""}`}>
              {watchMode === "docked" && watchBlock}
              {wide && syncPanel(false)}
              {wide && (
                <div className="rounded-[12px] border border-white/[0.08] bg-[#232425] p-3 w-full">
                  <div className="text-[10.5px] font-bold uppercase tracking-[.12em] text-white/50 mb-2 flex items-center gap-1.5"><HeartPulse size={12} /> HealthKit stream</div>
                  {[["HKQuantityTypeIdentifierHeartRate", `${Math.round(hr)} count/min`], ["HKQuantityTypeIdentifierActiveEnergyBurned", `${stats.sessionKcal.toFixed(1)} kcal`], ["HKWorkoutSession.state", w.running ? "running" : w.phase === "idle" ? "notStarted" : w.phase === "done" ? "ended" : "paused"], ["Reps (session)", stats.sessionReps]].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 text-[10.5px] font-code py-0.5"><span className="text-white/45 truncate">{k}</span><span className="text-white/80 tnum shrink-0">{v}</span></div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {!wide && <div className="max-w-[640px] mx-auto mt-7">{syncPanel(true)}</div>}
      </div>

      {watchMode === "pip" && (
        <div ref={dragRef} className="fixed z-40" style={{ right: `calc(${pip.x}px + env(safe-area-inset-right, 0px))`, bottom: `calc(${pip.y}px + env(safe-area-inset-bottom, 0px))`, transform: "scale(.78)", transformOrigin: "bottom right" }}>
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/70 text-[11px] font-bold text-white/80 cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragRef.start = { x: e.clientX, y: e.clientY, px: pip.x, py: pip.y }; }}
            onPointerMove={(e) => { const s = dragRef.start; if (!s) return; setPip({ x: clamp(s.px - (e.clientX - s.x), 0, window.innerWidth - 200), y: clamp(s.py - (e.clientY - s.y), 0, window.innerHeight - 260) }); }}
            onPointerUp={() => { dragRef.start = null; }}>⠿ drag</div>
          <div className="pt-6 pb-6"><WatchUltra {...watchProps} /></div>
        </div>
      )}
    </div>
  );
}

