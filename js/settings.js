/*
 * Triple Triad (HTML5) - a card game from FFVIII
 * Copyright (C) 2014 Jeffrey Han
 *
 * Triple Triad is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Triple Triad is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Triple Triad.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

/**
 * Game settings.
 */
Game.settings = {
	// volume [0, 1]
	"MUSIC": 0.6,
	"SOUND": 0.8,

	// frame rate
	"FPS": 30,

	// RANDOM, OFFENSIVE, DEFENSIVE, BALANCED
	"AI_PLAYER": "BALANCED",
	"AI_OPPONENT": "BALANCED"
};

/**
 * Game rules.
 */
Game.rules = {
	"OPEN": false,
	"SAME": true,
	"SAME_WALL": true,
	"PLUS": true,
	"COMBO": true,
	"ELEMENTAL": true,
	"SUDDEN_DEATH": true
};