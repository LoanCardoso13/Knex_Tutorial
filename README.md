Knex Tutorial

Initialize project with nodemon (development) and express.

Install knex and postgres dependencies.

Create the knexfile:
npx knex init

Configure it. In this case, for Postgres: 

Create a Postgres database for your project. In this case it's knex_practice.

Migrations
Add to the knexfile a configuration for migrations:
migrations: {
      tableName: 'practice_migrations',
      directory: `${__dirname}/src/database/migrations`
    }
Now create the migration file:
npx knex migrate:make create_table_users

In the file that was created (within migrations directory) make the function assigned to exports.up return the following:
knex.schema.createTable('users', table => {
    table.increments('id');
    table.text('username').unique().notNullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
Make exports.down function return:
knex.schema.dropTable('users');

Now run:
npx knex migrate:latest

Seeding
Add to the knexfile a configuration for seeds:
seeds: {
      directory: `${__dirname}/src/database/seeds`
    }
Now create a seeds file:
npx knex seed:make 001_users

In the file that was created (within seeds directory) write the name of the table, users, in both places and insert 2 user names. For example:

exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {username: 'maykbrito'},
        {username: 'diegosf'}
      ]);
    });
};

Now run:
npx knex seed:run

In the database directory, create an index.js file to export knex: 
const knexfile = require('../../knexfile');
const knex = require('knex')(knexfile.development);

module.exports = knex

Import knex in server.js (?) and create a get route with a knex promise:
knex('users').then( results => {
    response.json(results);
});
Now, using an API design platform such as Insomnia or Postman, you can list all users.

Develop architecture:
1) create src/routes.js:
in server.js, add the following:
const routes = require('./routes');
app.use(routes)
in routes.js import express and knex and add:
const routes = express.Router();
routes.get('users', (request, response) => 
    knex('users').then( results => response.json(results))
)
module.exports = routes

2) In src/controllers/UserController.js :
import knex
module.exports = {
    async index(request, response) {
        const results = await knex('users');
        return response.json(results);
    }
}

In src/routes :
const UserController = require('./controller/UserController');
routes.get('/users', UserController.index);

Now it's a good idea to check the refactoring by using an API design platform such as Insomnia or Postman, to list all users and verify if still works as before.

