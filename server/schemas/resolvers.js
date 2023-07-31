const { User } = require("../models");
const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-express");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        try {
          const userData = await User.findOne({ _id: context.user._id }).select(
            "-__v -password"
          );
          return userData;
        } catch (err) {
          console.error("Error fetching user data:", err);
          throw new Error("Failed to fetch user data");
        }
      }
      throw new AuthenticationError("Not logged in");
    },
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Invalid credentials");
      }

      const correctPassword = await user.isCorrectPassword(password);

      if (!correctPassword) {
        throw new AuthenticationError("Invalid credentials");
      }

      const token = signToken(user);
      return {
        token,
        _id: user._id,
        username: user.username,
        email: user.email,
      };
    },
    addUser: async (parent, { username, email, password }) => {
      console.log(username, email, password)
      try {
        const user = await User.create({ username, email, password });

        if (!user) {
          throw new Error("Couldn't create user");
        }

        const token = signToken(user);

        return {
          token,
          _id: user._id,
          username: user.username,
          email: user.email,
        };
      } catch (err) {
        console.error(err);

        throw new AuthenticationError("Failed to create user");
      }
    },
    saveBook: async (parent, { bookData }, context) => {
      if (context.user) {
        if (!bookData) {
          throw new Error("Book data is required");
        }

        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $addToSet: { savedBooks: bookData } },
          { new: true }
        ).populate("savedBooks");

        return updatedUser;
      }

      throw new AuthenticationError("Please log in to save a book");
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        if (!bookId) {
          throw new Error("Book ID is required");
        }

        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        ).populate("savedBooks");

        return updatedUser;
      }

      throw new AuthenticationError(
        "Please log in to remove a book from your saved books"
      );
    },
  },
};

module.exports = resolvers;