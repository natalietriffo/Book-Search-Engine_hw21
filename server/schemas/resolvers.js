//Requiring Apollo server and Auth from Utils and user model
const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

//We need a query mutation for creating user
//We need a query muation ofr saving a book and deleting a book

const resolvers = {
    Query: {
        me: async (parent, { username, user_id }) => {
            //If user Id exists, then return saved books based apon the user ID.
            if (user_id) {
                return User.findOne({ user_id }).populate('savedBooks');
            } else {
                //Else populate saved books by username
                return User.findOne({ username }).populate('savedBooks');
            }
        },
    },
    Mutation: {
        //Adding user based on there username, email, and pass
        addUser: async (parent, { username, email, password }) => {
            //Once user is created, assign the user a tolken
            try {
                const user = await User.create({ username, email, password });
                const token = signToken(user);
                return { token, user };
            } catch (Error) {
                console.error(Error);
                return {}
            }
        },
        login: async (parent, { username, email, password }) => {
            const user = await User.findOne({ $or: [{ username: username }, { email: email }] });
            //If user is not found, throw message

            if (!user) {
                throw new AuthenticationError('Unknown user, Try Again!');
            }

            const correctPw = await user.isCorrectPassword(password);
            //If password is blank, throw an error message

            if (!correctPw) {
                throw new AuthenticationError('Incorrect Password');
            }

            const token = signToken(user);

            return { token, user };
        },
        //We save a book based on a username, authors, description, title, and more
        saveBook: async (parent, { username, authors, description, title, link, image, bookId }) => {
            const saveBookInput = {
                authors: authors,
                description: description,
                bookId: bookId,
                image: image,
                link: link,
                title: title
            }
            //Returning the updated saved book set for the user
            return await User.findOneAndUpdate(
                { username: username },
                { $addToSet: { savedBooks: saveBookInput } },
                {
                    new: true,
                    runValidators: true,
                }
            )
        },
        //Removing book based on username and book ID
        removeBook: async (parent, { username, bookId }) => {
            //Returning updated saved books based on if one was removed
            return await User.findOneAndUpdate(
                { username: username },
                { $pull: { savedBooks: { bookId: bookId } } },
                { new: true }
            );
        },
    },
};

module.exports = resolvers;