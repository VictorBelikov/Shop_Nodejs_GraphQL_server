const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }
  
  type User {
    _id: ID!
    email: String!
    name: String!
    password: String
    status: String!
    posts: [Post!]!
  }
  
  type AuthData {
    token: String!
    userId: String!
  }
  
  input UserData {
    email: String!
    name: String!
    password: String!
  }
  
  input PostData {
    title: String!
    content: String!
    imageUrl: String!
  }
  
  type RootQuery {
    login(email: String!, password: String!): AuthData!
  }
  
  type RootMutation {
    createUser(userInput: UserData): User!
    createPost(postInput: PostData): Post!
  }
  
  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);
