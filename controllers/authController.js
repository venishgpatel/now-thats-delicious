const passport = require('passport');
const User = require('../models/User');
const crypto = require('crypto');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in.'
});

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success', 'You are now logged out.');
    res.redirect('/');
  });
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Oops, You must be logged in to do that');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  const user = await User.findOne({email: req.body.email});
  if (!user) {
    req.flash('error', 'The password reset has been emailed to you.');
    return res.redirect('/login');
  }
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: 'Passwrod Reset',
    resetURL,
    filename: 'password-reset'
  });
  req.flash('success', 'The password reset has been emailed to you.');
  console.log(resetURL);
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Passwrod reset invalid or has expired.');
    return res.redirect('/login');
  }

  res.render('reset', {
    title: 'Reset Password'
  });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    return next();
  }
  req.flash('errro', 'Passwords do not match');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash('error', 'Passwrod reset invalid or has expired.');
    return res.redirect('/login');
  }

  await user.setPassword(req.body.password, (err) => {
    if (err) {
      return next(err);
    }
  });
  
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();

  await req.login(updatedUser);
  req.flash('success', 'nice! Your password has been reset! You are now logged in!');
  res.redirect('/');
};