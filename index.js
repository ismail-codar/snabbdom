module.exports = {
	patch: require('./snabbdom.js').init([
		require("./modules/props.js"),
		require("./modules/attributes.js"),
		require("./modules/class.js"),
		require("./modules/style.js"),
		require("./modules/eventlisteners.js")
	]),
	h: require("./h.js"),
	thunk: require("./thunk.js")
}