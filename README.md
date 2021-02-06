<h1 align='center'>KnexJS Tutorial</h1>

This tutorial makes use of global installations of NodeJS and Postgres. An API design platform such as Insomnia or Postman is highly recommended. We will create an API that shall have users CRUD and projects owned by users.

You should have a Postgres user with a password in your machine (you may refer to a Postgres tutorial for that). Commonly the user name is postgres. Create a database for your project. In this case it's knex_practice database. Initialize the project in your root directory by running: 

```bash
npm init -y
```

Install nodemon as a development dependency:


```bash
npm i nodemon -D
```

If using git make sure you add a .gitignore file containing:

```bash
node_modules/
```

Install the project's dependencies:

```bash
npm i knex pg express
```

Create an src folder and server.js file within it. configure your package.json to have:

```bash
"main": "src/server.js",
  "scripts": {
    "start": "nodemon src/server.js"
  },
```

In your server.js file, write:

```bash
const express = require('express');
const app = express();

app.listen(3333, () => {
    console.log('server is running');
});
```

To run your server, preferably at a dedicated terminal:

```bash
npm start
```

Create the knexfile.js at the root by running the command:

```bash
npx knex init
```

In knexfile.js you may delete staging and production entries. Configuring the development entry for Postgres: 


```bash
  development: {
    client: 'pg',
    connection: {
      user: 'postgres',
      password: '0000',
      database: 'knex_practice'
    },
```

<h1>Migrations</h1>

Add to the knexfile a configuration for migrations:

```bash
migrations: {
      directory: `${__dirname}/src/database/migrations`
    }
```

It will ensure a database directory is created. It will contain a migrations folder and an automatically generated migration file after you run the following command:

```bash
npx knex migrate:make create_table_users
```

In the generated file the function assigned to exports.up should return the following:

```bash
knex.schema.createTable('users', table => {
    table.increments('id');
    table.text('username').unique().notNullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
```

While exports.down function should return:

```bash
knex.schema.dropTable('users');
```

In the end the file ending with "..._create_table_users.js" should be contain the code:

```bash

exports.up = knex => knex.schema.createTable('users', table => {
    table.increments('id');
    table.text('username').unique().notNullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
});

exports.down = knex => knex.schema.dropTable('users');
```

This is the purpose of KnexJS: to substitute raw SQL language by JavaScript and make it generalizable to all kinds of SQL languages. So someone running a database in sqlite3 can share code without much ado with another person that runs it in MySQL, for instance.

Now run:

```bash
npx knex migrate:latest
```

You should have a users table in your database. You may log into your Postgres user and check the tables of your database to confirm (you may refer to a Postgres tutorial for that).

<h1>Seeding</h1>

Now it's time to populate the table we created. Add to the knexfile a configuration for seeds:

```bash
seeds: {
      directory: `${__dirname}/src/database/seeds`
    }
```

Now create a seeds file:

```bash
npx knex seed:make 001_users
```

The digits are important to keep the seed files in the correct order, this time Knex doesn't do automatically for us such as when creating the migration file. In the file that was created (within seeds directory), "001_users.js", write the name of the table, "users", in both places and insert 2 user names of your preference. For example:

```bash
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {username: 'Joe'},
        {username: 'Junior'}
      ]);
    });
};
```

Now run:

```bash
npx knex seed:run
```

You should now have the user names you chose (here 'Joe' and 'Junior') in your table. You may log into your Postgres user and check to confirm (you may refer to a Postgres tutorial for that).

***
<br>

Now let's work on the structure of our project's files. In the database directory, create an index.js file to export knex:

```bash
const knexfile = require('../../knexfile');
const knex = require('knex')(knexfile.development);

module.exports = knex;
```
We will import knex and create a get route (/users) that connects to our knex through a promise and list the users of our table. The resulting server.js should look like this:

```bash
const express = require('express');
const knex = require('knex');

const app = express();

app.get('/users', (request, response) => {
    knex('users').then( results => response.json(results));
});

app.listen(3333, () => {
    console.log('server is running');
});
```

Now, with Insomnia or Postman, you can list all users.

Let's refine our software architecture. Within src folder (same folder that contains server.js) we create a routes.js file with the following code:

```bash
const express = require('express');
const knex = require('knex');

const routes = express.Router();

routes.get('/users', (request, response) => {
    knex('users').then( results => response.json(results));
});

module.exports = routes;
```

Your server.js file should change accordingly:

```bash
const express = require('express');
const routes = require('./routes');

const app = express();

app.use(routes);

app.listen(3333, () => {
    console.log('server is running');
});
```

Now let's create a controllers directory inside src folder for the callback functions of our routes. Inside controllers we write a UserController.js containing the following:

```bash
const knex = require('../database');

module.exports = {
    async index(request, response) {
        const results = await knex('users');

        return response.json(results);
    },
}
```

Your routes.js file should change accordingly:

```bash
const express = require('express');
const routes = express.Router();

const UserController = require('./controllers/UserController');

routes
    .get('/users', UserController.index)


module.exports = routes;
```

Now it's a good idea to check the refactoring by using an API design platform (such as Insomnia or Postman), to list all users and verify if still works as before.

***

Hereon we will finalize the CRUD functionalities. Let's first habilitate JSON reading in our server. add the following to our app.use section of code:

```bash
app.use(express.json());
```

In the UserController.js file, we add our second function assigned to module.exports:

```bash
async create(request, response, next) {

    const { username } = request.body;

    await knex('users').insert({
        username
    });
},
```

Improving our code, for dealing with errors, we may add a try & catch feature:

```bash
async create(request, response, next) {
    try {
        const { username } = request.body;

        await knex('users').insert({
            username
        });

        return response.status(201).send();
    } catch (error) {
        next(error);
    }
},
```

Let's go ahead and keep a "catch all" errors feature in our server:

```bash
app.use((error,request,response,next) => {
    response.status(error.status || 500);
    response.json( {error: error.message} );
});
```

In your routes.js file add:

```bash
routes
    .get('/users', UserController.index)
    .post('/users', UserController.create)
```

Our create user route is done. We can test it, along with the errors treatments in Insomnia or Postman. 

Now let's build the update route. In the UserController.js file, we add our third function assigned to module.exports:

```bash
async update(request, response, next) {
    try {
        const {username} = request.body;
        const {id} = request.params;

        await knex('users')
            .update({username})
            .where({id})

        return response.send();

    } catch (error) {
        next(error);
    }
},
```

Whereas in routes.js we add:

```bash
routes
    .get('/users', UserController.index)
    .post('/users', UserController.create)
    .put('/users/:id', UserController.update)
```

Testing this route (with Insomnia) we choose the id to update by the end of the http address, for instance, the following will update user 2:

```bash
http://localhost:3333/users/2
```

To finish our CRUD we create the delete route. In the UserController.js file, we add our fourth function assigned to module.exports:

```bash
async delete(request, response, next) {
    try {
        const {id} = request.params;

        await knex('users')
            .where({id})
            .del()

        return response.send();
    } catch (error) {
        next(error);   
    }
}
```

Routes.js becomes:

```bash
routes
    .get('/users', UserController.index)
    .post('/users', UserController.create)
    .put('/users/:id', UserController.update)
    .delete('/users/:id', UserController.delete)
```

Again we can test it in Insomnia making sure to add, by the end of the http address, the number referring to the id we want to delete. 

***

Now, to create a projects table, run:

```bash
npx knex migrate:make create_projects_table
```

We create this table relating users to projects as 1 to n, that is, each user might have many projects. The code of the newly generated file then should be:

```bash
exports.up = knex => knex.schema.createTable('projects', table => {
    table.increments('id');
    table.text('title');

    table.integer('user_id')
        .references('users.id')
        .notNullable()
        .onDelete('CASCADE');

    table.timestamp(true, true);
});

exports.down = knex => knex.schema.dropTable('projects');
```

It is tied to the users table in a way that each user may have many projects and the on delete cascade feature ensures that if user is deleted then his projects are as well. Table's timestamp is written differently but should behave similarly. To migrate we run:

```bash
npx knex migrate:latest
```

Now create the seed file:

```bash
npx knex seed:make 002_projects
```

Edit so it becomes:

```bash
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('projects').del()
    .then(function () {
      // Inserts seed entries
      return knex('projects').insert([
        {
          user_id: 2,
          title: "my project"
        }
      ]);
    });
};
```

Choose an id that exists in your database. In this case I chose 2, but yours could be different. Running the seed file we should be careful not to erase the previous user. Knex automatically runs 001_users if you do not specify otherwise. This would delete and create new users. So run the command:

```bash
npx knex seed:run --specific 002_projects
```

We now write a ProjectController.js file with the content:

```bash
const knex = require('../database');

module.exports = {
    async index(request, response, next) {
        try {
            const results = await knex('projects');

            return response.json(results);
        } catch (error) {
            next(error);        
        }
    },
}
```

And change our routes.js file accordingly:

```bash
const express = require('express');
const routes = express.Router();

const UserController = require('./controllers/UserController');
const ProjectController = require('./controllers/ProjectController');

routes
    .get('/users', UserController.index)
    .post('/users', UserController.create)
    .put('/users/:id', UserController.update)
    .delete('/users/:id', UserController.delete)

    .get('/projects', ProjectController.index);

module.exports = routes;
```

***

We can still refine our back-end. By adding the following code to our index function of the ProjectController.js file:

```bash
async index(request, response, next) {
    try {
        const { user_id } = request.query;

        const query = knex('projects');

        if (user_id) {
            query.where({ user_id })
        }

        results = await query;

        return response.json(results);
    } catch (error) {
        next(error);        
    }
},
```

We can list projects from specific users through the http address by writing its number in the address itself. For instance, this request:

```bash
http://localhost:3333/projects?user_id=3
```

Will list only the projects of user with id 3. It could be interesting to return the name of the user as well. For that we edit our if clause inside index function in ProjectController.js to:

```bash
if (user_id) {
    query
        .where({ user_id })
        .join('users', 'users.id', '=', 'projects.user_id')
        .select('projects.*', 'users.username');
}
```

Checking with Insomnia we'll see the username being returned as well.

To create new projects we add in module.exports function of ProjectController.js: 

```bash
async create(request, response, next) {
    try {
        const {title, user_id} = request.body;

        await knex('projects').insert({
            title,
            user_id
        });

        return response.status(201).send();
    } catch (error) {
        next(error);
    }
}
```

And provide the route:

```bash
routes
    .get('/users', UserController.index)
    .post('/users', UserController.create)
    .put('/users/:id', UserController.update)
    .delete('/users/:id', UserController.delete)

    .get('/projects', ProjectController.index)
    .post('/projects', ProjectController.create)
```

Turn on Insomnia and create many projects for one user. You may then list the projects for this user, as explained above, and be filled with a screen full of clone projects - as many as you clicked the button. It would be a good idea to add pages for easiness of consulting the data. To do this we extract the page variable in our query at index function of ProjectController.js, while leaving the default value of 1. We also limit the appearances per page and create offset accordingly:

```bash
async index(request, response, next) {
    try {
        const { user_id, page = 1 } = request.query;

        const query = knex('projects')
            .limit(5)
            .offset((page - 1) * 5)

        if (user_id) {
            query
                .where({ user_id })
                .join('users', 'users.id', '=', 'projects.user_id')
                .select('projects.*', 'users.username');
        }

        results = await query;

        return response.json(results);
    } catch (error) {
        next(error);        
    }
},
```

Now by including the page number at the http request we control paging. This will get id's from 6 to 10 (if available):

```bash
http://localhost:3333/projects?page=2
```

You may count the number of projects and send it as a header:

```bash
async index(request, response, next) {
    try {
        const { user_id, page = 1 } = request.query;

        const countObj = knex('projects').count();

        const query = knex('projects')
            .limit(5)
            .offset((page - 1) * 5)

        if (user_id) {
            query
                .where({ user_id })
                .join('users', 'users.id', '=', 'projects.user_id')
                .select('projects.*', 'users.username');

            countObj
                .where({user_id});
        }

        const [count] = await countObj;
        response.header('X-Total-Count', count["count"]);

        results = await query;

        return response.json(results);
    } catch (error) {
        next(error);        
    }
},
```

***

To make create a soft delete feature we first make a new migration file:

```bash
npx knex migrate:make add_column_deleted_at_to_users
```

Edit it to alter the users table with the timestamp of deletion:

```bash
exports.up = knex => knex.schema.alterTable('users', table => {
    table.timestamp('deleted_at');
});

exports.down = knex => knex.schema.alterTable('users', table => {
    table.dropColumn('deleted_at');
});
```

Now run the migration:

```bash
npx knex migrate:latest
```

Now we need to change the UserController.js in order not to actually delete a data instance when the user deletes it, but instead updating it with our deletion stamp. The new delete function then becomes:

```bash
async delete(request, response, next) {
    try {
        const {id} = request.params;

        await knex('users')
            .where({id})
            .update('deleted_at', new Date())
            // .del()

        return response.send();
    } catch (error) {
        next(error);   
    }
}
```

You may check with Insomnia that the users' "deleted_at" flag toggles between null (when the user have not been deleted) and the stamp with the time of deletion. We then change the index function of UserController.js in order not to list users stamped with deletion:

```bash
async index(request, response) {
    const results = await knex('users')
        .where('deleted_at', null);

    return response.json(results);
},
```

You can check with Insomnia that listing users doesn't show those softly deleted. We still need to make changes to regard for the on delete cascade feature that ensured projects couldn't exist without users. To do that we change index function of ProjectController.js to add a condition in our query:

```bash
async index(request, response, next) {
    try {
        const { user_id, page = 1 } = request.query;

        const countObj = knex('projects').count();

        const query = knex('projects')
            .limit(5)
            .offset((page - 1) * 5)

        if (user_id) {
            query
                .where({ user_id })
                .join('users', 'users.id', '=', 'projects.user_id')
                .select('projects.*', 'users.username')
                .where('users.deleted_at', null);

            countObj
                .where({user_id});
        }

        const [count] = await countObj;
        response.header('X-Total-Count', count["count"]);

        results = await query;

        return response.json(results);
    } catch (error) {
        next(error);        
    }
},
```

***

There's something to be perfected in our back-end. If you update a user name you'll see the updated_at flag doesn't change. To fix it we'll use procedures and triggers. 

We start by creating a new migrate:

```bash
npx knex migrate:make add_custom_functions
```

We then rename the newly created migration file, changing the date represented by the numbers to be one month older, for instance, in order to put it on top of our migrations folder. We also edit it with raw SQL queries so that it becomes:

```bash
const CUSTOM_FUNCTIONS = `
CREATE OR REPLACE FUNCTION on_update_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
`

const DROP_CUSTOM_FUNCTIONS = `
DROP FUNCTION on_update_timestamp()
`

exports.up = async knex => knex.raw(CUSTOM_FUNCTIONS)
exports.down = async knex => knex.raw(DROP_CUSTOM_FUNCTIONS)
```

But we need to reset our database since we didn't have this file when we started:

```bash
npx knex migrate:rollback --all
```

And run migrations it again:

```bash
npx knex migrate:latest
```

All your users have been deleted. Seed it again:

```bash
npx knex seed:run
```

Change knexfile.js to:

```bash
module.exports = {

  development: {
    client: 'pg',
    version: '8.5.1',
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: '0000',
      database: 'knex_practice'
    },
    migrations: {
      tableName: 'practice_migrations',
      directory: `${__dirname}/src/database/migrations`
    },
    seeds: {
      directory: `${__dirname}/src/database/seeds`
    }
  },
  onUpdateTrigger: table => `
  CREATE TRIGGER ${table}_updated_at
  BEFORE UPDATE ON ${table}
  FOR EACH ROW
  EXECUTE PROCEDURE on_update_timestamp();
  `
};
```

The create user table migration then becomes:

```bash
const { onUpdateTrigger } = require("../../../knexfile");

exports.up = async knex => knex.schema.createTable('users', table => {
    table.increments('id');
    table.text('username').unique().notNullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
}).then(() => knex.raw(onUpdateTrigger('users')));

exports.down = async knex => knex.schema.dropTable('users');
```

And project table migration similarly:

```bash
const { onUpdateTrigger } = require("../../../knexfile");

exports.up = async knex => knex.schema.createTable('projects', table => {
    table.increments('id');
    table.text('title');

    table.integer('user_id')
        .references('users.id')
        .notNullable()
        .onDelete('CASCADE');

    table.timestamp(true, true);
}).then(() => knex.raw(onUpdateTrigger('projects')));

exports.down = async knex => knex.schema.dropTable('projects');
```

Running the commands:

```bash
npx knex migrate:rollback --all
npx knex migrate:latest
npx knex seed:run
```

Now the updated_at flag will reflect updated performed, using Insomnia with the update user and list users routes created you can check that. 