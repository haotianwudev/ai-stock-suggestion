const { ApolloServer } = require('apollo-server');
const dotenv = require('dotenv');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const db = require('./db');

// Load environment variables
dotenv.config();

// Verify database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Initialize the Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: { db },
      introspection: true,
      playground: true,
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        // Return a sanitized error to the client
        return {
          message: error.message,
          locations: error.locations,
          path: error.path
        };
      }
    });

    // Start the server
    const PORT = process.env.PORT || 4000;
    const { url } = await server.listen(PORT);
    console.log(`🚀 Server ready at ${url}`);
    console.log(`📝 GraphQL Playground available at ${url}`);
  } catch (error) {
    console.error('⚠️ Server failed to start');
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 