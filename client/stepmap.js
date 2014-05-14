/// <reference path="jquery.d.ts" />
/// <reference path="underscore.d.ts" />
/// <reference path="backbone.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var StepMapStep = (function () {
    function StepMapStep(project) {
        this.project = project;
        this.name = "Fill next step";
        this.deadline = new Date();
        this.sentreminders = 0;
    }
    StepMapStep.prototype.sendReminder = function () {
        //TODO:send e-mail
        this.sentreminders = this.sentreminders + 1;
        this.project.reminderSent();
    };
    return StepMapStep;
})();

var StepMapProject = (function (_super) {
    __extends(StepMapProject, _super);
    function StepMapProject() {
        _super.apply(this, arguments);
    }
    StepMapProject.prototype.defaults = function () {
        return {
            name: "defname",
            startdate: new Date(),
            nextstep: new StepMapStep(this),
            badpoint: 0,
            goodpoint: 1,
            completedsteps: new Array()
        };
    };

    StepMapProject.prototype.initialize = function () {
        if (!this.get("name")) {
            this.set({ "name": this.defaults().name });
        }
        if (!this.get("startdate")) {
            this.set({ "startdate": this.defaults().startdate });
        }
    };

    StepMapProject.prototype.reminderSent = function () {
        if (this.get("nextstep").sentreminders > 3) {
            this.set("badpoint", this.get("badpoint") + 1);
        }
        if (this.get("badpoint") > this.get("goodpoint") * 20) {
            this.terminate();
        }
    };

    StepMapProject.prototype.closeNextStep = function () {
        this.get("completedsteps").push(this.get("nextstep"));
        this.set("nextstep", new StepMapStep(this));
        this.set("goodpoint", this.get("goodpoint") + 1);
    };

    StepMapProject.prototype.terminate = function () {
        //TODO:send e-mail
    };
    return StepMapProject;
})(Backbone.Model);

var StepMapProjectView = (function (_super) {
    __extends(StepMapProjectView, _super);
    function StepMapProjectView(project) {
        this.events = { "click #terminate": this.terminate, "click #closeStep": this.closeStep };

        _super.call(this);
        this.project = project;

        this.template = _.template($('#project-template').html());
    }
    StepMapProjectView.prototype.terminate = function () {
        this.el.remove();
        var smnpv = new StepMapNewProjectView();
        $("#project-list").append(smnpv.render().el);
    };

    StepMapProjectView.prototype.closeStep = function () {
        this.project.closeNextStep();
        this.render();
    };

    StepMapProjectView.prototype.render = function () {
        try  {
            var diffInMs = new Date(Date.now()).getDate() - new Date(this.project.get("startdate")).getDate();
            var diffInDays = Math.ceil(diffInMs / (1000 * 3600 * 24));
            var templateData = { projectname: this.project.get("name"), nextstep: this.project.get("nextstep").name, deadline: this.project.get("nextstep").deadline, goods: this.project.get("goodpoint"), bads: this.project.get("badpoint"), days: diffInDays };

            this.$el.html(this.template(templateData));

            //            var td = $(this.content).find("#progress");
            var cs = this.project.get("completedsteps");
            var csl = 0;
            if (cs) {
                csl = cs.length * 10;
            }
            this.$("#progress").width(csl);
        } catch (ex) {
            var i = 0;
        }
        return this;
    };
    return StepMapProjectView;
})(Backbone.View);

var StepMapNewProjectView = (function (_super) {
    __extends(StepMapNewProjectView, _super);
    function StepMapNewProjectView() {
        this.events = { "click #newProject": this.createNewProject };

        _super.call(this);

        this.template = _.template($('#new-project-template').html());
    }
    StepMapNewProjectView.prototype.createNewProject = function () {
        try  {
            this.el.remove();
            var smpv = new StepMapProjectView(new StepMapProject());
            $("#project-list").append(smpv.render().el);
        } catch (ex) {
            var i = 0;
        }
    };

    StepMapNewProjectView.prototype.render = function () {
        var templateData = {};
        this.$el.html(this.template(templateData));

        return this;
    };
    return StepMapNewProjectView;
})(Backbone.View);

var StepMapApp = (function () {
    function StepMapApp() {
        var Projects = Backbone.Collection.extend({
            model: StepMapProject,
            url: 'http://localhost:8080/projects'
        });

        var coll = new Projects();

        coll.fetch({
            success: function () {
                for (var model in coll.models) {
                    var smpv = new StepMapProjectView(coll.models[model]);
                    this.$("#project-list").append(smpv.render().el);
                }

                for (var i = 0; i < 7 - coll.models.length; i++) {
                    var smnpv = new StepMapNewProjectView();
                    this.$("#project-list").append(smnpv.render().el);
                }
            }
        });
    }
    StepMapApp.prototype.addNewProject = function () {
    };
    return StepMapApp;
})();

$(function () {
    var app = new StepMapApp();
});
