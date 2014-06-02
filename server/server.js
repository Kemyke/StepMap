var restify = require('restify');  
var server = restify.createServer();
server.use(restify.bodyParser());

var mongoose = require('mongoose/');
var config = require('./config');
db = mongoose.connect(config.creds.mongoose_auth_local),
Schema = mongoose.Schema;  

// Create a schema for our data
var ProjectSchema = new Schema({
  position: Number,
  name: String,
  startdate: Date,    
  goodpoint: Number,
  badpoint: Number,
  nextstep: 
	   {
		  name: String,
		  deadline: Date,    
		  sentreminders: Number,
		  projectid: Number
	   },
  completedsteps: 
	   {
		  name: String,
		  deadline: Date,
	          finishdate: Date,    
		  sentreminders: Number,
		  projectid: Number
	   }

});
// Use the schema to register a model with MongoDb
mongoose.model('Project', ProjectSchema); 
var Project = mongoose.model('Project'); 

function getProjects(req, res, next) {
  // Resitify currently has a bug which doesn't allow you to set default headers
  // This headers comply with CORS and allow us to server our response to any origin
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // .find() without any arguments, will return all results
  // the `-1` in .sort() means descending order
  
  var ps = Project.find().sort('id');

  if(ps)
  {  
    ps.exec(function (arr,data) {
      res.send(data);
  	});
  }
  else
  {
   res.send("nothing");
  }
}

function postProject(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // Create a new message model, fill it up and save it to Mongodb
  var project = new Project();
  project.id = req.params.id;
  project.name = req.params.name;
  project.position = req.params.position;
  project.startdate = req.params.startdate;
  project.badpoint = req.params.badpoint;
  project.goodpoint = req.params.goodpoint;
  project.nextstep = req.params.nextstep;
  project.completedsteps = req.params.completedsteps;
  project.save(function () {
    res.send(project);
  });
}

function delProject(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "X-Requested-With");
	  // Create a new message model, fill it up and save it to Mongodb
	  
	  var project = Project.find({_id: req.params._id});
	  
	  project.remove(function () {
	    res.send(req.body);
	  });
	}

function putProject(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "X-Requested-With");
	  // Create a new message model, fill it up and save it to Mongodb
	  Project.findOne({_id: req.params._id}, function(err, mymodel) {
		  mymodel.id = req.params.id;
		  mymodel.name = req.params.name;
		  mymodel.position = req.params.position;
		  mymodel.startdate = req.params.startdate;
		  mymodel.badpoint = req.params.badpoint;
		  mymodel.goodpoint = req.params.goodpoint;
		  mymodel.nextstep = req.params.nextstep;
		  mymodel.completedsteps = req.params.completedsteps;
		  mymodel.save(function () {
	    res.send(req.body);
	  });
	});
}

function putProjectsWTF(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "X-Requested-With");
	  
	  res.send(req.body);
}

// Set up our routes and start the server
server.get('/projects', getProjects);
server.post('/projects', postProject);
server.del('/projects/:_id', delProject);
server.put('/projects/:_id', putProject);
server.put('/projects/', putProjectsWTF);
server.listen(8080);

