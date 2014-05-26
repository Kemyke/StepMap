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
    function StepMapStep() {
        this.name = "Fill next step";
        this.deadline = new Date();
        this.sentreminders = 0;
    }
    StepMapStep.prototype.sendReminder = function () {
        //TODO:send e-mail
        this.sentreminders = this.sentreminders + 1;
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
            position: -1,
            startdate: new Date(),
            nextstep: new StepMapStep(),
            badpoint: 0,
            goodpoint: 1,
            completedsteps: new Array()
        };
    };

    StepMapProject.prototype.initialize = function () {
        this.idAttribute = "_id";

        if (!this.get("name")) {
            this.set({ "name": this.defaults().name });
        }
        if (!this.get("startdate")) {
            this.set({ "startdate": this.defaults().startdate });
        }
        if (!this.get("nextstep")) {
            this.set({ "nextstep": this.defaults().nextstep });
        }
        if (!this.get("badpoint")) {
            this.set({ "badpoint": this.defaults().badpoint });
        }
        if (!this.get("badpoint")) {
            this.set({ "badpoint": this.defaults().badpoint });
        }
        if (!this.get("completedsteps")) {
            this.set({ "completedsteps": this.defaults().completedsteps });
        }
        if (!this.get("position")) {
            this.set({ "position": this.defaults().position });
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
        this.set("nextstep", new StepMapStep());
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
        this.id = "projectposition" + project.get("position");
        this.events = {
            "click #terminate": this.terminate,
            "click #closeStep": this.closeStep,
            "dblclick #project-name": this.editProjectName,
            "blur .project-name-input": this.closeEditProjectName,
            "dblclick #nextStep": this.editNextStepName,
            "blur .nextstep-name-input": this.closeEditNextStepName
        };

        _super.call(this);
        this.project = project;

        this.template = _.template($('#project-template').html());

        _.bindAll(this, 'render');
        this.project.bind('change', this.render);
    }
    StepMapProjectView.prototype.editNextStepName = function () {
        this.$('.step').addClass("editing");
        this.$('.nextstep-name-input').focus();
    };

    StepMapProjectView.prototype.closeEditNextStepName = function () {
        this.project.save({ "nextstep": { "name": this.$('.nextstep-name-input').val() } });
        this.$('.step').removeClass("editing");
    };

    StepMapProjectView.prototype.editProjectName = function () {
        this.$('.project').addClass("editing");
        this.$('.project-name-input').focus();
    };

    StepMapProjectView.prototype.closeEditProjectName = function () {
        this.project.save({ name: this.$('.project-name-input').val() });
        this.$('.project').removeClass("editing");
    };

    StepMapProjectView.prototype.terminate = function () {
        var smnpv = new StepMapNewProjectView(this.project.get("position"));
        $("#" + this.id).after(smnpv.render().el);
        this.el.remove();
        this.project.destroy();
    };

    StepMapProjectView.prototype.closeStep = function () {
        this.project.closeNextStep();
        this.render();
        this.project.save();
    };

    StepMapProjectView.prototype.render = function () {
        var cs = this.project.get("completedsteps");
        var csl = 0;
        if (cs) {
            csl = cs.length * 10;
        }

        var diffInMs = new Date(Date.now()).getDate() - new Date(this.project.get("startdate")).getDate();
        var diffInDays = Math.ceil(diffInMs / (1000 * 3600 * 24));
        var templateData = { projectname: this.project.get("name"), progresswidth: csl, nextstep: this.project.get("nextstep").name, deadline: new Date(this.project.get("nextstep").deadline).toLocaleDateString(), goods: this.project.get("goodpoint"), bads: this.project.get("badpoint"), days: diffInDays };

        this.$el.html(this.template(templateData));

        return this;
    };
    return StepMapProjectView;
})(Backbone.View);

var StepMapNewProjectView = (function (_super) {
    __extends(StepMapNewProjectView, _super);
    function StepMapNewProjectView(position) {
        this.id = "newprojectposition" + position;
        this.events = { "click #newProject": this.createNewProject };
        _super.call(this);
        this.position = position;
        this.template = _.template($('#new-project-template').html());
    }
    StepMapNewProjectView.prototype.createNewProject = function () {
        var Project = StepMapProject.extend({
            url: 'http://localhost:8080/projects',
            idAttribute: '_id' });
        var project = new Project();
        project.set("position", this.position);
        var smpv = new StepMapProjectView(project);
        $("#" + this.id).after(smpv.render().el);
        this.el.remove();
        project.save();
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
            model: StepMapProject.extend({ idAttribute: '_id' }),
            url: 'http://localhost:8080/projects'
        });

        var coll = new Projects();

        coll.fetch({
            success: function () {
                for (var i = 0; i < 7; i++) {
                    try  {
                        var selectedItem = coll.models.filter(function (item) {
                            if (item)
                                return item.get("position") == i + 1;
                            else
                                return false;
                        });
                        if (selectedItem.length == 0) {
                            var smnpv = new StepMapNewProjectView(i + 1);
                            this.$("#project-list").append(smnpv.render().el);
                        } else {
                            for (var mp in selectedItem) {
                                if (mp == 0) {
                                    var smpv = new StepMapProjectView(selectedItem[0]);
                                    this.$("#project-list").append(smpv.render().el);
                                } else {
                                    selectedItem[mp].destroy();
                                }
                            }
                        }
                    } catch (ex) {
                        var x = 0;
                    }
                }
            }
        });
    }
    return StepMapApp;
})();

var app = new StepMapApp();
