angular.module('user.services', [])

    .service('UserService', ['$q', 'ParseConfiguration', '$cordovaFacebook',
        function ($q, ParseConfiguration, $cordovaFacebook) {

            var parseInitialized = false;


            return {
				
				doParseLoginWithFB: function () {
					try {
						 // STEP 1 - LOGIN TO FACEBOOK
						 return $cordovaFacebook.login(["public_profile", "email", "user_friends"])
							.then(function (success) {
								// save access_token
								var accessToken = success.authResponse.accessToken;
								var userID = success.authResponse.userID;
								var expiresIn = success.authResponse.expiresIn;
				 
								console.log("Login Success" + JSON.stringify(success));
				 
								// STEP - 2 CONVERTING DATE FORMAT
								var expDate = new Date(
									new Date().getTime() + expiresIn * 1000
								).toISOString();
				 
								// STEP - 3 LOGIN TO PARSE
								Parse.initialize(ParseConfiguration.applicationId, ParseConfiguration.javascriptKey);
								
								return Parse.FacebookUtils.logIn({
									id: userID,
									access_token: accessToken,
									expiration_date: expDate
								});
							}, function(error) {
								console.log(error);
							}).then(function (_parseResult) {
								
								// STEP - 4 GET ADDITIONAL USER INFORMATION FROM FACEBOOK
								// get the user information to add to the Parse Object
								var fbValues = "&fields=id,name,location,website,picture,email";
								var fbPermission = ["public_profile"];
				 
								return $cordovaFacebook.api("me?access_token=" + _parseResult.accessToken + fbValues, fbPermission);
							}).then(function (_fbUserInfo) {
				 
								// use the information to update the object
								// STEP - 5 UPDATE THE USER OBJECT
								var username = _fbUserInfo.name.toLocaleLowerCase().replace(" ", "");
								var email = _fbUserInfo.email;
				 
								Parse.User.current().set("username", username);
								Parse.User.current().set("email", email);
				 
								return Parse.User.current().save();
							}).then(function (_updatedUser) {
				 
								return _updatedUser;
							})
					} catch (_error) {
						console.log(_error.message);
						return $q.reject("Missing Facebook Plugin - This functionality only works on device");
					}
				},

                /**
                 *
                 * @returns {*}
                 */
                init: function () {
                    // if initialized, then return the activeUser
                    if (parseInitialized === false) {
                        Parse.initialize(ParseConfiguration.applicationId, ParseConfiguration.javascriptKey);
                        parseInitialized = true;
                        console.log("parse initialized in init function");
                    }

                    var currentUser = Parse.User.current();
                    if (currentUser) {
                        return $q.when(currentUser);
                    } else {
                        return $q.reject({error: "noUser"});
                    }

                },
                /**
                 *
                 * @param _userParams
                 */
                createUser: function (_userParams) {

                    var user = new Parse.User();
                    user.set("username", _userParams.email);
                    user.set("password", _userParams.password);
                    user.set("email", _userParams.email);
                    user.set("first_name", _userParams.first_name);
                    user.set("last_name", _userParams.last_name);

                    // should return a promise
                    return user.signUp(null, {});

                },
                /**
                 *
                 * @param _parseInitUser
                 * @returns {Promise}
                 */
                currentUser: function (_parseInitUser) {

                    // if there is no user passed in, see if there is already an
                    // active user that can be utilized
                    _parseInitUser = _parseInitUser ? _parseInitUser : Parse.User.current();

                    console.log("_parseInitUser " + Parse.User.current());
                    if (!_parseInitUser) {
                        return $q.reject({error: "noUser"});
                    } else {
                        return $q.when(_parseInitUser);
                    }
                },
                /**
                 *
                 * @param _user
                 * @param _password
                 * @returns {Promise}
                 */
                login: function (_user, _password) {
                    return Parse.User.logIn(_user, _password);
                },
                /**
                 *
                 * @returns {Promise}
                 */
                logout: function (_callback) {
                    var defered = $q.defer();
                    Parse.User.logOut();
                    defered.resolve();
                    return defered.promise;

                }

            }
        }]);