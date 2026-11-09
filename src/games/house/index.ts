// CUSHION TRICK-SHOT: the House door's game.
// A cozy living room; kids aim and bank toys off bouncy sofa cushions to collect 5 treats for their pet.
//   ASK:    pick the pet: Tuffy (dog), Brownie (cat), or Bunny (rabbit).
//   AIM:    drag to aim the trajectory arc (dots show the ricochet path).
//   TOSS:   release to launch! Bounces off walls, cushions (boing!) and boxes.
//   FETCH:  pet dashes or leaps to catch and return the toy (impossible to fail).
//   MEET:   5 treats collected! Pet munches at bowl; tap to pet and complete.
//   REVEAL: quick card reveal, awards badges (clean = bank shot master, secret = golden star).
// Draw budget <= 25 canvas calls per frame, zero allocations in the frame loop.
import { registerGame, type GameApi } from '../../app/registry';
import { getBadgeStore } from '../../cards/badges';
import { setCaptionStyle } from '../../ui/captions';
import type { Recipe } from '../../audio/recipes';
import type { Cv } from '../../cards/scenes';
import {
  BOWL_X, BOWL_Y, BOX_TABLE, EV, FLOOR_Y, FOOD_OF, LAUNCH_X, LAUNCH_Y, PETS, Ph,
  ROOM_H, ROOM_W, SOFA, STAR_POS, TOY_OF, TrickShotRound, predictTrajectory,
  type PetId, type TrajectoryPoint,
} from './logic';
import {
  aimDotImage, bowlSprite, foodPlate, petImage, petTile, roomScene, secretStarSprite,
  tableAndBoxesSprite, toyImage,
} from './art';
import {
  BOING, CAPTION, CATCH, CLACK, MEET, MUNCH, PET, PICKUP, STAR, START, TOSS, TUMBLE,
} from './sounds';
import { createHouseStore } from './store';

const PART_POOL = 14;
const PCOL = ['#FFC93C', '#E8654A', '#FFF6E5', '#7BD389', '#3FA9D9'];
const TILE_Y = 46;
const TILE_SIZE = 42;
const TILE_XS: Record<PetId, number> = { dog: 42, cat: 99, rabbit: 156 };

interface Part { x: number; y: number; vx: number; vy: number; life: number; c: number }

registerGame({
  id: 'house',
  shelf: 'house',
  start(container, api) { return startHouse(container, api); },
});

function startHouse(container: HTMLElement, api: GameApi): () => void {
  const { stage, kit, audio } = api;
  let dead = false;

  setCaptionStyle({ hideSfx: false, noIcon: true });
  api.exitButton();
  const canvas = stage.canvas;
  const oldLabel = canvas.getAttribute('aria-label') || '';
  canvas.setAttribute('aria-label', api.t('house.aria'));
  canvas.setAttribute('tabindex', '0');

  const store = createHouseStore();

  // ------------------------------------------------------------------ art, built once
  const bg = roomScene(ROOM_W, ROOM_H);
  const dotImg = aimDotImage();
  const starImg = secretStarSprite(false);
  const starEarnedImg = secretStarSprite(true);
  const boxesStandingImg = tableAndBoxesSprite(false);
  const boxesTumbledImg = tableAndBoxesSprite(true);

  const petSprites = new Map<PetId, Cv[]>();
  const petTiles = new Map<PetId, Cv>();
  const petTilesActive = new Map<PetId, Cv>();
  const toySprites = new Map<PetId, Cv>();
  const foodPlates = new Map<string, Cv>();
  const bowlSprites = new Map<string, Cv[]>();

  for (const p of PETS) {
    const poses: Cv[] = [];
    for (let i = 0; i < 5; i++) poses.push(petImage(p, i));
    petSprites.set(p, poses);
    toySprites.set(p, toyImage(p));
    petTiles.set(p, petTile(poses[0], TILE_SIZE, false));
    petTilesActive.set(p, petTile(poses[0], TILE_SIZE, true));

    const food = FOOD_OF[p];
    if (!foodPlates.has(food)) {
      const rawIcon = kit.icon('food.' + food, 24);
      foodPlates.set(food, foodPlate(rawIcon, 24, food));
      const bowls: Cv[] = [];
      for (let n = 0; n <= 5; n++) bowls.push(bowlSprite(n, food));
      bowlSprites.set(food, bowls);
    }
  }

  // Pre-allocated trajectory points (zero allocations in frame loop)
  const MAX_TRAJ = 24;
  const trajPoints: TrajectoryPoint[] = [];
  for (let i = 0; i < MAX_TRAJ; i++) trajPoints.push({ x: 0, y: 0 });
  let trajCount = 0;

  // Particle pool
  const parts: Part[] = [];
  for (let i = 0; i < PART_POOL; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, c: 0 });

  const burst = (x: number, y: number, n: number): void => {
    if (stage.reduced) return;
    for (let i = 0, k = 0; i < parts.length && k < n; i++) {
      const p = parts[i];
      if (p.life > 0) continue;
      p.x = x;
      p.y = y;
      p.vx = (Math.random() - 0.5) * 80;
      p.vy = -20 - Math.random() * 50;
      p.life = 400 + Math.random() * 250;
      p.c = (Math.random() * PCOL.length) | 0;
      k++;
    }
  };

  // Caption throttle map
  const lastCap = new Map<string, number>();
  const cue = (r: Recipe, key?: string, gap = 1200): void => {
    let showKey: string | undefined = undefined;
    if (key) {
      const now = performance.now();
      const last = lastCap.get(key) || 0;
      if (now - last >= gap) {
        lastCap.set(key, now);
        showKey = key;
      }
    }
    audio.play(r, showKey);
  };

  // ------------------------------------------------------------------ state
  const round = new TrickShotRound(Math.random, { reduced: stage.reduced });
  let revealing = false;
  let pointerDown = false;
  let meetTimer = 0;
  let lastNow = 0;
  let hotPet: PetId | null = null;

  const openAsk = (): void => {
    round.phase = Ph.Ask;
    api.caption('house.pick', 3000);
  };

  const startPet = (pet: PetId): void => {
    round.start(pet);
    cue(START[pet]);
    api.caption('house.aim', 2500);
  };

  openAsk();

  // ------------------------------------------------------------------ actions & inputs
  const updateAimFromPointer = (px: number, py: number): void => {
    const dx = px - LAUNCH_X;
    const dy = py - LAUNCH_Y;
    let angle = Math.atan2(dy, dx);
    // Clamp aiming arc upwards and right into room
    if (angle > -0.12) angle = -0.12;
    if (angle < -1.48) angle = -1.48;
    round.aimAngle = angle;
    const dist = Math.hypot(dx, dy);
    round.aimPower = Math.max(190, Math.min(340, dist * 2.6));
  };

  stage.onDown = (p) => {
    const px = p.x, py = p.y;
    if (revealing || dead) return;

    if (round.phase === Ph.Ask) {
      for (const pet of PETS) {
        const x = TILE_XS[pet];
        if (px >= x && px <= x + TILE_SIZE && py >= TILE_Y && py <= TILE_Y + TILE_SIZE) {
          audio.animal(pet);
          burst(x + TILE_SIZE / 2, TILE_Y + TILE_SIZE / 2, 8);
          startPet(pet);
          return;
        }
      }
      return;
    }

    if (round.phase === Ph.Aim) {
      pointerDown = true;
      round.isAiming = true;
      updateAimFromPointer(px, py);
      return;
    }

    if (round.phase === Ph.Meet) {
      // Child taps to feed pet and finish!
      finishRound();
    }
  };

  stage.onMove = (p) => {
    const px = p.x, py = p.y;
    if (revealing || dead) return;
    if (round.phase === Ph.Ask) {
      hotPet = null;
      for (const pet of PETS) {
        const x = TILE_XS[pet];
        if (px >= x && px <= x + TILE_SIZE && py >= TILE_Y && py <= TILE_Y + TILE_SIZE) {
          hotPet = pet;
          break;
        }
      }
      return;
    }

    if (round.phase === Ph.Aim && pointerDown) {
      updateAimFromPointer(px, py);
    }
  };

  stage.onUp = () => {
    if (revealing || dead) return;
    if (round.phase === Ph.Aim && pointerDown) {
      pointerDown = false;
      round.isAiming = false;
      if (round.toss()) {
        cue(TOSS, CAPTION.toss);
        burst(LAUNCH_X, LAUNCH_Y, 4);
      }
    }
  };

  stage.onKey = (e) => {
    if (revealing || dead) return;
    if (round.phase === Ph.Ask) {
      if (e.key === '1' || e.key === 'ArrowLeft') startPet('dog');
      else if (e.key === '2' || e.key === 'ArrowUp') startPet('cat');
      else if (e.key === '3' || e.key === 'ArrowRight') startPet('rabbit');
      else if (e.key === ' ' || e.key === 'Enter') startPet('dog');
      return;
    }

    if (round.phase === Ph.Aim) {
      if (e.key === 'ArrowUp') {
        round.aimAngle = Math.max(-1.48, round.aimAngle - 0.08);
      } else if (e.key === 'ArrowDown') {
        round.aimAngle = Math.min(-0.12, round.aimAngle + 0.08);
      } else if (e.key === 'ArrowRight') {
        round.aimPower = Math.min(340, round.aimPower + 20);
      } else if (e.key === 'ArrowLeft') {
        round.aimPower = Math.max(190, round.aimPower - 20);
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (round.toss()) {
          cue(TOSS, CAPTION.toss);
          burst(LAUNCH_X, LAUNCH_Y, 4);
        }
      }
      return;
    }

    if (round.phase === Ph.Meet && (e.key === ' ' || e.key === 'Enter')) {
      finishRound();
    }
  };

  const finishRound = (): void => {
    if (revealing) return;
    revealing = true;
    cue(MUNCH, CAPTION.munch);
    cue(PET[round.pet], CAPTION.purr);
    burst(BOWL_X + 12, BOWL_Y - 6, 12);

    try {
      store.addPlay(round.pet);
      const badges: ('clean' | 'secret')[] = [];
      if (round.isClean()) badges.push('clean');
      if (round.isSecret()) badges.push('secret');
      if (badges.length > 0) {
        getBadgeStore().award(round.pet, badges);
      }
    } catch {
      // Store / badge optional
    }

    api.reveal(round.pet, { quick: true }).catch((e) => console.error(e)).then(() => {
      revealing = false;
      if (dead) return;
      openAsk();
    });
  };

  // ------------------------------------------------------------------ frame loop
  stage.draw = (ctx) => {
    const now = performance.now();
    const dt = lastNow === 0 ? 16 : Math.min(now - lastNow, 50);
    lastNow = now;

    // 1. Simulation update
    const ev = round.tick(dt);

    if (ev & EV.Boing) {
      cue(BOING, CAPTION.boing);
      burst(round.toy.x, round.toy.y, 6);
    }
    if (ev & EV.Clack) {
      cue(CLACK, CAPTION.clack, 600);
      burst(round.toy.x, round.toy.y, 3);
    }
    if (ev & EV.Tumble) {
      cue(TUMBLE);
      burst(BOX_TABLE.x + 14, BOX_TABLE.y - 4, 8);
    }
    if (ev & EV.Catch) {
      cue(CATCH, CAPTION.fetch, 800);
      burst(round.petPose.x, round.petPose.y - 12, 6);
    }
    if (ev & EV.Star) {
      cue(STAR, CAPTION.star);
      burst(STAR_POS.x, STAR_POS.y, 14);
    }
    if (ev & EV.Pickup) {
      const food = FOOD_OF[round.pet];
      const pickList = PICKUP[food] || PICKUP.bone;
      const pickIdx = Math.min(round.foodsCollected - 1, pickList.length - 1);
      cue(pickList[pickIdx]);
      burst(round.toy.x, round.toy.y, 8);
    }
    if (ev & EV.Meet) {
      cue(MEET);
      burst(BOWL_X + 12, BOWL_Y - 4, 12);
      api.caption('house.feed', 3500);
    }

    // Update particles
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      p.vy += (140 * dt) / 1000;
    }

    // 2. Render background (1 call)
    ctx.drawImage(bg, 0, 0);

    // 3. Secret star (1 call)
    const curStarImg = round.secretEarned ? starEarnedImg : starImg;
    ctx.drawImage(curStarImg, STAR_POS.x - 14, STAR_POS.y - 24);

    // 4. Box table & wobble boxes (1 call)
    const curBoxesImg = round.boxTumbled ? boxesTumbledImg : boxesStandingImg;
    ctx.drawImage(curBoxesImg, BOX_TABLE.x - 4, BOX_TABLE.y - 18);

    if (round.phase === Ph.Ask) {
      // 5. Ask Shelf pet tiles (3 calls)
      for (const p of PETS) {
        const x = TILE_XS[p];
        const tileImg = (hotPet === p ? petTilesActive : petTiles).get(p)!;
        ctx.drawImage(tileImg, x, TILE_Y);
      }
    } else {
      // 5. Food bowl (1 call)
      const food = FOOD_OF[round.pet];
      const bowlList = bowlSprites.get(food);
      const bImg = bowlList ? bowlList[Math.min(round.foodsCollected, 5)] : null;
      if (bImg) ctx.drawImage(bImg, BOWL_X, BOWL_Y);

      // 6. Active food items (at most 2 calls)
      const fPlate = foodPlates.get(food);
      if (fPlate) {
        for (let i = 0; i < round.foods.length; i++) {
          const f = round.foods[i];
          if (f.active && !f.collected) {
            ctx.drawImage(fPlate, f.x - 12, f.y - 12);
          }
        }
      }

      // 7. Trajectory dots when aiming (~1-2 calls)
      if (round.phase === Ph.Aim) {
        const vx = Math.cos(round.aimAngle) * round.aimPower;
        const vy = Math.sin(round.aimAngle) * round.aimPower;
        trajCount = predictTrajectory(LAUNCH_X, LAUNCH_Y, vx, vy, trajPoints, 14);
        for (let i = 2; i < trajCount; i += 2) {
          const pt = trajPoints[i];
          ctx.drawImage(dotImg, pt.x - 4, pt.y - 4);
        }
      }

      // 8. Pet sprite (1 call, or 2 with flip)
      const poses = petSprites.get(round.pet);
      const pImg = poses ? poses[round.petPose.pose] : null;
      if (pImg) {
        if (round.petPose.flip) {
          ctx.save();
          ctx.translate(round.petPose.x, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(pImg, -32, round.petPose.y - 56);
          ctx.restore();
        } else {
          ctx.drawImage(pImg, round.petPose.x - 32, round.petPose.y - 56);
        }
      }

      // 9. Toy (1 call)
      const tImg = toySprites.get(round.pet);
      if (tImg) {
        ctx.drawImage(tImg, round.toy.x - 12, round.toy.y - 12);
      }
    }

    // 10. Particles (~1-4 calls)
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.life <= 0) continue;
      ctx.fillStyle = PCOL[p.c];
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2.5, 2.5);
    }
  };

  return () => {
    dead = true;
    canvas.setAttribute('aria-label', oldLabel);
  };
}
