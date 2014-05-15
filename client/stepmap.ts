/// <reference path="jquery.d.ts" />
/// <reference path="underscore.d.ts" />
/// <reference path="backbone.d.ts" />

class StepMapStep 
{
    name : string;
    deadline : Date;
    sentreminders: number;
    
    constructor() {
            this.name = "Fill next step";
            this.deadline = new Date();
            this.sentreminders = 0;
    }
        
    sendReminder()
    {
        //TODO:send e-mail
        this.sentreminders = this.sentreminders + 1;
    }
}

class StepMapProject extends Backbone.Model 
{      
    defaults() {
        return {
            name: "defname",
            startdate: new Date(),
            nextstep: new StepMapStep(),
            badpoint: 0,
            goodpoint: 1,
            completedsteps: new Array<StepMapStep>()
        }
    }
    
    initialize() {
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
    }
    

    reminderSent()
    {
        if(this.get("nextstep").sentreminders > 3)
        {
            this.set("badpoint", this.get("badpoint") + 1);
        }
        if(this.get("badpoint") > this.get("goodpoint") * 20)
        {
            this.terminate();
        }  
    }

    closeNextStep()
    {
        this.get("completedsteps").push(this.get("nextstep"));
        this.set("nextstep", new StepMapStep());
        this.set("goodpoint", this.get("goodpoint") + 1);
    }
    
    terminate()
    {
        //TODO:send e-mail
    }
}

class StepMapProjectView extends Backbone.View<StepMapProject>
{
    template: (data: any) => string;
    project : StepMapProject;
    
    constructor(project: StepMapProject) 
    {
        this.events = <any>{ "click #terminate": this.terminate, "click #closeStep": this.closeStep};
        
        super();
        this.project = project;
        
        this.template = _.template($('#project-template').html());
    }
    
    terminate()
    {
        this.el.remove(); 
        var smnpv = new StepMapNewProjectView();
        $("#project-list").append(smnpv.render().el);
        app.removeProject(this.project);
    }
    
    closeStep()
    {
        this.project.closeNextStep();
        this.render(); 
    }
    
    render() : Backbone.View<StepMapProject> 
    {
        try
        {
            var diffInMs = new Date(Date.now()).getDate() - new Date(this.project.get("startdate")).getDate();
            var diffInDays = Math.ceil(diffInMs / (1000 * 3600 * 24)); 
            var templateData = { projectname: this.project.get("name"), nextstep: this.project.get("nextstep").name, deadline: this.project.get("nextstep").deadline, goods: this.project.get("goodpoint"), bads: this.project.get("badpoint"), days: diffInDays };
            
            this.$el.html(this.template(templateData));

//            var td = $(this.content).find("#progress");
            var cs = this.project.get("completedsteps");
            var csl = 0;
            if(cs)
            {
                csl = cs.length * 10;
            } 
            this.$("#progress").width(csl);

        }
        catch(ex)
        {
            var i = 0;
        }
        return this;
    }
}

class StepMapNewProjectView extends Backbone.View<Backbone.Model>
{
    template: (data: any) => string;
    
    constructor() 
    {
        this.events = <any>{ "click #newProject": this.createNewProject};
        super();
        
        this.template = _.template($('#new-project-template').html());
    }

    createNewProject() 
    { 
        this.el.remove();  
        var Project =  StepMapProject.extend({
                                            url:'http://localhost:8080/projects',
                                            idAttribute:'_id'});
        var project = new Project();
        var smpv = new StepMapProjectView(project);
        $("#project-list").append(smpv.render().el);
        app.addNewProject(project);
    }
    
    render() : Backbone.View<Backbone.Model> 
    {
        var templateData = { };
        this.$el.html(this.template(templateData));
        
        return this;
    }
}

class StepMapApp
{
    constructor()
    {
        var Projects = Backbone.Collection.extend({
                    model:StepMapProject.extend({idAttribute:'_id'}),
                    url:'http://localhost:8080/projects',
        
                });
            
        var coll = new Projects();
        
        coll.fetch({success: function(){
                for(var model in coll.models)
                {
                  var smpv = new StepMapProjectView(coll.models[model]);
                  this.$("#project-list").append(smpv.render().el);  
                }
            
                for(var i=0;i<17 - coll.models.length;i++)
                {
                    var smnpv = new StepMapNewProjectView();
                    this.$("#project-list").append(smnpv.render().el);
                }   
            }
        });
    }
    
    addNewProject(project : StepMapProject)
    {     
        project.save();       
    }
    
    removeProject(project : StepMapProject)
    {
        project.destroy();
    }
}

var app = new StepMapApp();