/** Draw sprite on active canvas at a location. */
jaws.Sprite.prototype.drawAt = function(x, y) {
	this.x = x;
	this.y = y;
	this.draw();
}

/** Draw sprite on active canvas centered at a location. */
jaws.Sprite.prototype.drawCentered = function(x, y) {
	this.drawAt(x - (this.width / 2), y - (this.height / 2));
}

/** Sets scale factor based on original dimensions. */
jaws.Sprite.prototype.setScale = function(value) {
	if (this.originalWidth === undefined || this.originalHeight === undefined) {
		this.originalWidth = this.width;
		this.originalHeight = this.height;
	}
	this.scale_x = value * this.originalWidth / this.image.width;
	this.scale_y = value * this.originalHeight / this.image.height;
	return this.cacheOffsets();
}

/** Draw scaled sprite on active canvas at a location. */
jaws.Sprite.prototype.drawScaledAt = function(x, y, scale) {
	if (scale == 1)
		this.drawAt(x, y);
	else {
		this.setScale(scale);
		this.drawAt(x, y);
		this.setScale(1);
	}
}

/** Draw scaled sprite on active canvas centered at a location. */
jaws.Sprite.prototype.drawScaledCentered = function(x, y, scale) {
	if (scale == 1)
		this.drawCentered(x, y);
	else {
		this.setScale(scale);
		this.drawCentered(x, y);
		this.setScale(1);
	}
}