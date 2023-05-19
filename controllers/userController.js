const mongoose = require('mongoose');
const User = mongoose.model('User');
const { body, validationResult } = require('express-validator');

exports.loginForm = (req, res) => {
  res.render('login', {
    title: 'Login'
  });
};

exports.registerForm = (req, res) => {
  res.render('register', {
    title: 'Register'
  });
};

exports.validateRegister = (req, res, next) => {
  body('name');

  body('name', 'You must provide a name.').notEmpty();
  body('email', 'That email is not valid.').isEmail();
  body('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  body('password', 'Password cannot be blank.').notEmpty();
  body('password-confirm', 'Confirm-Password cannot be blank.').notEmpty();
  body('password-confirm', 'Opps! Your passwords do not match').equals(req.body.password);

  const errors = validationResult(req).array();

  if (Array.isArray(errors) && errors.length) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    });
    return;
  }
  next();
};

exports.register = async (req, res, next) => {
  const user = new User({
    email: req.body.email,
    name: req.body.name
  });
  await User.register(user, req.body.password, (err, user) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

exports.account = (req, res) => {
  res.render('account', {
    title: 'Edit Your Account'
  });
};

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findOneAndUpdate(
    {_id: req.user._id},
    {$set: updates},
    {new : true, runValidators: true, context: 'query'}
  );
  req.flash('success', 'Updated the profile');
  res.redirect('back');
};
