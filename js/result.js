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
 * Data type determining the results of placing a card.
 * @param {object} card source card
 * @param {int} position source card position
 * @param {array} board current board
 * @param {array} elements current element board
 */
function CardResult(card, position, board, elements) {
	/** Card result lists. */
	this.captured = [];
	this.same = (Game.rules.SAME) ? [] : undefined;
	this.plus = undefined;

	/** Combo lists. */
	this.combo = undefined;

	/** Total number of cards captured in this result (all rules and combos). */
	this.capturedCount = 0;

	/** Source card. */
	this.card = card;

	/** Current board. */
	this.board = board;

	/** Current element board. */
	this.elements = elements;

	/** Card owners on the board. */
	this.owners = undefined;
	if (Game.rules.COMBO) {  // store owners (for "combo")
		this.owners = [];
		for (var i = 0; i < 9; i++) {
			if (board[i] !== undefined)
				this.owners[i] = board[i].owner;
		}
	}

	/** Card sums list. */
	this.sums = (Game.rules.PLUS) ? { "list": [] } : undefined;

	// if "Same Wall" has been triggered
	var sameWall = false;

	// process card results on all sides (if valid)
	// set "Same Wall" status on borders
	if (position % 3 != 0)
		this.calcResult(card, position, Card.RANK_LEFT, position - 1, Card.RANK_RIGHT);
	else if (card.ranks[Card.RANK_LEFT] == 10)
		this.sameWall = true;
	if (position % 3 != 2)
		this.calcResult(card, position, Card.RANK_RIGHT, position + 1, Card.RANK_LEFT);
	else if (card.ranks[Card.RANK_RIGHT] == 10)
		sameWall = true;
	if (position > 2)
		this.calcResult(card, position, Card.RANK_TOP, position - 3, Card.RANK_BOTTOM);
	else if (card.ranks[Card.RANK_TOP] == 10)
		sameWall = true;
	if (position < 6)
		this.calcResult(card, position, Card.RANK_BOTTOM, position + 3, Card.RANK_TOP);
	else if (card.ranks[Card.RANK_BOTTOM] == 10)
		sameWall = true;

	// check captured
	if (this.captured.length < 1)
		this.captured = undefined;

	// check "same"
	if (this.same !== undefined) {
		var isValid = false;
		var minSize = (sameWall && Game.rules.SAME_WALL) ? 1 : 2;
		var len = this.same.length;
		if (len >= minSize) {
			for (var i = 0; i < len; i++) {
				if (this.same[i].owner != card.owner) {
					isValid = true;
					this.capturedCount++;
				}
			}
		}
		if (isValid) {
			this.sums = undefined;
			this.filterCaptured(this.same);
			this.calcCombo(this.same);
		} else
			this.same = undefined;
	}

	// check "plus"
	if (this.sums !== undefined) {
		for (var i = 0, len = this.sums.list.length; i < len; i++) {
			var sumList = this.sums[this.sums.list[i]];
			var listLen = sumList.length;
			if (listLen >= 2) {
				var isValid = false;
				for (var j = 0; j < listLen; j++) {
					if (sumList[j].owner != card.owner) {
						isValid = true;
						this.capturedCount++;
					}
				}
				if (isValid) {
					this.plus = sumList;
					this.filterCaptured(this.plus);
					this.calcCombo(this.plus);
					break;
				} else
					this.capturedCount = 0;
			}
		}
		this.sums = undefined;
	}

	if (this.captured !== undefined)
		this.capturedCount += this.captured.length;
}

CardResult.prototype = {
	constructor: CardResult,

	/**
	 * Processes card results for a source and target card.
	 * @param {object} source the source card
	 * @param {int} sourcePosition the source board position
	 * @param {int} sourceLocation the source rank location
	 * @param {int} targetPosition the target board position
	 * @param {int} targetLocation the target rank location
	 */
	calcResult: function(source, sourcePosition, sourceLocation, targetPosition, targetLocation) {
		var target = this.board[targetPosition];
		if (target === undefined)  // target position is empty
			return;

		var sourceRank = source.ranks[sourceLocation];
		var targetRank = target.ranks[targetLocation];

		// add to "same" list
		if (this.same !== undefined) {
			if (sourceRank == targetRank)
				this.same.push(target);
		}

		// add to "plus" list
		if (this.sums !== undefined) {
			var sum = sourceRank + targetRank;
			var sumList = this.sums[sum];
			if (sumList === undefined) {
				this.sums[sum] = sumList = [];
				this.sums.list.push(sum);
			}
			sumList.push(target);
		}

		// add to "captured" list
		if (this.captures(source, sourcePosition, sourceLocation, source.owner,
				targetPosition, targetLocation, target.owner))
			this.captured.push(target);
	},

	/**
	 * Returns whether or not the source card rank is greater than
	 * the target card rank, taking elements into account.
	 * @param {object} source the source card
	 * @param {int} sourcePosition the source board position
	 * @param {int} sourceLocation the source rank location
	 * @param {bool} sourceOwner the source card owner
	 * @param {int} targetPosition the target board position
	 * @param {int} targetLocation the target rank location
	 * @param {bool} targetOwner the target card owner
	 * @return {bool} true if source card "captures" target card
	 */
	captures: function(source, sourcePosition, sourceLocation, sourceOwner,
			targetPosition, targetLocation, targetOwner) {
		var target = this.board[targetPosition];
		if (target === undefined)  // target position is empty
			return false;

		if (sourceOwner == targetOwner)  // same owner: don't check capture
			return false;

		var sourceRank = source.ranks[sourceLocation];
		var targetRank = target.ranks[targetLocation];
		if (this.elements !== undefined) {
			// element bonuses
			if (this.elements[sourcePosition] != Game.Element.NEUTRAL)
				sourceRank += (source.element == this.elements[sourcePosition]) ? 1 : -1;
			if (this.elements[targetPosition] != Game.Element.NEUTRAL)
				targetRank += (target.element == this.elements[targetPosition]) ? 1 : -1;
		}
		return (sourceRank > targetRank);
	},

	/**
	 * Removes all cards in the captured list contained in the given result list.
	 * If the captured list is empty afterwards, it will be set to null.
	 * @param {array} resultList the list of cards to be used as a filter
	 */
	filterCaptured: function(resultList) {
		if (this.captured === undefined)
			return;

		var len = this.captured.length;
		while (len--) {
			var c = this.captured[len];
			if (resultList.indexOf(c) != -1)
				this.captured.splice(len, 1);
			else if (this.owners !== undefined)
				this.owners[c.position] = this.card.owner;
		}
		if (this.captured.length < 1)
			this.captured = undefined;
	},

	/**
	 * Checks for and processes combos.
	 * @param {array} resultList the list of cards used to initiate the combo
	 */
	calcCombo: function(resultList) {
		if (this.owners === undefined)  // rule not active
			return;

		// change owners on copied owners board
		var cardOwner = this.card.owner;
		var len = resultList.length;
		for (var i = 0; i < len; i++)
			this.owners[resultList[i].position] = cardOwner;

		// calculate captures
		var comboSet = {};
		var comboList = [];
		for (var i = 0; i < len; i++) {
			var c = resultList[i];
			if (c.owner == cardOwner)
				continue;

			var pos = c.position;
			if (pos % 3 != 0 &&
				this.captures(c, pos, Card.RANK_LEFT, this.owners[pos], pos - 1, Card.RANK_RIGHT, this.owners[pos - 1]))
				comboSet[pos - 1] = true;
			if (pos % 3 != 2 &&
				this.captures(c, pos, Card.RANK_RIGHT, this.owners[pos], pos + 1, Card.RANK_LEFT, this.owners[pos + 1]))
				comboSet[pos + 1] = true;
			if (pos > 2 &&
				this.captures(c, pos, Card.RANK_TOP, this.owners[pos], pos - 3, Card.RANK_BOTTOM, this.owners[pos - 3]))
				comboSet[pos - 3] = true;
			if (pos < 6 &&
				this.captures(c, pos, Card.RANK_BOTTOM, this.owners[pos], pos + 3, Card.RANK_TOP, this.owners[pos + 3]))
				comboSet[pos + 3] = true;
		}
		for (var prop in comboSet) {
			comboList.push(this.board[prop]);
			this.capturedCount++;
		}
		if (comboList.length < 1)  // no captures
			return;

		// add new "combo" list
		if (this.combo === undefined)
			this.combo = [];
		this.combo.push(comboList);

		// chain combos
		this.calcCombo(comboList);
	},

	/**
	 * Returns whether or not the result contains a normal capture.
	 * @return {bool} true if capture
	 */
	hasCapture: function() { return this.captured !== undefined; },

	/**
	 * Returns whether or not the result invoked the "Same" rule.
	 * @return {bool} true if "Same"
	 */
	isSame: function() { return this.same !== undefined; },

	/**
	 * Returns whether or not the result invoked the "Plus" rule.
	 * @return {bool} true if "Plus"
	 */
	isPlus: function() { return this.plus !== undefined; },

	/**
	 * Returns whether or not there are any (remaining) "Combo" lists.
	 * @return {bool} true if lists exist
	 */
	hasCombo: function() { return (this.combo !== undefined && this.combo.length > 0); },

	/**
	 * Returns the next "Combo" list, if any exist.
	 * @return {array} "Combo" card list, or null if none (remaining)
	 */
	nextCombo: function() { return this.hasCombo() ? this.combo.splice(0, 1)[0] : null; }
};