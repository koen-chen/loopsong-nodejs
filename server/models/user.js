module.exports = require('mongoose').Schema({
	username: String,
	email: String,
    password: String,
	role: String,
	create_at: { type: Date, default: Date.now },
	update_at: { type: Date, default: Date.now }
});