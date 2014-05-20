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
            position: -1,
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
        if (!this.get("position")) {
            this.set({ "position": this.defaults().position });
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
        this.id = "projectposition" + project.get("position");
        this.events = <any>{ "click #terminate": this.terminate, "click #closeStep": this.closeStep};
        
        super();
        this.project = project;
        
        this.template = _.template($('#project-template').html());
    }
    
    terminate()
    {
        var smnpv = new StepMapNewProjectView(this.project.get("position"));
        $("#"+this.id).after(smnpv.render().el);
        this.el.remove(); 
        this.project.destroy();
    }
    
    closeStep()
    {
        this.project.closeNextStep();
        this.render(); 
        this.project.save();
    }
    
    render() : Backbone.View<StepMapProject> 
    {
        var cs = this.project.get("completedsteps");
        var csl = 0;
        if(cs)
        {
            csl = cs.length * 10;
        } 
        
        var diffInMs = new Date(Date.now()).getDate() - new Date(this.project.get("startdate")).getDate();
        var diffInDays = Math.ceil(diffInMs / (1000 * 3600 * 24)); 
        var templateData = { projectname: this.project.get("name"), progresswidth:csl, nextstep: this.project.get("nextstep").name, deadline: new Date(this.project.get("nextstep").deadline).toLocaleDateString(), goods: this.project.get("goodpoint"), bads: this.project.get("badpoint"), days: diffInDays };
        
        this.$el.html(this.template(templateData));

        return this;
    }
}

class StepMapNewProjectView extends Backbone.View<Backbone.Model>
{
    template: (data: any) => string;
    
    position: number;
    
    constructor(position : number) 
    {
        this.id = "newprojectposition" + position;
        this.events = <any>{ "click #newProject": this.createNewProject};
        super();
        this.position = position;
        this.template = _.template($('#new-project-template').html());
    }

    createNewProject() 
    { 
        var Project =  StepMapProject.extend({
                                            url:'http://localhost:8080/projects',
                                            idAttribute:'_id'});
        var project = new Project();
        project.set("position", this.position);
        var smpv = new StepMapProjectView(project);
        $("#"+this.id).after(smpv.render().el);
        this.el.remove();  
        project.save();
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

                for(var i=0;i<7;i++)
                {
                    try
                    {
                    var selectedItem = coll.models.filter(function(item){ if(item) return item.get("position") == i+1; else return false; });
                    if(selectedItem.length == 0)
                    {
                        var smnpv = new StepMapNewProjectView(i+1);
                        this.$("#project-list").append(smnpv.render().el);
                    }
                    else
                    {
                        for(var mp in selectedItem)
                        {
                          if(mp == 0)
                          {
                            var smpv = new StepMapProjectView(selectedItem[0]);
                            this.$("#project-list").append(smpv.render().el);  
                          }
                          else
                          {
                            selectedItem[mp].destroy();
                          }
                        }
                    }
                    }
                    catch(ex)
                    {
                        var x = 0;
                    }
                }   
            }
        });
    }
}

var app = new StepMapApp();