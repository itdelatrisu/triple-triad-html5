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
 * Generic AI.
 * @param {array} hand the hand of cards
 * @param {array} board the board
 * @param {array} elements the element board
 */
function AI(hand, board, elements) {
	/** The hand. */
	this.hand = hand;

	/** The game board. */
	this.board = board;

	/** The element board. */
	this.elements = elements;

	/** Hand index of the next card to be played. */
	this.nextIndex = undefined;

	/** Board position of the next card to be played.*/
	this.nextPosition = undefined;
}

AI.prototype = {
	constructor: AI,

	/**
	 * Calculates the next card index and position.
	 * @param {int} thisScore the AI's score [1, 9]
	 * @param {int} thatScore the opposing player's score [1, 9]
	 */
	update: function(thisScore, thatScore) {},

	/**
	 * Returns a list containing all empty board positions [0, 8].
	 * @return {array} a list of empty positions
	 */
	emptySpaces: function() {
		var spaces = [];
		for (var i = 0; i < 9; i++) {
			if (this.board[i] === undefined)
				spaces.push(i);
		}
		return spaces;
	},

	/**
	 * Returns the "rank difference" value of a card at a position.
	 * This takes elements into account, and is calculated using the formula:<ul>
	 * <li>rank_diff = (10 * (# open sides)) - sum(ranks of open sides)</ul>
	 * @param {object} card the card
	 * @param {int} position the board position
	 * @return {int} the rank difference [0, 40]
	 */
	getRankDiff: function(card, position) {
		var totalRank = 0;
		var sides = 0;
		if (position % 3 != 0 && this.board[position - 1] === undefined) {
			totalRank += card.ranks[Card.RANK_LEFT];
			sides++;
		}
		if (position % 3 != 2 && this.board[position + 1] === undefined) {
			totalRank += card.ranks[Card.RANK_RIGHT];
			sides++;
		}
		if (position > 2 && this.board[position - 3] === undefined) {
			totalRank += card.ranks[Card.RANK_TOP];
			sides++;
		}
		if (position < 6 && this.board[position + 3] === undefined) {
			totalRank += card.ranks[Card.RANK_BOTTOM];
			sides++;
		}

		// element bonuses
		if (this.elements !== undefined && this.elements[position] != Game.Element.NEUTRAL)
			totalRank += ((card.element == this.elements[position]) ? 1 : -1) * sides;

		return Math.max((sides * 10) - totalRank, 0);
	},

	/**
	 * Returns the sum "rank difference" of all of the owner's cards on the board.
	 * @return {int} the board's rank difference
	 */
	getBoardRankDiff: function() {
		var owner = this.hand[0].owner;
		var totalRank = 0;
		for (var i = 0; i < 9; i++) {
			if (this.board[i] !== undefined && this.board[i].owner == owner)
				totalRank += this.getRankDiff(this.board[i], i);
		}
		return totalRank;
	},

	/**
	 * Returns the "side rank difference" at a position.
	 * This takes elements into account, and is calculated using the formula:<ul>
	 * <li>side_rank_diff = (10 * (# adjacent cards)) - sum(facing ranks of adjacent cards)</ul>
	 * @param {int} position the board position
	 * @return {int} the side rank difference [-4, 40]
	 */
	sideRankDiff: function(position) {
		var owner = this.hand[0].owner;
		var totalRank = 0;
		var sides = 0;
		if (position % 3 != 0 && this.board[position - 1] !== undefined && this.board[position - 1].owner == owner) {
			totalRank += this.board[position - 1].ranks[Card.RANK_RIGHT];
			if (this.elements !== undefined && this.elements[position - 1] != Game.Element.NEUTRAL)
				totalRank += (this.board[position - 1].element == this.elements[position - 1]) ? 1 : -1;
			sides++;
		}
		if (position % 3 != 2 && this.board[position + 1] !== undefined && this.board[position + 1].owner == owner) {
			totalRank += this.board[position + 1].ranks[Card.RANK_LEFT];
			if (this.elements !== undefined && this.elements[position + 1] != Game.Element.NEUTRAL)
				totalRank += (this.board[position + 1].element == this.elements[position + 1]) ? 1 : -1;
			sides++;
		}
		if (position > 2 && this.board[position - 3] !== undefined && this.board[position - 3].owner == owner) {
			totalRank += this.board[position - 3].ranks[Card.RANK_BOTTOM];
			if (this.elements !== undefined && this.elements[position - 3] != Game.Element.NEUTRAL)
				totalRank += (this.board[position - 3].element == this.elements[position - 3]) ? 1 : -1;
			sides++;
		}
		if (position < 6 && this.board[position + 3] !== undefined && this.board[position + 3].owner == owner) {
			totalRank += this.board[position + 3].ranks[Card.RANK_TOP];
			if (this.elements !== undefined && this.elements[position + 3] != Game.Element.NEUTRAL)
				totalRank += (this.board[position + 3].element == this.elements[position + 3]) ? 1 : -1;
			sides++;
		}

		return (sides * 10) - totalRank;
	},

	/**
	 * Uses the card and position creating the lowest "rank difference" of
	 * all the owner's cards on the board.
	 * @param {array} spaces the list of empty spaces
	 */
	useMinRankDiff: function(spaces) {
		var handSize = this.hand.length;
		var spacesCount = spaces.length;
		var boardRankDiff = this.getBoardRankDiff();
		var minTotalRankDiff = Number.MAX_VALUE;
		var nextLevel = -1;

		// use lowest level card possible, except if starting second and on last turn
		var useLowestLevel = ((spacesCount % 2 > 0) || handSize != 2);

		for (var i = 0; i < spacesCount; i++) {
			var space = spaces[i];
			var sideRankDiff = this.sideRankDiff(space);
			for (var index = 0; index < handSize; index++) {
				var c = this.hand[index];
				var totalRankDiff = boardRankDiff + this.getRankDiff(c, space) - sideRankDiff;
				if (totalRankDiff < minTotalRankDiff ||
					(totalRankDiff == minTotalRankDiff && (
						(useLowestLevel && c.level < nextLevel) ||
						(!useLowestLevel && c.level > nextLevel)
					)
				)) {
					minTotalRankDiff = totalRankDiff;
					nextLevel = c.level;
					this.nextIndex = index;
					this.nextPosition = space;
				}
			}
		}
	}
}

/**
 * Random AI.
 * Always chooses random moves.
 * @param {array} hand the hand of cards
 * @param {array} board the board
 * @param {array} elements the element board
 */
function RandomAI(hand, board, elements) {
	AI.call(this, hand, board, elements);
}

RandomAI.prototype = Object.create(AI.prototype);
RandomAI.prototype.constructor = RandomAI;
RandomAI.prototype.update = function(thisScore, thatScore) {
	var spaces = this.emptySpaces();
	this.nextIndex = Math.floor(Math.random() * this.hand.length);
	this.nextPosition = spaces[Math.floor(Math.random() * spaces.length)];
};

/**
 * Offensive AI.
 * Always captures the greatest number of cards with the worst card possible.
 * @param {array} hand the hand of cards
 * @param {array} board the board
 * @param {array} elements the element board
 */
function OffensiveAI(hand, board, elements) {
	AI.call(this, hand, board, elements);
}

OffensiveAI.prototype = Object.create(AI.prototype);
OffensiveAI.prototype.constructor = OffensiveAI;
OffensiveAI.prototype.update = function(thisScore, thatScore) {
	var spaces = this.emptySpaces();
	var handSize = this.hand.length;
	var spacesCount = spaces.length;

	// use lowest level card possible, except if starting second and on last turn
	var useLowestLevel = ((spacesCount % 2 > 0) || handSize != 2);

	// find move with max number of captured cards
	var maxCapture = -1;
	var nextLevel = -1;
	for (var i = 0; i < spacesCount; i++) {
		var space = spaces[i];
		for (var index = 0; index < handSize; index++) {
			var c = this.hand[index];
			var result = new CardResult(c, space, this.board, this.elements);
			var capturedCount = result.getCapturedCount();
			if (capturedCount > maxCapture ||
				(capturedCount == maxCapture && (
					(useLowestLevel && c.level < nextLevel) ||
					(!useLowestLevel && c.level > nextLevel)
				)
			)) {
				maxCapture = capturedCount;
				nextLevel = c.level;
				this.nextIndex = index;
				this.nextPosition = space;
			}
		}
	}

	// no capture possible: find lowest total rank difference
	if (maxCapture == 0)
		this.useMinRankDiff(spaces);
};

/**
 * Defensive AI.
 * Always picks the best card position possible.
 * @param {array} hand the hand of cards
 * @param {array} board the board
 * @param {array} elements the element board
 */
function DefensiveAI(hand, board, elements) {
	AI.call(this, hand, board, elements);
}

DefensiveAI.prototype = Object.create(AI.prototype);
DefensiveAI.prototype.constructor = DefensiveAI;
DefensiveAI.prototype.update = function(thisScore, thatScore) {
	this.useMinRankDiff(this.emptySpaces());
};

/**
 * Balanced AI.
 * Weighs capture count against best card placement for each move.
 * @param {array} hand the hand of cards
 * @param {array} board the board
 * @param {array} elements the element board
 */
function BalancedAI(hand, board, elements) {
	AI.call(this, hand, board, elements);
}

BalancedAI.prototype = Object.create(AI.prototype);
BalancedAI.prototype.constructor = BalancedAI;
BalancedAI.prototype.update = function(thisScore, thatScore) {
	var spaces = this.emptySpaces();
	var spacesCount = spaces.length;
	var handSize = this.hand.length;

	// use lowest level card possible, except if starting second and on last turn
	var useLowestLevel = ((spacesCount % 2 > 0) || handSize != 2);

	// if losing, use less placement restrictions
	var isLosing = (thisScore < thatScore);

	// find move with max number of captured cards
	var maxCapture = -1;
	var nextRankDiff = 41;
	var nextLevel = -1;
	for (var i = 0; i < spacesCount; i++) {
		var space = spaces[i];
		for (var index = 0; index < handSize; index++) {
			var c = this.hand[index];
			var result = new CardResult(c, space, this.board, this.elements);
			var capturedCount = result.getCapturedCount();
			var rankDiff = this.getRankDiff(c, space);

			// determine whether or not to use this result...
			var isValid = false;
			if (maxCapture == -1)
				isValid = true;
			else if (capturedCount > maxCapture) {
				if (capturedCount > 2 || nextRankDiff - rankDiff > -5 || isLosing)
					isValid = true;
			} else if (capturedCount == maxCapture) {
				if (rankDiff < nextRankDiff ||
					(rankDiff == nextRankDiff && (
						(useLowestLevel && c.level < nextLevel) ||
						(!useLowestLevel && c.level > nextLevel)
					)
				))
					isValid = true;
			} else if (capturedCount == maxCapture - 1 && !isLosing) {
				if (nextRankDiff - rankDiff > 5)
					isValid = true;
			}

			if (isValid) {
				maxCapture = capturedCount;
				nextRankDiff = rankDiff;
				nextLevel = c.level;
				this.nextIndex = index;
				this.nextPosition = space;
			}
		}
	}

	// no capture possible: find lowest total rank difference
	if (maxCapture == 0 && spacesCount != 9)
		this.useMinRankDiff(spaces);
};