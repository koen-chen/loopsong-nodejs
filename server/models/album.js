module.exports = require('mongoose').Schema({
	type: String,
	title: String,
	published: String,
	company: String,
	author: String,
	detail: String,
	trackList: Array,
	cover: String,
	tags: Array,
	likes: Number,
	collects: Array,
	shares: Array,	
	comments: Array,
	links: {
		taobao: String,
		douban: String,
		xiami: String,
		kuwo: String
	},
	creater: String,
	create_at: Number,
	update_at: Number
});