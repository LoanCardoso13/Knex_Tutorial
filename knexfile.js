// Update with your config settings.

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
