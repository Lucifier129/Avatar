/**
* controller.js
*/

var app = app || {};

(function (app) {

	var tools = app.tools
	var ENTER_KEY = 13
	var ESCAPE_KEY = 27

	function Controller(View, Model) {
		this.View = View
		this.model = new Model()
	}

	Controller.prototype.listen = function() {

		var that = this

		var isFocusing = false

		function focus() {
			isFocusing = true 
		}

		function blur() {
			isFocusing = false
		}

		tools.$listen('focus', '#new-todo', focus)

 		tools.$listen('blur', '#new-todo', blur)

 		tools.$listen('focus', '.edit', focus)

 		tools.$listen('blur', '.edit', blur)

 		tools.$listen('keyup', '#new-todo', function(e) {

 			if (e.keyCode !== ESCAPE_KEY || !isFocusing) {
 				return
 			}

 			var value = this.value

 			if (!value || value === this.defaultValue) {
 				return
 			}

 			that.model.add({
 				id: new Date().getTime(),
 				completed: false,
 				title: value
 			})
 		})

 		tools.$listen('keyup', '.edit', function(e) {
 			var keyCode = e.keyCode

 			if ((keyCode !== ESCAPE_KEY && keyCode !== ESCAPE_KEY) || !isFocusing) {
 				return
 			}

 			//TODO

 		})
	}

}(app));