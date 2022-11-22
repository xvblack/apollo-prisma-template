import { createServer } from "http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { loadSchema } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { PrismaClient } from "@prisma/client";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import express from "express";
import cors from "cors";

const prisma = new PrismaClient();

const typeDefs = await loadSchema("./graphql/schema.graphql", {
  loaders: [new GraphQLFileLoader()],
});

const resolvers = {
  Query: {
    users: async () => {
      const results = await prisma.user.findMany({});
      console.log(results);
      return results;
    },
    posts: async () => {
      return prisma.post.findMany();
    },
  },
  Subscription: {
    welcome: {
      // Example using an async generator
      subscribe: async function* () {
        for await (const word of ["Hello", "Bonjour", "Ciao"]) {
          await new Promise((r) => setTimeout(r, 2000));
          yield { welcome: { content: word } };
        }
      },
    },
  },
  User: {
    posts: async (parent, args, context, info) => {
      return prisma.post.findMany({
        where: {
          authorId: parent.id,
        },
      });
    },
  },
  Post: {
    author: async (parent, args, context, info) => {
      return prisma.user.findFirst({
        where: {
          id: parent.authorId,
        },
      });
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  schema,
  // plugins: [
  //   // Proper shutdown for the HTTP server.
  //   ApolloServerPluginDrainHttpServer({ httpServer }),

  //   // Proper shutdown for the WebSocket server.
  //   {
  //     async serverWillStart() {
  //       return {
  //         async drainServer() {
  //           await serverCleanup.dispose();
  //         },
  //       };
  //     },
  //   },
  // ],
});

await server.start();

const app = express();

// Specify the path where we'd like to mount our server
app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server)
);

// This `app` is the returned value from `express()`.
const httpServer = createServer(app);

// Creating the WebSocket server
const wsServer = new WebSocketServer({
  // This is the `httpServer` we created in a previous step.
  server: httpServer,
  // Pass a different path here if app.use
  // serves expressMiddleware at a different path
  path: "/graphql",
});

// Hand in the schema we just created and have the
// WebSocketServer start listening.
const serverCleanup = useServer({ schema }, wsServer);

// Modified server startup
await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);
console.log(`🚀 Server ready at http://localhost:4000/`);
