// import user model
const { User } = require("../models");
// import sign token function from auth
const { signToken } = require("../utils/auth");

module.exports = {
  // get a single user by either their id or their username
  async getSingleUser(req, res) {
    try {
      const foundUser = await User.findOne({
        $or: [{ _id: req.user._id }, { username: req.params.username }],
      });

    if (!foundUser) {
      return res.status(400).json({ message: "Cannot find a user with this id!" });
    }

    res.json(foundUser);
  }catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
},

  // create a user, sign a token, and send it back (to client/src/components/SignUpForm.js)
  async addUser(req, res) {
    try {
      const user = await User.create(req.body);
      console.log([req.body.username, req.body.email, req.body.password]);

      if (!user) {
        return res.status(400).json({ message: "Something is wrong!" });
      }
      const token = signToken(user);
      res.json({ token, user });
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  },
  // login a user, sign a token, and send it back (to client/src/components/LoginForm.js)
  // {body} is destructured req.body
  async login(req, res) {
    try {
      const user = await User.findOne({
        $or: [{ username: req.body.username }, { email: req.body.email }],
      });

      if (!user) {
        return res.status(400).json({ message: "Can't find this user" });
      }

      const correctPw = await user.isCorrectPassword(req.body.password);

      if (!correctPw) {
        return res.status(400).json({ message: "Wrong password!" });
      }
      const token = signToken(user);
      res.json({ token, user });
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  },
  // save a book to a user's `savedBooks` field by adding it to the set (to prevent duplicates)
  // user comes from `req.user` created in the auth middleware function
  async saveBook(req, res) {
    try {
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $addToSet: { savedBooks: req.body } },
        { new: true, runValidators: true }
      );
      return res.json(updatedUser);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  },
  // remove a book from `savedBooks`
  async deleteBook({ user, params }, res) {
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $pull: { savedBooks: { bookId: params.bookId } } },
      { new: true }
    );
    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "Couldn't find user with this id!" });
    }
    return res.json(updatedUser);
  },
};
