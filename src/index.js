const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const dotenv = require('dotenv');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const db = require('./db');

// Load environment variables
dotenv.config();

async function startServer() {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Create Express app
    const app = express();

    // Configure CORS for development, production and Apollo Studio
    app.use(cors({
      origin: [        
        'https://studio.apollographql.com', // Apollo Studio
        'https://sophie-ai-finance.vercel.app',
        'http://localhost:3000',
        'http://localhost:8081', // Expo web development server
        'http://localhost:19006', // Expo web development server (alternative port)
        /^http:\/\/localhost(:\d+)?$/, // All localhost ports
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/, // HTTP/HTTPS local network IPs
        /^exp:\/\/192\.168\.\d+\.\d+:\d+$/, // Expo local network URIs
        /^https?:\/\/[^\/]*sophie-ai-finance[^\/]*$/, // Any sophie-ai-finance domain
      ],
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Apollo-Require-Preflight',
        'apollographql-client-name',
        'apollographql-client-version'
      ],
      exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials']
    }));

    // Initialize Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: { db },
      introspection: true,
      playground: true,
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          locations: error.locations,
          path: error.path
        };
      }
    });

    await server.start();
    server.applyMiddleware({ app, path: '/graphql', cors: false });

    // Start the server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
      console.log(`📝 GraphQL Playground available at http://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('⚠️ Server failed to start');
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
