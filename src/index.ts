import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { loadSchema } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { PrismaClient } from "@prisma/client";

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = await loadSchema("./graphql/schema.graphql", {
  loaders: [new GraphQLFileLoader()],
});

const prisma = new PrismaClient();

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

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
