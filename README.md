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

```
async create(request, response, next) {

    const { username } = request.body;

    await knex('users').insert({
        username
    });
},
```

Improving our code, for dealing with errors, we may add a try & catch feature:

```
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

```
app.use((error,request,response,next) => {
    response.status(error.status || 500);
    response.json( {error: error.message} );
});
```

In your routes.js file add:

```
routes
    .get('/users', UserController.index)
    .post('/users', UserController.create)
```

Our create user route is done. We can test it, along with the errors treatments in Insomnia or Postman. 

Now let's build the update route. In the UserController.js file, we add our third function assigned to module.exports:

```
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

```
routes
    .get('/users', UserController.index)
    .post('/users', UserController.create)
    .put('/users/:id', UserController.update)
```

Testing this route (with Insomnia) we choose the id to update by the end of the http address, for instance, the following will update user 2:

```
http://localhost:3333/users/2
```

To finish our CRUD we create the delete route. In the UserController.js file, we add our fourth function assigned to module.exports:

```
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

```
routes
    .get('/users', UserController.index)
    .post('/users', UserController.create)
    .put('/users/:id', UserController.update)
    .delete('/users/:id', UserController.delete)
```

Again we can test it in Insomnia making sure to add, by the end of the http address, the number referring to the id we want to delete. 

***

