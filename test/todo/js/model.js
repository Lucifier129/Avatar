/**
* model.js
*/
var app = app || {};

(function(app) {

	var tools = app.tools

	function Model(name) {
		this.name = name
		this.todos = {}
	}

	Model.prototype = {

		find: function(id) {
			return this.todos[id]
		},

		add: function(todo) {
			this.todos[todo.id] = todo
		},

		remove: function(todo) {
			delete this.todos[todo.id]
		},

		save: function() {
			localStorage[this.name] = JSON.stringify(this.todos)
		}

	}

	app.Model = Model


}(app));