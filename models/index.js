'use strict';

const { supabase, TABLES } = require('../config/supabase');
const User = require('./User');
const UserSocialLinks = require('./user_social_links');
const SocialMediaPlatforms = require('./social_media_platforms');
const UserSaveProfile = require('./User_Save_Profile');

// Initialize models with error handling
const initializeModel = (model) => {
  try {
    return model(supabase);
  } catch (error) {
    console.error(`Error initializing model:`, error);
    return null;
  }
};

const models = {
  User: initializeModel(User),
  UserSocialLinks: initializeModel(UserSocialLinks),
  SocialMediaPlatforms: initializeModel(SocialMediaPlatforms),
  UserSaveProfile: initializeModel(UserSaveProfile),
  supabase
};

// Validate models
Object.entries(models).forEach(([name, model]) => {
  if (!model && name !== 'supabase') {
    console.error(`Model ${name} failed to initialize`);
  }
});

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;