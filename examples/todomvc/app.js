var snabbdom = require('../../snabbdom.js');
var patch = snabbdom.init([
  require('../../modules/class'),
  require('../../modules/props'),
  require('../../modules/style'),
  require('../../modules/eventlisteners'),
]);
var h = require('../../h.js');
var vdomPatchLive = require('vdom-patch-live');

var patchSnabbdom = function(render, patchData) {
    if(!patchData.domElement) {
        patchData.domElement = document.createElement("div");
        patchData.vNode = patch(patchData.domElement, h("div", [render(h)]));
        document.getElementById("container").appendChild(patchData.domElement);
    } else {
        patchData.vNode = patch(patchData.vNode, h("div", [render(h)]));
    }
    return patchData;
};

var TodoApp = {
    viewModel: require("./viewModel"),

    view: function () {
        var vm = this.viewModel;
		vm.todoStore.init();

        return function (h) {
            var todoStore = vm.todoStore;
            var todoExists = todoStore.todos.length > 0;

            var appNodes = [
                h("header.header", [
                    h("h1", ["todos"]),
                    h("input#new-todo.new-todo", {
                        props: {
                            "placeholder": "What needs to be done?",
                            "autofocus": ""
                        },
                        on: {
                            keyup: function (e) {
                                vm.addTodo(e, e.target);
                            }
                        }
                    })
                ])
            ];
            if (todoExists) {
                appNodes.push(h("section.main", [
                    h("input.toggle-all", {
                        props: {
                            "type": "checkbox",
                            "checked": todoStore.allCompleted()
                        },
                        on: {
                            click: function (e) {
                                todoStore.setAllTo(e.target)
                            }
                        }
                    }),
                    h("ul.todo-list", todoStore.todos.map(function (todo) {
                        return h("li", {
                            props: {className: [todo.completed ? "completed" : "", todo.editing ? "editing" : ""].join(" ")}
                        }, [
                            h("div.view", [
                                h("input.toggle", {
                                    props: {"type": "checkbox", checked: todo.completed},
                                    on: {
                                        click: function () {
                                            vm.toggleCompletion(todo.uid)
                                        }
                                    }
                                }),
                                h("label", {
                                    on: {
                                        dblclick: function () {
                                            vm.editTodo(todo);
                                        }
                                    }
                                }, todo.title),
                                h("button.destroy", {
                                    on: {
                                        click: function () {
                                            vm.remove(todo.uid);
                                        }
                                    }
                                })
                            ]),
                            todo.editing ? h("input.edit", {
                                props: {value: todo.title},
                                on: {
                                    blur: function (e) {
                                        vm.stopEditing(todo, e.target);
                                    },
                                    keyup: function (e) {
                                        if (e.keyCode == 13) {
                                            vm.updateEditingTodo(e.target, todo);
                                        }
                                        else if (e.keyCode == 27) {
                                            vm.cancelEditingTodo(todo);
                                        }
                                    }
                                }
                            }) : h("span")
                        ]);
                    }))
                ]));
                if (todoStore.getCompleted().length > 0) {
                    appNodes.push(h("footer.footer", [
                        h("span.todo-count", [h("strong", todoStore.getRemaining().length), todoStore.getRemaining().length == 1 ? 'item' : 'items' + ' left']),
                        h("button.clear-completed", {
                            on: {
                                click: function () {
                                    vm.removeCompleted();
                                }
                            }
                        }, ["Clear completed"])
                    ]));
                }
            }

            return h("section.todoapp", appNodes);
        }
    }
};

window.addEventListener('DOMContentLoaded', function () {
	vdomPatchLive(patchSnabbdom, function (renderLive) {
        renderLive(TodoApp.view());
	});
});
