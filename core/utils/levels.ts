import { levelToExp } from "./storage";

export function getLevel(xp: number) {
  if (xp < levelToExp[0]) return 0;
  if (xp >= levelToExp[levelToExp.length - 1]) return 25;

  for (let i = 0; i < levelToExp.length; i++) {
    if (xp < levelToExp[i] && xp > levelToExp[i - 1]) return i + 1;
  }
}

export function xpUntilNextLevel(xp: number) {
  if (xp < levelToExp[0]) return 50 - xp;
  if (xp >= levelToExp[levelToExp.length - 1]) return `You are the max level!`;

  for (let i = 0; i < levelToExp.length; i++) {
    if (xp < levelToExp[i] && xp > levelToExp[i - 1]) return levelToExp[i] - xp;
  }
}
