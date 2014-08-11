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

/**
 * Game sounds.
 */
Game.Sound = {
	BGM: ["sounds/bgm.mp3", "sounds/bgm.ogg"],
	BACK: ["sounds/sound-back.wav"],
	CARD: ["sounds/sound-card.wav"],
	INVALID: ["sounds/sound-invalid.wav"],
	SELECT: ["sounds/sound-select.wav"],
	SPECIAL: ["sounds/sound-special.wav"],
	START: ["sounds/sound-start.wav"],
	TURN: ["sounds/sound-turn.wav"],

	/**
	 * Initializes all sounds.
	 */
	setup: function() {
		Game.Sound.BGM = new Howl({
			"urls": Game.Sound.BGM,
			"buffer": false,
			"autoplay": true,
			"loop": true,
			"volume": Game.settings.MUSIC
		});
		Game.Sound.BACK = new Howl({ "urls": Game.Sound.BACK, "volume": Game.settings.SOUND });
		Game.Sound.CARD = new Howl({ "urls": Game.Sound.CARD, "volume": Game.settings.SOUND });
		Game.Sound.INVALID = new Howl({ "urls": Game.Sound.INVALID, "volume": Game.settings.SOUND });
		Game.Sound.SELECT = new Howl({ "urls": Game.Sound.SELECT, "volume": Game.settings.SOUND });
		Game.Sound.SPECIAL = new Howl({ "urls": Game.Sound.SPECIAL, "volume": Game.settings.SOUND });
		Game.Sound.START = new Howl({ "urls": Game.Sound.START, "volume": Game.settings.SOUND });
		Game.Sound.TURN = new Howl({ "urls": Game.Sound.TURN, "volume": Game.settings.SOUND });

		// sound on/off
		document.getElementById("sound").addEventListener("click", function() {
			var sound = document.getElementById("sound");
			if (!Game.isMuted) {
				sound.src = "img/icon-sound-off.png";
				if (!Game.isPaused)
					Howler.mute();
				Game.isMuted = true;
			} else {
				sound.src = "img/icon-sound-on.png";
				if (!Game.isPaused)
					Howler.unmute();
				Game.isMuted = false;
			}
		});
	},
}